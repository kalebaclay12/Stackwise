import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAccounts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

export const getAccountById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const createAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, name, color } = req.body;

    const account = await prisma.account.create({
      data: {
        userId: req.userId!,
        type,
        name,
        color,
        balance: 0,
        availableBalance: 0,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, color } = req.body;

    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
        color,
      },
    });

    res.json(updatedAccount);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        stacks: true,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.stacks.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete account with active stacks. Please delete all stacks first.'
      });
    }

    await prisma.account.delete({
      where: { id },
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAccountTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: id,
        isVirtual: false, // Exclude virtual allocation transactions
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const importCSVTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { transactions } = req.body;

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: 'No transactions provided' });
    }

    // Import transactions
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const txn of transactions) {
      try {
        const { date, description, amount, category } = txn;

        // Validate required fields
        if (!date || !description || amount === undefined) {
          errors.push(`Skipped transaction: missing required fields (date, description, or amount)`);
          skipped++;
          continue;
        }

        // Parse and validate date
        const txnDate = new Date(date);
        if (isNaN(txnDate.getTime())) {
          errors.push(`Skipped transaction "${description}": invalid date`);
          skipped++;
          continue;
        }

        // Create transaction
        await prisma.transaction.create({
          data: {
            accountId: id,
            type: amount < 0 ? 'debit' : 'credit',
            amount: Math.abs(amount),
            description,
            category: category || 'Uncategorized',
            date: txnDate,
            balance: account.balance, // Snapshot current balance
            isVirtual: false, // Real bank transaction
          },
        });

        // Update account balance
        await prisma.account.update({
          where: { id },
          data: {
            balance: { increment: amount },
            availableBalance: { increment: amount },
          },
        });

        imported++;
      } catch (error: any) {
        errors.push(`Failed to import transaction "${txn.description}": ${error.message}`);
        skipped++;
      }
    }

    res.json({
      message: `Successfully imported ${imported} transactions${skipped > 0 ? `, skipped ${skipped}` : ''}`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};
