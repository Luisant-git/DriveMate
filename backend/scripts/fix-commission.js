import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Usage: node scripts/fix-commission.js <bookingId> <driverPayout> <adminCommission>
// Example: node scripts/fix-commission.js abc123 750 250

const [bookingId, driverPayout, adminCommission] = process.argv.slice(2);

if (!bookingId || !driverPayout || !adminCommission) {
  console.log('Usage: node scripts/fix-commission.js <bookingId> <driverPayout> <adminCommission>');
  process.exit(1);
}

const booking = await prisma.booking.update({
  where: { id: bookingId },
  data: {
    driverPayout: parseFloat(driverPayout),
    adminCommission: parseFloat(adminCommission),
  },
  select: { id: true, driverPayout: true, adminCommission: true, finalAmount: true, status: true }
});

console.log('Updated booking:', booking);
await prisma.$disconnect();
