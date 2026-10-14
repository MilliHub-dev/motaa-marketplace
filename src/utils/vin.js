// VIN (vehicle identification number) helpers for the VIN checker.
// A modern VIN is 17 characters: letters and digits, never I, O or Q. Position 9 is a check
// digit worked out from the rest (mandatory for cars sold in North America, which most
// imported "tokunbo" cars in Nigeria were).

const TRANSLITERATION = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/** Upper case, without spaces or dashes people paste in. */
export function cleanVin(value) {
  return String(value || '').toUpperCase().replace(/[\s-]/g, '');
}

/** What is wrong with a VIN as typed, or '' when it looks right. */
export function vinProblem(value) {
  const vin = cleanVin(value);
  if (!vin) return 'Enter the 17-character VIN.';
  if (/[IOQ]/.test(vin)) return 'VINs never contain the letters I, O or Q. Check for a 1 or a 0.';
  if (/[^A-Z0-9]/.test(vin)) return 'A VIN only has letters and numbers.';
  if (vin.length !== 17) return `A VIN has 17 characters. This one has ${vin.length}.`;
  return '';
}

/** True when position 9 matches the rest of the VIN. */
export function checkDigitOk(value) {
  const vin = cleanVin(value);
  if (vin.length !== 17) return false;
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const ch = vin[i];
    const n = /\d/.test(ch) ? Number(ch) : TRANSLITERATION[ch];
    if (n === undefined) return false;
    sum += n * WEIGHTS[i];
  }
  const remainder = sum % 11;
  return vin[8] === (remainder === 10 ? 'X' : String(remainder));
}

const title = (text) => String(text || '').toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
const clean = (text) => {
  const value = String(text ?? '').trim();
  return value && value !== '0' && value.toLowerCase() !== 'not applicable' ? value : '';
};

/**
 * The details worth showing from NHTSA's DecodeVinValues result, or null when it found nothing.
 * `checkDigit` false means the VIN may be mistyped (or the car was built for another market).
 */
export function summariseVin(result, vin) {
  if (!result) return null;
  const make = clean(result.Make);
  const model = clean(result.Model);
  const year = clean(result.ModelYear);
  if (!make && !model && !year) return null;
  const litres = Number(result.DisplacementL);
  const cylinders = clean(result.EngineCylinders);
  const engine = [Number.isFinite(litres) && litres > 0 ? `${litres.toFixed(1)}L` : '', cylinders ? `${cylinders}-cylinder` : '', clean(result.EngineModel)]
    .filter(Boolean).join(' ');
  const rows = [
    ['Year', year],
    ['Make', title(make)],
    ['Model', model],
    ['Trim', clean(result.Trim) || clean(result.Series)],
    ['Body', clean(result.BodyClass)],
    ['Engine', engine],
    ['Fuel', clean(result.FuelTypePrimary)],
    ['Transmission', clean(result.TransmissionStyle)],
    ['Drive', clean(result.DriveType)],
    ['Doors', clean(result.Doors)],
    ['Seats', clean(result.Seats)],
    ['Made in', title(clean(result.PlantCountry).replace(/\s*\(.*\)\s*/, ''))],
  ].filter(([, value]) => value);
  return {
    vin: cleanVin(vin),
    name: [year, title(make), model].filter(Boolean).join(' '),
    make: title(make),
    model,
    year,
    rows,
    checkDigit: checkDigitOk(vin),
  };
}

export const VIN_API = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues';
