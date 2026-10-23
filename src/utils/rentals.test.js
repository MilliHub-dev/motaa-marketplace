import { describe, expect, it } from 'vitest';
import { rentalPurposeErrors, rentalPurposePayload } from './rentals';

const OPTIONS = ['personal', 'business', 'wedding-event', 'airport', 'travel', 'film-photo', 'other'].map((value) => ({ value, label: value }));

describe('purpose of rental', () => {
  it('needs a purpose from the list', () => {
    expect(rentalPurposeErrors('', '', OPTIONS).rental_purpose).toBe('Choose what you are renting the car for');
    expect(rentalPurposeErrors('holiday', '', OPTIONS).rental_purpose).toBe('Choose one of the options');
    expect(rentalPurposeErrors('wedding-event', '', OPTIONS)).toEqual({ rental_purpose: '', rental_purpose_details: '' });
  });

  it('needs a few words when the purpose is "other"', () => {
    expect(rentalPurposeErrors('other', ' a ', OPTIONS).rental_purpose_details).toBe("Tell the dealer what it's for");
    expect(rentalPurposeErrors('other', 'Moving house', OPTIONS)).toEqual({ rental_purpose: '', rental_purpose_details: '' });
  });

  it('keeps the details under 300 characters', () => {
    expect(rentalPurposeErrors('personal', 'x'.repeat(301), OPTIONS).rental_purpose_details).toBe('Keep it under 300 characters');
    expect(rentalPurposeErrors('personal', 'x'.repeat(300), OPTIONS).rental_purpose_details).toBe('');
  });

  it('sends the fields only for rentals', () => {
    expect(rentalPurposePayload(true, 'airport', '  Lagos airport pickup ')).toEqual({ rental_purpose: 'airport', rental_purpose_details: 'Lagos airport pickup' });
    expect(rentalPurposePayload(true, 'personal', '  ')).toEqual({ rental_purpose: 'personal', rental_purpose_details: undefined });
    expect(rentalPurposePayload(false, 'personal', 'x')).toEqual({});
  });
});
