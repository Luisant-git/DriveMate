import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding driver and lead subscription packages...');

  // Three-tier package system based on SNP model
  const packages = [
    {
      id: 'SILVER_PACKAGE',
      category: 'Silver',
      name: 'SILVER PACKAGE',
      type: 'LOCAL',
      types: ['DRIVER_TAXI', 'LOCAL'],
      duration: 30,
      price: 3050,
      description: 'Driver/Taxi: YES | Local: YES | Outstation: NO | Monthly: NO | Total Leads/Duties: UP TO 30 | Advance Payment: Rs. 6150/-',
      maxLeads: 30,
      maxDuties: 30,
      advancePayment: 6150
    },
    {
      id: 'GOLD_PACKAGE', 
      category: 'Gold',
      name: 'GOLD PACKAGE',
      type: 'OUTSTATION',
      types: ['LOCAL', 'OUTSTATION', 'MONTHLY'],
      duration: 30,
      price: 5050,
      description: 'Driver/Taxi: NO | Local: YES | Outstation: YES | Monthly: YES | Total Leads/Duties: UP TO 60 | Advance Payment: Rs. 10100/-',
      maxLeads: 60,
      maxDuties: 60,
      advancePayment: 10100
    },
    {
      id: 'DIAMOND_PACKAGE',
      category: 'Diamond',
      name: 'DIAMOND PACKAGE', 
      type: 'OUTSTATION',
      types: ['DRIVER_TAXI', 'LOCAL', 'OUTSTATION', 'MONTHLY'],
      duration: 30,
      price: 9050,
      description: 'Driver/Taxi: YES | Local: YES | Outstation: YES | Monthly: YES | Total Leads/Duties: UP TO 90 | Advance Payment: Rs. 18100/-',
      maxLeads: 90,
      maxDuties: 90,
      advancePayment: 18100
    }
  ];

  // Deactivate old plans (optional, but good practice so they don't confuse the admin UI)
  await prisma.subscriptionPlan.updateMany({
    data: { isActive: false }
  });
  
  await prisma.leadSubscriptionPlan.updateMany({
    data: { isActive: false }
  });

  for (const pkg of packages) {
    // Upsert Lead Package
    await prisma.leadSubscriptionPlan.upsert({
      where: { id: pkg.id },
      update: {
        name: pkg.name,
        type: pkg.type,
        types: pkg.types,
        duration: pkg.duration,
        price: pkg.price,
        description: pkg.description,
        maxLeads: pkg.maxLeads,
        advancePayment: pkg.advancePayment,
        isActive: true
      },
      create: {
        id: pkg.id,
        name: pkg.name,
        type: pkg.type,
        types: pkg.types,
        duration: pkg.duration,
        price: pkg.price,
        description: pkg.description,
        maxLeads: pkg.maxLeads,
        advancePayment: pkg.advancePayment,
        isActive: true
      },
    });
    console.log(`✓ Created/Updated Lead Package: ${pkg.name}`);

    // Upsert Driver Package (SubscriptionPlan)
    await prisma.subscriptionPlan.upsert({
      where: { id: pkg.id },
      update: {
        category: pkg.category,
        name: pkg.name,
        type: pkg.type,
        types: pkg.types,
        duration: pkg.duration,
        price: pkg.price,
        description: pkg.description,
        maxDuties: pkg.maxDuties,
        advancePayment: pkg.advancePayment,
        isActive: true
      },
      create: {
        id: pkg.id,
        category: pkg.category,
        name: pkg.name,
        type: pkg.type,
        types: pkg.types,
        duration: pkg.duration,
        price: pkg.price,
        description: pkg.description,
        maxDuties: pkg.maxDuties,
        advancePayment: pkg.advancePayment,
        isActive: true
      },
    });
    console.log(`✓ Created/Updated Driver Package: ${pkg.name}`);
  }

  console.log('Driver and Lead packages seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
