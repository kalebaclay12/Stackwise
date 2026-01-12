import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.params.id; // Route uses :id, not :accountId
    const { type, amount, description, category } = req.body;

    console.log('Creating transaction:', { accountId, type, amount, description, category, userId: req.userId });

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.userId,
      },
    });

    if (!account) {
      console.log('Account not found for user:', req.userId);
      return res.status(404).json({ message: 'Account not found' });
    }

    console.log('Account found:', { id: account.id, balance: account.balance, availableBalance: account.availableBalance });

    let newBalance = account.balance;
    let newAvailableBalance = account.availableBalance;

    if (type === 'deposit') {
      newBalance += amount;
      newAvailableBalance += amount;
    } else if (type === 'withdrawal') {
      if (account.availableBalance < amount) {
        return res.status(400).json({ message: 'Insufficient available balance' });
      }
      newBalance -= amount;
      newAvailableBalance -= amount;
    }

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: newBalance,
          availableBalance: newAvailableBalance,
        },
      });

      return tx.transaction.create({
        data: {
          accountId,
          type,
          amount: type === 'withdrawal' ? -amount : amount,
          description,
          category,
          balance: newBalance,
          isVirtual: false, // Manual transaction represents real money movement
        },
      });
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Find the transaction and verify ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!transaction || transaction.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Use a transaction to delete and update account balance
    await prisma.$transaction(async (tx) => {
      // Delete the transaction
      await tx.transaction.delete({
        where: { id },
      });

      // Update account balance (reverse the transaction)
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: { decrement: transaction.amount },
          availableBalance: { decrement: transaction.amount },
        },
      });
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};
