import { Response, NextFunction } from 'express';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from '../utils/plaid';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import stackCompletionService from '../services/stackCompletion.service';

export const createLinkToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Creating Plaid link token for user:', user.id);
    console.log('Plaid environment:', process.env.PLAID_ENV);
    console.log('Plaid client ID:', process.env.PLAID_CLIENT_ID);

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: 'Stackwise Banking',
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    console.log('Link token created successfully');
    res.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    console.error('Error response:', error.response?.data);
    next(error);
  }
};

export const exchangePublicToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { public_token } = req.body;

    console.log('Exchanging public token...');

    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = tokenResponse.data;
    console.log('Token exchanged successfully, item_id:', item_id);

    const institutionResponse = await plaidClient.itemGet({
      access_token,
    });

    const institution = await plaidClient.institutionsGetById({
      institution_id: institutionResponse.data.item.institution_id!,
      country_codes: [CountryCode.Us],
    });

    console.log('Institution:', institution.data.institution.name);

    // Get all accounts and balances from this institution
    const accountsResponse = await plaidClient.accountsBalanceGet({
      access_token,
    });

    const plaidAccounts = accountsResponse.data.accounts;
    console.log(`Retrieved ${plaidAccounts.length} accounts from Plaid`);

    // Create LinkedBank and corresponding Stackwise Account for each Plaid account
    const createdAccounts = [];

    for (const plaidAccount of plaidAccounts) {
      // Create LinkedBank entry
      const linkedBank = await prisma.linkedBank.create({
        data: {
          userId: req.userId!,
          plaidItemId: item_id,
          plaidAccessToken: access_token,
          plaidAccountId: plaidAccount.account_id,
          institutionId: institution.data.institution.institution_id,
          institutionName: institution.data.institution.name,
          accountName: plaidAccount.name,
          accountMask: plaidAccount.mask,
          accountType: plaidAccount.type,
          currentBalance: plaidAccount.balances.current || 0,
          availableBalance: plaidAccount.balances.available || plaidAccount.balances.current || 0,
          lastSyncedAt: new Date(),
          isActive: true,
        },
      });

      // Create Stackwise Account linked to this bank
      const stackwiseAccount = await prisma.account.create({
        data: {
          userId: req.userId!,
          linkedBankId: linkedBank.id,
          type: plaidAccount.type,
          name: `${plaidAccount.name} (${institution.data.institution.name})`,
          balance: plaidAccount.balances.current || 0,
          availableBalance: plaidAccount.balances.available || plaidAccount.balances.current || 0,
          lastSyncedAt: new Date(),
        },
      });

      console.log(`Created account: ${stackwiseAccount.name} with balance $${stackwiseAccount.balance}`);

      createdAccounts.push({
        id: linkedBank.id,
        institutionName: linkedBank.institutionName,
        accountName: linkedBank.accountName,
        accountMask: linkedBank.accountMask,
        balance: linkedBank.currentBalance,
      });
    }

    res.json({
      message: `Successfully linked ${createdAccounts.length} account(s)`,
      linkedBanks: createdAccounts,
    });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    console.error('Error response:', error.response?.data);
    next(error);
  }
};

export const getLinkedBanks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const linkedBanks = await prisma.linkedBank.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        institutionName: true,
        accountName: true,
        accountMask: true,
        accountType: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(linkedBanks);
  } catch (error) {
    next(error);
  }
};

export const getBalances = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const linkedBank = await prisma.linkedBank.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!linkedBank) {
      return res.status(404).json({ message: 'Linked bank not found' });
    }

    const balanceResponse = await plaidClient.accountsBalanceGet({
      access_token: linkedBank.plaidAccessToken,
    });

    res.json({
      accounts: balanceResponse.data.accounts,
    });
  } catch (error) {
    console.error('Error fetching balances:', error);
    next(error);
  }
};

export const transferFunds = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { linkedBankId, accountId, amount, description } = req.body;

    const linkedBank = await prisma.linkedBank.findFirst({
      where: {
        id: linkedBankId,
        userId: req.userId,
      },
    });

    if (!linkedBank) {
      return res.status(404).json({ message: 'Linked bank not found' });
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const newBalance = account.balance + amount;
    const newAvailableBalance = account.availableBalance + amount;

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: newBalance,
          availableBalance: newAvailableBalance,
        },
      });

      await tx.transaction.create({
        data: {
          accountId,
          type: 'deposit',
          amount: amount,
          description: description || `Transfer from ${linkedBank.institutionName} ${linkedBank.accountMask ? `(...${linkedBank.accountMask})` : ''}`,
          category: 'Bank Transfer',
          balance: newBalance,
          metadata: JSON.stringify({
            linkedBankId,
            institutionName: linkedBank.institutionName,
          }),
        },
      });
    });

    res.json({ message: 'Transfer successful', newBalance, newAvailableBalance });
  } catch (error) {
    console.error('Error transferring funds:', error);
    next(error);
  }
};

export const syncAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // LinkedBank ID

    const linkedBank = await prisma.linkedBank.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        accounts: true,
      },
    });

    if (!linkedBank) {
      return res.status(404).json({ message: 'Linked bank not found' });
    }

    console.log(`Syncing account: ${linkedBank.accountName}`);

    // Get updated balance from Plaid
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
      return res.status(404).json({ message: 'Account not found in Plaid' });
    }

    const newBalance = plaidAccount.balances.current || 0;
    const newAvailable = plaidAccount.balances.available || newBalance;

    // Update LinkedBank
    await prisma.linkedBank.update({
      where: { id },
      data: {
        currentBalance: newBalance,
        availableBalance: newAvailable,
        lastSyncedAt: new Date(),
      },
    });

    // Update corresponding Stackwise Account(s)
    const stackwiseAccount = linkedBank.accounts[0];
    if (stackwiseAccount) {
      // Calculate allocated amount (sum of all stack allocations)
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

      // Handle negative available balance
      if (newAvailableBalance < 0) {
        const negativeBalanceService = (await import('../services/negativeBalance.service')).default;
        const result = await negativeBalanceService.handleNegativeBalance(
          stackwiseAccount.id,
          req.userId!,
          newAvailableBalance
        );

        // Create notification for user
        await negativeBalanceService.createNotification(
          req.userId!,
          stackwiseAccount.id,
          result
        );

        console.log('Negative balance handled:', result);
      }
    }

    console.log(`Synced successfully: Balance = $${newBalance}`);

    res.json({
      message: 'Account synced successfully',
      balance: newBalance,
      availableBalance: newAvailable,
      lastSynced: new Date(),
    });
  } catch (error: any) {
    console.error('Error syncing account:', error);
    console.error('Error response:', error.response?.data);
    next(error);
  }
};

export const unlinkBank = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const linkedBank = await prisma.linkedBank.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        accounts: true,
      },
    });

    if (!linkedBank) {
      return res.status(404).json({ message: 'Linked bank not found' });
    }

    await plaidClient.itemRemove({
      access_token: linkedBank.plaidAccessToken,
    });

    // Delete associated Stackwise accounts (cascades to stacks and transactions)
    await prisma.linkedBank.delete({
      where: { id },
    });

    res.json({ message: 'Bank unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking bank:', error);
    next(error);
  }
};

export const syncTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // LinkedBank ID

    const linkedBank = await prisma.linkedBank.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        accounts: true,
      },
    });

    if (!linkedBank) {
      return res.status(404).json({ message: 'Linked bank not found' });
    }

    const stackwiseAccount = linkedBank.accounts[0];
    if (!stackwiseAccount) {
      return res.status(404).json({ message: 'No Stackwise account found for this bank' });
    }

    console.log(`Syncing transactions for: ${linkedBank.accountName}`);

    // Get last 30 days of transactions
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
    console.log(`Retrieved ${transactions.length} transactions from Plaid`);

    let newTransactions = 0;

    for (const plaidTx of transactions) {
      // Check if we already have this transaction
      const existing = await prisma.transaction.findFirst({
        where: {
          plaidTransactionId: plaidTx.transaction_id,
        },
      });

      if (!existing) {
        // Create new transaction record
        await prisma.transaction.create({
          data: {
            accountId: stackwiseAccount.id,
            plaidTransactionId: plaidTx.transaction_id,
            type: plaidTx.amount > 0 ? 'withdrawal' : 'deposit',
            amount: -plaidTx.amount, // Plaid uses positive for debits, we use negative
            description: plaidTx.name,
            category: plaidTx.category?.join(', '),
            date: new Date(plaidTx.date),
            balance: stackwiseAccount.balance,
            isVirtual: false,
          },
        });

        newTransactions++;

        // Check if this transaction should trigger auto-reset for any completed stacks
        await stackCompletionService.checkTransactionForAutoReset(
          stackwiseAccount.id,
          -plaidTx.amount, // Convert back to our format
          plaidTx.name,
          new Date(plaidTx.date)
        );
      }
    }

    console.log(`Synced ${newTransactions} new transactions`);

    // Automatically process transaction matching for new transactions
    if (newTransactions > 0) {
      console.log('Running automatic transaction matching...');
      const { processUnmatchedTransactions } = await import('../services/transactionMatcher.service');
      const matchResults = await processUnmatchedTransactions(stackwiseAccount.id);
      console.log(
        `Matching complete: ${matchResults.autoConfirmed} auto-confirmed, ${matchResults.suggested} suggested`
      );

      res.json({
        message: 'Transactions synced successfully',
        newTransactions,
        totalTransactions: transactions.length,
        matchingResults: {
          autoConfirmed: matchResults.autoConfirmed,
          pendingReview: matchResults.suggested,
        },
      });
    } else {
      res.json({
        message: 'Transactions synced successfully',
        newTransactions,
        totalTransactions: transactions.length,
      });
    }
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    console.error('Error response:', error.response?.data);
    next(error);
  }
};
