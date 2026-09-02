import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const diamondPackages = [
    // Local Diamond Packages
    {
      name: 'Diamond Local (10 Duty - 25 Days)',
      price: 900,
      maxDuties: 10,
      duration: 25,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-'
    },
    {
      name: 'Diamond Local (13 Duty - 1 Month)',
      price: 1100,
      maxDuties: 13,
      duration: 30,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-'
    },
    {
      name: 'Diamond Local (25 Duty - 3 Months)',
      price: 2300,
      maxDuties: 25,
      duration: 90,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-'
    },
    // Outstation Diamond Packages
    {
      name: 'Diamond Outstation (72 Duty - 8 Months)',
      price: 6999,
      maxDuties: 72,
      duration: 240,
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-'
    },
    {
      name: 'Diamond Outstation (84 Duty - 10 Months)',
      price: 7999,
      maxDuties: 84,
      duration: 300,
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-'
    },
    {
      name: 'Diamond Outstation (96 Duty - 12 Months)',
      price: 8999,
      maxDuties: 96,
      duration: 365,
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-'
    }
  ];

  for (const pkg of diamondPackages) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: pkg.name }
    });

    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: pkg
      });
      console.log(`Updated ${pkg.name}`);
    } else {
      await prisma.subscriptionPlan.create({
        data: pkg
      });
      console.log(`Created ${pkg.name}`);
    }
  }

  console.log('Diamond packages seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
