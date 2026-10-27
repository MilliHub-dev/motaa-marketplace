// Push notifications for the website (installed on a phone's home screen, or in a desktop browser).
//   GET    /accounts/web-push/  → {enabled, public_key, subscribed: [endpoint…]}
//   POST   /accounts/web-push/  {subscription, device}
//   DELETE /accounts/web-push/  {endpoint}            (on log out, while the token still works)
// The service worker (public/sw.js) shows the notifications and opens the page when one is tapped.
import { isInstalled, isIos } from './installApp';

export { isInstalled, isIos };

const ENDPOINT = '/accounts/web-push/';
const SW_URL = '/sw.js';

const globals = () => ({
  navigator: typeof navigator !== 'undefined' ? navigator : undefined,
  window: typeof window !== 'undefined' ? window : undefined,
  Notification: typeof Notification !== 'undefined' ? Notification : undefined,
});

/** The VAPID public key (base64url) → the Uint8Array pushManager.subscribe() wants. */
export function urlBase64ToUint8Array(base64) {
  const text = String(base64 || '').trim();
  const padded = (text + '='.repeat((4 - (text.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** True when the subscription was made with this server key (it changes if the server's keys are rotated). */
export function keyMatches(subscription, publicKey) {
  const current = subscription?.options?.applicationServerKey;
  if (!current || !publicKey) return true; // can't tell: keep it
  const a = new Uint8Array(current);
  const b = urlBase64ToUint8Array(publicKey);
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

/** This browser can do web push (a service worker, the Push API and notifications). */
export function supported(env = globals()) {
  return Boolean(env.navigator && 'serviceWorker' in env.navigator && env.window && 'PushManager' in env.window && env.Notification);
}

/**
 * The switch's state, from what the browser and the server say:
 * 'unsupported' | 'needs-install' (iPhone, not added to the home screen) | 'disabled-by-server' | 'denied' | 'off' | 'on'
 */
export function computeStatus({ ios, installed, isSupported, serverEnabled, permission, subscribed }) {
  if (ios && !installed) return 'needs-install'; // Safari only allows push for sites added to the home screen
  if (!isSupported) return 'unsupported';
  if (serverEnabled === false) return 'disabled-by-server';
  if (permission === 'denied') return 'denied';
  return permission === 'granted' && subscribed ? 'on' : 'off';
}

/** "iPhone (installed)", "Android (installed)", "Chrome on Windows"… for the list of devices on the server. */
export function deviceName(env = globals()) {
  const ua = env.navigator?.userAgent || '';
  const installed = isInstalled(env.window);
  if (isIos(ua, env.navigator?.maxTouchPoints)) return /iPad|Macintosh/.test(ua) ? `iPad${installed ? ' (installed)' : ''}` : `iPhone${installed ? ' (installed)' : ''}`;
  if (/Android/i.test(ua)) return `Android${installed ? ' (installed)' : ''}`;
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : '';
  return `${browser}${os ? ` on ${os}` : ''}${installed ? ' (installed)' : ''}`;
}

/** Register /sw.js (on app start in production; again on demand when turning notifications on). */
export async function registerServiceWorker(env = globals()) {
  if (!env.navigator || !('serviceWorker' in env.navigator)) return null;
  try {
    return await env.navigator.serviceWorker.register(SW_URL, { scope: '/' });
  } catch {
    return null;
  }
}

async function registration(env) {
  const sw = env.navigator?.serviceWorker;
  if (!sw) return null;
  return (await sw.getRegistration('/').catch(() => null)) || registerServiceWorker(env);
}

async function currentSubscription(env) {
  const reg = await registration(env);
  return reg ? reg.pushManager.getSubscription().catch(() => null) : null;
}

let serverConfig = null; // the last GET, so a tap can go straight to the permission prompt

/** GET /accounts/web-push/ → {enabled, public_key, subscribed}. */
export async function fetchConfig(api) {
  const body = await api.get(ENDPOINT);
  serverConfig = body?.data || { enabled: false };
  return serverConfig;
}

/** Where notifications stand on this device (see computeStatus). */
export async function status(api, env = globals()) {
  const ios = isIos(env.navigator?.userAgent || '', env.navigator?.maxTouchPoints);
  const installed = isInstalled(env.window);
  const isSupported = supported(env);
  if ((ios && !installed) || !isSupported) return computeStatus({ ios, installed, isSupported });
  let config;
  try { config = await fetchConfig(api); } catch { config = { enabled: false }; }
  const permission = env.Notification.permission;
  const subscription = config.enabled && permission === 'granted' ? await currentSubscription(env) : null;
  return computeStatus({ ios, installed, isSupported, serverEnabled: Boolean(config.enabled), permission, subscribed: Boolean(subscription) });
}

async function subscribe(api, env, config) {
  const reg = await registration(env);
  if (!reg) throw new Error("This browser can't receive notifications.");
  let subscription = await reg.pushManager.getSubscription();
  if (subscription && !keyMatches(subscription, config.public_key)) {
    await subscription.unsubscribe().catch(() => {});
    subscription = null;
  }
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(config.public_key) });
  }
  await api.post(ENDPOINT, { subscription: subscription.toJSON(), device: deviceName(env) });
  return subscription;
}

/**
 * Turn notifications on. Call it straight from a tap: the permission prompt is asked first (iPhone needs it to come
 * from the tap). → 'on' | 'denied' | 'off'
 */
export async function enable(api, env = globals()) {
  if (!supported(env)) return 'unsupported';
  const permission = await env.Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';
  const config = serverConfig?.enabled ? serverConfig : await fetchConfig(api);
  if (!config.enabled) return 'disabled-by-server';
  await subscribe(api, env, config);
  return 'on';
}

/** Turn notifications off on this device (the browser permission stays). → 'off' */
export async function disable(api, env = globals()) {
  const subscription = await currentSubscription(env);
  if (subscription) {
    await api.delete(ENDPOINT, { data: { endpoint: subscription.endpoint } }).catch(() => {});
    await subscription.unsubscribe().catch(() => {});
  }
  return 'off';
}

/** On app load after logging in: re-send this device's subscription (it may belong to the previous account). */
export async function sync(api, env = globals()) {
  if (!supported(env) || env.Notification.permission !== 'granted') return false;
  const subscription = await currentSubscription(env);
  if (!subscription) return false;
  const config = await fetchConfig(api).catch(() => null);
  if (!config?.enabled) return false;
  await subscribe(api, env, config);
  return true;
}

/** On log out, before the token is cleared: stop sending this account's notifications here (permission stays). */
export async function forget(api, env = globals()) {
  if (!supported(env)) return;
  const subscription = await currentSubscription(env);
  if (subscription) await api.delete(ENDPOINT, { data: { endpoint: subscription.endpoint } }).catch(() => {});
}
