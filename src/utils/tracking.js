// Live tracking of a mechanic or tow truck (server: motaa_backend/tracking/live.py).
//   GET    /tracking/<kind>/<uuid>/   the customer (or the sharer) polls every `poll_seconds`
//   POST   /tracking/<kind>/<uuid>/   the sharer sends {lat, lng, accuracy?, heading?, speed?}
//   DELETE /tracking/<kind>/<uuid>/   the sharer stops
// kind: 'booking' (mechanic booking) or 'transport' (towing / hauling job). Rate limit: 60 requests a minute.

export const SEND_EVERY_MS = 8000; // send at most this often…
export const SEND_IF_MOVED_M = 30; // …or sooner after moving this far
export const SERVER_MIN_GAP_MS = 2000; // the server ignores updates closer than this
export const WATCH_OPTIONS = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 };
export const DEFAULT_POLL_SECONDS = 10;
const MAX_POLL_MS = 60000;

export function trackingPath(kind, uuid) {
  return `/tracking/${kind === 'transport' ? 'transport' : 'booking'}/${encodeURIComponent(uuid)}/`;
}

/** Straight-line distance in metres between two {lat, lng}. */
export function metresBetween(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Whether a new device position should be sent now. `last`: { lat, lng, at } of the last one sent (or null).
 * Every 8 s, or sooner once moved more than 30 m — but never within 2 s (the server would ignore it).
 */
export function shouldSendPosition(last, next, now = Date.now()) {
  if (!last) return true;
  const elapsed = now - last.at;
  if (elapsed >= SEND_EVERY_MS) return true;
  if (elapsed < SERVER_MIN_GAP_MS) return false;
  return metresBetween(last, next) > SEND_IF_MOVED_M;
}

/** The POST body from a GeolocationPosition (heading/speed only when the device knows them). */
export function positionPayload(position) {
  const c = position?.coords || {};
  const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
  const body = { lat: round(c.latitude, 6), lng: round(c.longitude, 6) };
  if (Number.isFinite(c.accuracy)) body.accuracy = Math.round(c.accuracy);
  if (Number.isFinite(c.heading) && c.heading !== null) body.heading = Math.round(c.heading);
  if (Number.isFinite(c.speed) && c.speed !== null) body.speed = round(c.speed, 1);
  return body;
}

/** How long to wait before the next poll: `poll_seconds`, doubling after each failure (at most a minute). */
export function nextPollDelay(pollSeconds, failures = 0) {
  const base = Math.max(3, Number(pollSeconds) || DEFAULT_POLL_SECONDS) * 1000;
  return Math.min(MAX_POLL_MS, base * 2 ** Math.max(0, failures));
}

/** Seconds since the live position was recorded, counting the time since we fetched it. */
export function liveAgeSeconds(live, fetchedAt, now = Date.now()) {
  if (!live) return null;
  const base = Number(live.age_seconds);
  if (Number.isFinite(base) && fetchedAt) return Math.max(0, Math.round(base + (now - fetchedAt) / 1000));
  const at = live.updated_at ? new Date(live.updated_at).getTime() : NaN;
  return Number.isFinite(at) ? Math.max(0, Math.round((now - at) / 1000)) : null;
}

/** "Updated just now" / "Updated 12 s ago" / "Updated 3 min ago" / "Updated 2 h ago". */
export function updatedAgoText(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return '';
  const s = Math.max(0, Math.round(Number(seconds)));
  if (s < 5) return 'Updated just now';
  if (s < 60) return `Updated ${s} s ago`;
  if (s < 3600) return `Updated ${Math.floor(s / 60)} min ago`;
  return `Updated ${Math.floor(s / 3600)} h ago`;
}

/** Friendly words for a failed share: a geolocation error ({code}) or a refused POST ({status}). */
export function sharingErrorMessage(error) {
  if (error?.code === 1) return 'Location is blocked. Allow location for motaa.net in your browser settings, then try again.';
  if (error?.code === 2) return "Your device can't find its location right now. Check that location (GPS) is on.";
  if (error?.code === 3) return 'Finding your location is taking a while. Stay where you have a clear view of the sky.';
  if (error?.status === 409) return "This job can't be tracked any more, so sharing has stopped.";
  if (error?.status === 403 || error?.status === 404) return "You can't share your location for this job.";
  if (error?.status === 429) return 'Too many updates. Sharing continues more slowly.';
  return error?.message || "We couldn't send your location. We'll keep trying.";
}

/** Errors that end sharing (the job moved on, or this account can't share). */
export function stopsSharing(error) {
  return [403, 404, 409].includes(error?.status) || error?.code === 1;
}
