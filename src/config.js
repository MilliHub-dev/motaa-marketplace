// Every environment-specific value lives here and comes from VITE_* variables.
// See .env.example for what each one does. Anything in this file ships to the
// browser, so only public (publishable) keys belong here — never secret keys.
import { envFlag, isDebug } from './utils';

const env = import.meta.env;

export const IS_DEBUG = isDebug();

// ---- Backend ---------------------------------------------------------------

// Backend REST API, e.g. https://server.motaa.net/api/v1
export const API_URL = (
  env.VITE_API_URL ||
  (IS_DEBUG ? 'http://localhost:8000/api/v1' : 'https://server.motaa.net/api/v1')
).replace(/\/+$/, '');

// Server origin (API_URL without the /api/v1 path) — used for chat sockets and documents.
export const SERVER_ORIGIN = new URL(API_URL).origin;

// Websocket origin for live chat; defaults to the API host (wss:// for https).
export const WS_URL = (
  env.VITE_WS_URL || SERVER_ORIGIN.replace(/^http/, 'ws')
).replace(/\/+$/, '');

// ---- Site switches ---------------------------------------------------------

// When on, logged-out visitors get the "quick pit stop" dialog instead of the
// app (login, signup and the info pages stay reachable). Off unless set to true.
export const MAINTENANCE_MODE = envFlag(env.VITE_MAINTENANCE_MODE, false);

// ---- Third-party public keys -----------------------------------------------

export const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY || '';

// Paystack *public* key (pk_test_... in development). Paystack is the only payment gateway.
export const PAYSTACK_PUBLIC_KEY = env.VITE_PAYSTACK_PUBLIC_KEY || env.VITE_PAYSTACK_LIVE_PUBLIC_KEY || '';

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Dojah KYC widgets, one app/widget per business type.
export const DOJAH = {
  publicKey: env.VITE_DOJAH_PUBLIC_KEY || env.VITE_DOJAH_LIVE_PUBLIC_KEY || '',
  appIds: {
    dealership: env.VITE_DOJAH_DEALER_APP_ID || '',
    mechanic: env.VITE_DOJAH_MECHANIC_APP_ID || '',
  },
  widgetIds: {
    dealership: env.VITE_DOJAH_DEALER_WIDGET_ID || env.VITE_DOJAH_BIZ_DEALER_WIDGET_ID || '',
    mechanic: env.VITE_DOJAH_MECHANIC_WIDGET_ID || '',
  },
};

// Warn once in the console about missing keys so a misconfigured deploy is obvious.
const required = {
  VITE_GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY,
  VITE_PAYSTACK_PUBLIC_KEY: PAYSTACK_PUBLIC_KEY,
  VITE_FIREBASE_API_KEY: FIREBASE_CONFIG.apiKey,
};
const missing = Object.entries(required).filter(([, value]) => !value).map(([name]) => name);
if (missing.length && typeof console !== 'undefined') {
  console.warn(`[motaa] Missing configuration: ${missing.join(', ')}. Copy .env.example to .env and fill these in.`);
}
