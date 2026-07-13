const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate12Hours() {
  try {
    // Find an ONGOING booking
    const booking = await prisma.booking.findFirst({
      where: { status: 'ONGOING' }
    });

    if (!booking) {
      console.log('❌ No ONGOING trips found. Please start a trip first from the Driver Portal.');
      return;
    }

    // Set the actualStartTime to 13 hours ago
    const thirteenHoursAgo = new Date();
    thirteenHoursAgo.setHours(thirteenHoursAgo.getHours() - 13);

    await prisma.booking.update({
      where: { id: booking.id },
      data: { 
        actualStartTime: thirteenHoursAgo,
        updatedAt: thirteenHoursAgo 
      }
    });

    console.log(`✅ Successfully updated Booking ID: ${booking.id}`);
    console.log(`🕒 Set actualStartTime to: ${thirteenHoursAgo.toLocaleString()}`);
    console.log('👉 Now refresh the Driver Portal in your browser. You should see the "Trip exceeded 12 hours" prompt instead of "Complete Trip".');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulate12Hours();
