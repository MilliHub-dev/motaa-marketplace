import { describe, expect, it } from 'vitest';
import { emptyListingForm, listingPayload, listingToForm, validateListingForm } from './forms';

const filled = {
  ...emptyListingForm('sale'), title: '2019 Toyota Camry', brand: 'Toyota', model: 'Camry', vin: 'JT123', price: '18500000',
  condition: 'used-foreign', vehicle_type: 'sedan', fuel_system: 'petrol', transmission: 'auto', drivetrain: 'FWD', mileage: '45000',
  notes: 'Clean title, serviced every 5,000 km.', custom_duty: 'yes',
};

describe('listing form: customs duty and seller notes are compulsory', () => {
  it('needs a customs duty answer', () => {
    expect(validateListingForm({ ...filled, custom_duty: '' }).custom_duty).toBeTruthy();
    expect(validateListingForm(filled).custom_duty).toBeUndefined();
  });

  it('needs seller notes of at least 20 characters', () => {
    expect(validateListingForm({ ...filled, notes: '' }).notes).toMatch(/at least 20/);
    expect(validateListingForm({ ...filled, notes: 'Nice car' }).notes).toMatch(/at least 20/);
    expect(validateListingForm(filled).notes).toBeUndefined();
  });

  it('sends the duty answer as a yes/no boolean', () => {
    expect(listingPayload(filled).custom_duty).toBe(true);
    expect(listingPayload({ ...filled, custom_duty: 'no' }).custom_duty).toBe(false);
  });

  it('a new form starts unanswered; an existing listing shows its saved answer', () => {
    expect(emptyListingForm().custom_duty).toBe('');
    expect(listingToForm({ vehicle: { custom_duty: true } }).custom_duty).toBe('yes');
    expect(listingToForm({ vehicle: { custom_duty: false } }).custom_duty).toBe('no');
  });
});
