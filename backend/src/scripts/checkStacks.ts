import prisma from '../utils/prisma';

async function checkStacks() {
  try {
    // Find all accounts with their stacks
    const accounts = await prisma.account.findMany({
      include: {
        stacks: {
          orderBy: { priority: 'asc' }
        }
      }
    });

    console.log('\n=== Accounts with Stacks ===\n');

    for (const account of accounts) {
      console.log(`\nAccount: ${account.name} (${account.type})`);
      console.log(`  ID: ${account.id}`);
      console.log(`  Balance: $${account.balance.toFixed(2)}`);
      console.log(`  Available: $${account.availableBalance.toFixed(2)}`);
      console.log(`  Stacks (${account.stacks.length}):`);

      if (account.stacks.length === 0) {
        console.log('    (No stacks)');
      } else {
        for (const stack of account.stacks) {
          console.log(`\n    - ${stack.name}`);
          console.log(`      ID: ${stack.id}`);
          console.log(`      Priority: ${stack.priority}`);
          console.log(`      Current: $${stack.currentAmount.toFixed(2)} / Target: $${stack.targetAmount?.toFixed(2) ?? 'None'}`);
          console.log(`      Active: ${stack.isActive}`);
          console.log(`      Auto-allocate: ${stack.autoAllocate ? 'Yes' : 'No'}`);
          if (stack.autoAllocate) {
            console.log(`        Amount: $${stack.autoAllocateAmount?.toFixed(2) ?? 'N/A'}`);
            console.log(`        Frequency: ${stack.autoAllocateFrequency ?? 'N/A'}`);
            console.log(`        Next date: ${stack.autoAllocateNextDate?.toISOString() ?? 'N/A'}`);
          }
          console.log(`      Overflow: ${stack.overflowBehavior}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStacks();
