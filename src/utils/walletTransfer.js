// "Send money": wallet-to-wallet transfers (POST /wallet/transfer/ {recipient: email, amount, pin}).

export const MIN_TRANSFER = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The recipient as the server matches it: trimmed and lowercase. */
export function cleanEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

/** Whole naira typed into the amount box: digits only (up to 9 of them). */
export function cleanAmount(value) {
  return String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
}

/**
 * Problems before sending, as { recipient, amount } ('' when fine).
 * `available`: the wallet balance; `myEmail`: the signed-in user's email (you can't send to yourself).
 */
export function transferErrors({ recipient, amount, available, myEmail }, format = (n) => String(n)) {
  const email = cleanEmail(recipient);
  const value = Number(amount) || 0;
  const balance = Number(available);
  return {
    recipient: !email ? "Enter the recipient's email address"
      : !EMAIL_RE.test(email) ? 'Enter a valid email address'
        : myEmail && email === cleanEmail(myEmail) ? "You can't send money to yourself"
          : '',
    amount: !value ? 'Enter an amount'
      : value < MIN_TRANSFER ? `The minimum is ₦${format(MIN_TRANSFER)}`
        : Number.isFinite(balance) && value > balance ? `You can send up to ₦${format(Math.max(0, balance))}`
          : '',
  };
}

/** Where a refused transfer's message belongs: { recipient, amount, other }. */
export function transferServerErrors(error) {
  const fields = error?.fieldErrors || {};
  if (error?.status === 402) return { recipient: '', amount: error.message, other: '' };
  const recipient = fields.recipient || '';
  const amount = fields.amount || '';
  return { recipient, amount, other: recipient || amount ? '' : (error?.message || "That didn't work. Please try again.") };
}
