import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Standard and Silver packages...');

  const packages = [
    {
      id: 'STANDARD_PACKAGE',
      name: 'Standard Package (5 Duty - 15 Days)',
      duration: 15,
      price: 500,
      maxDuties: 5,
      type: 'LOCAL',
      description: 'LOCAL: MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-',
      isActive: true
    },
    {
      id: 'SILVER_PACKAGE',
      name: 'Silver Package (21 Duty - 2 Months)',
      duration: 60,
      price: 1999,
      maxDuties: 21,
      type: 'LOCAL',
      description: 'LOCAL: MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-',
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
