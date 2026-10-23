// A business's map pin (GET/POST /accounts/business-location/): distances to customers and the mechanic
// service charge are measured from it.

export const POOR_ACCURACY_METRES = 100;

/** Options for reading the device position while standing at the workshop: fresh and as precise as possible. */
export const PRECISE_POSITION = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

const finite = (value) => {
  const number = Number(value);
  return value !== null && value !== undefined && value !== '' && Number.isFinite(number) ? number : null;
};

/** True for a usable map point ({lat, lng} inside the world, not 0,0). */
export function hasPin(value) {
  const lat = finite(value?.lat);
  const lng = finite(value?.lng);
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}

/** The saved location (GET data) → the form: { address, city, state, lat, lng, place_id }. */
export function locationToForm(data) {
  return {
    address: String(data?.address || ''),
    city: String(data?.city || ''),
    state: String(data?.state || ''),
    lat: finite(data?.lat),
    lng: finite(data?.lng),
    place_id: '',
  };
}

/** A picked search suggestion (or a reverse-geocoded place) → the form fields it sets. */
export function placeToLocation(place, point) {
  const at = point || place;
  return {
    address: String(place?.formatted_address || place?.name || ''),
    city: String(place?.city || ''),
    state: String(place?.state || ''),
    lat: finite(at?.lat),
    lng: finite(at?.lng),
    place_id: point ? '' : String(place?.place_id || ''),
  };
}

/** Problems before saving, as { address, lat } ('' when fine). */
export function locationErrors(form) {
  return {
    address: String(form?.address || '').trim() ? '' : 'Enter your business address',
    lat: hasPin(form) ? '' : 'Set your pin: search your address, or use your current location at the workshop.',
  };
}

/** The POST body (coordinates rounded to ~1 m). */
export function locationPayload(form) {
  const round = (value) => Math.round(Number(value) * 1e6) / 1e6;
  return {
    address: String(form.address || '').trim(),
    city: String(form.city || '').trim() || undefined,
    state: String(form.state || '').trim() || undefined,
    lat: round(form.lat),
    lng: round(form.lng),
    place_id: form.place_id || undefined,
  };
}

/** A warning when the device position is rough (over 100 m), or ''. */
export function accuracyNote(metres) {
  const value = Math.round(Number(metres));
  if (!Number.isFinite(value) || value <= POOR_ACCURACY_METRES) return '';
  return `Your location is only accurate to about ${value.toLocaleString('en-US')} m. Drag the pin onto your workshop, or try again outside.`;
}

/** Friendly words for a failed navigator.geolocation request. */
export function geolocationMessage(error) {
  if (error?.code === 1) return "Location is blocked for this site. Allow it in your browser's settings, or search your address instead.";
  if (error?.code === 3) return "Finding your location took too long. Try again, or search your address instead.";
  return "We couldn't find your location. Try again, or search your address instead.";
}
