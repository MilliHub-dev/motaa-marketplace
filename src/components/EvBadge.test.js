import { describe, expect, it } from 'vitest';
import { isElectric } from './EvBadge';

describe('isElectric', () => {
  it('reads the car fuel type from a listing or a vehicle', () => {
    expect(isElectric({ vehicle: { fuel_system: 'Electric' } })).toBe(true);
    expect(isElectric({ fuel_system: 'electric' })).toBe(true);
    expect(isElectric({ vehicle: { fuel_system: 'petrol' } })).toBe(false);
    expect(isElectric(null)).toBe(false);
  });
});
