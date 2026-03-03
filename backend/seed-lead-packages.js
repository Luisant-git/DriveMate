import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding lead subscription packages...');

  // LOCAL Lead Packages
  const localLeadPackages = [
    { name: 'LOCAL LEAD - 5 Leads (7 Days)', type: 'LOCAL', leadsCount: 5, duration: 7, price: 299, description: 'Get 5 local ride leads for 7 days' },
    { name: 'LOCAL LEAD - 10 Leads (15 Days)', type: 'LOCAL', leadsCount: 10, duration: 15, price: 499, description: 'Get 10 local ride leads for 15 days' },
    { name: 'LOCAL LEAD - 20 Leads (1 Month)', type: 'LOCAL', leadsCount: 20, duration: 30, price: 899, description: 'Get 20 local ride leads for 1 month' },
    { name: 'LOCAL LEAD - 30 Leads (1 Month)', type: 'LOCAL', leadsCount: 30, duration: 30, price: 1299, description: 'Get 30 local ride leads for 1 month' },
    { name: 'LOCAL LEAD - 50 Leads (2 Months)', type: 'LOCAL', leadsCount: 50, duration: 60, price: 1999, description: 'Get 50 local ride leads for 2 months' },
  ];

  // OUTSTATION Lead Packages
  const outstationLeadPackages = [
    { name: 'OUTSTATION LEAD - 5 Leads (15 Days)', type: 'OUTSTATION', leadsCount: 5, duration: 15, price: 599, description: 'Get 5 outstation ride leads for 15 days' },
    { name: 'OUTSTATION LEAD - 10 Leads (1 Month)', type: 'OUTSTATION', leadsCount: 10, duration: 30, price: 999, description: 'Get 10 outstation ride leads for 1 month' },
    { name: 'OUTSTATION LEAD - 15 Leads (2 Months)', type: 'OUTSTATION', leadsCount: 15, duration: 60, price: 1499, description: 'Get 15 outstation ride leads for 2 months' },
    { name: 'OUTSTATION LEAD - 25 Leads (3 Months)', type: 'OUTSTATION', leadsCount: 25, duration: 90, price: 2299, description: 'Get 25 outstation ride leads for 3 months' },
    { name: 'OUTSTATION LEAD - 40 Leads (6 Months)', type: 'OUTSTATION', leadsCount: 40, duration: 180, price: 3499, description: 'Get 40 outstation ride leads for 6 months' },
  ];

  const allLeadPackages = [...localLeadPackages, ...outstationLeadPackages];

  for (const pkg of allLeadPackages) {
    await prisma.leadSubscriptionPlan.upsert({
      where: { 
        id: `${pkg.type}-${pkg.leadsCount}-${pkg.duration}` 
      },
      update: pkg,
      create: pkg,
    });
    console.log(`✓ Created/Updated: ${pkg.name}`);
  }

  console.log('Lead packages seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
