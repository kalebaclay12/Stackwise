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

export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, amount, description, category, date } = req.body;

    // Find the transaction and verify ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!transaction || transaction.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Only allow editing manual transactions (not allocations)
    if (transaction.type === 'allocation' || transaction.isVirtual) {
      return res.status(400).json({ message: 'Cannot edit allocation or virtual transactions' });
    }

    const account = transaction.account;
    const oldAmount = transaction.amount;

    // Calculate new amount based on type
    let newAmount = amount;
    if (type === 'withdrawal') {
      newAmount = -Math.abs(amount);
    } else if (type === 'deposit') {
      newAmount = Math.abs(amount);
    }

    // Calculate balance changes
    const amountDifference = newAmount - oldAmount;

    // Check if we have sufficient available balance for the change
    if (amountDifference < 0 && account.availableBalance + amountDifference < 0) {
      return res.status(400).json({ message: 'Insufficient available balance for this change' });
    }

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // Update account balance
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: { increment: amountDifference },
          availableBalance: { increment: amountDifference },
        },
      });

      // Update the transaction
      return tx.transaction.update({
        where: { id },
        data: {
          type,
          amount: newAmount,
          description,
          category: category || null,
          date: date ? new Date(date) : transaction.date,
          balance: account.balance + amountDifference,
        },
      });
    });

    res.json(updatedTransaction);
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
      include: { account: true, stack: true },
    });

    if (!transaction || transaction.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Use a transaction to delete and update account balance and stack amount
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

      // If this was a stack allocation, update the stack's currentAmount
      if (transaction.stackId && transaction.type === 'allocation') {
        await tx.stack.update({
          where: { id: transaction.stackId },
          data: {
            // Reverse the allocation: if amount was -10 (money added to stack),
            // we need to subtract it (add 10 back), so we decrement by the negative = increment
            currentAmount: { decrement: transaction.amount },
          },
        });
      }
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};
