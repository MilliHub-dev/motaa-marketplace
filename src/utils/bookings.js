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
