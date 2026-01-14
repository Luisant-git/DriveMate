import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTrips() {
  try {
    console.log('Clearing old trips...');
    
    // Update all ONGOING/CONFIRMED bookings to COMPLETED to clear them
    const result = await prisma.booking.updateMany({
      where: {
        status: { in: ['ONGOING', 'CONFIRMED'] }
      },
      data: {
        status: 'COMPLETED'
      }
    });
    
    console.log(`✅ Cleared ${result.count} trips`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTrips();