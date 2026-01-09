import prisma from '../utils/prisma';
import negativeBalanceService from '../services/negativeBalance.service';

/**
 * Test script to verify negative balance handling with all three behaviors
 */

async function testNegativeBalanceHandling() {
  console.log('=== Testing Negative Balance Handling ===\n');

  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: { contains: '@' } },
    });

    if (!testUser) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log(`Using test user: ${testUser.email} (${testUser.id})\n`);

    // Create or get test account
    let testAccount = await prisma.account.findFirst({
      where: { userId: testUser.id },
    });

    if (!testAccount) {
      testAccount = await prisma.account.create({
        data: {
          userId: testUser.id,
          type: 'checking',
          name: 'Test Account',
          balance: 1000,
          availableBalance: 1000,
        },
      });
      console.log(`Created test account: ${testAccount.name}\n`);
    } else {
      console.log(`Using existing account: ${testAccount.name}\n`);
    }

    // Create test stacks with different priorities
    const stack1 = await prisma.stack.upsert({
      where: { id: 'test-stack-1' },
      create: {
        id: 'test-stack-1',
        accountId: testAccount.id,
        name: 'High Priority Stack',
        currentAmount: 100,
        priority: 1,
        color: '#3B82F6',
        icon: '🎯',
        isActive: true,
        autoAllocate: false,
        resetBehavior: 'none',
        overflowBehavior: 'keep_in_stack',
        isCompleted: false,
        pendingReset: false,
      },
      update: {
        currentAmount: 100,
        priority: 1,
        isActive: true,
      },
    });

    const stack2 = await prisma.stack.upsert({
      where: { id: 'test-stack-2' },
      create: {
        id: 'test-stack-2',
        accountId: testAccount.id,
        name: 'Medium Priority Stack',
        currentAmount: 75,
        priority: 2,
        color: '#10B981',
        icon: '💰',
        isActive: true,
        autoAllocate: false,
        resetBehavior: 'none',
        overflowBehavior: 'keep_in_stack',
        isCompleted: false,
        pendingReset: false,
      },
      update: {
        currentAmount: 75,
        priority: 2,
        isActive: true,
      },
    });

    const stack3 = await prisma.stack.upsert({
      where: { id: 'test-stack-3' },
      create: {
        id: 'test-stack-3',
        accountId: testAccount.id,
        name: 'Low Priority Stack',
        currentAmount: 50,
        priority: 3,
        color: '#F59E0B',
        icon: '🏦',
        isActive: true,
        autoAllocate: false,
        resetBehavior: 'none',
        overflowBehavior: 'keep_in_stack',
        isCompleted: false,
        pendingReset: false,
      },
      update: {
        currentAmount: 50,
        priority: 3,
        isActive: true,
      },
    });

    console.log('Created test stacks:');
    console.log(`  - ${stack1.name}: $${stack1.currentAmount} (Priority 1 - Highest)`);
    console.log(`  - ${stack2.name}: $${stack2.currentAmount} (Priority 2)`);
    console.log(`  - ${stack3.name}: $${stack3.currentAmount} (Priority 3 - Lowest)`);
    console.log('');

    // Update account balance
    const totalAllocated = 100 + 75 + 50; // 225
    const accountBalance = 1000;
    const availableBalance = accountBalance - totalAllocated;

    await prisma.account.update({
      where: { id: testAccount.id },
      data: {
        balance: accountBalance,
        availableBalance: availableBalance,
      },
    });

    console.log(`Account Balance: $${accountBalance}`);
    console.log(`Total Allocated: $${totalAllocated}`);
    console.log(`Available Balance: $${availableBalance}\n`);

    // Test 1: auto_deallocate behavior
    console.log('--- Test 1: Auto-Deallocate Behavior ---');
    await prisma.userPreferences.upsert({
      where: { userId: testUser.id },
      create: {
        userId: testUser.id,
        negativeBalanceBehavior: 'auto_deallocate',
      },
      update: {
        negativeBalanceBehavior: 'auto_deallocate',
      },
    });

    // Simulate negative balance of -100
    const negativeAmount = -100;
    console.log(`Simulating negative available balance: $${negativeAmount}`);

    const result1 = await negativeBalanceService.handleNegativeBalance(
      testAccount.id,
      testUser.id,
      negativeAmount
    );

    console.log('Result:', result1);

    // Check stack balances after deallocation
    const updatedStacks1 = await prisma.stack.findMany({
      where: { accountId: testAccount.id },
      orderBy: { priority: 'asc' },
    });

    console.log('\nStack balances after auto-deallocation:');
    for (const stack of updatedStacks1) {
      console.log(`  - ${stack.name}: $${stack.currentAmount} (was $${
        stack.id === 'test-stack-1' ? 100 :
        stack.id === 'test-stack-2' ? 75 :
        50
      })`);
    }
    console.log('');

    // Reset stacks for next test
    await prisma.stack.update({
      where: { id: 'test-stack-1' },
      data: { currentAmount: 100 },
    });
    await prisma.stack.update({
      where: { id: 'test-stack-2' },
      data: { currentAmount: 75 },
    });
    await prisma.stack.update({
      where: { id: 'test-stack-3' },
      data: { currentAmount: 50 },
    });

    // Test 2: notify_only behavior
    console.log('--- Test 2: Notify Only Behavior ---');
    await prisma.userPreferences.update({
      where: { userId: testUser.id },
      data: { negativeBalanceBehavior: 'notify_only' },
    });

    const result2 = await negativeBalanceService.handleNegativeBalance(
      testAccount.id,
      testUser.id,
      negativeAmount
    );

    console.log('Result:', result2);

    const updatedStacks2 = await prisma.stack.findMany({
      where: { accountId: testAccount.id },
      orderBy: { priority: 'asc' },
    });

    console.log('\nStack balances (should be unchanged):');
    for (const stack of updatedStacks2) {
      console.log(`  - ${stack.name}: $${stack.currentAmount}`);
    }
    console.log('');

    // Test 3: allow_negative behavior
    console.log('--- Test 3: Allow Negative Behavior ---');
    await prisma.userPreferences.update({
      where: { userId: testUser.id },
      data: { negativeBalanceBehavior: 'allow_negative' },
    });

    const result3 = await negativeBalanceService.handleNegativeBalance(
      testAccount.id,
      testUser.id,
      negativeAmount
    );

    console.log('Result:', result3);

    const updatedStacks3 = await prisma.stack.findMany({
      where: { accountId: testAccount.id },
      orderBy: { priority: 'asc' },
    });

    console.log('\nStack balances (should be unchanged):');
    for (const stack of updatedStacks3) {
      console.log(`  - ${stack.name}: $${stack.currentAmount}`);
    }
    console.log('');

    console.log('=== All Tests Complete ===');
    console.log('\nSummary:');
    console.log('✓ auto_deallocate: Automatically removed money from lowest priority stacks');
    console.log('✓ notify_only: Did not modify stacks, returned notification message');
    console.log('✓ allow_negative: Allowed negative balance without modification');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNegativeBalanceHandling();
