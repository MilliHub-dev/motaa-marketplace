// Mechanic bookings: confirming a finished job, reporting a problem, reviews and the mechanic's payout
// (server rules: motaa_backend/bookings/settle.py).

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Thu 16 Oct, 6:00 pm" in local time, or '' when missing/invalid. */
export function bookingDeadline(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const hours = date.getHours();
  const time = `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'am' : 'pm'}`;
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}, ${time}`;
}

export const PROBLEM_MIN_LENGTH = 10;

/** Why a problem report can't be sent yet, or ''. */
export function problemError(details) {
  const text = String(details ?? '').trim();
  if (!text) return 'Tell us what went wrong.';
  if (text.length < PROBLEM_MIN_LENGTH) return `Please add a little more detail (at least ${PROBLEM_MIN_LENGTH} characters).`;
  return '';
}

/** 1–5 whole stars, or 0 when there is no valid rating. */
export function cleanStars(value) {
  const stars = Math.round(Number(value));
  return Number.isFinite(stars) && stars >= 1 && stars <= 5 ? stars : 0;
}

/** The next star when moving with the arrow keys in the star picker (wraps around, like radio buttons). */
export function nextStar(current, key) {
  const value = cleanStars(current);
  if (key === 'ArrowRight' || key === 'ArrowUp') return value >= 5 ? 1 : value + 1;
  if (key === 'ArrowLeft' || key === 'ArrowDown') return value <= 1 ? 5 : value - 1;
  if (key === 'Home') return 1;
  if (key === 'End') return 5;
  return value;
}

// ---- mechanic dashboard -------------------------------------------------------------------------------

export const ACTIVE_STATUSES = ['accepted', 'working'];
export const FINISHED_STATUSES = ['completed', 'canceled', 'declined', 'expired'];

/** History rows split into jobs still in hand (accepted / in progress) and finished ones. */
export function splitBookingHistory(rows) {
  const active = [];
  const finished = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    (ACTIVE_STATUSES.includes(String(row?.status || '').toLowerCase()) ? active : finished).push(row);
  });
  return { active, finished };
}

/**
 * What happens to a completed booking's fee, for the mechanic:
 *   { tone: 'info' | 'warning' | 'success' | 'gray', text } or null when there is nothing to say.
 * `format(iso)` turns a date into words.
 */
export function payoutNote(booking, format = bookingDeadline) {
  const payout = booking?.payout;
  if (!payout || String(booking?.status || '').toLowerCase() !== 'completed') return null;
  if (payout.problem) {
    return { tone: 'warning', text: `Customer reported a problem: ${payout.problem}. The fee is held while Motaa looks into it.` };
  }
  if (payout.state === 'released') return { tone: 'success', text: 'Paid' };
  if (payout.state === 'refunded') return { tone: 'gray', text: 'Refunded to the customer' };
  if (payout.state === 'held') {
    const when = payout.release_after ? format(payout.release_after) : '';
    return when
      ? { tone: 'info', text: `Paid on ${when} unless the customer reports a problem` }
      : { tone: 'info', text: 'Waiting for the customer to confirm' };
  }
  return null;
}

// ---- the mechanic service charge (motaa_backend/bookings/service_charge.py) ----------------------------

const group = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  const [whole, fraction] = (Math.round(number * 100) / 100).toString().split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${fraction ? `.${fraction.padEnd(2, '0')}` : ''}`;
};

/** True when there is a service charge to show (it is "0.00" when Motaa has switched it off). */
export function hasServiceCharge(value) {
  return Number(value) > 0;
}

/**
 * The label of the service charge row in a quote:
 * "Service charge (28.5 km × ₦150/km)", "(28.5 km approx. × ₦150/km)" for a straight-line distance,
 * "Service charge (minimum)" when the workshop isn't on the map.
 */
export function serviceChargeLabel(quote) {
  const km = Number(quote?.distance_km);
  if (quote?.distance_km === null || quote?.distance_km === undefined || !Number.isFinite(km)) return 'Service charge (minimum)';
  const approx = quote?.distance_by_road === false ? ' (approx.)' : '';
  return Number(quote?.per_km) > 0
    ? `Service charge (${km.toFixed(1)} km${approx} × ₦${group(quote.per_km)}/km)`
    : `Service charge (${km.toFixed(1)} km${approx})`;
}

/**
 * What booking costs now, from the quote: { amount, ready, needsLocation }.
 * Without a quote (it failed to load, e.g. an older server) the booking fee alone is charged.
 */
export function bookingAmountDue(quote, { fee, quoteFailed = false } = {}) {
  if (quote) {
    if (quote.needs_location) return { amount: null, ready: false, needsLocation: true };
    const total = quote.total ?? quote.booking_fee ?? fee;
    return { amount: total, ready: total !== null && total !== undefined, needsLocation: false };
  }
  if (quoteFailed && fee !== undefined && fee !== null) return { amount: fee, ready: true, needsLocation: false };
  return { amount: null, ready: false, needsLocation: false };
}

/** The `code` of a refused booking ('quote_changed' with `quote`, 'needs_location'), or ''. */
export function bookingErrorCode(error) {
  const code = error?.data?.code;
  return ['quote_changed', 'needs_location'].includes(code) ? code : '';
}

/**
 * What a mechanic is paid for a booking, from `payout`: the server's `you_receive` (booking fee + service charge
 * − Motaa's commission), or the fee + service charge from an older server. → number, or 0 when unknown.
 */
export function mechanicPayoutAmount(payout) {
  if (!payout) return 0;
  const server = Number(payout.you_receive);
  if (payout.you_receive !== null && payout.you_receive !== undefined && payout.you_receive !== '' && Number.isFinite(server)) return server;
  const fee = Number(payout.fee) || 0;
  const charge = Number(payout.service_charge) || 0;
  return Number(payout.total) || fee + charge;
}

/**
 * "You receive ₦6,500 (booking fee ₦5,000 + service charge ₦2,000 − Motaa commission ₦500)" for a mechanic.
 * The parts with no money in them are left out.
 */
export function mechanicReceives(payout) {
  if (!payout) return '';
  const amount = mechanicPayoutAmount(payout);
  const fee = Number(payout.fee) || 0;
  const charge = Number(payout.service_charge) || 0;
  const commission = Number(payout.commission) || 0;
  if (!amount && !fee) return '';
  const parts = [`booking fee ₦${group(fee)}`];
  if (charge > 0) parts.push(`+ service charge ₦${group(charge)}`);
  if (commission > 0) parts.push(`− Motaa commission ₦${group(commission)}`);
  return `You receive ₦${group(amount)} (${parts.join(' ')})`;
}
