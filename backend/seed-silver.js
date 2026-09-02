import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const silverPackages = [
    {
      name: 'Silver 1',
      price: 1777,
      maxDuties: 18,
      duration: 30,
      type: 'LOCAL',
      description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-'
    },
    {
      name: 'Silver 2',
      price: 2234,
      maxDuties: 23,
      duration: 90,
      type: 'LOCAL',
      description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-'
    },
    {
      name: 'Silver 3',
      price: 4350,
      maxDuties: 44,
      duration: 36500, // Unlimited
      type: 'LOCAL',
      description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-'
    }
  ];

  for (const pkg of silverPackages) {
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

  console.log('Silver packages seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
