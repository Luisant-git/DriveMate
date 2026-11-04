import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const bookingId = 'cmw0gbr9h00012126ff6dzusj';
const finalAmount = 550;
const adminCommission = 250;
const driverPayout = 300;
const now = new Date();

await prisma.booking.update({
  where: { id: bookingId },
  data: {
    status: 'COMPLETED',
    finalAmount,
    adminCommission,
    driverPayout,
    minHours: 4,
    extraPerHourRate: 90,
    completedAt: now,
    duration: '4h 0m',
  }
});

await prisma.$executeRawUnsafe(
  `UPDATE bookings SET "completedAt" = $1::timestamp WHERE id = $2`,
  now.toISOString(),
  bookingId
);

// Increment driver duties
await prisma.subscription.updateMany({
  where: { driverId: 'cmrg2j1qq00003heeclwxi5z5', status: 'ACTIVE' },
  data: { dutiesCompleted: { increment: 1 } }
});

await prisma.driver.update({
  where: { id: 'cmrg2j1qq00003heeclwxi5z5' },
  data: { totalRides: { increment: 1 } }
});

console.log('Done. Booking force-completed.');
console.log(`finalAmount: ₹${finalAmount} | driverPayout: ₹${driverPayout} | adminCommission: ₹${adminCommission}`);
await prisma.$disconnect();
