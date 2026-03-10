import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding lead subscription packages...');

  // Three-tier package system based on SNP model
  const leadPackages = [
    {
      id: 'SILVER_PACKAGE',
      name: 'SILVER PACKAGE',
      type: 'LOCAL',
      types: ['DRIVER_TAXI', 'LOCAL'],
      duration: 30,
      price: 3050,
      description: 'Driver/Taxi: YES | Local: YES | Outstation: NO | Monthly: NO | Total Leads: UP TO 30 | Advance Payment: Rs. 6150/-',
      maxLeads: 30,
      advancePayment: 6150
    },
    {
      id: 'GOLD_PACKAGE', 
      name: 'GOLD PACKAGE',
      type: 'OUTSTATION',
      types: ['LOCAL', 'OUTSTATION', 'MONTHLY'],
      duration: 30,
      price: 5050,
      description: 'Driver/Taxi: NO | Local: YES | Outstation: YES | Monthly: YES | Total Leads: UP TO 60 | Advance Payment: Rs. 10100/-',
      maxLeads: 60,
      advancePayment: 10100
    },
    {
      id: 'DIAMOND_PACKAGE',
      name: 'DIAMOND PACKAGE', 
      type: 'OUTSTATION',
      types: ['DRIVER_TAXI', 'LOCAL', 'OUTSTATION', 'MONTHLY'],
      duration: 30,
      price: 9050,
      description: 'Driver/Taxi: YES | Local: YES | Outstation: YES | Monthly: YES | Total Leads: UP TO 90 | Advance Payment: Rs. 18100/-',
      maxLeads: 90,
      advancePayment: 18100
    }
  ];

  for (const pkg of leadPackages) {
    await prisma.leadSubscriptionPlan.upsert({
      where: { id: pkg.id },
      update: pkg,
      create: pkg,
    });
    console.log(`✓ Created/Updated: ${pkg.name}`);
  }

  console.log('Lead packages seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
