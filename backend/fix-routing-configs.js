import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixRouting() {
  console.log('Fixing Booking Routing Configs...');

  // A BOTH package takes local and outstation duties, so it belongs in both
  // lists. MONTHLY is a one-time service charge and is deliberately excluded.
  const localPlans = await prisma.subscriptionPlan.findMany({
    where: { type: { in: ['LOCAL', 'BOTH'] }, isActive: true }
  });

  const outstationPlans = await prisma.subscriptionPlan.findMany({
    where: { type: { in: ['OUTSTATION', 'BOTH'] }, isActive: true }
  });

  console.log(`Found ${localPlans.length} LOCAL/BOTH plans and ${outstationPlans.length} OUTSTATION/BOTH plans.`);

  // 1. Config for Local - Hourly (One Way)
  const localConfig = await prisma.bookingRoutingConfig.upsert({
    where: {
      serviceType_tripType: {
        serviceType: 'Local - Hourly',
        tripType: 'One Way'
      }
    },
    update: {
      driverPlanIds: localPlans.map(p => p.id)
    },
    create: {
      serviceType: 'Local - Hourly',
      tripType: 'One Way',
      driverPlanIds: localPlans.map(p => p.id)
    }
  });

  // 2. Config for Outstation (One Way)
  const outstationOneWayConfig = await prisma.bookingRoutingConfig.upsert({
    where: {
      serviceType_tripType: {
        serviceType: 'Outstation',
        tripType: 'One Way'
      }
    },
    update: {
      driverPlanIds: outstationPlans.map(p => p.id)
    },
    create: {
      serviceType: 'Outstation',
      tripType: 'One Way',
      driverPlanIds: outstationPlans.map(p => p.id)
    }
  });

  // 3. Config for Outstation (Round Trip)
  const outstationRoundTripConfig = await prisma.bookingRoutingConfig.upsert({
    where: {
      serviceType_tripType: {
        serviceType: 'Outstation',
        tripType: 'Round Trip'
      }
    },
    update: {
      driverPlanIds: outstationPlans.map(p => p.id)
    },
    create: {
      serviceType: 'Outstation',
      tripType: 'Round Trip',
      driverPlanIds: outstationPlans.map(p => p.id)
    }
  });

  console.log('Routing configs successfully updated with new packages!');
}

fixRouting()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
