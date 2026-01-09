import prisma from '../utils/prisma';

async function fixVirtualTransactions() {
  try {
    // Update all allocation transactions to be marked as virtual
    const result = await prisma.transaction.updateMany({
      where: {
        type: 'allocation',
        isVirtual: false,
      },
      data: {
        isVirtual: true,
      },
    });

    console.log(`Updated ${result.count} allocation transactions to isVirtual: true`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing virtual transactions:', error);
    process.exit(1);
  }
}

fixVirtualTransactions();
