import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { processPendingAllocations } from '../services/autoAllocation.service';
import { calculateNextAllocationDate, AllocationFrequency } from '../utils/dateCalculator';
import stackCompletionService from '../services/stackCompletion.service';
import { processUnmatchedTransactions } from '../services/transactionMatcher.service';

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
      targetDueDate,
      color,
      icon,
      priority,
      autoAllocate,
      autoAllocateAmount,
      autoAllocateFrequency,
      autoAllocateStartDate,
      resetBehavior,
      recurringPeriod,
      overflowBehavior,
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

    // Set next allocation date - if start date is in the past, calculate next occurrence
    let autoAllocateNextDate = null;
    if (autoAllocate && autoAllocateStartDate && autoAllocateFrequency) {
      const startDate = new Date(autoAllocateStartDate);
      const now = new Date();

      if (startDate > now) {
        // Start date is in the future, use it as the next date
        autoAllocateNextDate = startDate;
      } else {
        // Start date is in the past, calculate next occurrence from start date
        let nextDate = startDate;
        while (nextDate <= now) {
          nextDate = calculateNextAllocationDate(
            nextDate,
            autoAllocateFrequency as AllocationFrequency
          );
        }
        autoAllocateNextDate = nextDate;
      }
    }

    const stack = await prisma.stack.create({
      data: {
        accountId,
        name,
        description,
        targetAmount,
        targetDueDate: targetDueDate ? new Date(targetDueDate) : null,
        color,
        icon,
        priority,
        currentAmount: 0,
        isActive: true,
        autoAllocate,
        autoAllocateAmount,
        autoAllocateFrequency,
        autoAllocateStartDate: autoAllocateStartDate ? new Date(autoAllocateStartDate) : null,
        autoAllocateNextDate,
        resetBehavior: resetBehavior || 'none',
        recurringPeriod: recurringPeriod || null,
        overflowBehavior: overflowBehavior || 'next_priority',
      },
    });

    // Automatically scan for transaction matches when a new stack is created
    // This runs in the background and doesn't block the response
    processUnmatchedTransactions(accountId).catch((err) => {
      console.error('Error scanning for transaction matches after stack creation:', err);
    });

    res.status(201).json(stack);
  } catch (error) {
    next(error);
  }
};

export const updateStack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      autoAllocate,
      autoAllocateAmount,
      autoAllocateFrequency,
      autoAllocateStartDate,
      targetDueDate,
      ...otherFields
    } = req.body;

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    // Prepare update data
    const updateData: any = { ...otherFields };

    // Convert targetDueDate string to Date if provided
    if (targetDueDate !== undefined) {
      updateData.targetDueDate = targetDueDate ? new Date(targetDueDate) : null;
    }

    // Handle auto-allocation settings
    if (autoAllocate !== undefined) {
      updateData.autoAllocate = autoAllocate;
    }

    if (autoAllocateAmount !== undefined) {
      updateData.autoAllocateAmount = autoAllocateAmount;
    }

    if (autoAllocateFrequency !== undefined) {
      updateData.autoAllocateFrequency = autoAllocateFrequency;
    }

    // Handle start date changes - recalculate next allocation date if needed
    if (autoAllocateStartDate !== undefined) {
      const newStartDate = new Date(autoAllocateStartDate);
      updateData.autoAllocateStartDate = newStartDate;

      // If the start date changed and auto-allocation is enabled, update the next date
      if (autoAllocate && autoAllocateFrequency) {
        // If the new start date is in the future, use it as the next date
        // Otherwise, calculate the next occurrence from the start date
        const now = new Date();
        if (newStartDate > now) {
          updateData.autoAllocateNextDate = newStartDate;
        } else {
          // Calculate next date from the start date
          let nextDate = newStartDate;
          while (nextDate <= now) {
            nextDate = calculateNextAllocationDate(
              nextDate,
              autoAllocateFrequency as AllocationFrequency
            );
          }
          updateData.autoAllocateNextDate = nextDate;
        }
      }
    } else if (
      autoAllocateFrequency !== undefined &&
      autoAllocateFrequency !== stack.autoAllocateFrequency &&
      stack.autoAllocateStartDate
    ) {
      // If only frequency changed, recalculate next date based on start date
      const now = new Date();
      let nextDate = stack.autoAllocateStartDate;
      while (nextDate <= now) {
        nextDate = calculateNextAllocationDate(
          nextDate,
          autoAllocateFrequency as AllocationFrequency
        );
      }
      updateData.autoAllocateNextDate = nextDate;
    }

    // If auto-allocation is being enabled and we haven't set nextDate yet, calculate it
    if (autoAllocate === true && !stack.autoAllocate && !updateData.autoAllocateNextDate) {
      // Auto-allocation is being enabled - calculate next date
      const frequency = autoAllocateFrequency || stack.autoAllocateFrequency;
      const startDate = autoAllocateStartDate ? new Date(autoAllocateStartDate) : stack.autoAllocateStartDate;

      if (frequency && startDate) {
        const now = new Date();
        if (startDate > now) {
          updateData.autoAllocateNextDate = startDate;
        } else {
          let nextDate = startDate;
          while (nextDate <= now) {
            nextDate = calculateNextAllocationDate(
              nextDate,
              frequency as AllocationFrequency
            );
          }
          updateData.autoAllocateNextDate = nextDate;
        }
      }
    }

    // If auto-allocation is being disabled, clear the next date
    if (autoAllocate === false) {
      updateData.autoAllocateNextDate = null;
      updateData.autoAllocateAmount = null;
      updateData.autoAllocateFrequency = null;
      updateData.autoAllocateStartDate = null;
    }

    const updatedStack = await prisma.stack.update({
      where: { id },
      data: updateData,
    });

    // If the name or description changed, re-scan for transaction matches
    // This allows existing unmatched transactions to be matched to renamed stacks
    if (otherFields.name !== undefined || otherFields.description !== undefined) {
      processUnmatchedTransactions(stack.accountId).catch((err) => {
        console.error('Error scanning for transaction matches after stack update:', err);
      });
    }

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
            isVirtual: true,
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
    const { amount, overflowBehavior } = req.body;

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

    // Check for overflow
    let amountToAllocate = amount;
    let overflowAmount = 0;
    let overflowHandled = false;

    if (stack.targetAmount && stack.currentAmount + amount > stack.targetAmount) {
      overflowAmount = (stack.currentAmount + amount) - stack.targetAmount;
      const behavior = overflowBehavior || stack.overflowBehavior;

      if (behavior === 'next_priority') {
        // Allocate only up to target, send overflow to next stack
        amountToAllocate = stack.targetAmount - stack.currentAmount;

        // Find next priority stack
        const nextStack = await prisma.stack.findFirst({
          where: {
            accountId: stack.accountId,
            priority: { gt: stack.priority },
            isActive: true,
          },
          orderBy: { priority: 'asc' },
        });

        if (nextStack && overflowAmount > 0) {
          await prisma.$transaction(async (tx) => {
            // Allocate to current stack up to target
            if (amountToAllocate > 0) {
              await tx.stack.update({
                where: { id },
                data: { currentAmount: { increment: amountToAllocate } },
              });
            }

            // Allocate overflow to next stack
            await tx.stack.update({
              where: { id: nextStack.id },
              data: { currentAmount: { increment: overflowAmount } },
            });

            const updatedAccount = await tx.account.update({
              where: { id: stack.accountId },
              data: { availableBalance: { decrement: amount } },
            });

            // Create transactions
            if (amountToAllocate > 0) {
              await tx.transaction.create({
                data: {
                  accountId: stack.accountId,
                  stackId: id,
                  type: 'allocation',
                  amount: -amountToAllocate,
                  description: `Allocated to "${stack.name}"`,
                  balance: updatedAccount.balance,
                  isVirtual: true,
                },
              });
            }

            await tx.transaction.create({
              data: {
                accountId: stack.accountId,
                stackId: nextStack.id,
                type: 'allocation',
                amount: -overflowAmount,
                description: `Overflow from "${stack.name}"`,
                balance: updatedAccount.balance,
                isVirtual: true,
              },
            });
          });

          overflowHandled = true;

          // Check if either stack is completed
          await stackCompletionService.checkAndMarkCompleted(id);
          await stackCompletionService.checkAndMarkCompleted(nextStack.id);
        }
      } else if (behavior === 'available_balance') {
        // Allocate only up to target, return overflow to available balance
        amountToAllocate = stack.targetAmount - stack.currentAmount;

        if (amountToAllocate > 0) {
          await prisma.$transaction(async (tx) => {
            await tx.stack.update({
              where: { id },
              data: { currentAmount: { increment: amountToAllocate } },
            });

            const updatedAccount = await tx.account.update({
              where: { id: stack.accountId },
              data: { availableBalance: { decrement: amountToAllocate } },
            });

            await tx.transaction.create({
              data: {
                accountId: stack.accountId,
                stackId: id,
                type: 'allocation',
                amount: -amountToAllocate,
                description: `Allocated to "${stack.name}" (${overflowAmount.toFixed(2)} returned to available balance)`,
                balance: updatedAccount.balance,
                isVirtual: true,
              },
            });
          });

          overflowHandled = true;
          await stackCompletionService.checkAndMarkCompleted(id);
        }
      }
      // 'keep_in_stack' behavior: just allocate the full amount (handled below)
    }

    // If no overflow or 'keep_in_stack' behavior, allocate normally
    if (!overflowHandled) {
      await prisma.$transaction(async (tx) => {
        await tx.stack.update({
          where: { id },
          data: { currentAmount: { increment: amountToAllocate } },
        });

        const updatedAccount = await tx.account.update({
          where: { id: stack.accountId },
          data: { availableBalance: { decrement: amountToAllocate } },
        });

        await tx.transaction.create({
          data: {
            accountId: stack.accountId,
            stackId: id,
            type: 'allocation',
            amount: -amountToAllocate,
            description: `Allocated to "${stack.name}"`,
            balance: updatedAccount.balance,
            isVirtual: true,
          },
        });
      });

      await stackCompletionService.checkAndMarkCompleted(id);
    }

    res.json({ message: 'Allocation successful', overflowAmount: overflowHandled ? overflowAmount : 0 });
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

      const updatedAccount = await tx.account.update({
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
          balance: updatedAccount.balance,
          isVirtual: true,
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

export const updateStackPriorities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const { priorities } = req.body;

    if (!Array.isArray(priorities)) {
      return res.status(400).json({ message: 'Priorities must be an array' });
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

    // Update all stack priorities in a transaction
    await prisma.$transaction(
      priorities.map(({ id, priority }) =>
        prisma.stack.updateMany({
          where: {
            id,
            accountId,
          },
          data: {
            priority,
          },
        })
      )
    );

    res.json({ message: 'Stack priorities updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const triggerAutoAllocations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await processPendingAllocations();
    res.json({
      message: 'Auto-allocation processing completed',
      processed: result.processed,
      timestamp: result.timestamp,
    });
  } catch (error) {
    next(error);
  }
};

export const resetStack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newTargetAmount, newTargetDueDate, newAutoAllocateAmount, newAutoAllocateFrequency } = req.body;

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    if (!stack.isCompleted) {
      return res.status(400).json({ message: 'Stack is not completed' });
    }

    await stackCompletionService.resetStackWithParams(id, {
      newTargetAmount,
      newTargetDueDate: newTargetDueDate ? new Date(newTargetDueDate) : undefined,
      newAutoAllocateAmount,
      newAutoAllocateFrequency,
    });

    const updatedStack = await prisma.stack.findUnique({ where: { id } });
    res.json(updatedStack);
  } catch (error) {
    next(error);
  }
};

export const dismissStackReset = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stack = await prisma.stack.findFirst({
      where: { id },
      include: { account: true },
    });

    if (!stack || stack.account.userId !== req.userId) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    await stackCompletionService.dismissReset(id);
    res.json({ message: 'Reset dismissed' });
  } catch (error) {
    next(error);
  }
};

export const getPendingStackResets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const pendingStacks = await stackCompletionService.getPendingResets(req.userId);
    res.json(pendingStacks);
  } catch (error) {
    next(error);
  }
};
