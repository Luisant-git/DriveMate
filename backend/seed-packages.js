import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding subscription packages...');

  // LOCAL Packages
  const localPackages = [
    { name: 'LOCAL - 4 Duty (15 Days)', type: 'LOCAL', duration: 15, price: 399, description: 'Mini 4 hour Rs.400-450, Extra per hour Rs.80-90' },
    { name: 'LOCAL - 6 Duty (20 Days)', type: 'LOCAL', duration: 20, price: 599, description: 'Mini 4 hour Rs.400-450, Extra per hour Rs.80-90' },
    { name: 'LOCAL - 8 Duty (25 Days)', type: 'LOCAL', duration: 25, price: 799, description: 'Mini 4 hour Rs.400-450, Extra per hour Rs.80-90' },
    { name: 'LOCAL - 10 Duty (1 Month)', type: 'LOCAL', duration: 30, price: 999, description: 'Mini 4 hour Rs.400-450, Extra per hour Rs.80-90' },
    { name: 'LOCAL NEW - 8 Duty (20 Days)', type: 'LOCAL', duration: 20, price: 699, description: 'Mini 4 hour Rs.450-500, Extra per hour Rs.90-100' },
    { name: 'LOCAL NEW - 10 Duty (25 Days)', type: 'LOCAL', duration: 25, price: 899, description: 'Mini 4 hour Rs.450-500, Extra per hour Rs.90-100' },
    { name: 'LOCAL NEW - 17 Duty (2 Months)', type: 'LOCAL', duration: 60, price: 1599, description: 'Mini 4 hour Rs.450-500, Extra per hour Rs.90-100' },
    { name: 'LOCAL NEW - 20 Duty (3 Months)', type: 'LOCAL', duration: 90, price: 1899, description: 'Mini 4 hour Rs.450-500, Extra per hour Rs.90-100' },
  ];

  // OUTSTATION Packages
  const outstationPackages = [
    { name: 'OUTSTATION - 33 Duty (4 Months)', type: 'OUTSTATION', duration: 120, price: 3399, description: 'Mini 12 hours Rs.850-950, Food extra per hour Rs.90' },
    { name: 'OUTSTATION - 44 Duty (5 Months)', type: 'OUTSTATION', duration: 150, price: 4499, description: 'Mini 12 hours Rs.850-950, Food extra per hour Rs.90' },
    { name: 'OUTSTATION - 55 Duty (6 Months)', type: 'OUTSTATION', duration: 180, price: 5599, description: 'Mini 12 hours Rs.850-950, Food extra per hour Rs.90' },
    { name: 'OUTSTATION NEW - 68 Duty (8 Months)', type: 'OUTSTATION', duration: 240, price: 6699, description: 'Mini 12 hours Rs.950-1500, Food extra per hour Rs.90-100' },
    { name: 'OUTSTATION NEW - 79 Duty (10 Months)', type: 'OUTSTATION', duration: 300, price: 7799, description: 'Mini 12 hours Rs.950-1500, Food extra per hour Rs.90-100' },
    { name: 'OUTSTATION NEW - 90 Duty (12 Months)', type: 'OUTSTATION', duration: 365, price: 8899, description: 'Mini 12 hours Rs.950-1500, Food extra per hour Rs.90-100' },
  ];

  const allPackages = [...localPackages, ...outstationPackages];

  for (const pkg of allPackages) {
    await prisma.subscriptionPlan.upsert({
      where: { 
        id: `${pkg.type}-${pkg.duration}-${pkg.price}` 
      },
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
