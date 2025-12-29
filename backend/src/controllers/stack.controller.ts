import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getStacksByAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const stacks = await prisma.stack.findMany({
      where: { accountId },
      orderBy: { priority: 'asc' },
    });

    res.json(stacks);
  } catch (error) {
    next(error);
  }
};

export const createStack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const {
      name,
      description,
      targetAmount,
      color,
      icon,
      priority,
      autoAllocate,
      autoAllocateAmount,
    } = req.body;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const stack = await prisma.stack.create({
      data: {
        accountId,
        name,
        description,
        targetAmount,
        color,
        icon,
        priority,
        currentAmount: 0,
        isActive: true,
        autoAllocate,
        autoAllocateAmount,
      },
    });

    res.status(201).json(stack);
  } catch (error) {
    next(error);
  }
};

export const updateStack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    const updatedStack = await prisma.stack.update({
      where: { id },
      data: req.body,
    });

    res.json(updatedStack);
  } catch (error) {
    next(error);
  }
};

export const deleteStack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    if (stack.currentAmount > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: stack.accountId },
          data: {
            availableBalance: {
              increment: stack.currentAmount,
            },
          },
        });

        await tx.transaction.create({
          data: {
            accountId: stack.accountId,
            stackId: stack.id,
            type: 'allocation',
            amount: stack.currentAmount,
            description: `Deallocated from "${stack.name}" (stack deleted)`,
            balance: stack.account.balance,
          },
        });

        await tx.stack.delete({
          where: { id },
        });
      });
    } else {
      await prisma.stack.delete({
        where: { id },
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const allocateToStack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    if (stack.account.availableBalance < amount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.stack.update({
        where: { id },
        data: {
          currentAmount: {
            increment: amount,
          },
        },
      });

      await tx.account.update({
        where: { id: stack.accountId },
        data: {
          availableBalance: {
            decrement: amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          accountId: stack.accountId,
          stackId: id,
          type: 'allocation',
          amount: -amount,
          description: `Allocated to "${stack.name}"`,
          balance: stack.account.balance,
        },
      });
    });

    res.json({ message: 'Allocation successful' });
  } catch (error) {
    next(error);
  }
};

export const deallocateFromStack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    if (stack.currentAmount < amount) {
      return res.status(400).json({ message: 'Insufficient funds in stack' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.stack.update({
        where: { id },
        data: {
          currentAmount: {
            decrement: amount,
          },
        },
      });

      await tx.account.update({
        where: { id: stack.accountId },
        data: {
          availableBalance: {
            increment: amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          accountId: stack.accountId,
          stackId: id,
          type: 'allocation',
          amount: amount,
          description: `Deallocated from "${stack.name}"`,
          balance: stack.account.balance,
        },
      });
    });

    res.json({ message: 'Deallocation successful' });
  } catch (error) {
    next(error);
  }
};

export const getStackTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { stackId: id },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};
