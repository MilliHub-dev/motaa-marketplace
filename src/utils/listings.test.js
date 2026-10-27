import { describe, expect, it } from 'vitest';
import { listingCondition } from './index';

describe('listing condition', () => {
  it('shows the condition for cars for sale', () => {
    expect(listingCondition({ listing_type: 'sale', vehicle: { condition: ' Foreign used ' } })).toBe('Foreign used');
    expect(listingCondition({ vehicle: { condition: 'New' } })).toBe('New');
  });

  it('never shows one for rentals, and nothing for an empty value', () => {
    expect(listingCondition({ listing_type: 'rental', vehicle: { condition: 'New' } })).toBe('');
    expect(listingCondition({ vehicle: { condition: 'New' } }, { rental: true })).toBe('');
    expect(listingCondition({ listing_type: 'sale', vehicle: { condition: '' } })).toBe('');
    expect(listingCondition(null)).toBe('');
  });
});
