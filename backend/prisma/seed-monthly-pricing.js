import prisma from '../src/config/database.js';

async function seedMonthlyPricing() {
  console.log('Seeding monthly pricing data...');

  const pricingData = [
    // Mini - 8 Hours
    { vehicleType: 'Mini', hoursPerDay: '8', daysPerWeek: '5', charge5Days: 18000, charge6Days: 20000, extraPerHour: 90 },
    { vehicleType: 'Mini', hoursPerDay: '8', daysPerWeek: '6', charge5Days: 18000, charge6Days: 20000, extraPerHour: 90 },
    
    // Mini - 10 Hours
    { vehicleType: 'Mini', hoursPerDay: '10', daysPerWeek: '5', charge5Days: 20000, charge6Days: 22000, extraPerHour: 90 },
    { vehicleType: 'Mini', hoursPerDay: '10', daysPerWeek: '6', charge5Days: 20000, charge6Days: 22000, extraPerHour: 90 },
    
    // Mini - 12 Hours
    { vehicleType: 'Mini', hoursPerDay: '12', daysPerWeek: '5', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
    { vehicleType: 'Mini', hoursPerDay: '12', daysPerWeek: '6', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
    
    // Mini - 1 Day
    { vehicleType: 'Mini', hoursPerDay: '1 day', daysPerWeek: '12', charge5Days: 850, charge6Days: 950, extraPerHour: 90 },
    
    // Sedan - 8 Hours
    { vehicleType: 'Sedan', hoursPerDay: '8', daysPerWeek: '5', charge5Days: 19000, charge6Days: 20000, extraPerHour: 90 },
    { vehicleType: 'Sedan', hoursPerDay: '8', daysPerWeek: '6', charge5Days: 19000, charge6Days: 20000, extraPerHour: 90 },
    
    // Sedan - 10 Hours
    { vehicleType: 'Sedan', hoursPerDay: '10', daysPerWeek: '5', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
    { vehicleType: 'Sedan', hoursPerDay: '10', daysPerWeek: '6', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
    
    // Sedan - 12 Hours
    { vehicleType: 'Sedan', hoursPerDay: '12', daysPerWeek: '5', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
    { vehicleType: 'Sedan', hoursPerDay: '12', daysPerWeek: '6', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
    
    // Sedan - 1 Day
    { vehicleType: 'Sedan', hoursPerDay: '1 day', daysPerWeek: '12', charge5Days: 850, charge6Days: 950, extraPerHour: 90 },
    
    // SUV/MPV - 8 Hours
    { vehicleType: 'SUV/MPV', hoursPerDay: '8', daysPerWeek: '5', charge5Days: 20000, charge6Days: 20000, extraPerHour: 90 },
    { vehicleType: 'SUV/MPV', hoursPerDay: '8', daysPerWeek: '6', charge5Days: 20000, charge6Days: 20000, extraPerHour: 90 },
    
    // SUV/MPV - 10 Hours
    { vehicleType: 'SUV/MPV', hoursPerDay: '10', daysPerWeek: '5', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
    { vehicleType: 'SUV/MPV', hoursPerDay: '10', daysPerWeek: '6', charge5Days: 21000, charge6Days: 22000, extraPerHour: 90 },
    
    // SUV/MPV - 12 Hours
    { vehicleType: 'SUV/MPV', hoursPerDay: '12', daysPerWeek: '5', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
    { vehicleType: 'SUV/MPV', hoursPerDay: '12', daysPerWeek: '6', charge5Days: 22000, charge6Days: 24000, extraPerHour: 90 },
    
    // SUV/MPV - 1 Day
    { vehicleType: 'SUV/MPV', hoursPerDay: '1 day', daysPerWeek: '12', charge5Days: 850, charge6Days: 950, extraPerHour: 90 },
    
    // Luxury Car - 8 Hours
    { vehicleType: 'Luxury Car', hoursPerDay: '8', daysPerWeek: '5', charge5Days: 20000, charge6Days: 21000, extraPerHour: 90 },
    { vehicleType: 'Luxury Car', hoursPerDay: '8', daysPerWeek: '6', charge5Days: 20000, charge6Days: 21000, extraPerHour: 90 },
    
    // Luxury Car - 10 Hours
    { vehicleType: 'Luxury Car', hoursPerDay: '10', daysPerWeek: '5', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
    { vehicleType: 'Luxury Car', hoursPerDay: '10', daysPerWeek: '6', charge5Days: 22000, charge6Days: 23000, extraPerHour: 90 },
    
    // Luxury Car - 12 Hours
    { vehicleType: 'Luxury Car', hoursPerDay: '12', daysPerWeek: '5', charge5Days: 23000, charge6Days: 25000, extraPerHour: 90 },
    { vehicleType: 'Luxury Car', hoursPerDay: '12', daysPerWeek: '6', charge5Days: 23000, charge6Days: 25000, extraPerHour: 90 },
    
    // Luxury Car - 1 Day
    { vehicleType: 'Luxury Car', hoursPerDay: '1 day', daysPerWeek: '12', charge5Days: 1000, charge6Days: 1200, extraPerHour: 90 },
  ];

  for (const data of pricingData) {
    await prisma.monthlyPricing.upsert({
      where: {
        vehicleType_hoursPerDay_daysPerWeek: {
          vehicleType: data.vehicleType,
          hoursPerDay: data.hoursPerDay,
          daysPerWeek: data.daysPerWeek
        }
      },
      update: data,
      create: data
    });
  }

  console.log('✅ Monthly pricing data seeded successfully!');
}

seedMonthlyPricing()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
