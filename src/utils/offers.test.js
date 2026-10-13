import { describe, expect, it } from 'vitest';
import {
  formatOfferAmount, latestOfferSteps, offerAmountProblem, offerCheckoutPath, offerEventLabel, offerUnit,
  parseOfferAmount, validForWords,
} from './offers';

describe('offer amounts', () => {
  it('keeps only the digits the user typed', () => {
    expect(parseOfferAmount('8,250,000')).toBe('8250000');
    expect(parseOfferAmount('₦ 500')).toBe('500');
    expect(parseOfferAmount('007')).toBe('7');
    expect(parseOfferAmount('abc')).toBe('');
    expect(parseOfferAmount(null)).toBe('');
    expect(parseOfferAmount('1'.repeat(20))).toHaveLength(12);
  });

  it('groups thousands while typing', () => {
    expect(formatOfferAmount('8250000')).toBe('8,250,000');
    expect(formatOfferAmount('8,250,0001')).toBe('82,500,001');
    expect(formatOfferAmount('950')).toBe('950');
    expect(formatOfferAmount('')).toBe('');
  });

  it('asks for a price when there is none', () => {
    expect(offerAmountProblem('')).toBe('Enter the price you want to offer.');
    expect(offerAmountProblem('0')).toBe('Enter a price above zero.');
    expect(offerAmountProblem('8,000,000')).toBe('');
  });
});

describe('offerEventLabel', () => {
  it('says who named the price', () => {
    expect(offerEventLabel('offered', true)).toBe('You offered');
    expect(offerEventLabel('offered', false)).toBe('They offered');
    expect(offerEventLabel('countered', true)).toBe('Your counter offer');
    expect(offerEventLabel('countered', false)).toBe('Counter offer');
  });

  it('names how a negotiation ended the same way for both sides', () => {
    for (const mine of [true, false]) {
      expect(offerEventLabel('accepted', mine)).toBe('Price agreed');
      expect(offerEventLabel('declined', mine)).toBe('Declined');
      expect(offerEventLabel('withdrawn', mine)).toBe('Withdrawn');
    }
    expect(offerEventLabel('something-new', false)).toBe('Offer');
  });
});

describe('validForWords', () => {
  const now = new Date('2026-10-13T10:00:00Z');
  const inMs = (ms) => new Date(now.getTime() + ms).toISOString();

  it('counts whole hours left', () => {
    expect(validForWords(inMs(48 * 3600000 - 5000), now)).toBe('for another 47 hours');
    expect(validForWords(inMs(2 * 3600000), now)).toBe('for another 2 hours');
    expect(validForWords(inMs(90 * 60000), now)).toBe('for another hour');
  });

  it('counts minutes in the last hour', () => {
    expect(validForWords(inMs(25 * 60000), now)).toBe('for another 25 minutes');
    expect(validForWords(inMs(61000), now)).toBe('for another 1 minute');
    expect(validForWords(inMs(10000), now)).toBe('for another 1 minute');
  });

  it('is null when it has run out or there is no date', () => {
    expect(validForWords(inMs(-1000), now)).toBeNull();
    expect(validForWords(null, now)).toBeNull();
    expect(validForWords('not a date', now)).toBeNull();
  });
});

describe('offerUnit', () => {
  it('matches what the price is for', () => {
    expect(offerUnit('sale')).toBe('');
    expect(offerUnit('part')).toBe('each');
    expect(offerUnit('rental', 'week')).toBe('per week');
    expect(offerUnit('rental', '')).toBe('per day');
  });
});

describe('offerCheckoutPath', () => {
  it('sends a car to checkout and a rental to its page', () => {
    expect(offerCheckoutPath({ kind: 'sale', item: { uuid: 'l-1', path: '/buy/l-1' } })).toBe('/checkout/?listingId=l-1');
    expect(offerCheckoutPath({ kind: 'rental', item: { uuid: 'l-2', path: '/rent/l-2' } })).toBe('/rent/l-2');
  });

  it('has no direct path for a part or a missing item', () => {
    expect(offerCheckoutPath({ kind: 'part', item: { uuid: 'p-1' } })).toBeNull();
    expect(offerCheckoutPath({ kind: 'sale', item: { uuid: null } })).toBeNull();
    expect(offerCheckoutPath(null)).toBeNull();
  });
});

describe('latestOfferSteps', () => {
  it('picks the newest message of each negotiation', () => {
    const messages = [
      { uuid: 'm1', offer: { uuid: 'o1' } },
      { uuid: 'm2', text: 'hello' },
      { uuid: 'm3', offer: { uuid: 'o1' } },
      { uuid: 'm4', offer: { uuid: 'o2' } },
    ];
    expect(latestOfferSteps(messages)).toEqual({ o1: 'm3', o2: 'm4' });
    expect(latestOfferSteps(undefined)).toEqual({});
  });
});
