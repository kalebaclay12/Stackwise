import { PrismaClient } from '@prisma/client';
import { calculateNextAllocationDate, AllocationFrequency } from '../utils/dateCalculator';

const prisma = new PrismaClient();

export interface StackResetParams {
  keepAmount?: boolean;
  keepDueDate?: boolean;
  newTargetAmount?: number;
  newTargetDueDate?: Date;
  newAutoAllocateAmount?: number;
  newAutoAllocateFrequency?: string;
}

export class StackCompletionService {
  /**
   * Check if a stack has reached its target and mark as completed
   */
  async checkAndMarkCompleted(stackId: string): Promise<boolean> {
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      include: { account: true }
    });

    if (!stack || !stack.targetAmount) {
      return false;
    }

    // Check if stack has reached or exceeded target
    if (stack.currentAmount >= stack.targetAmount && !stack.isCompleted) {
      const shouldAskReset = stack.resetBehavior === 'ask_reset';

      await prisma.stack.update({
        where: { id: stackId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          pendingReset: shouldAskReset,
        },
      });

      // Create notification if user needs to decide on reset
      if (shouldAskReset) {
        await prisma.notification.create({
          data: {
            userId: stack.account.userId,
            type: 'stack_reset_pending',
            title: `${stack.name} is ready to reset!`,
            message: `Your stack "${stack.name}" has reached its goal of $${stack.targetAmount.toFixed(2)}. Would you like to reset it and start saving again?`,
            data: JSON.stringify({ stackId: stack.id, stackName: stack.name }),
            read: false,
          },
        });
      }

      return true;
    }

    return false;
  }

  /**
   * Process completed stacks based on their reset behavior
   */
  async processCompletedStacks(): Promise<void> {
    const completedStacks = await prisma.stack.findMany({
      where: {
        isCompleted: true,
        isActive: true,
      },
    });

    for (const stack of completedStacks) {
      if (stack.resetBehavior === 'auto_reset' && !stack.pendingReset) {
        await this.autoResetStack(stack.id);
      } else if (stack.resetBehavior === 'delete' && !stack.pendingReset) {
        await this.deleteStack(stack.id);
      }
      // 'ask_reset' stacks remain pending until user action
    }
  }

  /**
   * Automatically reset a stack with the same parameters
   */
  async autoResetStack(stackId: string): Promise<void> {
    const stack = await prisma.stack.findUnique({ where: { id: stackId } });

    if (!stack || !stack.isCompleted) {
      return;
    }

    // Calculate new target due date based on recurring period
    let newTargetDueDate: Date | null = null;
    if (stack.targetDueDate && stack.recurringPeriod && stack.recurringPeriod !== 'none') {
      newTargetDueDate = this.calculateNextDueDate(
        new Date(stack.targetDueDate),
        stack.recurringPeriod
      );
    }

    // Calculate next auto-allocation date properly based on start date and frequency
    let newAutoAllocateNextDate = stack.autoAllocateNextDate;
    if (stack.autoAllocate && stack.autoAllocateStartDate && stack.autoAllocateFrequency) {
      const now = new Date();
      const startDate = new Date(stack.autoAllocateStartDate);

      // Calculate next occurrence from start date
      let nextDate = startDate;
      while (nextDate <= now) {
        nextDate = calculateNextAllocationDate(
          nextDate,
          stack.autoAllocateFrequency as AllocationFrequency
        );
      }
      newAutoAllocateNextDate = nextDate;
    }

    // Store the current amount before resetting (CRITICAL: must be done before update)
    const amountToReturn = stack.currentAmount;

    // Get account for transaction record
    const account = await prisma.account.findUnique({
      where: { id: stack.accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Perform all updates in a single transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Reset the stack to zero and set new due date
      await tx.stack.update({
        where: { id: stackId },
        data: {
          currentAmount: 0,
          isCompleted: false,
          completedAt: null,
          pendingReset: false,
          targetDueDate: newTargetDueDate,
          autoAllocateNextDate: newAutoAllocateNextDate,
        },
      });

      // Create a transaction record for the reset
      await tx.transaction.create({
        data: {
          accountId: stack.accountId,
          stackId: stack.id,
          type: 'allocation',
          amount: amountToReturn,
          description: `Stack "${stack.name}" auto-reset after completion`,
          balance: account.balance,
          isVirtual: true,
        },
      });

      // Return allocated funds to available balance
      await tx.account.update({
        where: { id: stack.accountId },
        data: {
          availableBalance: {
            increment: amountToReturn,
          },
        },
      });
    });
  }

  /**
   * Reset stack with custom parameters from user
   */
  async resetStackWithParams(
    stackId: string,
    params: StackResetParams
  ): Promise<void> {
    const stack = await prisma.stack.findUnique({ where: { id: stackId } });

    if (!stack || !stack.isCompleted) {
      throw new Error('Stack not found or not completed');
    }

    const account = await prisma.account.findUnique({
      where: { id: stack.accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Store the current amount before resetting
    const amountToReturn = stack.currentAmount;

    // Calculate next auto-allocation date properly based on start date and frequency
    let newAutoAllocateNextDate = stack.autoAllocateNextDate;
    if (stack.autoAllocate && stack.autoAllocateStartDate && stack.autoAllocateFrequency) {
      const now = new Date();
      const startDate = new Date(stack.autoAllocateStartDate);

      // Calculate next occurrence from start date
      let nextDate = startDate;
      while (nextDate <= now) {
        nextDate = calculateNextAllocationDate(
          nextDate,
          stack.autoAllocateFrequency as AllocationFrequency
        );
      }
      newAutoAllocateNextDate = nextDate;
    }

    // Perform all updates in a single transaction
    await prisma.$transaction(async (tx) => {
      // Return current stack amount to available balance
      await tx.account.update({
        where: { id: stack.accountId },
        data: {
          availableBalance: {
            increment: amountToReturn,
          },
        },
      });

      // Create transaction for the reset
      await tx.transaction.create({
        data: {
          accountId: stack.accountId,
          stackId: stack.id,
          type: 'allocation',
          amount: amountToReturn,
          description: `Stack "${stack.name}" reset after completion`,
          balance: account.balance,
          isVirtual: true,
        },
      });

      // Update stack with new parameters
      await tx.stack.update({
        where: { id: stackId },
        data: {
          currentAmount: 0,
          isCompleted: false,
          completedAt: null,
          pendingReset: false,
          targetAmount: params.newTargetAmount ?? stack.targetAmount,
          targetDueDate: params.newTargetDueDate ?? (params.keepDueDate ? stack.targetDueDate : null),
          autoAllocateAmount: params.newAutoAllocateAmount ?? stack.autoAllocateAmount,
          autoAllocateFrequency: params.newAutoAllocateFrequency ?? stack.autoAllocateFrequency,
          autoAllocateNextDate: newAutoAllocateNextDate,
        },
      });
    });
  }

  /**
   * Dismiss reset prompt and keep stack completed
   */
  async dismissReset(stackId: string): Promise<void> {
    await prisma.stack.update({
      where: { id: stackId },
      data: {
        pendingReset: false,
      },
    });
  }

  /**
   * Delete a completed stack
   */
  async deleteStack(stackId: string): Promise<void> {
    const stack = await prisma.stack.findUnique({ where: { id: stackId } });

    if (!stack) {
      return;
    }

    // Return allocated funds to available balance
    if (stack.currentAmount > 0) {
      await prisma.account.update({
        where: { id: stack.accountId },
        data: {
          availableBalance: {
            increment: stack.currentAmount,
          },
        },
      });
    }

    // Delete the stack (transactions will be cascade deleted or set to null)
    await prisma.stack.delete({
      where: { id: stackId },
    });
  }

  /**
   * Calculate next due date based on recurring period
   */
  private calculateNextDueDate(currentDueDate: Date, period: string): Date {
    const nextDate = new Date(currentDueDate);

    switch (period) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi_weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'bi_monthly':
        nextDate.setDate(nextDate.getDate() + 15);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semi_annually':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        // Default to monthly if unknown
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
  }

  /**
   * Get all stacks pending user reset confirmation
   */
  async getPendingResets(userId: string): Promise<any[]> {
    return await prisma.stack.findMany({
      where: {
        account: {
          userId,
        },
        isCompleted: true,
        pendingReset: true,
        isActive: true,
      },
      include: {
        account: true,
      },
    });
  }

  /**
   * Check if a transaction matches a stack's bill payment pattern and trigger auto-reset
   * This is called when new real transactions are synced from the bank
   */
  async checkTransactionForAutoReset(
    accountId: string,
    transactionAmount: number,
    transactionDescription: string,
    transactionDate: Date
  ): Promise<void> {
    // Find all completed stacks with auto_reset behavior for this account
    const completedStacks = await prisma.stack.findMany({
      where: {
        accountId,
        isCompleted: true,
        resetBehavior: 'auto_reset',
        isActive: true,
        targetAmount: { not: null },
      },
    });

    for (const stack of completedStacks) {
      // Check if transaction amount is close to the stack's target amount
      // Allow 5% variance for bills that may fluctuate slightly
      const amountDiff = Math.abs(Math.abs(transactionAmount) - (stack.targetAmount || 0));
      const percentDiff = (amountDiff / (stack.targetAmount || 1)) * 100;

      // If transaction amount matches stack target (within 5%)
      // AND transaction is a withdrawal/payment (negative)
      // AND description might match (simple keyword check)
      if (
        percentDiff <= 5 &&
        transactionAmount < 0 &&
        this.isLikelyBillPayment(transactionDescription, stack.name)
      ) {
        // This looks like the bill payment for this stack - trigger auto-reset
        console.log(
          `Auto-reset triggered for stack "${stack.name}" due to matching transaction: ${transactionDescription}`
        );
        await this.autoResetStack(stack.id);
      }
    }
  }

  /**
   * Simple heuristic to check if transaction description might match the stack name
   */
  private isLikelyBillPayment(transactionDesc: string, stackName: string): boolean {
    const descLower = transactionDesc.toLowerCase();
    const nameLower = stackName.toLowerCase();

    // Extract meaningful words from stack name (ignore common words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const nameWords = nameLower
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.includes(word));

    // Check if any significant word from stack name appears in transaction description
    for (const word of nameWords) {
      if (descLower.includes(word)) {
        return true;
      }
    }

    // Also check common bill payment patterns
    const billPatterns = [
      'payment',
      'bill pay',
      'autopay',
      'recurring',
      'subscription',
      'monthly',
    ];

    return billPatterns.some((pattern) => descLower.includes(pattern));
  }
}

export default new StackCompletionService();
