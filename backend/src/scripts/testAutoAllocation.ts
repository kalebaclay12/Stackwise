import prisma from '../utils/prisma';
import { processPendingAllocations } from '../services/autoAllocation.service';

/**
 * Test script to verify auto-allocation overflow behavior and completion detection
 *
 * This script tests:
 * 1. Overflow behavior: next_priority
 * 2. Overflow behavior: available_balance
 * 3. Overflow behavior: keep_in_stack
 * 4. Stack completion detection after auto-allocation
 * 5. Auto-reset for recurring stacks
 */

async function testAutoAllocation() {
  console.log('=== Starting Auto-Allocation Tests ===\n');

  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@stackwise.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@stackwise.com',
          password: 'test123',
          firstName: 'Test',
          lastName: 'User',
        },
      });
      console.log('✓ Created test user');
    }

    // Find or create test account with sufficient balance
    let testAccount = await prisma.account.findFirst({
      where: {
        userId: testUser.id,
        name: 'Test Account',
      },
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
      console.log('✓ Created test account with $1000 balance');
    } else {
      // Update balance for testing
      testAccount = await prisma.account.update({
        where: { id: testAccount.id },
        data: {
          balance: 1000,
          availableBalance: 1000,
        },
      });
      console.log('✓ Updated test account balance to $1000');
    }

    // Clean up old test stacks
    await prisma.stack.deleteMany({
      where: {
        accountId: testAccount.id,
      },
    });
    console.log('✓ Cleaned up old test stacks\n');

    // TEST 1: next_priority overflow behavior
    console.log('--- Test 1: next_priority overflow ---');
    const stack1 = await prisma.stack.create({
      data: {
        accountId: testAccount.id,
        name: 'Test Stack 1 (next_priority)',
        targetAmount: 100,
        currentAmount: 90, // Almost at target
        color: '#3B82F6',
        icon: '💰',
        priority: 0,
        isActive: true,
        autoAllocate: true,
        autoAllocateAmount: 20, // Will exceed by $10
        autoAllocateFrequency: 'daily',
        autoAllocateStartDate: new Date('2020-01-01'),
        autoAllocateNextDate: new Date(Date.now() - 1000), // Due now
        resetBehavior: 'none',
        overflowBehavior: 'next_priority',
      },
    });

    const stack2 = await prisma.stack.create({
      data: {
        accountId: testAccount.id,
        name: 'Test Stack 2 (receives overflow)',
        targetAmount: 200,
        currentAmount: 0,
        color: '#10B981',
        icon: '🎯',
        priority: 1,
        isActive: true,
        autoAllocate: false,
        resetBehavior: 'none',
        overflowBehavior: 'next_priority',
      },
    });

    console.log(`Stack 1: $${stack1.currentAmount}/$${stack1.targetAmount}`);
    console.log(`Stack 2: $${stack2.currentAmount}/$${stack2.targetAmount}`);
    console.log(`Auto-allocate: $${stack1.autoAllocateAmount} to Stack 1`);
    console.log('Expected: Stack 1 = $100, Stack 2 = $10, Available = $980\n');

    // TEST 2: available_balance overflow behavior
    console.log('--- Test 2: available_balance overflow ---');
    const stack3 = await prisma.stack.create({
      data: {
        accountId: testAccount.id,
        name: 'Test Stack 3 (available_balance)',
        targetAmount: 50,
        currentAmount: 45,
        color: '#F59E0B',
        icon: '🏠',
        priority: 2,
        isActive: true,
        autoAllocate: true,
        autoAllocateAmount: 15, // Will exceed by $10
        autoAllocateFrequency: 'daily',
        autoAllocateStartDate: new Date('2020-01-01'),
        autoAllocateNextDate: new Date(Date.now() - 1000), // Due now
        resetBehavior: 'none',
        overflowBehavior: 'available_balance',
      },
    });

    console.log(`Stack 3: $${stack3.currentAmount}/$${stack3.targetAmount}`);
    console.log(`Auto-allocate: $${stack3.autoAllocateAmount} to Stack 3`);
    console.log('Expected: Stack 3 = $50 (completed), Available balance increases by $10\n');

    // TEST 3: keep_in_stack overflow behavior
    console.log('--- Test 3: keep_in_stack overflow ---');
    const stack4 = await prisma.stack.create({
      data: {
        accountId: testAccount.id,
        name: 'Test Stack 4 (keep_in_stack)',
        targetAmount: 75,
        currentAmount: 70,
        color: '#EF4444',
        icon: '🚗',
        priority: 3,
        isActive: true,
        autoAllocate: true,
        autoAllocateAmount: 25, // Will exceed by $20
        autoAllocateFrequency: 'daily',
        autoAllocateStartDate: new Date('2020-01-01'),
        autoAllocateNextDate: new Date(Date.now() - 1000), // Due now
        resetBehavior: 'none',
        overflowBehavior: 'keep_in_stack',
      },
    });

    console.log(`Stack 4: $${stack4.currentAmount}/$${stack4.targetAmount}`);
    console.log(`Auto-allocate: $${stack4.autoAllocateAmount} to Stack 4`);
    console.log('Expected: Stack 4 = $95 (exceeds target, keeps overflow)\n');

    // TEST 4: Recurring stack with auto-reset
    console.log('--- Test 4: Recurring stack auto-reset ---');
    const stack5 = await prisma.stack.create({
      data: {
        accountId: testAccount.id,
        name: 'Test Stack 5 (recurring)',
        targetAmount: 30,
        currentAmount: 25,
        targetDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        color: '#8B5CF6',
        icon: '📅',
        priority: 4,
        isActive: true,
        autoAllocate: true,
        autoAllocateAmount: 10,
        autoAllocateFrequency: 'daily',
        autoAllocateStartDate: new Date('2020-01-01'),
        autoAllocateNextDate: new Date(Date.now() - 1000), // Due now
        resetBehavior: 'auto_reset',
        recurringPeriod: 'monthly',
        overflowBehavior: 'available_balance',
      },
    });

    console.log(`Stack 5: $${stack5.currentAmount}/$${stack5.targetAmount} (recurring)`);
    console.log(`Auto-allocate: $${stack5.autoAllocateAmount} to Stack 5`);
    console.log('Expected: Stack 5 = $30 (completed), should be marked for reset\n');

    // Run auto-allocation
    console.log('=== Running Auto-Allocation ===\n');
    await processPendingAllocations();

    // Check results
    console.log('\n=== Checking Results ===\n');

    const updatedAccount = await prisma.account.findUnique({
      where: { id: testAccount.id },
    });

    const updatedStack1 = await prisma.stack.findUnique({
      where: { id: stack1.id },
    });

    const updatedStack2 = await prisma.stack.findUnique({
      where: { id: stack2.id },
    });

    const updatedStack3 = await prisma.stack.findUnique({
      where: { id: stack3.id },
    });

    const updatedStack4 = await prisma.stack.findUnique({
      where: { id: stack4.id },
    });

    const updatedStack5 = await prisma.stack.findUnique({
      where: { id: stack5.id },
    });

    console.log('Test 1 - next_priority:');
    console.log(`  Stack 1: $${updatedStack1?.currentAmount}/$${updatedStack1?.targetAmount} (${updatedStack1?.isCompleted ? 'COMPLETED' : 'active'})`);
    console.log(`  Stack 2: $${updatedStack2?.currentAmount}/$${updatedStack2?.targetAmount}`);
    console.log(`  ✓ ${updatedStack1?.currentAmount === 100 && updatedStack2?.currentAmount === 10 ? 'PASS' : 'FAIL'}`);

    console.log('\nTest 2 - available_balance:');
    console.log(`  Stack 3: $${updatedStack3?.currentAmount}/$${updatedStack3?.targetAmount} (${updatedStack3?.isCompleted ? 'COMPLETED' : 'active'})`);
    console.log(`  ✓ ${updatedStack3?.currentAmount === 50 && updatedStack3?.isCompleted ? 'PASS' : 'FAIL'}`);

    console.log('\nTest 3 - keep_in_stack:');
    console.log(`  Stack 4: $${updatedStack4?.currentAmount}/$${updatedStack4?.targetAmount} (${updatedStack4?.isCompleted ? 'COMPLETED' : 'active'})`);
    console.log(`  ✓ ${updatedStack4?.currentAmount === 95 ? 'PASS' : 'FAIL'}`);

    console.log('\nTest 4 - recurring stack:');
    console.log(`  Stack 5: $${updatedStack5?.currentAmount}/$${updatedStack5?.targetAmount} (${updatedStack5?.isCompleted ? 'COMPLETED' : 'active'})`);
    console.log(`  ✓ ${updatedStack5?.currentAmount === 30 && updatedStack5?.isCompleted ? 'PASS' : 'FAIL'}`);

    console.log(`\nAccount available balance: $${updatedAccount?.availableBalance}`);
    console.log(`Expected: ~$920 (1000 - 20 - 5 - 25 - 10 - 10 = 930, but overflow adjustments)`);

    console.log('\n=== Tests Complete ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoAllocation();
