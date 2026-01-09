import prisma from '../utils/prisma';

export interface NegativeBalanceResult {
  handled: boolean;
  behavior: string;
  deallocatedStacks?: Array<{ stackId: string; stackName: string; amount: number }>;
  remainingNegative?: number;
  message: string;
}

export class NegativeBalanceService {
  /**
   * Handle negative available balance based on user preferences
   */
  async handleNegativeBalance(
    accountId: string,
    userId: string,
    negativeAmount: number
  ): Promise<NegativeBalanceResult> {
    // Get user preferences
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    const behavior = preferences?.negativeBalanceBehavior || 'auto_deallocate';

    if (behavior === 'allow_negative') {
      return {
        handled: true,
        behavior,
        message: 'Negative balance allowed per user settings',
      };
    }

    if (behavior === 'notify_only') {
      return {
        handled: false,
        behavior,
        remainingNegative: negativeAmount,
        message: 'Notification required - user needs to manually resolve',
      };
    }

    // Default: auto_deallocate
    return await this.autoDeallocate(accountId, Math.abs(negativeAmount));
  }

  /**
   * Automatically deallocate from lowest priority stacks to cover the deficit
   */
  private async autoDeallocate(
    accountId: string,
    amountNeeded: number
  ): Promise<NegativeBalanceResult> {
    // Get all stacks ordered by priority (highest number = lowest priority)
    const stacks = await prisma.stack.findMany({
      where: {
        accountId,
        isActive: true,
        currentAmount: { gt: 0 },
      },
      orderBy: { priority: 'desc' }, // Start with lowest priority
    });

    const deallocatedStacks: Array<{ stackId: string; stackName: string; amount: number }> = [];
    let remainingNeeded = amountNeeded;

    for (const stack of stacks) {
      if (remainingNeeded <= 0) break;

      const amountToTake = Math.min(stack.currentAmount, remainingNeeded);

      // Deallocate from this stack
      await prisma.$transaction(async (tx) => {
        await tx.stack.update({
          where: { id: stack.id },
          data: { currentAmount: { decrement: amountToTake } },
        });

        await tx.account.update({
          where: { id: accountId },
          data: { availableBalance: { increment: amountToTake } },
        });

        const account = await tx.account.findUnique({
          where: { id: accountId },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            accountId,
            stackId: stack.id,
            type: 'allocation',
            amount: amountToTake,
            description: `Auto-deallocated from "${stack.name}" due to low account balance`,
            balance: account?.balance || 0,
            isVirtual: true,
          },
        });
      });

      deallocatedStacks.push({
        stackId: stack.id,
        stackName: stack.name,
        amount: amountToTake,
      });

      remainingNeeded -= amountToTake;
    }

    if (remainingNeeded > 0) {
      // Couldn't fully cover the deficit
      return {
        handled: false,
        behavior: 'auto_deallocate',
        deallocatedStacks,
        remainingNegative: remainingNeeded,
        message: `Deallocated from ${deallocatedStacks.length} stack(s), but still short $${remainingNeeded.toFixed(2)}`,
      };
    }

    return {
      handled: true,
      behavior: 'auto_deallocate',
      deallocatedStacks,
      message: `Successfully deallocated from ${deallocatedStacks.length} stack(s) to cover deficit`,
    };
  }

  /**
   * Create a notification for the user about negative balance
   */
  async createNotification(
    userId: string,
    accountId: string,
    result: NegativeBalanceResult
  ): Promise<void> {
    // This will be implemented when we add a notifications system
    // For now, we'll just log it
    console.log('Negative balance notification:', {
      userId,
      accountId,
      result,
    });

    // TODO: Create actual notification in database
    // TODO: Send email if emailNotifications is enabled
  }
}

export default new NegativeBalanceService();
