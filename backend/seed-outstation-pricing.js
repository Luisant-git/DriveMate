import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOutstationPricing() {
  console.log('Seeding Outstation Pricing Packages...');

  const outstationPackages = [
    {
      packageType: 'OUTSTATION',
      hours: 8,
      minimumKm: 60,
      minimumCharge: 850,
      extraPerHour: 100,
      description: '8 Hours Package (60-150 KM) - Minimum Charge ₹850-950'
    },
    {
      packageType: 'OUTSTATION',
      hours: 10,
      minimumKm: 150,
      minimumCharge: 950,
      extraPerHour: 100,
      description: '10 Hours Package (151-300 KM) - Minimum Charge ₹950-1000'
    },
    {
      packageType: 'OUTSTATION',
      hours: 12,
      minimumKm: 300,
      minimumCharge: 1000,
      extraPerHour: 100,
      description: '12 Hours Package (300+ KM) - Minimum Charge ₹1000-1500'
    }
  ];

  for (const pkg of outstationPackages) {
    try {
      const existing = await prisma.pricingPackage.findUnique({
        where: {
          packageType_hours: {
            packageType: pkg.packageType,
            hours: pkg.hours
          }
        }
      });

      if (existing) {
        await prisma.pricingPackage.update({
          where: { id: existing.id },
          data: pkg
        });
        console.log(`✓ Updated: ${pkg.description}`);
      } else {
        await prisma.pricingPackage.create({
          data: pkg
        });
        console.log(`✓ Created: ${pkg.description}`);
      }
    } catch (error) {
      console.error(`✗ Error with ${pkg.description}:`, error.message);
    }
  }

  console.log('Outstation pricing seeding completed!');
}

seedOutstationPricing()
  .catch((e) => {
    console.error('Error seeding outstation pricing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
