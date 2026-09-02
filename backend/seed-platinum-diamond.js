import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Platinum and Diamond packages...');

  const packages = [
    // Platinum Local
    {
      id: 'PLATINUM_LOCAL_5',
      name: 'Platinum Local (5 Duty - 15 Days)',
      duration: 15,
      price: 500,
      maxDuties: 5,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-',
      isActive: true
    },
    {
      id: 'PLATINUM_LOCAL_8',
      name: 'Platinum Local (8 Duty - 20 Days)',
      duration: 20,
      price: 700,
      maxDuties: 8,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-',
      isActive: true
    },
    {
      id: 'PLATINUM_LOCAL_18',
      name: 'Platinum Local (18 Duty - 2 Months)',
      duration: 60,
      price: 1700,
      maxDuties: 18,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-',
      isActive: true
    },
    // Platinum Outstation
    {
      id: 'PLATINUM_OUTSTATION_36',
      name: 'Platinum Outstation (36 Duty - 4 Months)',
      duration: 120,
      price: 3599,
      maxDuties: 36,
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-',
      isActive: true
    },
    {
      id: 'PLATINUM_OUTSTATION_52',
      name: 'Platinum Outstation (52 Duty - 5 Months)',
      duration: 150,
      price: 5000,
      maxDuties: 52,
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-',
      isActive: true
    },
    {
      id: 'PLATINUM_OUTSTATION_63',
      name: 'Platinum Outstation (63 Duty - 6 Months)',
      duration: 180,
      price: 6000,
      maxDuties: 63,
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-',
      isActive: true
    },

    // Diamond Local
    {
      id: 'DIAMOND_LOCAL_10',
      name: 'Diamond Local (10 Duty - 25 Days)',
      duration: 25,
      price: 900,
      maxDuties: 10,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-',
      isActive: true
    },
    {
      id: 'DIAMOND_LOCAL_13',
      name: 'Diamond Local (13 Duty - 1 Month)',
      duration: 30,
      price: 1100,
      maxDuties: 13,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-',
      isActive: true
    },
    {
      id: 'DIAMOND_LOCAL_25',
      name: 'Diamond Local (25 Duty - 3 Months)',
      duration: 90,
      price: 2300,
      maxDuties: 25,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-',
      isActive: true
    },
    // Diamond Outstation
    {
      id: 'DIAMOND_OUTSTATION_72',
      name: 'Diamond Outstation (72 Duty - 8 Months)',
      duration: 240,
      price: 6999,
      maxDuties: 72,
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-',
      isActive: true
    },
    {
      id: 'DIAMOND_OUTSTATION_84',
      name: 'Diamond Outstation (84 Duty - 10 Months)',
      duration: 300,
      price: 7999,
      maxDuties: 84,
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-',
      isActive: true
    },
    {
      id: 'DIAMOND_OUTSTATION_96',
      name: 'Diamond Outstation (96 Duty - 12 Months)',
      duration: 365,
      price: 8999,
      maxDuties: 96,
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-',
      isActive: true
    }
  ];

  for (const pkg of packages) {
    await prisma.subscriptionPlan.upsert({
      where: { id: pkg.id },
      update: pkg,
      create: pkg,
    });
    console.log(`✓ Created/Updated: ${pkg.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
