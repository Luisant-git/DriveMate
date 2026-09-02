import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting old packages...');
  
  // Get all packages
  const allPackages = await prisma.subscriptionPlan.findMany();
  
  // Filter out the new ones
  const packagesToDelete = allPackages.filter(pkg => !['LOWEST_1', 'LOWEST_2', 'LOWEST_3'].includes(pkg.id));
  
  if (packagesToDelete.length === 0) {
    console.log('No old packages found to delete.');
    return;
  }
  
  for (const pkg of packagesToDelete) {
    try {
      // First delete any associated subscriptions for this package
      await prisma.subscription.deleteMany({
        where: { planId: pkg.id }
      });
      
      // Then delete the package itself
      await prisma.subscriptionPlan.delete({
        where: { id: pkg.id }
      });
      console.log(`Deleted: ${pkg.name}`);
    } catch (err) {
      console.error(`Failed to delete ${pkg.name}:`, err.message);
    }
  }
  
  console.log('Cleanup completed! Old packages are completely removed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
