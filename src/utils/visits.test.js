import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEDUPE_MS, SESSION_IDLE_MS, VISITOR_KEY, createVisitTracker, getVisitorId, isValidVisitorId, newVisitorId,
  resetMemoryVisitorId, visitBody,
} from './visits';

const store = () => { const data = {}; return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }; };
const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

describe('visitor id', () => {
  beforeEach(() => resetMemoryVisitorId());

  it('makes ids the API accepts, with or without crypto', () => {
    expect(isValidVisitorId(newVisitorId())).toBe(true);
    expect(isValidVisitorId(newVisitorId({ getRandomValues: (a) => a.fill(7) }))).toBe(true);
    expect(isValidVisitorId(newVisitorId(null))).toBe(true);
    expect(newVisitorId()).not.toBe(newVisitorId());
  });

  it('rejects ids the API would not accept', () => {
    expect(isValidVisitorId('short')).toBe(false);
    expect(isValidVisitorId('has spaces in it')).toBe(false);
    expect(isValidVisitorId('a'.repeat(101))).toBe(false);
    expect(isValidVisitorId(null)).toBe(false);
    expect(isValidVisitorId('abc-123_XYZ')).toBe(true);
  });

  it('is created once and kept', () => {
    const storage = store();
    const first = getVisitorId(storage);
    expect(storage.data[VISITOR_KEY]).toBe(first);
    resetMemoryVisitorId();
    expect(getVisitorId(storage)).toBe(first);
  });

  it('replaces a stored id that is not valid', () => {
    const storage = store();
    storage.setItem(VISITOR_KEY, 'bad id');
    const id = getVisitorId(storage, () => 'fresh-id-123');
    expect(id).toBe('fresh-id-123');
    expect(storage.data[VISITOR_KEY]).toBe('fresh-id-123');
  });

  it('falls back to one in-memory id when storage is blocked', () => {
    const id = getVisitorId(broken);
    expect(isValidVisitorId(id)).toBe(true);
    expect(getVisitorId(broken)).toBe(id);
    expect(getVisitorId(null)).toBe(id);
  });

  it('builds the request body', () => {
    expect(visitBody('abcdefgh', true)).toEqual({ visitor_id: 'abcdefgh', platform: 'web', new_session: true });
    expect(visitBody('abcdefgh', undefined).new_session).toBe(false);
  });
});

describe('visit tracker', () => {
  it('starts a session on the first page view, then counts page views', () => {
    const t = createVisitTracker();
    expect(t.pageView('/', 1000)).toEqual({ new_session: true });
    expect(t.pageView('/buy', 5000)).toEqual({ new_session: false });
    expect(t.pageView('/rent', 6000)).toEqual({ new_session: false });
  });

  it('does not count the same path twice within the dedupe window', () => {
    const t = createVisitTracker();
    t.pageView('/buy', 0);
    expect(t.pageView('/buy', DEDUPE_MS - 1)).toBeNull();
    expect(t.pageView('/buy', DEDUPE_MS + 10)).toEqual({ new_session: false });
    // a different path is always counted
    expect(t.pageView('/rent', DEDUPE_MS + 20)).toEqual({ new_session: false });
  });

  it('starts a new session on a page view after 30+ minutes idle', () => {
    const t = createVisitTracker();
    t.pageView('/', 0);
    expect(t.pageView('/buy', SESSION_IDLE_MS - 1)).toEqual({ new_session: false });
    expect(t.pageView('/rent', 2 * SESSION_IDLE_MS)).toEqual({ new_session: true });
  });

  it('activity keeps the session alive and only pings when coming back after 30+ minutes', () => {
    const t = createVisitTracker();
    expect(t.activity('/', 0)).toBeNull(); // nothing before the first page view
    t.pageView('/', 0);
    expect(t.activity('/', SESSION_IDLE_MS - 1)).toBeNull();
    // activity moved the idle clock, so this is still the same session
    expect(t.pageView('/buy', 2 * SESSION_IDLE_MS - 10)).toEqual({ new_session: false });
    expect(t.activity('/buy', 3 * SESSION_IDLE_MS)).toEqual({ new_session: true });
    expect(t.activity('/buy', 3 * SESSION_IDLE_MS + 5)).toBeNull();
  });
});
