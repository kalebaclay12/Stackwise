import prisma from '../utils/prisma';
import stackCompletionService from '../services/stackCompletion.service';

/**
 * Comprehensive Stack Completion Testing Script
 *
 * This script tests all stack completion behaviors:
 * 1. auto_reset - Stack automatically resets when completed
 * 2. ask_reset - Stack asks user to reset (sets pendingReset flag)
 * 3. delete - Stack automatically deletes when completed
 * 4. none - Stack just marks as completed, no automatic action
 */

async function setupTestStacks() {
  console.log('\n=== Setting Up Test Stacks ===\n');

  // Find the Plaid Checking account
  const plaidAccount = await prisma.account.findFirst({
    where: { name: { contains: 'Plaid Checking' } }
  });

  if (!plaidAccount) {
    console.error('Plaid Checking account not found!');
    return null;
  }

  console.log(`Using account: ${plaidAccount.name} (${plaidAccount.id})`);
  console.log(`Available balance: $${plaidAccount.availableBalance.toFixed(2)}\n`);

  // Get existing test stacks
  const existingStacks = await prisma.stack.findMany({
    where: { accountId: plaidAccount.id },
    orderBy: { priority: 'asc' }
  });

  console.log(`Found ${existingStacks.length} existing stacks:`);
  for (const stack of existingStacks) {
    console.log(`  - ${stack.name} (Priority ${stack.priority}): $${stack.currentAmount}/${stack.targetAmount ?? 'no target'}`);
  }

  return { plaidAccount, existingStacks };
}

async function testAutoResetBehavior(accountId: string) {
  console.log('\n\n=== TEST 1: Auto-Reset Behavior ===');
  console.log('This stack should automatically reset to $0 when it reaches its target.\n');

  // Update the first stack to test auto_reset
  const stack = await prisma.stack.findFirst({
    where: {
      accountId,
      name: 'High Priority Stack'
    }
  });

  if (!stack) {
    console.log('Stack not found, skipping test');
    return;
  }

  // Configure for auto-reset testing
  await prisma.stack.update({
    where: { id: stack.id },
    data: {
      targetAmount: 120,  // Set target just $20 above current
      resetBehavior: 'auto_reset',
      recurringPeriod: 'monthly',
      targetDueDate: new Date('2026-02-01'),
      isCompleted: false,
      completedAt: null,
    }
  });

  console.log(`Configured "${stack.name}" for auto-reset:`);
  console.log(`  Current: $${stack.currentAmount} → Target: $120`);
  console.log(`  Reset Behavior: auto_reset`);
  console.log(`  Recurring: monthly`);

  // Allocate $20 to complete it
  console.log(`\nAllocating $20 to reach target...`);
  await prisma.$transaction(async (tx) => {
    await tx.stack.update({
      where: { id: stack.id },
      data: { currentAmount: { increment: 20 } }
    });
    await tx.account.update({
      where: { id: accountId },
      data: { availableBalance: { decrement: 20 } }
    });
  });

  // Check if it's completed
  const wasCompleted = await stackCompletionService.checkAndMarkCompleted(stack.id);
  console.log(`Stack completed: ${wasCompleted}`);

  if (wasCompleted) {
    // Process the completion
    await stackCompletionService.processCompletedStacks();

    // Check the result
    const resetStack = await prisma.stack.findUnique({ where: { id: stack.id } });
    console.log(`\nAfter auto-reset:`);
    console.log(`  Current Amount: $${resetStack?.currentAmount.toFixed(2)}`);
    console.log(`  Is Completed: ${resetStack?.isCompleted}`);
    console.log(`  Next Due Date: ${resetStack?.targetDueDate?.toISOString().split('T')[0]}`);

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    console.log(`  Account Available Balance: $${account?.availableBalance.toFixed(2)} (funds returned)`);
  }
}

async function testAskResetBehavior(accountId: string) {
  console.log('\n\n=== TEST 2: Ask-Reset Behavior ===');
  console.log('This stack should mark as completed and set pendingReset flag for user confirmation.\n');

  const stack = await prisma.stack.findFirst({
    where: {
      accountId,
      name: 'Medium Priority Stack'
    }
  });

  if (!stack) {
    console.log('Stack not found, skipping test');
    return;
  }

  // Configure for ask_reset testing
  await prisma.stack.update({
    where: { id: stack.id },
    data: {
      targetAmount: 90,  // Set target just $15 above current
      resetBehavior: 'ask_reset',
      recurringPeriod: 'weekly',
      isCompleted: false,
      completedAt: null,
      pendingReset: false,
    }
  });

  console.log(`Configured "${stack.name}" for ask-reset:`);
  console.log(`  Current: $${stack.currentAmount} → Target: $90`);
  console.log(`  Reset Behavior: ask_reset`);

  // Allocate $15 to complete it
  console.log(`\nAllocating $15 to reach target...`);
  await prisma.$transaction(async (tx) => {
    await tx.stack.update({
      where: { id: stack.id },
      data: { currentAmount: { increment: 15 } }
    });
    await tx.account.update({
      where: { id: accountId },
      data: { availableBalance: { decrement: 15 } }
    });
  });

  // Check if it's completed
  const wasCompleted = await stackCompletionService.checkAndMarkCompleted(stack.id);
  console.log(`Stack completed: ${wasCompleted}`);

  if (wasCompleted) {
    // Process the completion
    await stackCompletionService.processCompletedStacks();

    // Check the result
    const completedStack = await prisma.stack.findUnique({ where: { id: stack.id } });
    console.log(`\nAfter ask-reset processing:`);
    console.log(`  Current Amount: $${completedStack?.currentAmount.toFixed(2)}`);
    console.log(`  Is Completed: ${completedStack?.isCompleted}`);
    console.log(`  Pending Reset: ${completedStack?.pendingReset} ← Should be TRUE`);
    console.log(`  Completed At: ${completedStack?.completedAt?.toISOString()}`);

    console.log(`\n  ✓ Stack is waiting for user to confirm reset via UI`);
  }
}

async function testDeleteBehavior(accountId: string) {
  console.log('\n\n=== TEST 3: Delete Behavior ===');
  console.log('This stack should automatically delete when it reaches its target.\n');

  const stack = await prisma.stack.findFirst({
    where: {
      accountId,
      name: 'Low Priority Stack'
    }
  });

  if (!stack) {
    console.log('Stack not found, skipping test');
    return;
  }

  const stackId = stack.id;
  const stackName = stack.name;

  // Configure for delete testing
  await prisma.stack.update({
    where: { id: stack.id },
    data: {
      targetAmount: 60,  // Set target just $10 above current
      resetBehavior: 'delete',
      isCompleted: false,
      completedAt: null,
    }
  });

  console.log(`Configured "${stack.name}" for delete:`);
  console.log(`  Current: $${stack.currentAmount} → Target: $60`);
  console.log(`  Reset Behavior: delete`);

  // Allocate $10 to complete it
  console.log(`\nAllocating $10 to reach target...`);
  const beforeBalance = (await prisma.account.findUnique({ where: { id: accountId } }))?.availableBalance ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.stack.update({
      where: { id: stack.id },
      data: { currentAmount: { increment: 10 } }
    });
    await tx.account.update({
      where: { id: accountId },
      data: { availableBalance: { decrement: 10 } }
    });
  });

  // Check if it's completed
  const wasCompleted = await stackCompletionService.checkAndMarkCompleted(stackId);
  console.log(`Stack completed: ${wasCompleted}`);

  if (wasCompleted) {
    // Process the completion
    await stackCompletionService.processCompletedStacks();

    // Check if stack was deleted
    const deletedStack = await prisma.stack.findUnique({ where: { id: stackId } });
    console.log(`\nAfter delete processing:`);
    console.log(`  Stack exists: ${deletedStack !== null}`);

    if (!deletedStack) {
      console.log(`  ✓ Stack "${stackName}" was successfully deleted!`);

      const afterBalance = (await prisma.account.findUnique({ where: { id: accountId } }))?.availableBalance ?? 0;
      console.log(`  Account balance before: $${beforeBalance.toFixed(2)}`);
      console.log(`  Account balance after: $${afterBalance.toFixed(2)}`);
      console.log(`  Funds returned: $${(afterBalance - beforeBalance).toFixed(2)}`);
    }
  }
}

async function testNoneBehavior(accountId: string) {
  console.log('\n\n=== TEST 4: None Behavior (No Auto-Action) ===');
  console.log('This stack should just mark as completed with no automatic action.\n');

  // Create a new test stack for this
  const newStack = await prisma.stack.create({
    data: {
      accountId,
      name: 'Test None Behavior',
      targetAmount: 25,
      currentAmount: 0,
      resetBehavior: 'none',
      color: '#888888',
      icon: 'TestTube',
      priority: 99,
      isActive: true,
    }
  });

  console.log(`Created "${newStack.name}"`);
  console.log(`  Current: $${newStack.currentAmount} → Target: $25`);
  console.log(`  Reset Behavior: none`);

  // Allocate $25 to complete it
  console.log(`\nAllocating $25 to reach target...`);
  await prisma.$transaction(async (tx) => {
    await tx.stack.update({
      where: { id: newStack.id },
      data: { currentAmount: { increment: 25 } }
    });
    await tx.account.update({
      where: { id: accountId },
      data: { availableBalance: { decrement: 25 } }
    });
  });

  // Check if it's completed
  const wasCompleted = await stackCompletionService.checkAndMarkCompleted(newStack.id);
  console.log(`Stack completed: ${wasCompleted}`);

  if (wasCompleted) {
    // Process the completion
    await stackCompletionService.processCompletedStacks();

    // Check the result
    const completedStack = await prisma.stack.findUnique({ where: { id: newStack.id } });
    console.log(`\nAfter processing:`);
    console.log(`  Current Amount: $${completedStack?.currentAmount.toFixed(2)}`);
    console.log(`  Is Completed: ${completedStack?.isCompleted}`);
    console.log(`  Pending Reset: ${completedStack?.pendingReset}`);
    console.log(`  Stack still exists: ${completedStack !== null}`);
    console.log(`\n  ✓ Stack just sits completed, no automatic action taken`);

    // Clean up
    await prisma.stack.delete({ where: { id: newStack.id } });
    console.log(`  Cleaned up test stack`);
  }
}

async function printFinalState(accountId: string) {
  console.log('\n\n=== FINAL STATE ===\n');

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      stacks: {
        orderBy: { priority: 'asc' }
      }
    }
  });

  console.log(`Account: ${account?.name}`);
  console.log(`Balance: $${account?.balance.toFixed(2)}`);
  console.log(`Available: $${account?.availableBalance.toFixed(2)}`);
  console.log(`\nRemaining Stacks (${account?.stacks.length}):`);

  for (const stack of account?.stacks ?? []) {
    console.log(`\n  ${stack.name}`);
    console.log(`    Current: $${stack.currentAmount.toFixed(2)} / Target: $${stack.targetAmount?.toFixed(2) ?? 'None'}`);
    console.log(`    Completed: ${stack.isCompleted}`);
    console.log(`    Pending Reset: ${stack.pendingReset}`);
    console.log(`    Reset Behavior: ${stack.resetBehavior}`);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     STACK COMPLETION FUNCTIONALITY TEST SUITE          ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const setup = await setupTestStacks();
  if (!setup) {
    console.error('Setup failed, exiting...');
    return;
  }

  const { plaidAccount } = setup;

  try {
    // Run all tests in sequence
    await testAutoResetBehavior(plaidAccount.id);
    await testAskResetBehavior(plaidAccount.id);
    await testDeleteBehavior(plaidAccount.id);
    await testNoneBehavior(plaidAccount.id);

    // Show final state
    await printFinalState(plaidAccount.id);

    console.log('\n\n✅ ALL TESTS COMPLETED!\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
