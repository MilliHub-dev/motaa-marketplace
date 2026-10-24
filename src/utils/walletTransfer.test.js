import { describe, expect, it } from 'vitest';
import { cleanAmount, cleanEmail, transferErrors, transferServerErrors } from './walletTransfer';

const fmt = (n) => Number(n).toLocaleString('en-US');

describe('send money', () => {
  it('cleans the email and the amount', () => {
    expect(cleanEmail('  Ada@Example.COM ')).toBe('ada@example.com');
    expect(cleanAmount('₦1,500')).toBe('1500');
    expect(cleanAmount('007')).toBe('7');
    expect(cleanAmount('1234567890123')).toBe('123456789');
  });

  it('checks the recipient', () => {
    const base = { amount: 1500, available: 5000, myEmail: 'me@example.com' };
    expect(transferErrors({ ...base, recipient: '' }).recipient).toBe("Enter the recipient's email address");
    expect(transferErrors({ ...base, recipient: 'ada@' }).recipient).toBe('Enter a valid email address');
    expect(transferErrors({ ...base, recipient: ' ME@example.com ' }).recipient).toBe("You can't send money to yourself");
    expect(transferErrors({ ...base, recipient: 'ada@example.com' }).recipient).toBe('');
  });

  it('checks the amount: at least ₦100 and no more than the balance', () => {
    const base = { recipient: 'ada@example.com', available: 5000 };
    expect(transferErrors({ ...base, amount: '' }, fmt).amount).toBe('Enter an amount');
    expect(transferErrors({ ...base, amount: 99 }, fmt).amount).toBe('The minimum is ₦100');
    expect(transferErrors({ ...base, amount: 5001 }, fmt).amount).toBe('You can send up to ₦5,000');
    expect(transferErrors({ ...base, amount: 5000 }, fmt).amount).toBe('');
    expect(transferErrors({ ...base, amount: 100, available: undefined }, fmt).amount).toBe('');
  });

  it('puts server errors on the right field', () => {
    expect(transferServerErrors({ status: 400, message: 'x', fieldErrors: { recipient: 'Recipient not found' } }))
      .toEqual({ recipient: 'Recipient not found', amount: '', other: '' });
    expect(transferServerErrors({ status: 400, message: 'x', fieldErrors: { amount: 'Ensure this value is greater than or equal to 100.' } }))
      .toEqual({ recipient: '', amount: 'Ensure this value is greater than or equal to 100.', other: '' });
    expect(transferServerErrors({ status: 402, message: 'Your wallet balance is too low.', fieldErrors: {} }))
      .toEqual({ recipient: '', amount: 'Your wallet balance is too low.', other: '' });
    expect(transferServerErrors({ status: 400, message: "You can't transfer to your own wallet.", fieldErrors: {} }))
      .toEqual({ recipient: '', amount: '', other: "You can't transfer to your own wallet." });
  });
});
