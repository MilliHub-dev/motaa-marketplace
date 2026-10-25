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

// ---- US auction records (GET /vin/<VIN>/auction/ on the Motaa API) -----------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const group = (value) => String(Math.round(Number(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const hasNumber = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

/** An auction photo link → an absolute URL. The API sends paths relative to its host ("/api/v1/vin/photo/?u=…"). */
export function auctionPhotoUrl(path, origin) {
  const text = String(path || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  const base = String(origin || '').replace(/\/+$/, '');
  return `${base}${text.startsWith('/') ? '' : '/'}${text}`;
}

/** "2023-05-04" → "4 May 2023" (no time zone shift), or ''. */
export function auctionDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!match) return '';
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month} ${match[1]}` : '';
}

/** 6200 → "$6,200", or '' when unknown. */
export function usd(value) {
  return hasNumber(value) && Number(value) > 0 ? `$${group(value)}` : '';
}

/**
 * "Sold at COPART · 4 May 2023 · $6,200 · Sold on Approval" when the sale date or price is known; otherwise
 * "At IAAI · lot 44031493 · Sold on Approval". The parts that are unknown are left out.
 */
export function auctionSaleLine(record) {
  const platform = String(record?.platform || '').trim();
  const date = auctionDate(record?.sale_date);
  const price = usd(record?.sale_price_usd);
  const status = String(record?.sale_status || '').trim();
  const where = platform || 'a US auction';
  const parts = date || price
    ? [`Sold at ${where}`, date, price]
    : [`At ${where}`, record?.lot_number ? `lot ${record.lot_number}` : ''];
  return [...parts, status].filter(Boolean).join(' · ');
}

/** The auction lookup's query: make, model and year from the VIN decode (empty when it hasn't any). */
export function auctionQuery(decoded) {
  const params = new URLSearchParams();
  const make = String(decoded?.make || '').trim();
  const model = String(decoded?.model || '').trim();
  const year = String(decoded?.year || '').trim();
  if (make && model && year) {
    params.set('make', make);
    params.set('model', model);
    params.set('year', year);
  }
  return params.toString();
}

/** "48,280 km (30,000 mi)", or just one of them, or ''. */
export function auctionOdometer(km, mi) {
  const k = hasNumber(km) && Number(km) > 0 ? `${group(km)} km` : '';
  const m = hasNumber(mi) && Number(mi) > 0 ? `${group(mi)} mi` : '';
  if (k && m) return `${k} (${m})`;
  return k || m;
}

/** "2016 Toyota Camry" for the auction record (or its title). */
export function auctionCarName(record) {
  const name = [record?.year, record?.make, record?.model].filter(Boolean).join(' ').trim();
  return name || String(record?.title || '').trim() || 'This car';
}

/**
 * "2016 Toyota Camry, auction photo 3 of 12"; for a similar car (not the one checked):
 * "Another 2014 Toyota Camry (not this car), auction photo 3 of 12".
 */
export function auctionPhotoAlt(record, index, total, { similar = false } = {}) {
  const name = similar ? `Another ${auctionCarName(record)} (not this car)` : auctionCarName(record);
  return `${name}, auction photo ${index + 1} of ${total}`;
}

/** The note under a similar car's photos. */
export function similarCarNote(record) {
  const platform = String(record?.platform || '').trim();
  return `No US auction record for this exact car. These photos are of another ${auctionCarName(record)}`
    + `${platform ? ` sold at ${platform}` : ' from a US auction'}, to show what one looks like.`;
}

/** One earlier sale: "IAAI · lot 3311 · 2 Mar 2021 · $4,100 · Sold" */
export function auctionHistoryLine(row) {
  return [
    String(row?.platform || '').trim(),
    row?.lot_number ? `lot ${row.lot_number}` : '',
    auctionDate(row?.date),
    usd(row?.price_usd),
    String(row?.status || '').trim(),
  ].filter(Boolean).join(' · ');
}
