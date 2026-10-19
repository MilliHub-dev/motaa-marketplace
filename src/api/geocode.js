// Address search goes through the Motaa backend, which asks Google Places (the key stays on the server)
// and falls back to OpenStreetMap. Reverse geocoding (current location → address) uses Photon
// (https://photon.komoot.io, free, no key).
//
// Google bills per "session": keep one session id per search box from the first keystroke until a pick,
// and fetch details only for the suggestion picked (with the same session). Then start a new session.
//
//   const session = newPlacesSession();
//   const suggestions = await searchPlaces('Wuse 2', { session });   // [{ place_id, main, secondary, description, place }]
//   const place = suggestions[0].place || await placeDetails(suggestions[0].place_id, { session, name: suggestions[0].main });
//   const here  = await reversePlace({ lat, lng });                   // one place, or null
import { API_URL, PHOTON_URL } from '../config';

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

async function photonRequest(path, params, signal) {
  const url = new URL(`${PHOTON_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Geocoder responded ${response.status}`);
  return response.json();
}

// ---- address search (Motaa backend → Google Places) ---------------------------------------------------

export const MIN_SEARCH_LENGTH = 3;
export const SEARCH_DEBOUNCE_MS = 400;
const AUTH_STORAGE_KEY = 'motaa-auth-user';

/** A new random id for one search box's typing session (crypto.randomUUID, with a fallback). */
export function newPlacesSession() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* not available (old browser / insecure context) */ }
  const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex(3)}-${hex(12)}`;
}

/** Whether typing `text` should fire a search: at least 3 characters and not the same as the last search. */
export function shouldSearch(text, lastSearched) {
  const value = String(text ?? '').trim();
  return value.length >= MIN_SEARCH_LENGTH && value !== String(lastSearched ?? '').trim();
}

/** A failed address search or lookup. `status` is the HTTP status (0 when it never got an answer). */
export class PlacesError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'PlacesError';
    this.status = status;
  }
}

/** What to tell the user when a search or lookup fails. */
export function placesErrorMessage(error) {
  if (error?.status === 404) return "We couldn't find that place. Try another one.";
  if (error?.status === 429) return 'Too many searches, try again in a bit. You can type the full address instead.';
  return 'Address search is unavailable right now. You can type the full address instead.';
}

function signedInToken() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(AUTH_STORAGE_KEY) || 'null')?.token || '';
  } catch {
    return '';
  }
}

// A plain fetch (not the app's API client): a rejected token must never sign anyone out from an address box.
async function placesRequest(path, params, signal) {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  const send = (token) => fetch(url, {
    signal,
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
  });
  const token = signedInToken();
  let response = await send(token);
  if (response.status === 401 && token) response = await send(''); // stale token: these endpoints are open anyway
  let body = null;
  try { body = await response.json(); } catch { /* not JSON */ }
  if (!response.ok || body?.error === true) {
    throw new PlacesError(body?.message || `Address search responded ${response.status}`, response.status);
  }
  return body?.data;
}

/** One suggestion row: { place_id, main, secondary, description, place (full place or null) }. */
export function toSuggestion(row) {
  if (!row?.place_id && !row?.place) return null;
  const description = String(row.description || row.place?.formatted_address || '').trim();
  const main = String(row.main || '').trim() || description.split(',')[0] || '';
  return {
    place_id: String(row.place_id || row.place?.place_id),
    main,
    secondary: String(row.secondary || '').trim(),
    description: description || main,
    place: row.place && Number.isFinite(Number(row.place.lat)) && Number.isFinite(Number(row.place.lng))
      ? { ...row.place, lat: Number(row.place.lat), lng: Number(row.place.lng) }
      : null,
  };
}

/**
 * Suggestions for what the user typed (≥ 3 characters). `session`: the box's session id.
 * `near` {lat, lng} biases results towards the user. Throws PlacesError (status 429 = too many searches).
 */
export async function searchPlaces(query, { session, near, signal } = {}) {
  const text = String(query || '').trim();
  if (text.length < MIN_SEARCH_LENGTH) return [];
  const data = await placesRequest('/places/search/', {
    q: text, session, lat: near?.lat, lng: near?.lng,
  }, signal);
  const seen = new Set();
  return (Array.isArray(data?.results) ? data.results : [])
    .map(toSuggestion)
    .filter((row) => row && (seen.has(row.place_id) ? false : seen.add(row.place_id)));
}

/** The full place for a picked suggestion, with the same `session` used while typing. 404 → PlacesError. */
export async function placeDetails(placeId, { session, name, signal } = {}) {
  const data = await placesRequest('/places/details/', { place_id: placeId, session, name }, signal);
  const lat = Number(data?.lat);
  const lng = Number(data?.lng);
  if (!data || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new PlacesError("We couldn't find that place. Try another one.", 404);
  }
  return { ...data, lat, lng };
}

// ---- reverse geocoding (Photon) ----------------------------------------------------------------------

/** The address at a point (e.g. the device location); null when nothing is found. */
export async function reversePlace({ lat, lng }, { signal } = {}) {
  const body = await photonRequest('/reverse', { lat, lon: lng, lang: 'en' }, signal);
  const place = toPlace(body?.features?.[0]);
  // keep the exact point the user is at, not the nearest mapped feature
  return place ? { ...place, lat: Number(lat), lng: Number(lng) } : null;
}
