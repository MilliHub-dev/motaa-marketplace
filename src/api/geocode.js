// Address search and reverse geocoding with Photon (https://photon.komoot.io),
// an open geocoder built on OpenStreetMap. No API key is needed.
//
//   const places = await searchPlaces('Lekki Phase 1');   // [{ place_id, formatted_address, lat, lng, ... }]
//   const place  = await reversePlace({ lat, lng });       // one place, or null
import { PHOTON_URL } from '../config';

// Roughly Nigeria: [minLon, minLat, maxLon, maxLat]. Keeps suggestions local.
const COUNTRY_BOXES = { ng: [2.6, 4.2, 14.7, 13.9] };

const unique = (parts) => parts.filter((part, i) => part && parts.indexOf(part) === i);

/** A Photon GeoJSON feature → the place shape the app uses everywhere. */
export function toPlace(feature) {
  const p = feature?.properties || {};
  const [lng, lat] = feature?.geometry?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const city = p.city || p.town || p.village || p.county || '';
  const name = p.name || street || city || p.state || '';
  const formatted = unique([p.name, street, p.district || p.locality, city, p.state, p.country]).join(', ');
  return {
    place_id: p.osm_id ? `${p.osm_type || 'N'}${p.osm_id}` : `${lat},${lng}`,
    name,
    country: p.countrycode || '',
    state: p.state || '',
    city,
    formatted_address: formatted || name,
    zip_code: p.postcode || '',
    lat,
    lng,
  };
}

async function request(path, params, signal) {
  const url = new URL(`${PHOTON_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Geocoder responded ${response.status}`);
  return response.json();
}

/** Suggestions for what the user typed. `country` is a 2-letter code ('' for worldwide). */
export async function searchPlaces(query, { country = 'ng', limit = 6, near, signal } = {}) {
  const text = String(query || '').trim();
  if (text.length < 2) return [];
  const code = String(country || '').toLowerCase();
  const box = COUNTRY_BOXES[code];
  const body = await request('/api/', {
    q: text,
    limit: code ? limit * 2 : limit, // room to drop results from other countries
    lang: 'en',
    bbox: box ? box.join(',') : undefined,
    lat: near?.lat,
    lon: near?.lng,
  }, signal);
  const seen = new Set();
  return (body?.features || [])
    .map(toPlace)
    .filter((place) => place && (!code || !place.country || place.country.toLowerCase() === code))
    .filter((place) => (seen.has(place.formatted_address) ? false : seen.add(place.formatted_address)))
    .slice(0, limit);
}

/** The address at a point (e.g. the device location); null when nothing is found. */
export async function reversePlace({ lat, lng }, { signal } = {}) {
  const body = await request('/reverse', { lat, lon: lng, lang: 'en' }, signal);
  const place = toPlace(body?.features?.[0]);
  // keep the exact point the user is at, not the nearest mapped feature
  return place ? { ...place, lat: Number(lat), lng: Number(lng) } : null;
}
