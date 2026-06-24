const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrder() {
  console.log('Starting order fix...');

  // 1. Fix Drivers
  console.log('\n--- Fixing Drivers ---');
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log('Applying temporary offsets for drivers to avoid unique constraint errors...');
  for (const [index, driver] of drivers.entries()) {
    await prisma.driver.update({
      where: { id: driver.id },
      data: { driverNo: 1000000 + index + 1 } // Safe high numbers
    });
  }

  console.log('Setting exact sequential driver numbers (1, 2, 3...)...');
  for (const [index, driver] of drivers.entries()) {
    await prisma.driver.update({
      where: { id: driver.id },
      data: { driverNo: index + 1 }
    });
  }
  console.log(`Successfully reordered ${drivers.length} drivers.`);

  // 2. Fix Customers
  console.log('\n--- Fixing Customers ---');
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log('Applying temporary offsets for customers...');
  for (const [index, customer] of customers.entries()) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { customerNo: 1000000 + index + 1 }
    });
  }

  console.log('Setting exact sequential customer numbers (1, 2, 3...)...');
  for (const [index, customer] of customers.entries()) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { customerNo: index + 1 }
    });
  }
  console.log(`Successfully reordered ${customers.length} customers.`);

  // Attempt to reset auto-increment sequences (Mainly for PostgreSQL)
  try {
     console.log('\nAttempting to reset database auto-increment sequences...');
     await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Driver"', 'driverNo'), coalesce(max("driverNo")+1, 1), false) FROM "Driver";`);
     await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Customer"', 'customerNo'), coalesce(max("customerNo")+1, 1), false) FROM "Customer";`);
     console.log('Sequences reset successfully.');
  } catch(e) {
     console.log('Note: Sequence reset skipped (This is normal if you are using MySQL/MongoDB).');
  }

  console.log('\nAll done! Your IDs are now perfectly ordered by creation date.');
}

fixOrder()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
