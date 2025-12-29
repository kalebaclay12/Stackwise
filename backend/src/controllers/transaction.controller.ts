import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const { type, amount, description, category } = req.body;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

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
        },
      });
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};
