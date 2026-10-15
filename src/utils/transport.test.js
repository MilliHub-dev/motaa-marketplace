import { describe, expect, it } from 'vitest';
import {
  TRANSPORT_STATES, capacityLabel, distanceLabel, emptyServiceForm, haulerApiQuery, invoicePayload, invoiceProblems, jobDateText,
  jobEventLabel, jobProblemNotice, latestJobSteps, matchState, requestPayload, requestProblems, serviceFormData, servicePath, serviceToForm,
  statesLine, towingApiQuery, tripFacts, validateServiceForm,
} from './transport';

const url = (query) => new URLSearchParams(query);
const place = (formatted_address, lat = 6.5, lng = 3.3) => ({ formatted_address, lat, lng });

describe('states', () => {
  it('names the capital Abuja, as the transport API does, in alphabetical order', () => {
    expect(TRANSPORT_STATES).toContain('Abuja');
    expect(TRANSPORT_STATES).not.toContain('FCT');
    expect(TRANSPORT_STATES).toHaveLength(37);
    expect([...TRANSPORT_STATES].sort((a, b) => a.localeCompare(b))).toEqual(TRANSPORT_STATES);
  });

  it('matches what the address search says to a state name', () => {
    expect(matchState('Lagos State')).toBe('Lagos');
    expect(matchState('Federal Capital Territory')).toBe('Abuja');
    expect(matchState('fct')).toBe('Abuja');
    expect(matchState('cross river')).toBe('Cross River');
    expect(matchState('Ontario')).toBe('');
    expect(matchState('')).toBe('');
  });
});

describe('labels', () => {
  it('words distances, capacity and states', () => {
    expect(distanceLabel(3.27)).toBe('3.3 km away');
    expect(distanceLabel(0.4)).toBe('Less than 1 km away');
    expect(distanceLabel(null)).toBeNull();
    expect(capacityLabel(1)).toBe('Carries 1 car');
    expect(capacityLabel(6)).toBe('Carries 6 cars');
    expect(capacityLabel(null)).toBe('');
    expect(statesLine(['Lagos', 'Ogun'])).toBe('Lagos, Ogun');
    expect(statesLine(['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo'])).toBe('Lagos, Ogun, Oyo +2 more');
  });

  it('links each kind to its own page', () => {
    expect(servicePath({ kind: 'towing', uuid: 'a' })).toBe('/towing/a');
    expect(servicePath({ kind: 'hauler', uuid: 'b' })).toBe('/car-haulers/b');
  });
});

describe('browsing queries', () => {
  it('asks for available towing vans near a point by default', () => {
    expect(Object.fromEntries(url(towingApiQuery(url(''), { lat: 6.123456, lng: 3.5 }))))
      .toEqual({ kind: 'towing', lat: '6.12346', lng: '3.50000', available: '1' });
  });

  it('includes busy vans with all=1 and pages by offset', () => {
    expect(Object.fromEntries(url(towingApiQuery(url('all=1&offset=25'), null)))).toEqual({ kind: 'towing', offset: '25' });
  });

  it('passes hauler filters through and drops bad ones', () => {
    expect(Object.fromEntries(url(haulerApiQuery(url('state=FCT&truck_type=enclosed&cars=3&q=lagos')))))
      .toEqual({ kind: 'hauler', state: 'Abuja', truck_type: 'enclosed', cars: '3', q: 'lagos' });
    expect(Object.fromEntries(url(haulerApiQuery(url('state=Nowhere&truck_type=flying&cars=99'))))).toEqual({ kind: 'hauler' });
  });
});

describe('requests', () => {
  it('needs a pickup; a hauler also needs a drop-off and a sensible number of cars', () => {
    expect(requestProblems({ pickup: null }, 'towing')).toEqual({ pickup: 'Enter where to pick up from.' });
    expect(requestProblems({ pickup: place('Ikeja') }, 'towing')).toEqual({});
    expect(Object.keys(requestProblems({ pickup: place('Ikeja'), dropoff: null, cars: '0', days: '400' }, 'hauler')).sort())
      .toEqual(['cars', 'days', 'dropoff']);
  });

  it('sends a tow request without hauler fields, and positions only when known', () => {
    expect(requestPayload({ pickup: place('Ikeja'), dropoff: { formatted_address: 'Yaba', lat: null, lng: null }, cars: '3', notes: '  burst tyre ' }, 'towing'))
      .toEqual({ pickup_address: 'Ikeja', pickup_lat: 6.5, pickup_lng: 3.3, dropoff_address: 'Yaba', notes: 'burst tyre' });
  });

  it('sends a hauler request with cars, date, days and hours', () => {
    expect(requestPayload({ pickup: place('Lagos'), dropoff: place('Abuja', 9, 7), cars: '4', date: '2026-11-02', days: '2', hours: '' }, 'hauler'))
      .toEqual({
        pickup_address: 'Lagos', pickup_lat: 6.5, pickup_lng: 3.3, dropoff_address: 'Abuja', dropoff_lat: 9, dropoff_lng: 7,
        cars: 4, date: '2026-11-02', days: 2,
      });
  });
});

describe('jobs', () => {
  it('reads the job date as a calendar day', () => {
    expect(jobDateText('2026-11-02')).toBe('Nov 2, 2026');
    expect(jobDateText(null)).toBe('');
  });

  it('lists the trip facts that are set', () => {
    expect(tripFacts({ kind: 'hauler', cars: 3, date: '2026-11-02', days: 2, hours: null, distance_km: '540.0' }))
      .toEqual(['3 cars', 'Nov 2, 2026', '2 days', 'About 540 km']);
    expect(tripFacts({ kind: 'towing', cars: 1 })).toEqual([]);
  });

  it('labels each step', () => {
    expect(jobEventLabel('requested', 'towing')).toBe('Tow requested');
    expect(jobEventLabel('requested', 'hauler')).toBe('Car hauler requested');
    expect(jobEventLabel('fuel')).toBe('Fuel money released');
  });

  it('finds the newest step of each job', () => {
    const messages = [
      { uuid: 'm1', transport_job: { uuid: 'j1' } },
      { uuid: 'm2', text: 'hi' },
      { uuid: 'm3', transport_job: { uuid: 'j1' } },
      { uuid: 'm4', transport_job: { uuid: 'j2' } },
    ];
    expect(latestJobSteps(messages)).toEqual({ j1: 'm3', j2: 'm4' });
  });

  it('sends invoice amounts as whole naira and leaves out an empty fuel amount', () => {
    expect(invoicePayload({ service_amount: '45,000', fuel_amount: '', note: ' ' })).toEqual({ service_amount: '45000' });
    expect(invoicePayload({ service_amount: '45,000', fuel_amount: '5,000', note: 'Lagos' })).toEqual({ service_amount: '45000', fuel_amount: '5000', note: 'Lagos' });
    expect(invoiceProblems({ service_amount: '' })).toHaveProperty('service_amount');
    expect(invoiceProblems({ service_amount: '1' })).toEqual({});
  });
});

describe('the business form', () => {
  it('needs a price per kind, an address and a photo', () => {
    const towing = { ...emptyServiceForm('towing'), title: 'Tow Ikeja', base_address: 'Ikeja' };
    expect(validateServiceForm(towing, 'towing', 1)).toEqual({ callout_fee: 'Set a call-out fee, a price per km, or both.' });
    expect(validateServiceForm({ ...towing, per_km_fee: '500' }, 'towing', 1)).toEqual({});
    const hauler = { ...emptyServiceForm('hauler'), title: 'Carrier', base_address: 'Lagos' };
    expect(Object.keys(validateServiceForm(hauler, 'hauler', 0)).sort()).toEqual(['photos', 'price', 'states']);
  });

  it('reads a listing back into the form', () => {
    const form = serviceToForm({ kind: 'hauler', title: 'Carrier', price: '250000.00', price_unit: 'day', fuel_included: true, truck_type: 'enclosed', capacity: 6, states: ['Lagos'], active: false });
    expect(form).toMatchObject({ title: 'Carrier', price: '250000', fuel_included: true, truck_type: 'enclosed', capacity: '6', states: ['Lagos'], active: false });
  });

  it('builds the multipart body for each kind', () => {
    const towing = serviceFormData({ ...emptyServiceForm('towing'), title: ' Tow ', callout_fee: '15,000', base_lat: 6.5, base_lng: 3.3 }, 'towing',
      [{ uuid: 'p1', removed: true }, { file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }) }]);
    expect(towing.get('title')).toBe('Tow');
    expect(towing.get('callout_fee')).toBe('15000');
    expect(towing.get('available_now')).toBe('true');
    expect(towing.get('remove_photos')).toBe('["p1"]');
    expect(towing.getAll('photos')).toHaveLength(1);
    expect(towing.has('states')).toBe(false);

    const hauler = serviceFormData({ ...emptyServiceForm('hauler'), price: '250,000', states: ['Lagos', 'Abuja'], capacity: '6' }, 'hauler');
    expect(hauler.get('price')).toBe('250000');
    expect(hauler.get('states')).toBe('["Lagos","Abuja"]');
    expect(hauler.get('base_lat')).toBe('');
    expect(hauler.has('callout_fee')).toBe(false);
  });
});

describe('reported problems', () => {
  it('labels the chat step', () => {
    expect(jobEventLabel('problem', 'towing')).toBe('Problem reported');
  });

  it('words the notice for the customer and for the business', () => {
    const problem = { details: 'The car was dropped at the wrong address', reported_on: '2026-10-15T10:00:00Z' };
    expect(jobProblemNotice({ side: 'customer', problem })).toBe('You reported a problem: “The car was dropped at the wrong address”. Motaa is looking into it.');
    expect(jobProblemNotice({ side: 'business', problem })).toBe('The customer reported a problem: “The car was dropped at the wrong address”. Motaa will contact you.');
    expect(jobProblemNotice({ side: 'customer', problem: { details: '' } })).toBe('You reported a problem. Motaa is looking into it.');
    expect(jobProblemNotice({ side: 'customer', problem: null })).toBe('');
    expect(jobProblemNotice(undefined)).toBe('');
  });
});
