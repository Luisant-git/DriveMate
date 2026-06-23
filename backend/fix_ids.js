import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  console.log("Fixing Drivers...");
  const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'asc' } });
  
  // Negate all first to avoid unique constraint violations
  for (let i = 0; i < drivers.length; i++) {
    await prisma.$executeRawUnsafe(`UPDATE drivers SET "driverNo" = ${-(i + 1000)} WHERE id = '${drivers[i].id}'`);
  }
  
  // Set correct sequential numbers
  for (let i = 0; i < drivers.length; i++) {
    await prisma.$executeRawUnsafe(`UPDATE drivers SET "driverNo" = ${i + 1} WHERE id = '${drivers[i].id}'`);
  }
  await prisma.$executeRawUnsafe(`SELECT setval('"drivers_driverNo_seq"', ${drivers.length + 1}, false)`);

  console.log("Fixing Customers...");
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'asc' } });
  
  // Negate all first
  for (let i = 0; i < customers.length; i++) {
    await prisma.$executeRawUnsafe(`UPDATE customers SET "customerNo" = ${-(i + 1000)} WHERE id = '${customers[i].id}'`);
  }
  
  // Set correct sequential numbers
  for (let i = 0; i < customers.length; i++) {
    await prisma.$executeRawUnsafe(`UPDATE customers SET "customerNo" = ${i + 1} WHERE id = '${customers[i].id}'`);
  }
  await prisma.$executeRawUnsafe(`SELECT setval('"customers_customerNo_seq"', ${customers.length + 1}, false)`);

  console.log("Done!");
}

fix().catch(console.error).finally(() => prisma.$disconnect());
