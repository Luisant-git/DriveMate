import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function backfill() {
  try {
    const deletedCustomers = await prisma.customer.findMany({
      where: { email: { startsWith: 'deleted_' } }
    });
    
    for (const c of deletedCustomers) {
      const exists = await prisma.deletedAccountArchive.findFirst({
        where: { originalId: c.id }
      });
      if (!exists) {
        await prisma.deletedAccountArchive.create({
          data: {
            originalId: c.id,
            role: 'CUSTOMER',
            name: c.name,
            phone: c.phone,
            email: c.email,
            data: c
          }
        });
      }
    }

    const deletedDrivers = await prisma.driver.findMany({
      where: { email: { startsWith: 'deleted_' } }
    });
    
    for (const d of deletedDrivers) {
      const exists = await prisma.deletedAccountArchive.findFirst({
        where: { originalId: d.id }
      });
      if (!exists) {
        await prisma.deletedAccountArchive.create({
          data: {
            originalId: d.id,
            role: 'DRIVER',
            name: d.name,
            phone: d.phone,
            email: d.email,
            data: d
          }
        });
      }
    }

    const deletedLeads = await prisma.lead.findMany({
      where: { email: { startsWith: 'deleted_' } }
    });
    
    for (const l of deletedLeads) {
      const exists = await prisma.deletedAccountArchive.findFirst({
        where: { originalId: l.id }
      });
      if (!exists) {
        await prisma.deletedAccountArchive.create({
          data: {
            originalId: l.id,
            role: 'LEAD',
            name: l.name,
            phone: l.phone,
            email: l.email,
            data: l
          }
        });
      }
    }

    console.log(`Backfilled ${deletedCustomers.length} customers, ${deletedDrivers.length} drivers, ${deletedLeads.length} leads.`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

backfill();
