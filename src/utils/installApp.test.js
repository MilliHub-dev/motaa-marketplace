import { describe, expect, it } from 'vitest';
import { dismissInstall, isInstalled, isIos, wasDismissed } from './installApp';

const store = () => { const data = {}; return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }; };

describe('installing the web app', () => {
  it('recognises iPhones and iPads, including iPads that say they are Macs', () => {
    expect(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIos('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 5)).toBe(false);
  });

  it('knows when it is already running as an installed app', () => {
    expect(isInstalled({ matchMedia: () => ({ matches: true }), navigator: {} })).toBe(true);
    expect(isInstalled({ matchMedia: () => ({ matches: false }), navigator: { standalone: true } })).toBe(true);
    expect(isInstalled({ matchMedia: () => ({ matches: false }), navigator: {} })).toBe(false);
  });

  it('stays hidden for two weeks after "Not now", then asks again', () => {
    const storage = store();
    const day = 24 * 60 * 60 * 1000;
    expect(wasDismissed(1000, storage)).toBe(false);
    dismissInstall(1000, storage);
    expect(wasDismissed(1000 + 13 * day, storage)).toBe(true);
    expect(wasDismissed(1000 + 15 * day, storage)).toBe(false);
  });
});
