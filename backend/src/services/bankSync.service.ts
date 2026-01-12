import prisma from '../utils/prisma';
import { plaidClient } from '../utils/plaid';
import { processUnmatchedTransactions } from './transactionMatcher.service';
import stackCompletionService from './stackCompletion.service';

interface SyncResult {
  linkedBankId: string;
  institutionName: string;
  success: boolean;
  balanceUpdated: boolean;
  newTransactions: number;
  error?: string;
}

/**
 * Syncs all linked banks for a user
 * Includes smart caching - skips banks synced within the last hour
 */
export async function syncAllUserBanks(userId: string, force: boolean = false): Promise<{
  totalBanks: number;
  synced: number;
  skipped: number;
  failed: number;
  totalNewTransactions: number;
  results: SyncResult[];
}> {
  console.log(`Starting sync for all banks for user: ${userId} (force: ${force})`);

  const linkedBanks = await prisma.linkedBank.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      accounts: true,
    },
  });

  if (linkedBanks.length === 0) {
    return {
      totalBanks: 0,
      synced: 0,
      skipped: 0,
      failed: 0,
      totalNewTransactions: 0,
      results: [],
    };
  }

  const results: SyncResult[] = [];
  let syncedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let totalNewTransactions = 0;

  for (const linkedBank of linkedBanks) {
    const result: SyncResult = {
      linkedBankId: linkedBank.id,
      institutionName: linkedBank.institutionName,
      success: false,
      balanceUpdated: false,
      newTransactions: 0,
    };

    try {
      // Smart caching: Skip if synced within last hour (unless forced)
      if (!force && linkedBank.lastSyncedAt) {
        const minutesSinceLastSync = (Date.now() - new Date(linkedBank.lastSyncedAt).getTime()) / (1000 * 60);
        if (minutesSinceLastSync < 60) {
          console.log(`Skipping ${linkedBank.institutionName} - synced ${Math.round(minutesSinceLastSync)} minutes ago`);
          skippedCount++;
          result.success = true;
          result.error = `Recently synced (${Math.round(minutesSinceLastSync)} minutes ago)`;
          results.push(result);
          continue;
        }
      }

      console.log(`Syncing ${linkedBank.institutionName}...`);

      // 1. Sync balance
      const balanceResponse = await plaidClient.accountsBalanceGet({
        access_token: linkedBank.plaidAccessToken,
        options: {
          account_ids: linkedBank.plaidAccountId ? [linkedBank.plaidAccountId] : undefined,
        },
      });

      const plaidAccount = balanceResponse.data.accounts.find(
        acc => acc.account_id === linkedBank.plaidAccountId
      ) || balanceResponse.data.accounts[0];

      if (!plaidAccount) {
        throw new Error('Account not found in Plaid response');
      }

      const newBalance = plaidAccount.balances.current || 0;
      const newAvailable = plaidAccount.balances.available || newBalance;

      // Update LinkedBank
      await prisma.linkedBank.update({
        where: { id: linkedBank.id },
        data: {
          currentBalance: newBalance,
          availableBalance: newAvailable,
          lastSyncedAt: new Date(),
        },
      });

      result.balanceUpdated = true;

      // Update corresponding Stackwise Account
      const stackwiseAccount = linkedBank.accounts[0];
      if (stackwiseAccount) {
        // Calculate allocated amount
        const stacks = await prisma.stack.findMany({
          where: { accountId: stackwiseAccount.id },
        });
        const totalAllocated = stacks.reduce((sum, stack) => sum + stack.currentAmount, 0);
        const newAvailableBalance = newBalance - totalAllocated;

        await prisma.account.update({
          where: { id: stackwiseAccount.id },
          data: {
            balance: newBalance,
            availableBalance: newAvailableBalance,
            lastSyncedAt: new Date(),
          },
        });

        // 2. Sync transactions (last 30 days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();

        const transactionsResponse = await plaidClient.transactionsGet({
          access_token: linkedBank.plaidAccessToken,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          options: {
            account_ids: linkedBank.plaidAccountId ? [linkedBank.plaidAccountId] : undefined,
            count: 100,
            offset: 0,
          },
        });

        const transactions = transactionsResponse.data.transactions;
        let newTransactions = 0;

        for (const plaidTx of transactions) {
          // Check if transaction already exists
          const existing = await prisma.transaction.findFirst({
            where: { plaidTransactionId: plaidTx.transaction_id },
          });

          if (!existing) {
            // Create new transaction
            await prisma.transaction.create({
              data: {
                accountId: stackwiseAccount.id,
                plaidTransactionId: plaidTx.transaction_id,
                type: plaidTx.amount > 0 ? 'withdrawal' : 'deposit',
                amount: -plaidTx.amount, // Plaid uses positive for debits
                description: plaidTx.name,
                category: plaidTx.category?.join(', '),
                date: new Date(plaidTx.date),
                balance: newBalance,
                isVirtual: false,
              },
            });

            newTransactions++;

            // Check if this transaction should trigger auto-reset
            await stackCompletionService.checkTransactionForAutoReset(
              stackwiseAccount.id,
              -plaidTx.amount,
              plaidTx.name,
              new Date(plaidTx.date)
            );
          }
        }

        result.newTransactions = newTransactions;
        totalNewTransactions += newTransactions;

        // 3. Run automatic transaction matching for new transactions
        if (newTransactions > 0) {
          console.log(`Running automatic matching for ${newTransactions} new transactions...`);
          const matchResults = await processUnmatchedTransactions(stackwiseAccount.id);
          console.log(`Matching complete: ${matchResults.autoConfirmed} auto-confirmed, ${matchResults.suggested} suggested`);
        }
      }

      result.success = true;
      syncedCount++;
      console.log(`Successfully synced ${linkedBank.institutionName}: ${result.newTransactions} new transactions`);

    } catch (error: any) {
      console.error(`Error syncing ${linkedBank.institutionName}:`, error);
      result.success = false;
      result.error = error.message || 'Unknown error';
      failedCount++;
    }

    results.push(result);
  }

  console.log(`Sync complete: ${syncedCount} synced, ${skippedCount} skipped, ${failedCount} failed`);

  return {
    totalBanks: linkedBanks.length,
    synced: syncedCount,
    skipped: skippedCount,
    failed: failedCount,
    totalNewTransactions,
    results,
  };
}

/**
 * Daily cron job to sync all users' banks
 */
export async function syncAllBanksDaily() {
  console.log('Starting daily bank sync for all users...');

  const users = await prisma.user.findMany({
    where: {
      linkedBanks: {
        some: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  console.log(`Found ${users.length} users with linked banks`);

  let totalSynced = 0;
  let totalTransactions = 0;

  for (const user of users) {
    try {
      const result = await syncAllUserBanks(user.id, true); // Force sync
      totalSynced += result.synced;
      totalTransactions += result.totalNewTransactions;
      console.log(`Synced ${result.synced} banks for user ${user.email}: ${result.totalNewTransactions} new transactions`);
    } catch (error) {
      console.error(`Error syncing banks for user ${user.email}:`, error);
    }
  }

  console.log(`Daily sync complete: ${totalSynced} banks synced, ${totalTransactions} new transactions`);

  return {
    usersSynced: users.length,
    banksSynced: totalSynced,
    totalNewTransactions: totalTransactions,
  };
}
