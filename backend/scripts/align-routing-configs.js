import prisma from '../src/config/database.js';

/**
 * Aligns the booking routing configs with the package-type rule:
 *   - a BOTH package (takes local and outstation duties) must be in every row
 *   - a plan that only serves one service type must not sit in the other row
 *
 * Driver side only. Lead plans live in their own table and are left untouched.
 *
 * Usage:
 *   node scripts/align-routing-configs.js           # dry run, prints the diff
 *   node scripts/align-routing-configs.js --apply   # writes the changes
 */
const APPLY = process.argv.includes('--apply');

const LOCAL_ROW = { serviceType: 'Local - Hourly', tripType: 'One Way' };
const OUTSTATION_ROWS = [
  { serviceType: 'Outstation', tripType: 'One Way' },
  { serviceType: 'Outstation', tripType: 'Round Trip' },
];

const plans = await prisma.subscriptionPlan.findMany({
  select: { id: true, name: true, type: true, price: true, isActive: true },
});
const byId = new Map(plans.map((p) => [p.id, p]));

const bothPlans = plans.filter((p) => p.isActive && p.type === 'BOTH');
const localOnly = plans.filter((p) => p.isActive && p.type === 'LOCAL');

const changes = [];

const getRow = async ({ serviceType, tripType }) =>
  prisma.bookingRoutingConfig.findUnique({
    where: { serviceType_tripType: { serviceType, tripType } },
  });

// 1) Local row must carry the BOTH packages
const localRow = await getRow(LOCAL_ROW);
if (!localRow) {
  console.log(`MISSING row ${LOCAL_ROW.serviceType} / ${LOCAL_ROW.tripType}`);
} else {
  const missing = bothPlans.filter((p) => !localRow.driverPlanIds.includes(p.id));
  if (missing.length > 0) {
    changes.push({
      row: localRow,
      label: `${localRow.serviceType} / ${localRow.tripType}`,
      next: [...localRow.driverPlanIds, ...missing.map((p) => p.id)],
      note: `+ ${missing.map((p) => `${p.name} [${p.type}]`).join(', ')}`,
    });
  } else {
    console.log(`OK  ${localRow.serviceType} / ${localRow.tripType}: already has every BOTH plan`);
  }
}

// 2) Outstation rows must not carry LOCAL-only packages
for (const key of OUTSTATION_ROWS) {
  const row = await getRow(key);
  if (!row) {
    console.log(`MISSING row ${key.serviceType} / ${key.tripType}`);
    continue;
  }
  const strays = localOnly.filter((p) => row.driverPlanIds.includes(p.id));
  if (strays.length > 0) {
    const strayIds = new Set(strays.map((p) => p.id));
    changes.push({
      row,
      label: `${row.serviceType} / ${row.tripType}`,
      next: row.driverPlanIds.filter((id) => !strayIds.has(id)),
      note: `- ${strays.map((p) => `${p.name} [${p.type}]`).join(', ')}`,
    });
  } else {
    console.log(`OK  ${row.serviceType} / ${row.tripType}: no LOCAL-only plan routed`);
  }
}

// 3) Report anything else that looks misplaced, without touching it
console.log('\nOther memberships worth a look:');
for (const row of await prisma.bookingRoutingConfig.findMany()) {
  const wantsLocal = row.serviceType === 'Local - Hourly';
  const odd = row.driverPlanIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((p) => p.isActive && (wantsLocal ? p.type === 'OUTSTATION' : p.type === 'LOCAL'));
  if (odd.length > 0) {
    console.log(`  ${row.serviceType} / ${row.tripType}: ${odd.map((p) => `${p.name} [${p.type}]`).join(', ')}`);
  }
}

if (changes.length === 0) {
  console.log('\nNothing to change.');
} else {
  console.log('\nPlanned changes:');
  for (const c of changes) {
    console.log(`  ${c.label}: ${c.note} (${c.row.driverPlanIds.length} -> ${c.next.length} plans)`);
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write.');
  } else {
    for (const c of changes) {
      await prisma.bookingRoutingConfig.update({
        where: { id: c.row.id },
        data: { driverPlanIds: c.next },
      });
      console.log(`  applied ${c.label}`);
    }
  }
}

if (APPLY && changes.length > 0) {
  console.log('\nAfter:');
  for (const row of await prisma.bookingRoutingConfig.findMany({ orderBy: [{ serviceType: 'asc' }, { tripType: 'asc' }] })) {
    const both = row.driverPlanIds.map((id) => byId.get(id)).filter((p) => p?.type === 'BOTH').map((p) => p.name);
    console.log(`  ${row.serviceType} / ${row.tripType}: ${row.driverPlanIds.length} plans, BOTH => ${both.join(', ') || 'none'}`);
  }
}

await prisma.$disconnect();
