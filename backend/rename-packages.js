import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Renaming packages...');

  const packages = await prisma.subscriptionPlan.findMany();

  for (const pkg of packages) {
    let newName = pkg.name;

    if (newName.includes('Lowest 1')) {
      newName = newName.replace('Lowest 1', 'Silver 1');
    } else if (newName.includes('Lowest 2')) {
      newName = newName.replace('Lowest 2', 'Silver 2');
    } else if (newName.includes('Lowest 3')) {
      newName = newName.replace('Lowest 3', 'Silver 3');
    } else if (newName.includes('Standard Package')) {
      newName = newName.replace('Standard Package', 'Gold Package');
    }

    if (newName !== pkg.name) {
      await prisma.subscriptionPlan.update({
        where: { id: pkg.id },
        data: { name: newName }
      });
      console.log(`Renamed: "${pkg.name}" -> "${newName}"`);
    }
  }

  console.log('Renaming completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
