import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOutstationPricing() {
  console.log('Cleaning Outstation Pricing...');

  // Delete all OUTSTATION packages
  await prisma.pricingPackage.deleteMany({
    where: { packageType: 'OUTSTATION' }
  });
  console.log('✓ Deleted all existing OUTSTATION packages');

  // Create only the 3 required packages
  const packages = [
    {
      packageType: 'OUTSTATION',
      hours: 8,
      minimumKm: 60,
      minimumCharge: 850,
      extraPerHour: 100,
      description: '8 Hours Package (60-150 KM)'
    },
    {
      packageType: 'OUTSTATION',
      hours: 10,
      minimumKm: 150,
      minimumCharge: 950,
      extraPerHour: 100,
      description: '10 Hours Package (151-300 KM)'
    },
    {
      packageType: 'OUTSTATION',
      hours: 12,
      minimumKm: 300,
      minimumCharge: 1000,
      extraPerHour: 100,
      description: '12 Hours Package (300+ KM)'
    }
  ];

  for (const pkg of packages) {
    await prisma.pricingPackage.create({ data: pkg });
    console.log(`✓ Created: ${pkg.description}`);
  }

  console.log('Done!');
}

cleanOutstationPricing()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
