import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    // Monthly Duty
    {
      category: 'Silver',
      name: 'Monthly Duty Service Charge',
      price: 2300,
      maxDuties: 30, // Assuming 1 duty per day for a month
      duration: 30,
      type: 'MONTHLY',
      description: 'ONE TIME SERVICE CHARGE FOR MONTHLY DUTY'
    },
    // Spare Driver Weekly Hourly Daily
    {
      category: 'Silver',
      name: 'Spare Driver - 23 Duties',
      price: 2234,
      maxDuties: 23,
      duration: 90, // 3 months
      type: 'LOCAL',
      description: 'LOCAL: MINI 4 HOUR 450 EXTRA PER HOUR 90/- | OUTSTATION: MINI 12 HOUR 900/- EXTRA PER HOUR 90/-'
    },
    
    // LOCAL OLD PACKAGE
    {
      category: 'Silver',
      name: 'Local Old - 5 Duties',
      price: 500,
      maxDuties: 5,
      duration: 15,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, 450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-'
    },
    {
      category: 'Silver',
      name: 'Local Old - 7 Duties',
      price: 700,
      maxDuties: 7,
      duration: 20,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, 450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-'
    },
    {
      category: 'Silver',
      name: 'Local Old - 17 Duties',
      price: 1700,
      maxDuties: 17,
      duration: 60, // 2 months
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, 450/- OR 500/- EXTRA PER HOUR RS, 90/- OR 100/-'
    },

    // OUTSTATION OLD PACKAGE
    {
      category: 'Silver',
      name: 'Outstation Old - 36 Duties',
      price: 3599,
      maxDuties: 36,
      duration: 120, // 4 months
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-'
    },
    {
      category: 'Silver',
      name: 'Outstation Old - 52 Duties',
      price: 5000,
      maxDuties: 52,
      duration: 150, // 5 months
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-'
    },
    {
      category: 'Silver',
      name: 'Outstation Old - 63 Duties',
      price: 6000,
      maxDuties: 63,
      duration: 180, // 6 months
      type: 'OUTSTATION',
      description: 'MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- FOOD EXTRA PER HOUR RS, 90/-'
    },

    // LOCAL NEW PACKAGE
    {
      category: 'Silver',
      name: 'Local New - 9 Duties',
      price: 900,
      maxDuties: 9,
      duration: 25,
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, 500 OR 550/- EXTRA PER HOUR RS, 100/-'
    },
    {
      category: 'Silver',
      name: 'Local New - 11 Duties',
      price: 1100,
      maxDuties: 11,
      duration: 30, // 1 month
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, 500 OR 550/- EXTRA PER HOUR RS, 100/-'
    },
    {
      category: 'Silver',
      name: 'Local New - 23 Duties',
      price: 2300,
      maxDuties: 23,
      duration: 90, // 3 months
      type: 'LOCAL',
      description: 'MINIMUM 4 HOUR RS, 500 OR 550/- EXTRA PER HOUR RS, 100/-'
    },

    // OUTSTATION NEW PACKAGE
    {
      category: 'Silver',
      name: 'Outstation New - 72 Duties',
      price: 6999,
      maxDuties: 72,
      duration: 240, // 8 months
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS, 90/- OR 100/-'
    },
    {
      category: 'Silver',
      name: 'Outstation New - 84 Duties',
      price: 7999,
      maxDuties: 84,
      duration: 300, // 10 months
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS, 90/- OR 100/-'
    },
    {
      category: 'Silver',
      name: 'Outstation New - 96 Duties',
      price: 8999,
      maxDuties: 96,
      duration: 365, // 12 months
      type: 'OUTSTATION',
      description: 'MINI 12 HOURS RS, 1000/- OR 1200/- UP RS, 1500/- FOOD EXTRA PER HOUR RS, 90/- OR 100/-'
    }
  ];

  // Optionally delete existing plans to clean up
  // await prisma.subscriptionPlan.deleteMany({});
  
  for (const pkg of packages) {
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

  console.log('All new packages seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
