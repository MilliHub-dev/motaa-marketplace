// Counts website visits for the admin dashboard (see src/utils/visits.js). Mounted once inside the
// router in App.jsx as <VisitPing />. Fire-and-forget: a plain fetch, so a 401 never reaches the
// API client's sign-out handling and no failure ever shows a toast.
import { useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GlobalStore } from '../App';
import { API_URL } from '../config';
import { createVisitTracker, getVisitorId, visitBody } from '../utils/visits';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
const ACTIVITY_THROTTLE_MS = 15000;

const enabled = () => typeof window !== 'undefined' && typeof fetch === 'function'
  && import.meta.env.MODE !== 'test' && !import.meta.env.VITEST;

function sendVisit(newSession, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    fetch(`${API_URL}/analytics/visit/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(visitBody(getVisitorId(), newSession)),
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  } catch {
    // never let counting get in the way
  }
}

export function useVisitPing() {
  const { pathname } = useLocation();
  const { authUser } = useContext(GlobalStore) || {};
  const trackerRef = useRef(null);
  const tokenRef = useRef(authUser?.token);
  const pathRef = useRef(pathname);
  tokenRef.current = authUser?.token;
  pathRef.current = pathname;

  if (!trackerRef.current) trackerRef.current = createVisitTracker();

  // a page view on the first load and on every route change
  useEffect(() => {
    if (!enabled()) return;
    const ping = trackerRef.current.pageView(pathname, Date.now());
    if (ping) sendVisit(ping.new_session, tokenRef.current);
  }, [pathname]);

  // back after 30+ minutes away or idle → a new session
  useEffect(() => {
    if (!enabled()) return undefined;
    let lastCheck = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastCheck < ACTIVITY_THROTTLE_MS) return;
      lastCheck = now;
      const ping = trackerRef.current.activity(pathRef.current, now);
      if (ping) sendVisit(ping.new_session, tokenRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      lastCheck = 0;
      onActivity();
    };
    document.addEventListener('visibilitychange', onVisibility);
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true, capture: true }));
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity, { capture: true }));
    };
  }, []);
}

/** Renders nothing; counts the visit. */
export function VisitPing() {
  useVisitPing();
  return null;
}
