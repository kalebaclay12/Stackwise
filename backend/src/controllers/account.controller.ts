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
    const { type, name } = req.body;

    const account = await prisma.account.create({
      data: {
        userId: req.userId!,
        type,
        name,
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
    const { name, type } = req.body;

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
      where: { accountId: id },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};
