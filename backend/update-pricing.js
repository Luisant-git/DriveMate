import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePricing() {
  try {
    console.log('Updating pricing packages...');
    
    // Update all existing PricingPackage records
    const result = await prisma.pricingPackage.updateMany({
      data: {
        extraPerHour: 90,
        extraPerHourImm: 100
      }
    });
    
    console.log(`Successfully updated ${result.count} pricing packages.`);
  } catch (error) {
    console.error('Error updating pricing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePricing();
