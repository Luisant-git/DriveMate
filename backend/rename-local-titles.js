import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { oldName: 'Silver 1 (18 Duty - 1 Month)', newName: 'Silver Local 1 (18 Duty - 1 Month)' },
    { oldName: 'Silver 2 (23 Duty - 3 Months)', newName: 'Silver Local 2 (23 Duty - 3 Months)' },
    { oldName: 'Silver 3 (44 Duty - Unlimited)', newName: 'Silver Local 3 (44 Duty - Unlimited)' },
    { oldName: 'Gold 1 (5 Duty - 15 Days)', newName: 'Gold Local 1 (5 Duty - 15 Days)' },
    { oldName: 'Gold 2 (21 Duty - 2 Months)', newName: 'Gold Local 2 (21 Duty - 2 Months)' }
  ];

  for (const update of updates) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: update.oldName }
    });

    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: { name: update.newName }
      });
      console.log(`Renamed "${update.oldName}" to "${update.newName}"`);
    } else {
      console.log(`Package "${update.oldName}" not found (already renamed?)`);
    }
  }

  console.log('Finished adding Local to Silver and Gold package titles!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
