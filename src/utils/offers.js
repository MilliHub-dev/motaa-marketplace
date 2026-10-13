// Pure helpers for price negotiation in chat (no React, no network). What an offer's
// state is, which buttons to show and whether it can be checked out always come from the
// API (`status_label`, `actions`, `can_checkout`); nothing here works those out.

const MAX_DIGITS = 12;

/** What the user typed → whole naira as digits: "8,250,000" → "8250000", "₦ 500" → "500". */
export function parseOfferAmount(text) {
  return String(text ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_DIGITS);
}

/** Digits grouped in thousands for showing in the amount field as the user types: "8250000" → "8,250,000". */
export function formatOfferAmount(text) {
  return parseOfferAmount(text).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** What stops the amount being sent ('' when it can go). The server checks it against the asking price. */
export function offerAmountProblem(text) {
  const digits = parseOfferAmount(text);
  if (!digits) return 'Enter the price you want to offer.';
  if (Number(digits) <= 0) return 'Enter a price above zero.';
  return '';
}

/** Heading of one step of a negotiation, from the message's `offer_event` and whether I sent it. */
export function offerEventLabel(event, mine) {
  switch (event) {
    case 'offered': return mine ? 'You offered' : 'They offered';
    case 'countered': return mine ? 'Your counter offer' : 'Counter offer';
    case 'accepted': return 'Price agreed';
    case 'declined': return 'Declined';
    case 'withdrawn': return 'Withdrawn';
    default: return 'Offer';
  }
}

/** "for another 47 hours" until an agreed price runs out; null when there is no date or it has passed. */
export function validForWords(expiresAt, now = new Date()) {
  const date = expiresAt ? new Date(expiresAt) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const left = date.getTime() - now.getTime();
  if (left <= 0) return null;
  const hours = Math.floor(left / 3600000);
  if (hours >= 2) return `for another ${hours} hours`;
  if (hours === 1) return 'for another hour';
  const minutes = Math.max(1, Math.floor(left / 60000));
  return `for another ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** 'per day' for a rental listing (the listing's payment cycle), 'each' for a part, '' for a car on sale. */
export function offerUnit(kind, paymentCycle) {
  if (kind === 'part') return 'each';
  if (kind === 'rental') return `per ${paymentCycle || 'day'}`;
  return '';
}

/**
 * Where "Checkout at this price" goes: the car checkout for a sale, the rental page (dates are
 * chosen there) for a rental. A part has to be in the parts cart first, so it has no direct path.
 */
export function offerCheckoutPath(offer) {
  const uuid = offer?.item?.uuid;
  if (!uuid) return null;
  if (offer.kind === 'sale') return `/checkout/?listingId=${encodeURIComponent(uuid)}`;
  if (offer.kind === 'rental') return offer.item.path || `/rent/${uuid}`;
  return null;
}

/**
 * The newest step of each negotiation in a list of messages (oldest first): { offer uuid: message key }.
 * Only that step may show buttons, even while an older copy still says `offer_latest`.
 */
export function latestOfferSteps(messages, keyOf = (msg) => String(msg?.uuid || msg?.id || '')) {
  const latest = {};
  for (const msg of Array.isArray(messages) ? messages : []) {
    if (msg?.offer?.uuid) latest[msg.offer.uuid] = keyOf(msg);
  }
  return latest;
}
