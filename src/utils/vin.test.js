import { describe, expect, it } from 'vitest';
import { checkDigitOk, cleanVin, summariseVin, vinProblem } from './vin';

describe('VIN checker', () => {
  it('tidies what people paste', () => {
    expect(cleanVin(' 1hgcm8263-3a004352 ')).toBe('1HGCM82633A004352');
  });

  it('explains what is wrong with a VIN', () => {
    expect(vinProblem('')).toBe('Enter the 17-character VIN.');
    expect(vinProblem('1HGCM82633A00435')).toBe('A VIN has 17 characters. This one has 16.');
    expect(vinProblem('1HGCM82633A0O4352')).toContain('never contain the letters I, O or Q');
    expect(vinProblem('1HGCM82633A00435!')).toBe('A VIN only has letters and numbers.');
    expect(vinProblem('1HGCM82633A004352')).toBe('');
  });

  it('checks the check digit', () => {
    expect(checkDigitOk('1HGCM82633A004352')).toBe(true);
    expect(checkDigitOk('1HGCM82643A004352')).toBe(false);
    expect(checkDigitOk('11111111111111111')).toBe(true);
  });

  it('keeps the useful details from the decoder', () => {
    const result = { Make: 'HONDA', Model: 'Accord', ModelYear: '2003', Trim: 'EX-V6', BodyClass: 'Coupe', DisplacementL: '2.998832712',
      EngineCylinders: '6', FuelTypePrimary: 'Gasoline', TransmissionStyle: 'Automatic', DriveType: '', PlantCountry: 'UNITED STATES (USA)', Doors: '0' };
    const summary = summariseVin(result, '1HGCM82633A004352');
    expect(summary.name).toBe('2003 Honda Accord');
    expect(summary.rows).toEqual([['Year', '2003'], ['Make', 'Honda'], ['Model', 'Accord'], ['Trim', 'EX-V6'], ['Body', 'Coupe'],
      ['Engine', '3.0L 6-cylinder'], ['Fuel', 'Gasoline'], ['Transmission', 'Automatic'], ['Made in', 'United States']]);
    expect(summary.checkDigit).toBe(true);
    expect(summariseVin({ Make: '', Model: '', ModelYear: '' }, 'X')).toBeNull();
  });
});
