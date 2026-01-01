import { Response, NextFunction } from 'express';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from '../utils/plaid';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

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
        email_address: user.email,
        name: {
          given_name: user.firstName,
          family_name: user.lastName,
        },
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

    const accountsResponse = await plaidClient.accountsGet({
      access_token,
    });

    const account = accountsResponse.data.accounts[0];
    console.log('Account retrieved:', account?.name);

    const linkedBank = await prisma.linkedBank.create({
      data: {
        userId: req.userId!,
        plaidItemId: item_id,
        plaidAccessToken: access_token,
        institutionId: institution.data.institution.institution_id,
        institutionName: institution.data.institution.name,
        accountId: account?.account_id,
        accountName: account?.name,
        accountMask: account?.mask,
        accountType: account?.type,
        isActive: true,
      },
    });

    console.log('Bank linked successfully:', linkedBank.id);

    res.json({
      linkedBank: {
        id: linkedBank.id,
        institutionName: linkedBank.institutionName,
        accountName: linkedBank.accountName,
        accountMask: linkedBank.accountMask,
      },
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

export const unlinkBank = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    await plaidClient.itemRemove({
      access_token: linkedBank.plaidAccessToken,
    });

    await prisma.linkedBank.delete({
      where: { id },
    });

    res.json({ message: 'Bank unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking bank:', error);
    next(error);
  }
};
