// Pure helpers for the spare-parts marketplace (no React, no network): URL ⇄ API
// queries, form ⇄ payload conversion and wording for dates. Money, statuses and the
// buttons to show always come from the API; nothing here works those out.

export const PARTS_PAGE_SIZE = 24;
export const MAX_PART_PHOTOS = 8;
export const MAX_RETURN_PHOTOS = 4;
export const FIRST_FITMENT_YEAR = 1950;
// sessionStorage: the orders a checkout just created, for the confirmation page
export const PLACED_ORDERS_KEY = 'motaa:parts-orders-placed';

// PartsReturn.REASONS on the backend (the API has no endpoint that lists them).
export const RETURN_REASONS = [
  { value: 'wrong-part', label: "It's the wrong part or doesn't fit" },
  { value: 'damaged', label: 'It arrived damaged or faulty' },
  { value: 'not-as-described', label: "It's not as described" },
  { value: 'not-received', label: "I haven't received it" },
  { value: 'changed-mind', label: "I don't want it any more" },
];

const LIST_FILTERS = ['q', 'category', 'make', 'model', 'year', 'condition', 'brand', 'price_min', 'price_max', 'state'];

/** Page URL (?q=&category=&make=&…&page=) → query string for GET /parts/. */
export function partsApiQuery(params, { store, pageSize = PARTS_PAGE_SIZE } = {}) {
  const qs = new URLSearchParams();
  for (const key of LIST_FILTERS) {
    const value = (params.get(key) || '').trim();
    if (value) qs.set(key, value);
  }
  if (!qs.get('make')) qs.delete('model'); // a model only means something with its make
  if (params.get('in_stock') === '1') qs.set('in_stock', '1');
  const sort = params.get('sort');
  if (sort && sort !== 'newest') qs.set('sort', sort);
  if (store) qs.set('store', store);
  qs.set('per_page', String(pageSize));
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  if (page > 1) qs.set('offset', String((page - 1) * pageSize));
  return qs.toString();
}

/** True when the URL holds any filter (sorting and paging don't count). */
export function hasPartsFilters(params) {
  return LIST_FILTERS.some((key) => (params.get(key) || '').trim()) || params.get('in_stock') === '1';
}

/** Chips for the applied filters: [{ keys: [url params to remove], label }]. */
export function partsFilterChips(params, filters = {}, commaInt = String) {
  const chips = [];
  const get = (key) => (params.get(key) || '').trim();
  if (get('q')) chips.push({ keys: ['q'], label: `Search: ${get('q')}` });
  if (get('category')) {
    const name = (filters.categories || []).find((c) => c.slug === get('category'))?.name || get('category');
    chips.push({ keys: ['category'], label: name });
  }
  if (get('make') || get('year')) {
    const car = [get('year'), get('make'), get('make') ? get('model') : ''].filter(Boolean).join(' ');
    chips.push({ keys: ['make', 'model', 'year'], label: `Fits: ${car}` });
  }
  if (get('condition')) {
    const names = get('condition').split(',').filter(Boolean)
      .map((value) => (filters.conditions || []).find((c) => c.value === value)?.label || value);
    chips.push({ keys: ['condition'], label: names.join(', ') });
  }
  if (get('brand')) chips.push({ keys: ['brand'], label: `Brand: ${get('brand')}` });
  const min = get('price_min');
  const max = get('price_max');
  if (min || max) {
    const label = min && max ? `₦${commaInt(min)} – ₦${commaInt(max)}` : min ? `From ₦${commaInt(min)}` : `Up to ₦${commaInt(max)}`;
    chips.push({ keys: ['price_min', 'price_max'], label });
  }
  if (get('state')) chips.push({ keys: ['state'], label: `Seller in ${get('state')}` });
  if (params.get('in_stock') === '1') chips.push({ keys: ['in_stock'], label: 'In stock' });
  return chips;
}

/**
 * The return policy is plain text: paragraphs, "- " bullets and "1." steps.
 * → [{ type: 'p', text } | { type: 'ul' | 'ol', items: [] }]
 */
export function policyBlocks(text) {
  const blocks = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    const step = line.match(/^\d+[.)]\s+(.*)$/);
    const type = bullet ? 'ul' : step ? 'ol' : 'p';
    if (type === 'p') {
      blocks.push({ type, text: line });
      continue;
    }
    const last = blocks[blocks.length - 1];
    const item = (bullet || step)[1];
    if (last?.type === type) last.items.push(item);
    else blocks.push({ type, items: [item] });
  }
  return blocks;
}

/** "today", "tomorrow", "in 5 days"; null when the date is missing or already past. */
export function deadlineWords(value, now = new Date()) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const left = date.getTime() - now.getTime();
  if (left < 0) return null;
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(date) - startOf(now)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

/**
 * What has happened to an order so far, from the dates the API recorded:
 * [{ key, label, at, done }]. A cancelled order ends with "Cancelled".
 */
export function orderTimeline(order) {
  if (!order) return [];
  const pickup = order.delivery_method === 'pickup';
  const steps = [
    { key: 'placed', label: 'Order placed and paid', at: order.date },
    { key: 'accepted', label: 'Accepted by the seller', at: order.accepted_at },
    { key: 'shipped', label: pickup ? 'Ready for pickup' : 'Sent by the seller', at: order.shipped_at },
    { key: 'delivered', label: pickup ? 'Collected' : 'Delivered', at: order.delivered_at },
    { key: 'completed', label: 'Completed: seller paid', at: order.completed_at },
  ].map((step) => ({ ...step, at: step.at || null, done: Boolean(step.at) }));
  if (order.cancelled_at) {
    const by = order.cancelled_by === 'seller' ? ' by the seller' : order.cancelled_by === 'customer' ? ' by the customer' : '';
    return [...steps.filter((step) => step.done), { key: 'cancelled', label: `Cancelled${by}`, at: order.cancelled_at, done: true }];
  }
  return steps;
}

/** "Lekki, Lagos" from a store's city and state. */
export function storePlace(store) {
  return [store?.city, store?.state].map((v) => (v || '').trim()).filter(Boolean).join(', ');
}

// ---------------------------------------------------------------- amounts

/** "12,500.50" → "12500.50"; '' stays ''. */
export function cleanAmount(value) {
  return String(value ?? '').replace(/[,\s₦]/g, '');
}

function amountProblem(value, { required = true, aboveZero = false } = {}) {
  const text = cleanAmount(value);
  if (!text) return required ? 'Enter an amount.' : '';
  const number = Number(text);
  if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(number)) return 'Enter a valid amount.';
  if (aboveZero && number <= 0) return 'Enter a price above zero.';
  return '';
}

/** "42500.00" → "42500" for a form field. */
function amountField(value) {
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : '';
}

// ---------------------------------------------------------------- add / edit part

export const emptyFitment = () => ({ make: '', model: '', year_from: '', year_to: '' });

export function emptyPartForm() {
  return {
    name: '', category: '', condition: 'new', brand: '', part_number: '', price: '', stock: '1', warranty: '',
    description: '', universal: false, active: true, fitments: [emptyFitment()],
  };
}

/** A part from GET /parts/seller/parts/<uuid>/ → the form's state. */
export function partToForm(part) {
  const fitments = (Array.isArray(part?.fitments) ? part.fitments : []).map((row) => ({
    make: row?.make || '', model: row?.model || '',
    year_from: row?.year_from ? String(row.year_from) : '', year_to: row?.year_to ? String(row.year_to) : '',
  }));
  return {
    name: part?.name || '',
    category: part?.category_slug || part?.category?.slug || '',
    condition: part?.condition || 'new',
    brand: part?.brand || '',
    part_number: part?.part_number || '',
    price: amountField(part?.price),
    stock: part?.stock === null || part?.stock === undefined ? '0' : String(part.stock),
    warranty: part?.warranty || '',
    description: part?.description || '',
    universal: Boolean(part?.universal),
    active: part?.active !== false,
    fitments: fitments.length ? fitments : [emptyFitment()],
  };
}

const isBlankFitment = (row) => !['make', 'model', 'year_from', 'year_to'].some((key) => String(row?.[key] ?? '').trim());

/** Rows the seller actually filled in, as the API wants them. */
export function cleanFitments(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => !isBlankFitment(row)).map((row) => ({
    make: String(row.make || '').trim(),
    model: String(row.model || '').trim(),
    year_from: String(row.year_from || '').trim() ? Number(row.year_from) : null,
    year_to: String(row.year_to || '').trim() ? Number(row.year_to) : null,
  }));
}

/** Field → message for whatever stops the form being sent (same rules as the API). */
export function validatePartForm(form, photoCount, { thisYear = new Date().getFullYear() } = {}) {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = 'Enter the name of the part.';
  if (!form.category) errors.category = 'Choose a category.';
  if (!form.condition) errors.condition = 'Choose a condition.';
  const price = amountProblem(form.price, { aboveZero: true });
  if (price) errors.price = price === 'Enter an amount.' ? 'Enter a price.' : price;
  if (!/^\d+$/.test(String(form.stock).trim()) || Number(form.stock) > 1000000) errors.stock = 'Enter how many you have in stock.';
  if (photoCount < 1) errors.images = 'Add at least one photo of the part.';
  else if (photoCount > MAX_PART_PHOTOS) errors.images = `A part can have up to ${MAX_PART_PHOTOS} photos.`;
  if (!form.universal) {
    const rows = cleanFitments(form.fitments);
    const maxYear = thisYear + 1;
    const badYear = (year) => year !== null && (!Number.isInteger(year) || year < FIRST_FITMENT_YEAR || year > maxYear);
    if (!rows.length) errors.fitments = 'Add at least one car this part fits, or mark it as fitting any car.';
    else if (rows.some((row) => !row.make)) errors.fitments = 'Choose a make for every car this part fits.';
    else if (rows.some((row) => badYear(row.year_from) || badYear(row.year_to))) errors.fitments = `Years must be between ${FIRST_FITMENT_YEAR} and ${maxYear}.`;
    else if (rows.some((row) => row.year_from && row.year_to && row.year_from > row.year_to)) errors.fitments = "A start year can't be after the end year.";
  }
  return errors;
}

/**
 * multipart body for POST /parts/seller/parts/ and PATCH /parts/seller/parts/<uuid>/.
 * images: the ImageUploader's items ([{ file } | { uuid, removed }]).
 */
export function partFormData(form, images = []) {
  const body = new FormData();
  for (const key of ['name', 'brand', 'part_number', 'warranty']) body.append(key, form[key].trim());
  body.append('description', form.description.trim());
  body.append('category', form.category);
  body.append('condition', form.condition);
  body.append('price', cleanAmount(form.price));
  body.append('stock', String(form.stock).trim());
  body.append('universal', form.universal ? 'true' : 'false');
  body.append('active', form.active ? 'true' : 'false');
  body.append('fitments', JSON.stringify(form.universal ? [] : cleanFitments(form.fitments)));
  const removed = images.filter((item) => item.uuid && item.removed).map((item) => item.uuid);
  if (removed.length) body.append('remove_images', JSON.stringify(removed));
  for (const item of images) if (item.file) body.append('images', item.file, item.file.name);
  return body;
}

// ---------------------------------------------------------------- shop settings

/** Shop settings for a business that has not opened a shop yet (the API's own defaults). */
export function emptyStoreForm() {
  return {
    active: true, delivers: true, delivery_fee: '0', delivers_nationwide: true, delivery_days: '',
    offers_pickup: false, pickup_address: '', zones: [],
  };
}

export function storeToForm(store) {
  if (!store) return emptyStoreForm();
  return {
    active: store.active !== false,
    delivers: Boolean(store.delivers),
    delivery_fee: amountField(store.delivery_fee) || '0',
    delivers_nationwide: Boolean(store.delivers_nationwide),
    delivery_days: store.delivery_days || '',
    offers_pickup: Boolean(store.offers_pickup),
    pickup_address: store.pickup_address || '',
    zones: (Array.isArray(store.zones) ? store.zones : []).map((zone) => ({ state: zone?.state || '', fee: amountField(zone?.fee) })),
  };
}

export function validateStoreForm(form) {
  const errors = {};
  if (!form.delivers && !form.offers_pickup) errors.delivers = 'Offer delivery, pickup or both.';
  if (form.delivers) {
    const fee = amountProblem(form.delivery_fee, { required: form.delivers_nationwide });
    if (fee) errors.delivery_fee = fee;
    const seen = new Set();
    for (const zone of form.zones) {
      const state = (zone.state || '').trim();
      if (!state) errors.zones = 'Choose a state for every delivery fee.';
      else if (seen.has(state.toLowerCase())) errors.zones = `${state} is listed twice.`;
      else if (amountProblem(zone.fee)) errors.zones = `Enter the delivery fee for ${state}.`;
      seen.add(state.toLowerCase());
      if (errors.zones) break;
    }
    if (!errors.zones && !form.delivers_nationwide && !form.zones.length) {
      errors.zones = 'Add at least one state you deliver to, or deliver nationwide.';
    }
  }
  if (form.offers_pickup && !form.pickup_address.trim()) errors.pickup_address = 'Enter the address customers collect from.';
  return errors;
}

/** JSON body for PUT /parts/seller/store/. */
export function storePayload(form) {
  return {
    active: Boolean(form.active),
    delivers: Boolean(form.delivers),
    delivery_fee: cleanAmount(form.delivery_fee) || '0',
    delivers_nationwide: Boolean(form.delivers_nationwide),
    delivery_days: form.delivery_days.trim(),
    offers_pickup: Boolean(form.offers_pickup),
    pickup_address: form.pickup_address.trim(),
    zones: form.zones.map((zone) => ({ state: zone.state.trim(), fee: cleanAmount(zone.fee) })),
  };
}

// ---------------------------------------------------------------- checkout

/** What stops a parts checkout being sent (the API checks the same things). */
export function validateDelivery(form, { needsAddress }) {
  const errors = {};
  if (needsAddress && form.delivery_address.trim().length < 5) errors.delivery_address = 'Enter the address to deliver to.';
  if (needsAddress && !form.state) errors.state = 'Choose the state to deliver to.';
  const digits = String(form.phone_number || '').replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) errors.phone_number = 'Enter a phone number the seller can reach you on.';
  return errors;
}
