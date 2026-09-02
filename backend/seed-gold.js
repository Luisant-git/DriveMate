import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const goldPackages = [
    {
      name: 'Gold 1',
      price: 500,
      maxDuties: 5,
      duration: 15, // 15 Days
      type: 'LOCAL',
      description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/-'
    },
    {
      name: 'Gold 2',
      price: 1999,
      maxDuties: 21,
      duration: 60, // 2 Months
      type: 'LOCAL',
      description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-'
    }
  ];

  for (const pkg of goldPackages) {
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

  console.log('Gold packages seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
