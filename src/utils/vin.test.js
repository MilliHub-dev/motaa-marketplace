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

describe('US auction record', () => {
  it('prefixes photo paths with the API host', async () => {
    const { auctionPhotoUrl } = await import('./vin');
    expect(auctionPhotoUrl('/api/v1/vin/photo/?u=abc', 'https://server.motaa.net')).toBe('https://server.motaa.net/api/v1/vin/photo/?u=abc');
    expect(auctionPhotoUrl('api/v1/vin/photo/?u=abc', 'https://server.motaa.net/')).toBe('https://server.motaa.net/api/v1/vin/photo/?u=abc');
    expect(auctionPhotoUrl('https://cdn.example.com/a.jpg', 'https://server.motaa.net')).toBe('https://cdn.example.com/a.jpg');
    expect(auctionPhotoUrl('', 'https://server.motaa.net')).toBe('');
  });

  it('words the sale, the odometer and the history', async () => {
    const { auctionDate, auctionHistoryLine, auctionOdometer, auctionPhotoAlt, auctionSaleLine, usd } = await import('./vin');
    expect(auctionDate('2023-05-04')).toBe('4 May 2023');
    expect(auctionDate('nope')).toBe('');
    expect(usd(6200)).toBe('$6,200');
    expect(usd(null)).toBe('');
    expect(auctionSaleLine({ platform: 'COPART', sale_date: '2023-05-04', sale_price_usd: 6200 })).toBe('Sold at COPART · 4 May 2023 · $6,200');
    expect(auctionSaleLine({ platform: 'IAAI', lot_number: '44031493', sale_date: null, sale_price_usd: null })).toBe('At IAAI · lot 44031493');
    expect(auctionSaleLine({ platform: 'IAAI', lot_number: '44031493', sale_date: null, sale_price_usd: null, sale_status: 'Sold on Approval' }))
      .toBe('At IAAI · lot 44031493 · Sold on Approval');
    expect(auctionSaleLine({ platform: 'COPART', sale_date: null, sale_price_usd: 6200, sale_status: 'Sold' })).toBe('Sold at COPART · $6,200 · Sold');
    expect(auctionSaleLine({ platform: '', sale_date: '2023-05-04' })).toBe('Sold at a US auction · 4 May 2023');
    expect(auctionOdometer(48280, 30000)).toBe('48,280 km (30,000 mi)');
    expect(auctionOdometer(null, 30000)).toBe('30,000 mi');
    expect(auctionOdometer(0, null)).toBe('');
    expect(auctionPhotoAlt({ year: 2016, make: 'Toyota', model: 'Camry' }, 2, 12)).toBe('2016 Toyota Camry, auction photo 3 of 12');
    expect(auctionPhotoAlt({ title: '2016 TOYOTA CAMRY SE' }, 0, 1)).toBe('2016 TOYOTA CAMRY SE, auction photo 1 of 1');
    expect(auctionHistoryLine({ platform: 'IAAI', lot_number: '3311', date: '2021-03-02', price_usd: 4100, status: 'Sold' }))
      .toBe('IAAI · lot 3311 · 2 Mar 2021 · $4,100 · Sold');
  });
});

describe('similar car (no record for this VIN)', () => {
  it('sends make, model and year from the decode only when all three are known', async () => {
    const { auctionQuery } = await import('./vin');
    expect(auctionQuery({ make: 'Toyota', model: 'Camry', year: '2014' })).toBe('make=Toyota&model=Camry&year=2014');
    expect(auctionQuery({ make: 'Land Rover', model: 'Range Rover Sport', year: 2015 })).toBe('make=Land+Rover&model=Range+Rover+Sport&year=2015');
    expect(auctionQuery({ make: 'Toyota', model: '', year: '2014' })).toBe('');
    expect(auctionQuery(null)).toBe('');
  });

  it('labels the photos as another car', async () => {
    const { auctionPhotoAlt, similarCarNote } = await import('./vin');
    const car = { year: 2014, make: 'Toyota', model: 'Camry', platform: 'IAAI' };
    expect(auctionPhotoAlt(car, 2, 12, { similar: true })).toBe('Another 2014 Toyota Camry (not this car), auction photo 3 of 12');
    expect(similarCarNote(car)).toBe('No US auction record for this exact car. These photos are of another 2014 Toyota Camry sold at IAAI, to show what one looks like.');
    expect(similarCarNote({ ...car, platform: '' })).toMatch(/another 2014 Toyota Camry from a US auction, to show/);
  });
});
