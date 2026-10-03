import { afterEach, describe, expect, it, vi } from 'vitest';
import { reversePlace, searchPlaces, toPlace } from './geocode';

const feature = (properties, coordinates = [3.47, 6.44]) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates } });
const respond = (features) => vi.fn(async () => ({ ok: true, json: async () => ({ features }) }));

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

  it('searches within Nigeria, drops other countries and duplicates', async () => {
    const fetchMock = respond([
      feature({ osm_id: 1, name: 'Lekki', state: 'Lagos', country: 'Nigeria', countrycode: 'NG' }),
      feature({ osm_id: 2, name: 'Lekki', state: 'Lagos', country: 'Nigeria', countrycode: 'NG' }),
      feature({ osm_id: 3, name: 'Lekki Street', country: 'Ghana', countrycode: 'GH' }),
    ]);
    vi.stubGlobal('fetch', fetchMock);
    const places = await searchPlaces(' Lekki ');
    expect(places.map((p) => p.place_id)).toEqual(['N1']);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/');
    expect(url.searchParams.get('q')).toBe('Lekki');
    expect(url.searchParams.get('bbox')).toBe('2.6,4.2,14.7,13.9');
  });

  it('does not search for very short text, and reports server failures', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchPlaces('a')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(searchPlaces('Abuja')).rejects.toThrow('503');
  });

  it('reverse geocoding keeps the exact point asked for', async () => {
    vi.stubGlobal('fetch', respond([feature({ osm_id: 9, name: 'Wuse 2', state: 'FCT', country: 'Nigeria', countrycode: 'NG' }, [7.48, 9.07])]));
    expect(await reversePlace({ lat: 9.0712, lng: 7.4801 })).toMatchObject({ lat: 9.0712, lng: 7.4801, formatted_address: 'Wuse 2, FCT, Nigeria' });
    vi.stubGlobal('fetch', respond([]));
    expect(await reversePlace({ lat: 0, lng: 0 })).toBeNull();
  });
});
