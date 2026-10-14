// Visitor counting for the admin dashboard: POST /analytics/visit/ {visitor_id, platform, new_session}.
// The pure parts (visitor id, session timing, dedupe) live here; src/hooks/useVisitPing.js wires
// them to the router and sends the ping. A ping never shows errors, never retries and never signs
// anyone out.

export const VISITOR_KEY = 'motaa-visitor-id';
/** Coming back after this long without activity (or with the tab hidden) starts a new session. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;
/** The same path isn't counted twice within this window (e.g. a redirect or a double render). */
export const DEDUPE_MS = 2000;

const ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

/** What the API accepts as a visitor id: 8–100 letters, digits, - or _. */
export function isValidVisitorId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

/** A fresh random id (a UUID when the browser can make one). Never derived from personal data. */
export function newVisitorId(cryptoApi = globalThis.crypto) {
  try {
    if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
    if (typeof cryptoApi?.getRandomValues === 'function') {
      const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fall through to Math.random
  }
  let id = '';
  while (id.length < 32) id += Math.random().toString(36).slice(2);
  return id.slice(0, 32);
}

let memoryId = null;

/**
 * The browser's visitor id, created once and kept in `storage` (localStorage). When storage is
 * unavailable (private mode, blocked site data) the id lives in memory for this page load.
 */
export function getVisitorId(storage = safeLocalStorage(), makeId = newVisitorId) {
  try {
    const stored = storage?.getItem(VISITOR_KEY);
    if (isValidVisitorId(stored)) return stored;
  } catch {
    // storage blocked: use the in-memory id
  }
  if (!isValidVisitorId(memoryId)) memoryId = makeId();
  try {
    storage?.setItem(VISITOR_KEY, memoryId);
  } catch {
    // can't keep it: it lasts for this page load
  }
  return memoryId;
}

/** For tests: forget the in-memory id. */
export function resetMemoryVisitorId() {
  memoryId = null;
}

function safeLocalStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Decides when to ping and whether the ping starts a session.
 *   const tracker = createVisitTracker();
 *   tracker.pageView('/buy', Date.now())  → { new_session: true } | null (deduped)
 *   tracker.activity('/buy', Date.now())  → { new_session: true } after 30+ min idle, else null
 */
export function createVisitTracker({ idleMs = SESSION_IDLE_MS, dedupeMs = DEDUPE_MS } = {}) {
  let lastActive = null;   // last page view or interaction (a hidden tab gets none, so it goes idle)
  let lastPath = null;
  let lastPingAt = -Infinity;

  const expired = (now) => lastActive === null || now - lastActive >= idleMs;

  return {
    /** A route change (or the first load). */
    pageView(path, now) {
      const newSession = expired(now);
      lastActive = now;
      if (!newSession && path === lastPath && now - lastPingAt < dedupeMs) return null;
      lastPath = path;
      lastPingAt = now;
      return { new_session: newSession };
    },
    /** The visitor did something (tab shown, click, key, scroll). Pings only when a new session starts. */
    activity(path, now) {
      if (lastActive === null) return null; // nothing counted yet: the first page view will
      if (!expired(now)) { lastActive = now; return null; }
      return this.pageView(path, now);
    },
  };
}

/** The request body for one ping. */
export function visitBody(visitorId, newSession) {
  return { visitor_id: visitorId, platform: 'web', new_session: Boolean(newSession) };
}
