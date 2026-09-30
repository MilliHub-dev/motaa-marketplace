import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client';

function setup() {
  let token;
  const api = createApiClient({ baseURL: 'https://example.test/api', getToken: () => token });
  const adapter = vi.fn(async (config) => ({ data: { value: adapter.mock.calls.length }, status: 200, headers: {}, config }));
  api.http.defaults.adapter = adapter;
  return { api, adapter, setToken: (next) => { token = next; } };
}

afterEach(() => vi.useRealTimers());
describe('opt-in listing cache', () => {
  it('reuses fresh data, separates filters, expires, and bypasses on reload', async () => {
    vi.useFakeTimers();
    const { api, adapter } = setup();
    const config = { cacheTTL: 30000 };
    const first = await api.get('/listings/buy/?summary=1', config);
    expect(await api.get('/listings/buy/?summary=1', config)).toEqual(first);
    expect(adapter).toHaveBeenCalledTimes(1);
    await api.get('/listings/buy/?summary=1&condition=new', config);
    vi.advanceTimersByTime(30001);
    await api.get('/listings/buy/?summary=1', config);
    await api.get('/listings/buy/?summary=1');
    expect(adapter).toHaveBeenCalledTimes(4);
  });
  it('invalidates after writes and account changes', async () => {
    const { api, adapter, setToken } = setup();
    const get = () => api.get('/listings/buy/', { cacheTTL: 30000 });
    await get();
    await api.post('/admin/dealership/listings/', { action: 'unpublish' });
    await get();
    setToken('another-account');
    await get();
    expect(adapter).toHaveBeenCalledTimes(4);
  });
  it('does not cache failures or serve an aborted request', async () => {
    const { api, adapter } = setup();
    adapter.mockRejectedValueOnce(new Error('offline'));
    const config = { cacheTTL: 30000 };
    await expect(api.get('/listings/buy/', config)).rejects.toThrow();
    await api.get('/listings/buy/', config);
    const controller = new AbortController();
    controller.abort();
    await expect(api.get('/listings/buy/', { ...config, signal: controller.signal })).rejects.toMatchObject({ kind: 'cancelled' });
    expect(adapter).toHaveBeenCalledTimes(2);
  });
  it('does not repopulate cache with reads started before a mutation', async () => {
    const { api, adapter } = setup();
    let finish;
    adapter.mockImplementationOnce((config) => new Promise((resolve) => { finish = () => resolve({ data: { stale: true }, status: 200, headers: {}, config }); }));
    const pending = api.get('/listings/buy/', { cacheTTL: 30000 });
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    await api.post('/change/', {});
    finish();
    await pending;
    expect(await api.get('/listings/buy/', { cacheTTL: 30000 })).not.toEqual({ stale: true });
    expect(adapter).toHaveBeenCalledTimes(3);
  });
});
