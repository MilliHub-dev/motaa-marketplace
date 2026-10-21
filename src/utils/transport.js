// Pure helpers for towing vans and car haulers (no React, no network). Prices (`price_line`),
// statuses (`status_label`), buttons (`actions`) and every amount come from the API; nothing
// here works money out.
import { NIGERIAN_STATES } from '../data/nigeria';
import { parseOfferAmount } from './offers';

export const TRANSPORT_PAGE_SIZE = 25;
export const MAX_TRANSPORT_PHOTOS = 8;

/** Where each kind lives on the customer site. */
export const TRANSPORT_PATHS = { towing: '/towing', hauler: '/car-haulers' };

/** The customer page for one towing van or car hauler. */
export function servicePath(service) {
  const base = TRANSPORT_PATHS[service?.kind] || TRANSPORT_PATHS.towing;
  return service?.uuid ? `${base}/${service.uuid}` : base;
}

/**
 * The states as the transport API names them: like the rest of the site, except the capital is
 * "Abuja" (the API drops "FCT"), in the API's alphabetical order.
 */
export const TRANSPORT_STATES = NIGERIAN_STATES.map((state) => (state === 'FCT' ? 'Abuja' : state))
  .sort((a, b) => a.localeCompare(b));

/** "Lagos State", "Federal Capital Territory", "fct" → the matching name in `states`, or ''. */
export function matchState(text, states = TRANSPORT_STATES) {
  const clean = String(text ?? '').trim().toLowerCase().replace(/\s+state$/, '');
  if (!clean) return '';
  const wanted = ['fct', 'federal capital territory', 'abuja federal capital territory'].includes(clean) ? 'abuja' : clean;
  return (Array.isArray(states) ? states : []).find((state) => String(state).toLowerCase() === wanted) || '';
}

/** "33 min", "1 h 5 min", "2 h" for a drive time in minutes, or '' when unknown. */
export function driveTime(minutes) {
  const value = Math.round(Number(minutes));
  if (minutes === null || minutes === undefined || minutes === '' || !Number.isFinite(value) || value <= 0) return '';
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/**
 * "28.5 km away · 33 min drive" from the API's road distance (distance_km / "28.5km") and drive_minutes,
 * or null without a distance. The minutes are left out when the server doesn't know them.
 */
export function distanceLabel(distance, minutes) {
  const km = parseFloat(String(distance ?? ''));
  if (!Number.isFinite(km)) return null;
  const away = km < 1 ? 'Less than 1 km away' : `${km.toFixed(1)} km away`;
  const drive = driveTime(minutes);
  return drive ? `${away} · ${drive} drive` : away;
}

/** "Carries 3 cars" */
export function capacityLabel(capacity) {
  const cars = Number(capacity);
  if (!Number.isFinite(cars) || cars <= 0) return '';
  return `Carries ${cars} car${cars === 1 ? '' : 's'}`;
}

/** "Lagos, Ogun, Oyo +4 more" for the states a hauler covers. */
export function statesLine(states, shown = 3) {
  const list = (Array.isArray(states) ? states : []).filter(Boolean);
  if (!list.length) return '';
  if (list.length <= shown) return list.join(', ');
  return `${list.slice(0, shown).join(', ')} +${list.length - shown} more`;
}

// ---------------------------------------------------------------- browsing

/** GET /transport/ query for the towing page: ?lat=&lng= (the search point) and `all=1` to include busy vans. */
export function towingApiQuery(params, point) {
  const qs = new URLSearchParams({ kind: 'towing' });
  if (point) {
    qs.set('lat', Number(point.lat).toFixed(5));
    qs.set('lng', Number(point.lng).toFixed(5));
  }
  if (params.get('all') !== '1') qs.set('available', '1');
  const q = (params.get('q') || '').trim();
  if (q) qs.set('q', q);
  const offset = parseInt(params.get('offset'), 10);
  if (offset > 0) qs.set('offset', String(offset));
  return qs.toString();
}

export const TRUCK_TYPES = [
  { value: 'open', label: 'Open' },
  { value: 'enclosed', label: 'Enclosed' },
];

/** GET /transport/ query for the car haulers page (?state=&truck_type=&cars=&q=&offset=). */
export function haulerApiQuery(params) {
  const qs = new URLSearchParams({ kind: 'hauler' });
  const state = matchState(params.get('state'));
  if (state) qs.set('state', state);
  if (TRUCK_TYPES.some((type) => type.value === params.get('truck_type'))) qs.set('truck_type', params.get('truck_type'));
  const cars = parseInt(params.get('cars'), 10);
  if (cars >= 1 && cars <= 20) qs.set('cars', String(cars));
  const q = (params.get('q') || '').trim();
  if (q) qs.set('q', q);
  const offset = parseInt(params.get('offset'), 10);
  if (offset > 0) qs.set('offset', String(offset));
  return qs.toString();
}

// ---------------------------------------------------------------- requests

export function emptyRequestForm() {
  return { pickup: null, dropoff: null, cars: '1', date: '', days: '', hours: '', notes: '' };
}

const wholeNumber = (value) => String(value ?? '').replace(/\D/g, '');

/** What stops a request being sent: { field: message }. The server checks everything again. */
export function requestProblems(form, kind) {
  const problems = {};
  if (!form?.pickup?.formatted_address?.trim()) problems.pickup = 'Enter where to pick up from.';
  if (kind === 'hauler') {
    if (!form?.dropoff?.formatted_address?.trim()) problems.dropoff = 'Enter where the cars are going.';
    const cars = Number(wholeNumber(form?.cars));
    if (!(cars >= 1 && cars <= 20)) problems.cars = 'Enter how many cars, from 1 to 20.';
    const days = wholeNumber(form?.days);
    if (days && !(Number(days) >= 1 && Number(days) <= 365)) problems.days = 'Enter 1 to 365 days, or leave it empty.';
    const hours = wholeNumber(form?.hours);
    if (hours && !(Number(hours) >= 1 && Number(hours) <= 1000)) problems.hours = 'Enter 1 to 1000 hours, or leave it empty.';
  }
  return problems;
}

/** POST /transport/<uuid>/request/ body (or the trip part of POST /transport/jobs/new/). Empty fields are left out. */
export function requestPayload(form, kind) {
  const body = {};
  const place = (prefix, value) => {
    const address = value?.formatted_address?.trim();
    if (!address) return;
    body[`${prefix}_address`] = address;
    if (Number.isFinite(Number(value.lat)) && value.lat !== null && value.lat !== '') body[`${prefix}_lat`] = Number(value.lat);
    if (Number.isFinite(Number(value.lng)) && value.lng !== null && value.lng !== '') body[`${prefix}_lng`] = Number(value.lng);
  };
  place('pickup', form?.pickup);
  place('dropoff', form?.dropoff);
  if (kind === 'hauler') {
    body.cars = Number(wholeNumber(form?.cars)) || 1;
    if (form?.date) body.date = form.date;
    if (wholeNumber(form?.days)) body.days = Number(wholeNumber(form.days));
    if (wholeNumber(form?.hours)) body.hours = Number(wholeNumber(form.hours));
  }
  const notes = String(form?.notes ?? '').trim();
  if (notes) body.notes = notes;
  return body;
}

/** Today as YYYY-MM-DD in the visitor's own time zone (the earliest date that can be picked). */
export function todayInput(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- jobs

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-20" (a job's date) → "Oct 20, 2026"; '' when missing. Read as a calendar day, not UTC midnight. */
export function jobDateText(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!match) return '';
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) return '';
  return `${MONTHS[month]} ${Number(match[3])}, ${match[1]}`;
}

/** The trip as lines to show: "From …", "To …", cars, date, how long. */
export function tripFacts(job) {
  if (!job) return [];
  const facts = [];
  if (job.kind === 'hauler' && Number(job.cars) > 0) facts.push(`${job.cars} car${Number(job.cars) === 1 ? '' : 's'}`);
  const date = jobDateText(job.date);
  if (date) facts.push(date);
  if (Number(job.days) > 0) facts.push(`${job.days} day${Number(job.days) === 1 ? '' : 's'}`);
  if (Number(job.hours) > 0) facts.push(`${job.hours} hour${Number(job.hours) === 1 ? '' : 's'}`);
  const km = parseFloat(String(job.distance_km ?? ''));
  if (Number.isFinite(km) && km > 0) facts.push(`About ${km} km`);
  return facts;
}

/** Heading for one step of a job in the chat, from the message's `transport_event`. */
export function jobEventLabel(event, kind) {
  const what = kind === 'hauler' ? 'Car hauler' : 'Tow';
  switch (event) {
    case 'requested': return `${what} requested`;
    case 'invoiced': return 'Invoice';
    case 'paid': return 'Paid';
    case 'fuel': return 'Fuel money released';
    case 'done': return 'Marked as done';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'problem': return 'Problem reported';
    default: return kind === 'hauler' ? 'Car hauler job' : 'Towing job';
  }
}

export const JOB_PROBLEM_MIN_LENGTH = 10;

/**
 * The notice for a job whose customer reported a problem (`job.problem`), worded for whoever is looking:
 * the customer sees their own words, the business is told Motaa will contact them. '' when there is none.
 */
export function jobProblemNotice(job) {
  const details = String(job?.problem?.details || '').trim();
  if (!job?.problem) return '';
  const quoted = details ? `: “${details}”` : '';
  return job.side === 'business'
    ? `The customer reported a problem${quoted}. Motaa will contact you.`
    : `You reported a problem${quoted}. Motaa is looking into it.`;
}

/** Badge colour for a job's status. */
export function jobStatusColor(status) {
  return {
    requested: 'yellow', invoiced: 'orange', paid: 'blue', done: 'purple', completed: 'green', declined: 'red', cancelled: 'gray',
  }[status] || 'gray';
}

/** True once the job has an invoice (the API sends the amounts then). */
export function hasInvoice(job) {
  return job?.service_amount !== null && job?.service_amount !== undefined && job?.service_amount !== '';
}

/** True when the fuel part of an invoice is more than nothing. */
export function hasFuel(job) {
  return Number(job?.fuel_amount) > 0;
}

/**
 * The newest step of each job in a list of messages (oldest first): { job uuid: message key }.
 * Only that step may show buttons, even while an older copy still says `transport_latest`.
 */
export function latestJobSteps(messages, keyOf = (msg) => String(msg?.uuid || msg?.id || '')) {
  const latest = {};
  for (const msg of Array.isArray(messages) ? messages : []) {
    if (msg?.transport_job?.uuid) latest[msg.transport_job.uuid] = keyOf(msg);
  }
  return latest;
}

/** Invoice body: whole naira as digits; an empty fuel amount is left out. */
export function invoicePayload({ service_amount, fuel_amount, note }) {
  const body = { service_amount: parseOfferAmount(service_amount) };
  const fuel = parseOfferAmount(fuel_amount);
  if (fuel) body.fuel_amount = fuel;
  const text = String(note ?? '').trim();
  if (text) body.note = text;
  return body;
}

export function invoiceProblems({ service_amount }) {
  const problems = {};
  if (!(Number(parseOfferAmount(service_amount)) > 0)) problems.service_amount = 'Enter the price for the job.';
  return problems;
}

// ---------------------------------------------------------------- the business's listings

/** A whole-naira amount from the API ("15000.00") for an input; '' when missing. */
function amountField(value) {
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number)) : '';
}

export function emptyServiceForm(kind) {
  return {
    title: '', description: '', base_address: '', base_state: '', base_lat: null, base_lng: null, active: true,
    ...(kind === 'towing'
      ? { callout_fee: '', per_km_fee: '', available_now: true }
      : { price: '', price_unit: 'day', fuel_included: false, truck_type: 'open', capacity: '1', states: [] }),
  };
}

export function serviceToForm(service) {
  const kind = service?.kind === 'hauler' ? 'hauler' : 'towing';
  const form = emptyServiceForm(kind);
  if (!service) return form;
  return {
    ...form,
    title: service.title || '',
    description: service.description || '',
    base_address: service.base_address || '',
    base_state: service.base_state || '',
    base_lat: service.base_lat ?? null,
    base_lng: service.base_lng ?? null,
    active: service.active !== false,
    ...(kind === 'towing'
      ? { callout_fee: amountField(service.callout_fee), per_km_fee: amountField(service.per_km_fee), available_now: Boolean(service.available_now) }
      : {
        price: amountField(service.price), price_unit: service.price_unit || 'day', fuel_included: Boolean(service.fuel_included),
        truck_type: service.truck_type || 'open', capacity: service.capacity ? String(service.capacity) : '1',
        states: Array.isArray(service.states) ? service.states : [],
      }),
  };
}

/** What stops the listing being saved: { field: message }. The server checks everything again. */
export function validateServiceForm(form, kind, photoCount) {
  const problems = {};
  if (String(form.title ?? '').trim().length < 3) problems.title = 'Give it a name customers will recognise, e.g. "24/7 Tow Truck – Ikeja".';
  if (!String(form.base_address ?? '').trim()) problems.base_address = 'Enter where the truck is based.';
  if (kind === 'towing') {
    if (!(Number(parseOfferAmount(form.callout_fee)) > 0) && !(Number(parseOfferAmount(form.per_km_fee)) > 0)) {
      problems.callout_fee = 'Set a call-out fee, a price per km, or both.';
    }
  } else {
    if (!(Number(parseOfferAmount(form.price)) > 0)) problems.price = 'Set the starting price customers see.';
    const capacity = Number(wholeNumber(form.capacity));
    if (!(capacity >= 1 && capacity <= 20)) problems.capacity = 'How many cars can it carry? (1 to 20)';
    if (!(Array.isArray(form.states) && form.states.length)) problems.states = 'Choose the states it covers.';
  }
  if (photoCount < 1) problems.photos = 'Add at least one photo.';
  if (photoCount > MAX_TRANSPORT_PHOTOS) problems.photos = `Up to ${MAX_TRANSPORT_PHOTOS} photos.`;
  return problems;
}

/** Multipart body for POST /transport/mine/ and PATCH /transport/mine/<uuid>/. */
export function serviceFormData(form, kind, images = []) {
  const body = new FormData();
  body.append('title', String(form.title ?? '').trim());
  body.append('description', String(form.description ?? '').trim());
  body.append('base_address', String(form.base_address ?? '').trim());
  body.append('base_state', String(form.base_state ?? '').trim());
  body.append('base_lat', form.base_lat === null || form.base_lat === undefined ? '' : String(form.base_lat));
  body.append('base_lng', form.base_lng === null || form.base_lng === undefined ? '' : String(form.base_lng));
  body.append('active', form.active ? 'true' : 'false');
  if (kind === 'towing') {
    body.append('callout_fee', parseOfferAmount(form.callout_fee));
    body.append('per_km_fee', parseOfferAmount(form.per_km_fee));
    body.append('available_now', form.available_now ? 'true' : 'false');
  } else {
    body.append('price', parseOfferAmount(form.price));
    body.append('price_unit', form.price_unit);
    body.append('fuel_included', form.fuel_included ? 'true' : 'false');
    body.append('truck_type', form.truck_type);
    body.append('capacity', wholeNumber(form.capacity));
    body.append('states', JSON.stringify(Array.isArray(form.states) ? form.states : []));
  }
  const removed = images.filter((item) => item.uuid && item.removed).map((item) => item.uuid);
  if (removed.length) body.append('remove_photos', JSON.stringify(removed));
  for (const item of images) if (item.file) body.append('photos', item.file, item.file.name);
  return body;
}
