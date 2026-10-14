// Wallet PIN rules and error handling (the server is the source of truth: wallet/pin.py).
//
// Every payment, transfer or withdrawal from the wallet sends `pin`. When the PIN is the problem the
// server answers 403 with a `code`:
//   pin_not_set   → set a PIN first, then the same request is sent again with it
//   pin_required  → ask for the PIN
//   pin_incorrect → wrong PIN (`attempts_left`): ask again
//   pin_locked    → too many wrong tries (`locked_until`): offer "Reset PIN"

export const PIN_LENGTH = 4;

const EASY_PINS = new Set([
  '0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210',
]);

/** Digits only, at most `length` of them (what a PIN box keeps from typing or pasting). */
export function cleanPin(value, length = PIN_LENGTH) {
  return String(value ?? '').replace(/\D/g, '').slice(0, length);
}

/** Why `pin` can't be used as a new PIN, or '' (same rules and words as the server). */
export function newPinProblem(pin) {
  const value = String(pin ?? '').trim();
  if (!/^\d{4}$/.test(value)) return 'Your PIN must be exactly 4 digits.';
  if (new Set(value).size === 1 || EASY_PINS.has(value)) {
    return 'That PIN is too easy to guess. Avoid repeated digits and sequences like 1234.';
  }
  return '';
}

/** Problems with a new PIN and its confirmation, as { pin, confirm } ('' when fine). */
export function newPinErrors(pin, confirm) {
  const pinError = newPinProblem(pin);
  const confirmError = !pinError && cleanPin(confirm).length === PIN_LENGTH && confirm !== pin ? "The PINs don't match." : '';
  return { pin: pinError, confirm: confirmError };
}

const PIN_CODES = ['pin_not_set', 'pin_required', 'pin_incorrect', 'pin_locked'];

/** The wallet PIN code of a failed request ('pin_incorrect', ...), or '' when the PIN wasn't the problem. */
export function pinErrorCode(error) {
  const code = error?.data?.code;
  return error?.status === 403 && PIN_CODES.includes(code) ? code : '';
}

const FALLBACK_MESSAGES = {
  pin_not_set: 'Set a 4-digit wallet PIN to pay from your wallet.',
  pin_required: 'Enter your 4-digit wallet PIN to continue.',
  pin_incorrect: 'That PIN is incorrect.',
  pin_locked: 'Your wallet PIN is locked after too many wrong tries. Try again in 30 minutes, or reset it.',
};

/**
 * What the PIN prompt does after a failed request:
 *   { step: 'create' | 'enter' | 'locked', message }  — keep the prompt open on that step
 *   null                                                — not a PIN problem: close the prompt, the caller handles it
 */
export function pinErrorStep(error) {
  const code = pinErrorCode(error);
  if (!code) return null;
  const message = error?.data?.message || FALLBACK_MESSAGES[code];
  if (code === 'pin_not_set') return { step: 'create', message };
  if (code === 'pin_locked') return { step: 'locked', message };
  return { step: 'enter', message };
}

/** The step to open the prompt on, from GET /wallet/pin/ ({has_pin, locked}). */
export function firstPinStep(status) {
  if (!status?.has_pin) return 'create';
  return status.locked ? 'locked' : 'enter';
}

/** Seconds to wait before another reset code can be sent (429 `retry_after`), or 0. */
export function retryAfterSeconds(error) {
  const seconds = Number(error?.data?.retry_after);
  return error?.status === 429 && Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 0;
}

/** "until 3:45 PM" for a locked PIN, or '' when unknown. */
export function lockedUntilText(lockedUntil, locale) {
  if (!lockedUntil) return '';
  const date = new Date(lockedUntil);
  if (Number.isNaN(date.getTime())) return '';
  return `until ${date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
}

/** "3:45 pm" — when a locked PIN unlocks, or '' when unknown. */
export function unlockTime(lockedUntil, locale) {
  if (!lockedUntil) return '';
  const date = new Date(lockedUntil);
  if (Number.isNaN(date.getTime())) return '';
  // always a 12-hour clock ("3:45 pm"), like the app
  return date.toLocaleTimeString(locale || 'en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(AM|PM)$/i, (m) => m.toLowerCase());
}

// ---- the step-by-step PIN screens in Wallet settings -------------------------------------------------

/** The entry steps of each flow (a success screen follows the last one). */
export const PIN_FLOW_STEPS = {
  set: ['new', 'confirm'],
  change: ['current', 'new', 'confirm'],
  reset: ['email', 'new', 'confirm'],
};

/**
 * Where a flow goes after its final request fails:
 *   { step: 'current' | 'new' | 'email' | 'confirm', message }  — back to that step with the message
 *   { step: 'locked', message }                                  — offer to reset the PIN
 *   { step: 'switch-set', message }                              — a reset without a PIN: set one instead
 */
export function pinFlowErrorStep(flow, error) {
  const message = error?.message || 'Something went wrong. Please try again.';
  const pinStep = pinErrorStep(error); // only Change sends a PIN to check
  if (pinStep) return pinStep.step === 'locked' ? { step: 'locked', message: pinStep.message } : { step: flow === 'change' ? 'current' : 'new', message: pinStep.message };
  if (flow === 'reset' && error?.status === 409) return { step: 'switch-set', message };
  const details = error?.data?.details || {};
  const fieldMessage = (name) => (Array.isArray(details[name]) ? details[name][0] : details[name]);
  if (details.pin || details.new_pin || details.confirm_pin) {
    return { step: 'new', message: fieldMessage('pin') || fieldMessage('new_pin') || fieldMessage('confirm_pin') || message };
  }
  if (flow === 'reset' && error?.status === 400) return { step: /code/i.test(message) ? 'email' : 'new', message };
  return { step: 'confirm', message };
}
