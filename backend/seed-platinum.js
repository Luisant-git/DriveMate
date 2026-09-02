import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const platinumPackages = [
    // Local Platinum Packages
    {
      name: 'Platinum Local (5 Duty - 15 Days)',
      price: 500,
      maxDuties: 5,
      duration: 15,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-'
    },
    {
      name: 'Platinum Local (8 Duty - 20 Days)',
      price: 700,
      maxDuties: 8,
      duration: 20,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-'
    },
    {
      name: 'Platinum Local (18 Duty - 2 Months)',
      price: 1700,
      maxDuties: 18,
      duration: 60,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-'
    },
    // Outstation Platinum Packages
    {
      name: 'Platinum Outstation (36 Duty - 4 Months)',
      price: 3599,
      maxDuties: 36,
      duration: 120,
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-'
    },
    {
      name: 'Platinum Outstation (52 Duty - 5 Months)',
      price: 5000,
      maxDuties: 52,
      duration: 150,
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-'
    },
    {
      name: 'Platinum Outstation (63 Duty - 6 Months)',
      price: 6000,
      maxDuties: 63,
      duration: 180,
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-'
    }
  ];

  for (const pkg of platinumPackages) {
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

  console.log('Platinum packages seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
