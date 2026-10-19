import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PlacesError, newPlacesSession, placeDetails, placesErrorMessage, reversePlace, searchPlaces, shouldSearch, toPlace, toSuggestion,
} from './geocode';

const feature = (properties, coordinates = [3.47, 6.44]) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates } });
const respond = (features) => vi.fn(async () => ({ ok: true, json: async () => ({ features }) }));

const memoryStorage = () => {
  const items = new Map();
  return { getItem: (k) => (items.has(k) ? items.get(k) : null), setItem: (k, v) => items.set(k, String(v)), removeItem: (k) => items.delete(k), clear: () => items.clear() };
};

afterEach(() => vi.unstubAllGlobals());

describe('geocode (Photon)', () => {
  it('turns a Photon feature into the app place shape', () => {
    const place = toPlace(feature({ osm_type: 'N', osm_id: 42, name: 'Lekki Phase I', county: 'Eti Osa', state: 'Lagos', country: 'Nigeria', countrycode: 'NG', postcode: '101244' }));
    expect(place).toMatchObject({
      place_id: 'N42', name: 'Lekki Phase I', city: 'Eti Osa', state: 'Lagos', country: 'NG',
      zip_code: '101244', lat: 6.44, lng: 3.47, formatted_address: 'Lekki Phase I, Eti Osa, Lagos, Nigeria',
    });
    expect(toPlace(feature({ housenumber: '12', street: 'Admiralty Way', city: 'Lagos', state: 'Lagos', country: 'Nigeria' })).formatted_address)
      .toBe('12 Admiralty Way, Lagos, Nigeria');
    expect(toPlace({ properties: {}, geometry: {} })).toBeNull();
  });

  it('reverse geocoding keeps the exact point asked for', async () => {
    vi.stubGlobal('fetch', respond([feature({ osm_id: 9, name: 'Wuse 2', state: 'FCT', country: 'Nigeria', countrycode: 'NG' }, [7.48, 9.07])]));
    expect(await reversePlace({ lat: 9.0712, lng: 7.4801 })).toMatchObject({ lat: 9.0712, lng: 7.4801, formatted_address: 'Wuse 2, FCT, Nigeria' });
    vi.stubGlobal('fetch', respond([]));
    expect(await reversePlace({ lat: 0, lng: 0 })).toBeNull();
  });
});

const api = (status, body) => vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }));
const ROWS = [
  { place_id: 'g1', main: 'Wuse 2', secondary: 'Abuja, Federal Capital Territory, Nigeria', description: 'Wuse 2, Abuja, Nigeria', place: null },
  { place_id: 'g1', main: 'Wuse 2 (again)', secondary: '', description: '', place: null },
  { place_id: 'osm-7', main: 'Wuse Market', secondary: 'Abuja', description: 'Wuse Market, Abuja',
    place: { place_id: 'osm-7', name: 'Wuse Market', country: 'NG', state: 'FCT', city: 'Abuja', formatted_address: 'Wuse Market, Abuja', zip_code: '', lat: '9.07', lng: '7.47' } },
];

describe('address search (Motaa backend → Google Places)', () => {
  it('asks the backend with the text and the session, and maps the suggestions', async () => {
    const fetchMock = api(200, { error: false, data: { results: ROWS, source: 'google' } });
    vi.stubGlobal('fetch', fetchMock);
    const results = await searchPlaces('  Wuse 2 ', { session: 's-1', near: { lat: 9.1, lng: 7.4 } });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toMatch(/\/api\/v1\/places\/search\/$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'Wuse 2', session: 's-1', lat: '9.1', lng: '7.4' });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(results).toHaveLength(2); // the duplicate place_id is dropped
    expect(results[0]).toEqual({ place_id: 'g1', main: 'Wuse 2', secondary: 'Abuja, Federal Capital Territory, Nigeria', description: 'Wuse 2, Abuja, Nigeria', place: null });
    expect(results[1].place).toMatchObject({ formatted_address: 'Wuse Market, Abuja', lat: 9.07, lng: 7.47 });
  });

  it('never asks for fewer than 3 characters', async () => {
    const fetchMock = api(200, { data: { results: [] } });
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchPlaces('Wu', { session: 's' })).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the signed-in token, and retries without it when it is rejected (never signs out)', async () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem('motaa-auth-user', JSON.stringify({ token: 'old' }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ detail: 'Invalid token.' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { results: ROWS.slice(0, 1) } }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchPlaces('Wuse', { session: 's' })).toHaveLength(1);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Token old');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
    expect(storage.getItem('motaa-auth-user')).toContain('old');
  });

  it('fetches details for the picked suggestion with the same session', async () => {
    const place = { place_id: 'g1', name: 'Wuse 2', country: 'NG', state: 'FCT', city: 'Abuja', formatted_address: 'Wuse 2, Abuja, Nigeria', zip_code: '904101', lat: 9.08, lng: 7.47 };
    const fetchMock = api(200, { error: false, data: place });
    vi.stubGlobal('fetch', fetchMock);
    expect(await placeDetails('g1', { session: 's-1', name: 'Wuse 2' })).toEqual(place);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toMatch(/\/places\/details\/$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({ place_id: 'g1', session: 's-1', name: 'Wuse 2' });
  });

  it('turns 404 / 429 / offline into friendly messages', async () => {
    vi.stubGlobal('fetch', api(404, { error: true, message: "We couldn't find that place. Try another one." }));
    const missing = await placeDetails('nope', { session: 's' }).catch((e) => e);
    expect(missing).toBeInstanceOf(PlacesError);
    expect(missing.status).toBe(404);
    expect(placesErrorMessage(missing)).toBe("We couldn't find that place. Try another one.");
    vi.stubGlobal('fetch', api(429, { detail: 'Request was throttled.' }));
    const busy = await searchPlaces('Lekki', { session: 's' }).catch((e) => e);
    expect(busy.status).toBe(429);
    expect(placesErrorMessage(busy)).toMatch(/Too many searches.*type the full address/);
    expect(placesErrorMessage(new TypeError('Failed to fetch'))).toMatch(/unavailable.*type the full address/);
  });

  it('maps rows defensively', () => {
    expect(toSuggestion(null)).toBeNull();
    expect(toSuggestion({ place_id: 'x', description: 'Allen Avenue, Ikeja, Lagos' })).toMatchObject({ main: 'Allen Avenue', description: 'Allen Avenue, Ikeja, Lagos', place: null });
  });
});

describe('search sessions', () => {
  it('makes a fresh random id each time, even without crypto.randomUUID', () => {
    const a = newPlacesSession();
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(newPlacesSession()).not.toBe(a);
    vi.stubGlobal('crypto', {});
    const b = newPlacesSession();
    expect(b).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newPlacesSession()).not.toBe(b);
  });

  it('only searches from 3 characters and never the same text twice in a row', () => {
    expect(shouldSearch('Wu', '')).toBe(false);
    expect(shouldSearch('Wus', '')).toBe(true);
    expect(shouldSearch(' Wuse ', 'Wuse')).toBe(false);
    expect(shouldSearch('Wuse 2', 'Wuse')).toBe(true);
  });
});
