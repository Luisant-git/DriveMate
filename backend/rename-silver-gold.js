import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { oldName: 'Silver 1', newName: 'Silver 1 (18 Duty - 1 Month)' },
    { oldName: 'Silver 2', newName: 'Silver 2 (23 Duty - 3 Months)' },
    { oldName: 'Silver 3', newName: 'Silver 3 (44 Duty - Unlimited)' },
    { oldName: 'Gold 1', newName: 'Gold 1 (5 Duty - 15 Days)' },
    { oldName: 'Gold 2', newName: 'Gold 2 (21 Duty - 2 Months)' }
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

  console.log('Finished renaming Silver and Gold packages!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
