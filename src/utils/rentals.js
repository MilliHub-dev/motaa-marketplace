// "Purpose of rental" on the rental checkout (server rules: motaa_backend listings checkout).

export const RENTAL_PURPOSE_DETAILS_MAX = 300;
export const RENTAL_PURPOSE_OTHER_MIN = 3;

/**
 * Problems with the purpose fields, as { rental_purpose, rental_purpose_details } ('' when fine).
 * `options`: the `rental_purposes` the server offers ([{value, label}]); a purpose must be one of them.
 */
export function rentalPurposeErrors(purpose, details, options = []) {
  const list = Array.isArray(options) ? options : [];
  const value = String(purpose || '');
  const text = String(details || '').trim();
  const errors = { rental_purpose: '', rental_purpose_details: '' };
  if (!value) errors.rental_purpose = 'Choose what you are renting the car for';
  else if (list.length && !list.some((option) => option?.value === value)) errors.rental_purpose = 'Choose one of the options';
  if (value === 'other' && text.length < RENTAL_PURPOSE_OTHER_MIN) errors.rental_purpose_details = "Tell the dealer what it's for";
  else if (text.length > RENTAL_PURPOSE_DETAILS_MAX) errors.rental_purpose_details = `Keep it under ${RENTAL_PURPOSE_DETAILS_MAX} characters`;
  return errors;
}

/** The checkout body fields for the purpose (left out when the checkout isn't a rental). */
export function rentalPurposePayload(isRental, purpose, details) {
  if (!isRental) return {};
  const text = String(details || '').trim();
  return { rental_purpose: purpose || undefined, rental_purpose_details: text || undefined };
}
