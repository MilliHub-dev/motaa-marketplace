import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeStatus, deviceName, disable, enable, fetchConfig, forget, keyMatches, status, sync, urlBase64ToUint8Array,
} from './webPush';

// a VAPID-style key (base64url, no padding) and another one
const KEY = 'BOrhGhGy0Wd0vFAb1bQnXJKpzLeYLnMx7fJ1bWv2jQ_-Zm1sbl9wdXNoX2tleV8xMjM0NTY3ODkwYWJjZGVmZ2hpams';
const OTHER = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

function fakeSubscription(key = KEY, endpoint = 'https://push.example/abc') {
  return {
    endpoint,
    options: { applicationServerKey: urlBase64ToUint8Array(key).buffer },
    toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }),
    unsubscribe: vi.fn(async () => true),
  };
}

function fakeEnv({ ua = 'Mozilla/5.0 (Linux; Android 14) Chrome/120', standalone = false, permission = 'default', subscription = null, granted = 'granted' } = {}) {
  const pushManager = {
    current: subscription,
    getSubscription: vi.fn(async () => pushManager.current),
    subscribe: vi.fn(async () => { pushManager.current = fakeSubscription(); return pushManager.current; }),
  };
  const reg = { pushManager };
  const Notification = { permission, requestPermission: vi.fn(async () => { Notification.permission = granted; return granted; }) };
  return {
    pushManager,
    navigator: { userAgent: ua, maxTouchPoints: 0, serviceWorker: { getRegistration: vi.fn(async () => reg), register: vi.fn(async () => reg) } },
    window: { PushManager: function PushManager() {}, matchMedia: () => ({ matches: standalone }), navigator: {} },
    Notification,
  };
}

const fakeApi = (config = { enabled: true, public_key: KEY, subscribed: [] }) => ({
  get: vi.fn(async () => ({ error: false, data: config })),
  post: vi.fn(async () => ({ error: false })),
  delete: vi.fn(async () => ({ error: false })),
});

describe('web push: status', () => {
  it('works out the switch state', () => {
    expect(computeStatus({ ios: true, installed: false, isSupported: false })).toBe('needs-install');
    expect(computeStatus({ ios: false, installed: false, isSupported: false })).toBe('unsupported');
    expect(computeStatus({ ios: false, isSupported: true, serverEnabled: false, permission: 'granted' })).toBe('disabled-by-server');
    expect(computeStatus({ ios: false, isSupported: true, serverEnabled: true, permission: 'denied' })).toBe('denied');
    expect(computeStatus({ ios: false, isSupported: true, serverEnabled: true, permission: 'default' })).toBe('off');
    expect(computeStatus({ ios: false, isSupported: true, serverEnabled: true, permission: 'granted', subscribed: false })).toBe('off');
    expect(computeStatus({ ios: true, installed: true, isSupported: true, serverEnabled: true, permission: 'granted', subscribed: true })).toBe('on');
  });

  it('asks iPhones to add the site to the home screen first', async () => {
    const env = fakeEnv({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/604.1' });
    expect(await status(fakeApi(), env)).toBe('needs-install');
    const installed = fakeEnv({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)', standalone: true, permission: 'granted', subscription: fakeSubscription() });
    expect(await status(fakeApi(), installed)).toBe('on');
  });

  it('reads the server switch and the permission', async () => {
    expect(await status(fakeApi({ enabled: false }), fakeEnv({ permission: 'granted' }))).toBe('disabled-by-server');
    expect(await status(fakeApi(), fakeEnv({ permission: 'denied' }))).toBe('denied');
    expect(await status(fakeApi(), fakeEnv({ permission: 'default' }))).toBe('off');
  });
});

describe('web push: keys and devices', () => {
  it('converts the base64url key and compares it with a subscription', () => {
    const bytes = urlBase64ToUint8Array('AQID_-8');
    expect(Array.from(bytes)).toEqual([1, 2, 3, 255, 239]);
    expect(keyMatches(fakeSubscription(KEY), KEY)).toBe(true);
    expect(keyMatches(fakeSubscription(KEY), OTHER)).toBe(false);
  });

  it('names the device', () => {
    expect(deviceName(fakeEnv({ standalone: true }))).toBe('Android (installed)');
    expect(deviceName(fakeEnv({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)', standalone: true }))).toBe('iPhone (installed)');
    expect(deviceName(fakeEnv({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' }))).toBe('Chrome on Windows');
  });
});

describe('web push: turning it on and off', () => {
  beforeEach(() => vi.clearAllMocks());

  it('enable(): asks permission, subscribes with the server key and posts the subscription', async () => {
    const api = fakeApi();
    const env = fakeEnv();
    await fetchConfig(api);
    expect(await enable(api, env)).toBe('on');
    expect(env.Notification.requestPermission).toHaveBeenCalled();
    const options = env.pushManager.subscribe.mock.calls[0][0];
    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey)).toEqual(Array.from(urlBase64ToUint8Array(KEY)));
    expect(api.post).toHaveBeenCalledWith('/accounts/web-push/', { subscription: { endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } }, device: 'Android' });
  });

  it('enable(): stops when the permission is refused', async () => {
    const api = fakeApi();
    const env = fakeEnv({ granted: 'denied' });
    expect(await enable(api, env)).toBe('denied');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('disable(): tells the server and unsubscribes', async () => {
    const subscription = fakeSubscription();
    const api = fakeApi();
    expect(await disable(api, fakeEnv({ permission: 'granted', subscription }))).toBe('off');
    expect(api.delete).toHaveBeenCalledWith('/accounts/web-push/', { data: { endpoint: 'https://push.example/abc' } });
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('sync(): re-posts an existing subscription, and re-subscribes when the server key changed', async () => {
    const api = fakeApi();
    const same = fakeEnv({ permission: 'granted', subscription: fakeSubscription(KEY) });
    expect(await sync(api, same)).toBe(true);
    expect(same.pushManager.subscribe).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledTimes(1);

    const old = fakeSubscription(OTHER, 'https://push.example/old');
    const changed = fakeEnv({ permission: 'granted', subscription: old });
    expect(await sync(api, changed)).toBe(true);
    expect(old.unsubscribe).toHaveBeenCalled();
    expect(changed.pushManager.subscribe).toHaveBeenCalled();

    expect(await sync(api, fakeEnv({ permission: 'default' }))).toBe(false);
    expect(await sync(api, fakeEnv({ permission: 'granted', subscription: null }))).toBe(false);
  });

  it('forget(): removes the endpoint on log out but keeps the subscription', async () => {
    const subscription = fakeSubscription();
    const api = fakeApi();
    await forget(api, fakeEnv({ permission: 'granted', subscription }));
    expect(api.delete).toHaveBeenCalledWith('/accounts/web-push/', { data: { endpoint: 'https://push.example/abc' } });
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
  });
});
