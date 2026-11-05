// Re-derives Min Hours, Extra/Hr Rate and Excess Amount for every package from
// its description, so packages saved before the derivation existed stop showing
// 0 — or, worse, a fare stored as hours ("MINI 4 HOUR 450" saved as 450 hours).
// Run once after deploying: node scripts/derive-plan-pricing.js
import prisma from '../src/config/database.js';
import { derivePlanPricing } from '../src/utils/planPricing.js';

const run = async () => {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: [{ category: 'asc' }, { price: 'asc' }] });
  let changed = 0;

  for (const plan of plans) {
    const pricing = derivePlanPricing({ description: plan.description, type: plan.type });

    const unchanged = Number(plan.minHours) === pricing.minHours
      && Number(plan.extraPerHourRate) === pricing.extraPerHourRate
      && Number(plan.excessAmountPerRide) === pricing.excessAmountPerRide;
    if (unchanged) continue;

    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        minHours: pricing.minHours,
        extraPerHourRate: pricing.extraPerHourRate,
        excessAmountPerRide: pricing.excessAmountPerRide,
      },
    });

    changed++;
    console.log(
      `  ${plan.category} ₹${plan.price} (${plan.type}) ${plan.name}\n` +
      `      minHours ${plan.minHours} -> ${pricing.minHours} · extra ${plan.extraPerHourRate} -> ${pricing.extraPerHourRate} · excess ${plan.excessAmountPerRide} -> ${pricing.excessAmountPerRide}`
    );
  }

  console.log(`\n✓ Updated ${changed} of ${plans.length} plans`);
  await prisma.$disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
