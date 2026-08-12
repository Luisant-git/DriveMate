import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subscriptionPackages = [
  // Silver
  { category: 'Silver', name: 'Local (18 Duty - 1 Month)', type: 'LOCAL', duration: 30, price: 1777, maxDuties: 18, description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-' },
  { category: 'Silver', name: 'Local (23 Duty - 3 Months)', type: 'LOCAL', duration: 90, price: 2234, maxDuties: 23, description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-' },
  { category: 'Silver', name: 'Local (44 Duty - Unlimited)', type: 'LOCAL', duration: 3650, price: 4350, maxDuties: 44, description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-' },
  
  // Gold
  { category: 'Gold', name: 'Local (5 Duty - 15 Days)', type: 'LOCAL', duration: 15, price: 500, maxDuties: 5, description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/-' },
  { category: 'Gold', name: 'Local (21 Duty - 2 Months)', type: 'LOCAL', duration: 60, price: 1999, maxDuties: 21, description: 'LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-' },
  
  // Platinum
  { category: 'Platinum', name: 'Local (5 Duty - 15 Days)', type: 'LOCAL', duration: 15, price: 500, maxDuties: 5, description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-' },
  { category: 'Platinum', name: 'Local (8 Duty - 20 Days)', type: 'LOCAL', duration: 20, price: 700, maxDuties: 8, description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-' },
  { category: 'Platinum', name: 'Local (18 Duty - 2 Months)', type: 'LOCAL', duration: 60, price: 1700, maxDuties: 18, description: 'MINIMUM 4 HOUR RS,450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-' },
  { category: 'Platinum', name: 'Outstation (36 Duty - 4 Months)', type: 'OUTSTATION', duration: 120, price: 3599, maxDuties: 36, description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-' },
  { category: 'Platinum', name: 'Outstation (52 Duty - 5 Months)', type: 'OUTSTATION', duration: 150, price: 5000, maxDuties: 52, description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-' },
  { category: 'Platinum', name: 'Outstation (63 Duty - 6 Months)', type: 'OUTSTATION', duration: 180, price: 6000, maxDuties: 63, description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-' },

  // Diamond
  { category: 'Diamond', name: 'Local (10 Duty - 25 Days)', type: 'LOCAL', duration: 25, price: 900, maxDuties: 10, description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-' },
  { category: 'Diamond', name: 'Local (13 Duty - 1 Month)', type: 'LOCAL', duration: 30, price: 1100, maxDuties: 13, description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-' },
  { category: 'Diamond', name: 'Local (25 Duty - 3 Months)', type: 'LOCAL', duration: 90, price: 2300, maxDuties: 25, description: 'MINIMUM 4 HOUR RS, RS,500 OR 550/- EXTRA PER HOUR RS,100/-' },
  { category: 'Diamond', name: 'Outstation (72 Duty - 8 Months)', type: 'OUTSTATION', duration: 240, price: 6999, maxDuties: 72, description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-' },
  { category: 'Diamond', name: 'Outstation (84 Duty - 10 Months)', type: 'OUTSTATION', duration: 300, price: 7999, maxDuties: 84, description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-' },
  { category: 'Diamond', name: 'Outstation (96 Duty - 12 Months)', type: 'OUTSTATION', duration: 365, price: 8999, maxDuties: 96, description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS,90/- OR 100/-' },
];

const localPricing = [
  { packageType: 'LOCAL_HOURLY', hours: 4, minimumCharge: 500, immediateCharge: 550, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 5, minimumCharge: 600, immediateCharge: 650, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 6, minimumCharge: 700, immediateCharge: 750, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 7, minimumCharge: 800, immediateCharge: 850, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 8, minimumCharge: 900, immediateCharge: 950, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 9, minimumCharge: 1000, immediateCharge: 1050, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 10, minimumCharge: 1100, immediateCharge: 1150, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 11, minimumCharge: 1200, immediateCharge: 1250, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'LOCAL_HOURLY', hours: 12, minimumCharge: 1300, immediateCharge: 1350, extraPerHour: 90, extraPerHourImm: 100 },
];

const outstationPricing = [
  { packageType: 'OUTSTATION', hours: 8, minimumKm: 60, minimumCharge: 850, immediateCharge: 950, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'OUTSTATION', hours: 10, minimumKm: 150, minimumCharge: 950, immediateCharge: 1050, extraPerHour: 90, extraPerHourImm: 100 },
  { packageType: 'OUTSTATION', hours: 12, minimumKm: 300, minimumCharge: 1000, immediateCharge: 1200, extraPerHour: 90, extraPerHourImm: 100 },
];

const monthlyPricing = [
  { vehicleType: 'Luxury Car', hoursPerDay: '12 Hours', daysPerWeek: '1 day', charge5Days: 1000, charge6Days: 1200, extraPerHour: 90 },
  { vehicleType: 'Luxury Car', hoursPerDay: '10', daysPerWeek: '5 Days', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
  { vehicleType: 'Luxury Car', hoursPerDay: '10', daysPerWeek: '6 Days', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
  { vehicleType: 'Luxury Car', hoursPerDay: '12', daysPerWeek: '6 Days', charge5Days: 23000, charge6Days: 25000, extraPerHour: 90 },
  { vehicleType: 'Luxury Car', hoursPerDay: '12', daysPerWeek: '5 Days', charge5Days: 23000, charge6Days: 25000, extraPerHour: 90 },
  { vehicleType: 'Luxury Car', hoursPerDay: '8', daysPerWeek: '6 Days', charge5Days: 20000, charge6Days: 21000, extraPerHour: 90 },
  { vehicleType: 'Luxury Car', hoursPerDay: '8', daysPerWeek: '5 Days', charge5Days: 20000, charge6Days: 21000, extraPerHour: 90 },

  { vehicleType: 'Mini', hoursPerDay: '12 Hours', daysPerWeek: '1 day', charge5Days: 850, charge6Days: 950, extraPerHour: 90 },
  { vehicleType: 'Mini', hoursPerDay: '10', daysPerWeek: '6 Days', charge5Days: 20000, charge6Days: 22000, extraPerHour: 90 },
  { vehicleType: 'Mini', hoursPerDay: '10', daysPerWeek: '5 Days', charge5Days: 20000, charge6Days: 22000, extraPerHour: 90 },
  { vehicleType: 'Mini', hoursPerDay: '12', daysPerWeek: '6 Days', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
  { vehicleType: 'Mini', hoursPerDay: '12', daysPerWeek: '5 Days', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
  { vehicleType: 'Mini', hoursPerDay: '8', daysPerWeek: '5 Days', charge5Days: 18000, charge6Days: 20000, extraPerHour: 90 },
  { vehicleType: 'Mini', hoursPerDay: '8', daysPerWeek: '6 Days', charge5Days: 18000, charge6Days: 20000, extraPerHour: 90 },

  { vehicleType: 'Sedan', hoursPerDay: '12 Hours', daysPerWeek: '1 day', charge5Days: 850, charge6Days: 950, extraPerHour: 90 },
  { vehicleType: 'Sedan', hoursPerDay: '10', daysPerWeek: '5 Days', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
  { vehicleType: 'Sedan', hoursPerDay: '10', daysPerWeek: '6 Days', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
  { vehicleType: 'Sedan', hoursPerDay: '12', daysPerWeek: '5 Days', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
  { vehicleType: 'Sedan', hoursPerDay: '12', daysPerWeek: '6 Days', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
  { vehicleType: 'Sedan', hoursPerDay: '8', daysPerWeek: '5 Days', charge5Days: 19000, charge6Days: 20000, extraPerHour: 90 },
  { vehicleType: 'Sedan', hoursPerDay: '8', daysPerWeek: '6 Days', charge5Days: 19000, charge6Days: 20000, extraPerHour: 90 },

  { vehicleType: 'SUV/MPV', hoursPerDay: '12 Hours', daysPerWeek: '1 day', charge5Days: 850, charge6Days: 950, extraPerHour: 90 },
  { vehicleType: 'SUV/MPV', hoursPerDay: '10', daysPerWeek: '6 Days', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
  { vehicleType: 'SUV/MPV', hoursPerDay: '10', daysPerWeek: '5 Days', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
  { vehicleType: 'SUV/MPV', hoursPerDay: '12', daysPerWeek: '6 Days', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
  { vehicleType: 'SUV/MPV', hoursPerDay: '12', daysPerWeek: '5 Days', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
  { vehicleType: 'SUV/MPV', hoursPerDay: '8', daysPerWeek: '6 Days', charge5Days: 20000, charge6Days: 20000, extraPerHour: 90 },
  { vehicleType: 'SUV/MPV', hoursPerDay: '8', daysPerWeek: '5 Days', charge5Days: 20000, charge6Days: 20000, extraPerHour: 90 },
];


async function seedProduction() {
  console.log('--- Seeding Production Database ---');
  
  // 1. Seed Subscription Packages
  console.log('\n1. Seeding Subscription Packages...');
  for (const pkg of subscriptionPackages) {
    await prisma.subscriptionPlan.upsert({
      where: { 
        id: `${pkg.type}-${pkg.duration}-${pkg.price}-${pkg.maxDuties}` 
      },
      update: pkg,
      create: pkg,
    });
    console.log(`✓ Subscription: ${pkg.name}`);
  }

  // 2. Seed Pricing Packages (Customer Bookings)
  console.log('\n2. Seeding Hourly Pricing Charges...');
  const allPricing = [...localPricing, ...outstationPricing];
  for (const pkg of allPricing) {
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
    console.log(`✓ Pricing: ${pkg.packageType} ${pkg.hours}H`);
  }

  // 3. Seed Monthly Pricing (Customer Bookings)
  console.log('\n3. Seeding Monthly Pricing Charges...');
  for (const pkg of monthlyPricing) {
    await prisma.monthlyPricing.upsert({
      where: { 
        vehicleType_hoursPerDay_daysPerWeek: { 
          vehicleType: pkg.vehicleType, 
          hoursPerDay: pkg.hoursPerDay,
          daysPerWeek: pkg.daysPerWeek
        } 
      },
      update: pkg,
      create: pkg
    });
    console.log(`✓ Monthly Pricing: ${pkg.vehicleType} ${pkg.hoursPerDay}H ${pkg.daysPerWeek}`);
  }
  
  console.log('\n✅ Database seeding completed successfully!');
}

seedProduction()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
