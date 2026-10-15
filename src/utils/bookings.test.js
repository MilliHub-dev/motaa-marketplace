import { describe, expect, it } from 'vitest';
import {
  bookingDeadline, cleanStars, nextStar, payoutNote, problemError, splitBookingHistory,
} from './bookings';

describe('bookingDeadline', () => {
  it('reads like "Fri 16 Oct, 6:00 pm" in local time', () => {
    expect(bookingDeadline(new Date(2026, 9, 16, 18, 0).toISOString())).toBe('Fri 16 Oct, 6:00 pm');
    expect(bookingDeadline(new Date(2026, 9, 17, 0, 5).toISOString())).toBe('Sat 17 Oct, 12:05 am');
    expect(bookingDeadline(new Date(2026, 9, 17, 12, 30).toISOString())).toBe('Sat 17 Oct, 12:30 pm');
  });

  it('is empty for a missing or broken date', () => {
    expect(bookingDeadline(null)).toBe('');
    expect(bookingDeadline('nope')).toBe('');
  });
});

describe('problem reports', () => {
  it('need at least 10 characters (like the server)', () => {
    expect(problemError('')).toMatch(/what went wrong/);
    expect(problemError('   bad   ')).toMatch(/at least 10/);
    expect(problemError('Still leaking oil')).toBe('');
  });
});

describe('star rating', () => {
  it('keeps whole stars from 1 to 5', () => {
    expect(cleanStars(4)).toBe(4);
    expect(cleanStars('5')).toBe(5);
    expect(cleanStars(4.6)).toBe(5);
    expect(cleanStars(0)).toBe(0);
    expect(cleanStars(9)).toBe(0);
    expect(cleanStars(null)).toBe(0);
  });

  it('moves with the arrow keys and wraps around', () => {
    expect(nextStar(0, 'ArrowRight')).toBe(1);
    expect(nextStar(3, 'ArrowRight')).toBe(4);
    expect(nextStar(5, 'ArrowRight')).toBe(1);
    expect(nextStar(1, 'ArrowLeft')).toBe(5);
    expect(nextStar(3, 'ArrowDown')).toBe(2);
    expect(nextStar(3, 'Home')).toBe(1);
    expect(nextStar(3, 'End')).toBe(5);
    expect(nextStar(3, 'Tab')).toBe(3);
  });
});

describe('mechanic dashboard', () => {
  it('splits active jobs from finished ones', () => {
    const rows = ['accepted', 'completed', 'working', 'canceled', 'declined', 'expired'].map((status, i) => ({ uuid: String(i), status }));
    const { active, finished } = splitBookingHistory(rows);
    expect(active.map((r) => r.status)).toEqual(['accepted', 'working']);
    expect(finished.map((r) => r.status)).toEqual(['completed', 'canceled', 'declined', 'expired']);
    expect(splitBookingHistory(undefined)).toEqual({ active: [], finished: [] });
  });

  const completed = (payout) => ({ status: 'completed', payout: { fee: '5000.00', problem: '', ...payout } });

  it('says when a held fee is paid', () => {
    expect(payoutNote(completed({ state: 'held', release_after: '2026-10-16T18:00:00' }), () => 'Thu 16 Oct, 6:00 pm'))
      .toEqual({ tone: 'info', text: 'Paid on Thu 16 Oct, 6:00 pm unless the customer reports a problem' });
    expect(payoutNote(completed({ state: 'held', release_after: null })))
      .toEqual({ tone: 'info', text: 'Waiting for the customer to confirm' });
  });

  it('warns about a reported problem', () => {
    expect(payoutNote(completed({ state: 'held', problem: 'Engine still shakes' })))
      .toEqual({ tone: 'warning', text: 'Customer reported a problem: Engine still shakes. The fee is held while Motaa looks into it.' });
  });

  it('shows paid and refunded fees', () => {
    expect(payoutNote(completed({ state: 'released' }))).toEqual({ tone: 'success', text: 'Paid' });
    expect(payoutNote(completed({ state: 'refunded' }))).toEqual({ tone: 'gray', text: 'Refunded to the customer' });
  });

  it('says nothing for unfinished jobs or without a payout', () => {
    expect(payoutNote({ status: 'working', payout: { state: 'held' } })).toBeNull();
    expect(payoutNote({ status: 'completed' })).toBeNull();
    expect(payoutNote(completed({ state: 'unpaid' }))).toBeNull();
  });
});
