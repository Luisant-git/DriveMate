// Backfill adminCommission and driverPayout for completed bookings that have null values
// Formula: adminCommission = 250 (base), driverPayout = finalAmount - 250
// Run once: node scripts/backfill-commission.js

import prisma from '../src/config/database.js';

const BASE_ADMIN_COMMISSION = 250;

const run = async () => {
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      adminCommission: null,
      finalAmount: { not: null, gt: 0 }
    },
    select: { id: true, finalAmount: true, estimateAmount: true }
  });

  console.log(`Found ${bookings.length} completed bookings without commission data`);

  let updated = 0;
  for (const b of bookings) {
    const final = b.finalAmount || b.estimateAmount || 0;
    if (final <= 0) continue;
    const adminComm = BASE_ADMIN_COMMISSION;
    const driverPay = final - adminComm;
    await prisma.booking.update({
      where: { id: b.id },
      data: {
        adminCommission: adminComm,
        driverPayout: driverPay > 0 ? driverPay : 0
      }
    });
    updated++;
  }

  console.log(`✓ Backfilled ${updated} bookings`);
  await prisma.$disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });
