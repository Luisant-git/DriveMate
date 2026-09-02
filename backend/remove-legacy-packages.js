import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allPlans = await prisma.subscriptionPlan.findMany();

  const keepNames = [
    'Silver 1', 'Silver 2', 'Silver 3',
    'Gold 1', 'Gold 2',
    'Platinum Local (5 Duty - 15 Days)',
    'Platinum Local (8 Duty - 20 Days)',
    'Platinum Local (18 Duty - 2 Months)',
    'Platinum Outstation (36 Duty - 4 Months)',
    'Platinum Outstation (52 Duty - 5 Months)',
    'Platinum Outstation (63 Duty - 6 Months)',
    'Diamond Local (10 Duty - 25 Days)',
    'Diamond Local (13 Duty - 1 Month)',
    'Diamond Local (25 Duty - 3 Months)',
    'Diamond Outstation (72 Duty - 8 Months)',
    'Diamond Outstation (84 Duty - 10 Months)',
    'Diamond Outstation (96 Duty - 12 Months)'
  ];

  let removedCount = 0;
  let deactivatedCount = 0;

  for (const plan of allPlans) {
    if (!keepNames.includes(plan.name)) {
      try {
        await prisma.subscriptionPlan.delete({ where: { id: plan.id } });
        console.log(`Deleted: "${plan.name}"`);
        removedCount++;
      } catch (err) {
        // Fallback to setting isActive = false if it has foreign key constraints
        await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { isActive: false }
        });
        console.log(`Marked Inactive: "${plan.name}"`);
        deactivatedCount++;
      }
    }
  }

  console.log(`Completed. Deleted: ${removedCount}, Deactivated: ${deactivatedCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
