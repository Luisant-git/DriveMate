// Package pricing is read out of the description the admin types in
// Admin -> Packages, so "Min Hours", "Extra/Hr Rate" and "Excess Amount / Ride"
// are never entered by hand:
//   "LOCAL : MINI 4 HOUR 450 EXTRA PER HOUR 90/-"
//     -> minHours 4 · baseFare 450 · extraPerHourRate 90 · excess ₹250
//   "MINI 08 OR 10 OR 12 HOURS RS, 900 OR 1000/- ... EXTRA PER HOUR RS, 90/-"
//     -> minHours 8 · baseFare 900 · extraPerHourRate 90 · excess ₹250
// The first number after "MINI/MINIMUM ... HOURS" is the minimum hours, the
// first amount after it is the package fare, and the first amount after
// "EXTRA PER HOUR" is the per-hour rate. "OR" values are the immediate/extra
// cases and are ignored here — pricing tables hold those.

export const EXCESS_PER_RIDE = 250;
// "Every ₹100 above the reference bill: ₹90 to the driver, ₹10 to excess."
export const EXCESS_EXTRA_PERCENT = 10;
// "MINI 4 HOUR 450" is the client's minimum local fare; it keeps the rule sane
// for plans whose description carries no parsable fare.
export const DEFAULT_BASE_FARE = 450;

const HOUR_WORD = /(?:HOURS?|HRS?)\b/;

const firstNumber = (text) => {
  const match = String(text || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
};

// "RS, 900" / "Rs. 10100/-" -> " 900 " so the first number after the hour word
// is always the amount and never part of a currency prefix.
const stripCurrency = (text) =>
  String(text || '')
    .replace(/\bRS\.?\s*,?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Plans can describe both services ("LOCAL : ... | OUTSTATION: ..."), so pick
// the part that matches the plan type before parsing.
const pickSegment = (description, planType) => {
  const segments = String(description || '')
    .split('|')
    .map((part) => stripCurrency(part.toUpperCase()))
    .filter(Boolean);

  if (segments.length === 0) return '';

  const wanted = planType === 'OUTSTATION' ? 'OUTSTATION' : planType === 'LOCAL' ? 'LOCAL' : '';
  if (wanted) {
    const match = segments.find((segment) => segment.includes(wanted));
    if (match) return match;
  }

  return segments.find((segment) => HOUR_WORD.test(segment)) || segments[0];
};

export const parsePlanDescription = (description, planType = 'LOCAL') => {
  const type = String(planType || 'LOCAL').toUpperCase();
  const text = pickSegment(description, type);
  const empty = { minHours: 0, baseFare: 0, extraPerHourRate: 0, serviceType: type };
  if (!text) return empty;

  const hoursMatch = text.match(/(?:MINIMUM|MINI|MIN)\s*([^|]*?)\s*(?:HOURS?|HRS?)\b/);
  const parsedHours = hoursMatch
    ? firstNumber(hoursMatch[1])
    : firstNumber((text.match(/(\d+)\s*(?:HOURS?|HRS?)\b/) || [])[1]);

  // Anything above a day means the rupee amount was read as hours, which is
  // what older rows stored ("MINI 4 HOUR 450" saved as 450 hours).
  const minHours = parsedHours > 0 && parsedHours <= 24 ? parsedHours : 0;

  const afterHours = hoursMatch ? text.slice(hoursMatch.index + hoursMatch[0].length) : text;
  const extraIndex = afterHours.search(/EXTRA\s*PER\s*HOUR/);
  const baseFare = firstNumber(extraIndex >= 0 ? afterHours.slice(0, extraIndex) : afterHours);

  const extraMatch = text.match(/EXTRA\s*PER\s*HOUR\s*(\d+)/);

  return {
    minHours,
    baseFare,
    extraPerHourRate: extraMatch ? Number(extraMatch[1]) : 0,
    serviceType: /OUTSTATION/.test(text) ? 'OUTSTATION' : /LOCAL/.test(text) ? 'LOCAL' : type,
  };
};

export const derivePlanPricing = ({ description, type }) => {
  const parsed = parsePlanDescription(description, type);
  return {
    minHours: parsed.minHours,
    extraPerHourRate: parsed.extraPerHourRate,
    baseFare: parsed.baseFare,
    // Every ride is cut the same ₹250 — the 90/10 split above the reference
    // bill is decided at completion, so the plan only stores the flat part.
    excessAmountPerRide: String(type || '').toUpperCase() === 'MONTHLY' ? 0 : EXCESS_PER_RIDE,
  };
};

// Plan rows written before the derivation existed can hold stale numbers, so
// the description stays the source of truth when a trip is completed.
export const resolvePlanRates = (plan) => {
  const parsed = parsePlanDescription(plan?.description || '', plan?.type || 'LOCAL');
  const storedHours = Number(plan?.minHours) || 0;
  const storedExtra = Number(plan?.extraPerHourRate) || 0;
  const storedBase = Number(plan?.baseFare) || 0;

  return {
    minHours: storedHours > 0 && storedHours <= 24 ? storedHours : parsed.minHours,
    extraPerHourRate: storedExtra > 0 ? storedExtra : parsed.extraPerHourRate,
    // Min Rate typed in Admin -> Packages wins over the amount in the description
    baseFare: storedBase > 0 ? storedBase : parsed.baseFare,
  };
};

// ── Excess amount rule ───────────────────────────────────────────────
// The client's rule, in their own numbers: a ₹700 ride pays the driver ₹450
// and takes ₹250 as excess, and every ₹100 beyond that gives the driver ₹90
// while adding ₹10 to the excess. Both hold only if the flat ₹250 already
// absorbs the overage up to ₹450 fare + ₹250 = ₹700, so the 90/10 split starts
// at that reference bill:
//   ₹550 -> pays ₹300, excess ₹250   (below the reference bill)
//   ₹700 -> pays ₹450, excess ₹250
//   ₹800 -> pays ₹540, excess ₹260
// A monthly package is a one-time service charge, so it carries no cut.
export const computeRideSplit = ({ plan, collected }) => {
  const rates = resolvePlanRates(plan);
  const bill = Number(collected) > 0 ? Number(collected) : rates.baseFare;
  const baseFare = rates.baseFare > 0 ? rates.baseFare : DEFAULT_BASE_FARE;
  const isMonthly = String(plan?.type || '').toUpperCase() === 'MONTHLY';

  // The flat cut is the package's own number (₹250 by default, editable in
  // Admin -> Packages); a package set to 0 is never cut.
  const stored = plan?.excessAmountPerRide;
  const flatCut = stored === undefined || stored === null ? EXCESS_PER_RIDE : Number(stored) || 0;

  const referenceBill = baseFare + flatCut;
  const excess = isMonthly || flatCut <= 0
    ? 0
    : flatCut + Math.max(0, bill - referenceBill) * (EXCESS_EXTRA_PERCENT / 100);
  const rounded = Math.round(excess * 100) / 100;

  return {
    collected: bill,
    baseFare,
    referenceBill,
    minHours: rates.minHours,
    extraPerHourRate: rates.extraPerHourRate,
    excessAmount: rounded,
    driverPayout: Math.max(0, Math.round((bill - rounded) * 100) / 100),
  };
};
