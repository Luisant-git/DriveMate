import prisma from './src/config/database.js';

const localPackages = [
  { packageType: 'LOCAL_HOURLY', hours: 4, minimumCharge: 500, extraPerHour: 100, description: '4 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 5, minimumCharge: 600, extraPerHour: 100, description: '5 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 6, minimumCharge: 700, extraPerHour: 100, description: '6 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 7, minimumCharge: 800, extraPerHour: 100, description: '7 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 8, minimumCharge: 900, extraPerHour: 100, description: '8 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 9, minimumCharge: 1000, extraPerHour: 100, description: '9 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 10, minimumCharge: 1100, extraPerHour: 100, description: '10 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 11, minimumCharge: 1200, extraPerHour: 100, description: '11 Hour Local Package' },
  { packageType: 'LOCAL_HOURLY', hours: 12, minimumCharge: 1300, extraPerHour: 100, description: '12 Hour Local Package' }
];

const outstationPackages = [
  { packageType: 'OUTSTATION', hours: 8, minimumKm: 40, minimumCharge: 850, extraPerHour: 100, description: '8 Hours / 40 KM' },
  { packageType: 'OUTSTATION', hours: 9, minimumKm: 100, minimumCharge: 900, extraPerHour: 100, description: '9 Hours / 100 KM' },
  { packageType: 'OUTSTATION', hours: 10, minimumKm: 150, minimumCharge: 900, extraPerHour: 100, description: '10 Hours / 150 KM' },
  { packageType: 'OUTSTATION', hours: 11, minimumKm: 250, minimumCharge: 1100, extraPerHour: 100, description: '11 Hours / 250 KM' },
  { packageType: 'OUTSTATION', hours: 12, minimumKm: 300, minimumCharge: 1200, extraPerHour: 100, description: '12 Hours / 300 KM' },
  { packageType: 'OUTSTATION', hours: 16, minimumKm: 0, minimumCharge: 1500, extraPerHour: 100, description: 'Full Day Package (6AM to 10PM)' }
];

async function seedPricingPackages() {
  console.log('Seeding pricing packages...');
  
  for (const pkg of [...localPackages, ...outstationPackages]) {
    await prisma.pricingPackage.upsert({
      where: { 
        packageType_hours: { 
          packageType: pkg.packageType, 
          hours: pkg.hours 
        } 
      },
      update: pkg,
      create: pkg
    });
    console.log(`✓ ${pkg.packageType} ${pkg.hours}H package created/updated`);
  }
  
  console.log('Pricing packages seeded successfully!');
}

seedPricingPackages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
