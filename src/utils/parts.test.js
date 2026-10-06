import { describe, expect, it } from 'vitest';
import {
  cleanAmount, cleanFitments, deadlineWords, emptyPartForm, hasPartsFilters, orderTimeline, partFormData, partToForm,
  partsApiQuery, partsFilterChips, policyBlocks, storePayload, storePlace, storeToForm, validateDelivery, validatePartForm,
  validateStoreForm,
} from './parts';
import { isBusinessUser } from './index';

const url = (query) => new URLSearchParams(query);

describe('partsApiQuery', () => {
  it('passes the filters through and pages by offset', () => {
    const qs = new URLSearchParams(partsApiQuery(url('q=brake+pad&category=brakes&make=Toyota&model=Corolla&year=2012&condition=new,used&price_min=1000&price_max=50000&state=Lagos&in_stock=1&sort=price_asc&page=3')));
    expect(Object.fromEntries(qs)).toEqual({
      q: 'brake pad', category: 'brakes', make: 'Toyota', model: 'Corolla', year: '2012', condition: 'new,used',
      price_min: '1000', price_max: '50000', state: 'Lagos', in_stock: '1', sort: 'price_asc', per_page: '24', offset: '48',
    });
  });

  it('leaves out defaults, blanks, and a model without its make', () => {
    const qs = new URLSearchParams(partsApiQuery(url('q=+&model=Corolla&sort=newest&in_stock=0&page=1')));
    expect(Object.fromEntries(qs)).toEqual({ per_page: '24' });
  });

  it("adds the shop when listing one seller's parts", () => {
    expect(partsApiQuery(url(''), { store: 'abc', pageSize: 10 })).toBe('store=abc&per_page=10');
  });
});

describe('filters in the URL', () => {
  it('knows when a filter is applied (sorting and paging are not filters)', () => {
    expect(hasPartsFilters(url('sort=popular&page=2'))).toBe(false);
    expect(hasPartsFilters(url('in_stock=1'))).toBe(true);
    expect(hasPartsFilters(url('make=Honda'))).toBe(true);
  });

  it('builds a chip for each applied filter with the API labels', () => {
    const filters = { categories: [{ slug: 'brakes', name: 'Brakes' }], conditions: [{ value: 'used', label: 'Used (Tokunbo)' }] };
    const chips = partsFilterChips(url('category=brakes&make=Toyota&model=Camry&year=2010&condition=used&price_min=5000&in_stock=1'), filters, (n) => Number(n).toLocaleString('en-US'));
    expect(chips).toEqual([
      { keys: ['category'], label: 'Brakes' },
      { keys: ['make', 'model', 'year'], label: 'Fits: 2010 Toyota Camry' },
      { keys: ['condition'], label: 'Used (Tokunbo)' },
      { keys: ['price_min', 'price_max'], label: 'From ₦5,000' },
      { keys: ['in_stock'], label: 'In stock' },
    ]);
  });
});

describe('policyBlocks', () => {
  it('splits the policy into paragraphs, bullets and steps', () => {
    const text = 'You can return a part if:\n- it is wrong;\n- it is damaged.\n\nHow it works:\n1. Open the order.\n2. Wait for the seller.';
    expect(policyBlocks(text)).toEqual([
      { type: 'p', text: 'You can return a part if:' },
      { type: 'ul', items: ['it is wrong;', 'it is damaged.'] },
      { type: 'p', text: 'How it works:' },
      { type: 'ol', items: ['Open the order.', 'Wait for the seller.'] },
    ]);
  });

  it('copes with nothing', () => {
    expect(policyBlocks(null)).toEqual([]);
  });
});

describe('deadlineWords', () => {
  const now = new Date(2026, 9, 6, 15, 0);
  it('says how long is left in plain words', () => {
    expect(deadlineWords(new Date(2026, 9, 6, 18, 0), now)).toBe('today');
    expect(deadlineWords(new Date(2026, 9, 7, 9, 0), now)).toBe('tomorrow');
    expect(deadlineWords(new Date(2026, 9, 13, 9, 0), now)).toBe('in 7 days');
  });
  it('has nothing to say about past or missing dates', () => {
    expect(deadlineWords(new Date(2026, 9, 6, 14, 0), now)).toBeNull();
    expect(deadlineWords(null, now)).toBeNull();
    expect(deadlineWords('not a date', now)).toBeNull();
  });
});

describe('orderTimeline', () => {
  it('marks the steps the API has dates for', () => {
    const steps = orderTimeline({ date: '2026-10-01T10:00:00Z', accepted_at: '2026-10-01T11:00:00Z', delivery_method: 'delivery' });
    expect(steps.map((step) => [step.key, step.done])).toEqual([['placed', true], ['accepted', true], ['shipped', false], ['delivered', false], ['completed', false]]);
    expect(steps[2].label).toBe('Sent by the seller');
  });
  it('words pickup orders differently', () => {
    const steps = orderTimeline({ date: 'x', delivery_method: 'pickup' });
    expect(steps[2].label).toBe('Ready for pickup');
    expect(steps[3].label).toBe('Collected');
  });
  it('ends a cancelled order where it stopped', () => {
    const steps = orderTimeline({ date: '2026-10-01T10:00:00Z', cancelled_at: '2026-10-01T12:00:00Z', cancelled_by: 'seller' });
    expect(steps.map((step) => step.key)).toEqual(['placed', 'cancelled']);
    expect(steps[1].label).toBe('Cancelled by the seller');
  });
});

describe('part form', () => {
  const filled = () => ({ ...emptyPartForm(), name: 'Front brake pads', category: 'brakes', price: '42,500', stock: '4', fitments: [{ make: 'Toyota', model: 'Corolla', year_from: '2008', year_to: '2013' }] });

  it('accepts a complete part', () => {
    expect(validatePartForm(filled(), 2, { thisYear: 2026 })).toEqual({});
  });

  it('points at each missing field', () => {
    const errors = validatePartForm(emptyPartForm(), 0, { thisYear: 2026 });
    expect(Object.keys(errors).sort()).toEqual(['category', 'fitments', 'images', 'name', 'price']);
  });

  it('checks the cars a part fits unless it fits any car', () => {
    const form = filled();
    form.fitments = [{ make: '', model: 'Corolla', year_from: '', year_to: '' }];
    expect(validatePartForm(form, 1, { thisYear: 2026 }).fitments).toMatch(/make/);
    form.fitments = [{ make: 'Toyota', model: '', year_from: '2015', year_to: '2010' }];
    expect(validatePartForm(form, 1, { thisYear: 2026 }).fitments).toMatch(/start year/);
    form.fitments = [{ make: 'Toyota', model: '', year_from: '1900', year_to: '' }];
    expect(validatePartForm(form, 1, { thisYear: 2026 }).fitments).toMatch(/between 1950 and 2027/);
    form.universal = true;
    expect(validatePartForm(form, 1, { thisYear: 2026 }).fitments).toBeUndefined();
  });

  it('limits photos to eight and wants a real price and stock', () => {
    expect(validatePartForm(filled(), 9).images).toMatch(/up to 8/);
    expect(validatePartForm({ ...filled(), price: '0' }, 1).price).toMatch(/above zero/);
    expect(validatePartForm({ ...filled(), price: 'abc' }, 1).price).toMatch(/valid/);
    expect(validatePartForm({ ...filled(), stock: '' }, 1).stock).toBeTruthy();
  });

  it('drops empty fitment rows and turns years into numbers', () => {
    expect(cleanFitments([{ make: ' Toyota ', model: '', year_from: '2008', year_to: '' }, { make: '', model: '', year_from: '', year_to: '' }]))
      .toEqual([{ make: 'Toyota', model: '', year_from: 2008, year_to: null }]);
  });

  it('builds the multipart body the API expects', () => {
    const file = new File(['x'], 'pad.jpg', { type: 'image/jpeg' });
    const body = partFormData(filled(), [{ key: 'a', uuid: 'img-1', url: '/a.jpg', removed: true }, { key: 'b', uuid: 'img-2', url: '/b.jpg' }, { key: 'c', file }]);
    expect(body.get('name')).toBe('Front brake pads');
    expect(body.get('price')).toBe('42500');
    expect(body.get('universal')).toBe('false');
    expect(body.get('active')).toBe('true');
    expect(JSON.parse(body.get('fitments'))).toEqual([{ make: 'Toyota', model: 'Corolla', year_from: 2008, year_to: 2013 }]);
    expect(JSON.parse(body.get('remove_images'))).toEqual(['img-1']);
    expect(body.getAll('images')).toHaveLength(1);
    expect(body.getAll('images')[0].name).toBe('pad.jpg');
  });

  it('sends no fitments for a part that fits any car', () => {
    const body = partFormData({ ...filled(), universal: true }, []);
    expect(body.get('fitments')).toBe('[]');
    expect(body.has('remove_images')).toBe(false);
  });

  it('reads a part from the API back into the form', () => {
    const form = partToForm({
      name: 'Oil filter', category_slug: 'filters', condition: 'used', brand: 'Denso', part_number: '90915', price: '3500.00', stock: 0,
      warranty: '', description: 'Fits most', universal: false, active: false, fitments: [{ make: 'Toyota', model: '', year_from: 2005, year_to: null, label: 'Toyota 2005+' }],
    });
    expect(form).toMatchObject({ name: 'Oil filter', category: 'filters', condition: 'used', price: '3500', stock: '0', active: false });
    expect(form.fitments).toEqual([{ make: 'Toyota', model: '', year_from: '2005', year_to: '' }]);
    expect(partToForm({ universal: true }).fitments).toHaveLength(1);
  });
});

describe('shop settings', () => {
  it('reads the shop into the form and back into a payload', () => {
    const form = storeToForm({
      active: true, delivers: true, delivery_fee: '2500.00', delivers_nationwide: true, delivery_days: '1-3 days', offers_pickup: true,
      pickup_address: ' 5 Ladipo St ', zones: [{ state: 'Lagos', fee: '1500.00' }],
    });
    expect(form.delivery_fee).toBe('2500');
    expect(form.zones).toEqual([{ state: 'Lagos', fee: '1500' }]);
    expect(validateStoreForm(form)).toEqual({});
    expect(storePayload({ ...form, delivery_fee: '2,500' })).toEqual({
      active: true, delivers: true, delivery_fee: '2500', delivers_nationwide: true, delivery_days: '1-3 days', offers_pickup: true,
      pickup_address: '5 Ladipo St', zones: [{ state: 'Lagos', fee: '1500' }],
    });
  });

  it('starts a business without a shop on the defaults', () => {
    expect(storeToForm(null)).toMatchObject({ active: true, delivers: true, delivers_nationwide: true, offers_pickup: false, zones: [] });
  });

  it('refuses a shop with no way to get orders to customers', () => {
    expect(validateStoreForm({ ...storeToForm(null), delivers: false }).delivers).toBeTruthy();
  });

  it('needs a pickup address, complete state fees and somewhere to deliver', () => {
    const base = storeToForm(null);
    expect(validateStoreForm({ ...base, offers_pickup: true }).pickup_address).toBeTruthy();
    expect(validateStoreForm({ ...base, zones: [{ state: '', fee: '100' }] }).zones).toMatch(/Choose a state/);
    expect(validateStoreForm({ ...base, zones: [{ state: 'Kano', fee: '' }] }).zones).toMatch(/Kano/);
    expect(validateStoreForm({ ...base, zones: [{ state: 'Kano', fee: '1' }, { state: 'kano', fee: '2' }] }).zones).toMatch(/twice/);
    expect(validateStoreForm({ ...base, delivers_nationwide: false }).zones).toMatch(/at least one state/);
    expect(validateStoreForm({ ...base, delivery_fee: 'x' }).delivery_fee).toBeTruthy();
  });
});

describe('small helpers', () => {
  it('cleans typed amounts', () => {
    expect(cleanAmount(' ₦12,500.50 ')).toBe('12500.50');
    expect(cleanAmount(null)).toBe('');
  });
  it('names where a shop is', () => {
    expect(storePlace({ city: 'Ikeja', state: 'Lagos' })).toBe('Ikeja, Lagos');
    expect(storePlace({ city: '', state: 'Kano' })).toBe('Kano');
    expect(storePlace(null)).toBe('');
  });
  it('checks delivery details the way the API does', () => {
    const form = { delivery_address: '5 Admiralty Way', state: 'Lagos', phone_number: '0803 123 4567' };
    expect(validateDelivery(form, { needsAddress: true })).toEqual({});
    expect(Object.keys(validateDelivery({ delivery_address: '', state: '', phone_number: '12' }, { needsAddress: true })).sort()).toEqual(['delivery_address', 'phone_number', 'state']);
    expect(validateDelivery({ delivery_address: '', state: '', phone_number: '+2348031234567' }, { needsAddress: false })).toEqual({});
  });
  it('treats parts dealers as business accounts', () => {
    expect(isBusinessUser({ user_type: 'parts_dealer' })).toBe(true);
    expect(isBusinessUser({ user_type: 'dealer' })).toBe(true);
    expect(isBusinessUser({ user_type: 'customer' })).toBe(false);
    expect(isBusinessUser(null)).toBe(false);
  });
});
