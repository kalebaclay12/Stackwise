import prisma from '../utils/prisma';
import { calculateNextAllocationDate, AllocationFrequency } from '../utils/dateCalculator';
import stackCompletionService from './stackCompletion.service';

export async function processPendingAllocations() {
  try {
    const now = new Date();

    // Find all stacks that are due for auto-allocation
    const dueStacks = await prisma.stack.findMany({
      where: {
        autoAllocate: true,
        isActive: true,
        autoAllocateNextDate: {
          lte: now,
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        priority: 'asc', // Process in priority order for overflow handling
      },
    });

    console.log(`Found ${dueStacks.length} stacks due for auto-allocation`);

    for (const stack of dueStacks) {
      try {
        // Skip if no amount specified
        if (!stack.autoAllocateAmount || stack.autoAllocateAmount <= 0) {
          console.warn(`Stack ${stack.id} has no valid allocation amount, skipping`);
          continue;
        }

        // Get fresh account data to check current available balance
        const account = await prisma.account.findUnique({
          where: { id: stack.accountId },
        });

        if (!account) {
          console.error(`Account ${stack.accountId} not found for stack ${stack.id}`);
          continue;
        }

        // Check if account has sufficient available balance
        if (account.availableBalance < stack.autoAllocateAmount) {
          console.warn(
            `Insufficient balance in account ${stack.accountId} for stack ${stack.id}. ` +
            `Required: ${stack.autoAllocateAmount}, Available: ${account.availableBalance}`
          );

          // Calculate next date even if we skip this allocation
          if (stack.autoAllocateFrequency && stack.autoAllocateNextDate) {
            const nextDate = calculateNextAllocationDate(
              stack.autoAllocateNextDate,
              stack.autoAllocateFrequency as AllocationFrequency
            );

            await prisma.stack.update({
              where: { id: stack.id },
              data: { autoAllocateNextDate: nextDate },
            });
          }
          continue;
        }

        // Get fresh stack data
        const currentStack = await prisma.stack.findUnique({
          where: { id: stack.id },
        });

        if (!currentStack) {
          console.error(`Stack ${stack.id} not found`);
          continue;
        }

        // Determine how much to allocate based on overflow behavior
        let amountToAllocate = stack.autoAllocateAmount;
        let overflowAmount = 0;
        let overflowHandled = false;

        // Check if allocation would exceed target
        if (currentStack.targetAmount &&
            (currentStack.currentAmount + stack.autoAllocateAmount) > currentStack.targetAmount) {

          const behavior = currentStack.overflowBehavior;
          overflowAmount = (currentStack.currentAmount + stack.autoAllocateAmount) - currentStack.targetAmount;

          console.log(
            `Stack "${currentStack.name}" will exceed target by $${overflowAmount.toFixed(2)}. ` +
            `Overflow behavior: ${behavior}`
          );

          if (behavior === 'next_priority') {
            // Find next priority stack in same account
            const nextStack = await prisma.stack.findFirst({
              where: {
                accountId: currentStack.accountId,
                priority: { gt: currentStack.priority },
                isActive: true,
              },
              orderBy: { priority: 'asc' },
            });

            if (nextStack) {
              // Allocate up to target to this stack, send overflow to next
              amountToAllocate = currentStack.targetAmount - currentStack.currentAmount;

              await prisma.$transaction(async (tx) => {
                // Allocate to current stack (up to target)
                if (amountToAllocate > 0) {
                  await tx.stack.update({
                    where: { id: currentStack.id },
                    data: { currentAmount: { increment: amountToAllocate } },
                  });
                }

                // Allocate overflow to next stack
                await tx.stack.update({
                  where: { id: nextStack.id },
                  data: { currentAmount: { increment: overflowAmount } },
                });

                // Update account available balance
                const updatedAccount = await tx.account.update({
                  where: { id: currentStack.accountId },
                  data: { availableBalance: { decrement: stack.autoAllocateAmount ?? 0 } },
                });

                // Create transactions
                if (amountToAllocate > 0) {
                  await tx.transaction.create({
                    data: {
                      accountId: currentStack.accountId,
                      stackId: currentStack.id,
                      type: 'allocation',
                      amount: -amountToAllocate,
                      description: `Auto-allocated to "${currentStack.name}"`,
                      balance: updatedAccount.balance,
                      isVirtual: true,
                    },
                  });
                }

                await tx.transaction.create({
                  data: {
                    accountId: currentStack.accountId,
                    stackId: nextStack.id,
                    type: 'allocation',
                    amount: -overflowAmount,
                    description: `Overflow from "${currentStack.name}"`,
                    balance: updatedAccount.balance,
                    isVirtual: true,
                  },
                });

                // Calculate and update next allocation date
                if (stack.autoAllocateFrequency && stack.autoAllocateNextDate) {
                  const nextDate = calculateNextAllocationDate(
                    stack.autoAllocateNextDate,
                    stack.autoAllocateFrequency as AllocationFrequency
                  );

                  await tx.stack.update({
                    where: { id: currentStack.id },
                    data: { autoAllocateNextDate: nextDate },
                  });
                }
              });

              overflowHandled = true;

              // Check if either stack is completed
              await stackCompletionService.checkAndMarkCompleted(currentStack.id);
              await stackCompletionService.checkAndMarkCompleted(nextStack.id);

              console.log(
                `Successfully allocated $${amountToAllocate.toFixed(2)} to "${currentStack.name}" ` +
                `and $${overflowAmount.toFixed(2)} overflow to "${nextStack.name}"`
              );
            }
          } else if (behavior === 'available_balance') {
            // Allocate only up to target, return overflow to available balance
            amountToAllocate = currentStack.targetAmount - currentStack.currentAmount;

            if (amountToAllocate > 0) {
              await prisma.$transaction(async (tx) => {
                await tx.stack.update({
                  where: { id: currentStack.id },
                  data: { currentAmount: { increment: amountToAllocate } },
                });

                const updatedAccount = await tx.account.update({
                  where: { id: currentStack.accountId },
                  data: { availableBalance: { decrement: amountToAllocate } },
                });

                await tx.transaction.create({
                  data: {
                    accountId: currentStack.accountId,
                    stackId: currentStack.id,
                    type: 'allocation',
                    amount: -amountToAllocate,
                    description: `Auto-allocated to "${currentStack.name}" ($${overflowAmount.toFixed(2)} returned to available balance)`,
                    balance: updatedAccount.balance,
                    isVirtual: true,
                  },
                });

                // Calculate and update next allocation date
                if (stack.autoAllocateFrequency && stack.autoAllocateNextDate) {
                  const nextDate = calculateNextAllocationDate(
                    stack.autoAllocateNextDate,
                    stack.autoAllocateFrequency as AllocationFrequency
                  );

                  await tx.stack.update({
                    where: { id: currentStack.id },
                    data: { autoAllocateNextDate: nextDate },
                  });
                }
              });

              overflowHandled = true;
              await stackCompletionService.checkAndMarkCompleted(currentStack.id);

              console.log(
                `Successfully allocated $${amountToAllocate.toFixed(2)} to "${currentStack.name}" ` +
                `($${overflowAmount.toFixed(2)} returned to available balance)`
              );
            }
          }
          // 'keep_in_stack' behavior: just allocate the full amount (handled below)
        }

        // If no overflow or 'keep_in_stack' behavior, allocate normally
        if (!overflowHandled) {
          await prisma.$transaction(async (tx) => {
            await tx.stack.update({
              where: { id: currentStack.id },
              data: {
                currentAmount: {
                  increment: stack.autoAllocateAmount ?? 0,
                },
              },
            });

            const updatedAccount = await tx.account.update({
              where: { id: currentStack.accountId },
              data: {
                availableBalance: {
                  decrement: stack.autoAllocateAmount ?? 0,
                },
              },
            });

            await tx.transaction.create({
              data: {
                accountId: currentStack.accountId,
                stackId: currentStack.id,
                type: 'allocation',
                amount: -(stack.autoAllocateAmount ?? 0),
                description: `Auto-allocated to "${currentStack.name}"`,
                balance: updatedAccount.balance,
                isVirtual: true,
              },
            });

            // Calculate and update next allocation date
            if (stack.autoAllocateFrequency && stack.autoAllocateNextDate) {
              const nextDate = calculateNextAllocationDate(
                stack.autoAllocateNextDate,
                stack.autoAllocateFrequency as AllocationFrequency
              );

              await tx.stack.update({
                where: { id: currentStack.id },
                data: { autoAllocateNextDate: nextDate },
              });
            }
          });

          // Check if stack is completed after allocation
          await stackCompletionService.checkAndMarkCompleted(currentStack.id);

          console.log(
            `Successfully allocated $${stack.autoAllocateAmount} to stack "${currentStack.name}" (${currentStack.id})`
          );
        }
      } catch (error) {
        console.error(`Error processing stack ${stack.id}:`, error);
        // Continue processing other stacks even if one fails
      }
    }

    // After all allocations, process any completed stacks
    await stackCompletionService.processCompletedStacks();

    return {
      processed: dueStacks.length,
      timestamp: now,
    };
  } catch (error) {
    console.error('Error in processPendingAllocations:', error);
    throw error;
  }
}
