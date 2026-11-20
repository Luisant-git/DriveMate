import prisma from '../src/config/database.js';
import { resolvePlanCategory } from '../src/controllers/subscription.controller.js';

async function backfillCategories() {
  console.log('Starting subscription plans category backfill...');

  const plans = await prisma.subscriptionPlan.findMany();
  console.log(`Found ${plans.length} total subscription plans.`);

  let updatedCount = 0;
  for (const plan of plans) {
    const targetCategory = resolvePlanCategory(plan);
    if (plan.category !== targetCategory) {
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { category: targetCategory }
      });
      console.log(`Updated plan "${plan.name}" (ID: ${plan.id}): '${plan.category}' -> '${targetCategory}'`);
      updatedCount++;
    }
  }

  console.log(`Finished category backfill. Updated ${updatedCount} plans.`);
  process.exit(0);
}

backfillCategories().catch((err) => {
  console.error('Error during backfill:', err);
  process.exit(1);
});

