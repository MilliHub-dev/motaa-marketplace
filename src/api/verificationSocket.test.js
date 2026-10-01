import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { watchVerification } from './verificationSocket';
let sockets;
class Socket {
  constructor(url) { this.url = url; sockets.push(this); }
  close = vi.fn();
}
beforeEach(() => { sockets = []; vi.useFakeTimers(); vi.stubGlobal('WebSocket', Socket); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('uses the authenticated private route and refreshes for snapshots and updates', () => {
  const refresh = vi.fn();
  const stop = watchVerification({ url: 'wss://server.test', token: 'a+b', onUpdate: refresh });
  expect(sockets[0].url).toBe('wss://server.test/ws/verification/?token=a%2Bb');
  sockets[0].onmessage({ data: '{bad' });
  sockets[0].onmessage({ data: JSON.stringify({ type: 'other' }) });
  sockets[0].onmessage({ data: JSON.stringify({ type: 'verification.status' }) });
  sockets[0].onmessage({ data: JSON.stringify({ type: 'verification.updated' }) });
  expect(refresh).toHaveBeenCalledTimes(2);
  stop();
  expect(sockets[0].close).toHaveBeenCalled();
});
it('reconnects with backoff and cancels pending retries on unmount', () => {
  const stop = watchVerification({ url: 'wss://server.test', token: 'token', onUpdate: vi.fn() });
  sockets[0].onclose({ code: 1006 });
  vi.advanceTimersByTime(1000);
  expect(sockets).toHaveLength(2);
  sockets[1].onclose({ code: 1006 });
  stop();
  vi.advanceTimersByTime(60000);
  expect(sockets).toHaveLength(2);
});
it('does not retry rejected authentication', () => {
  const stop = watchVerification({ url: 'wss://server.test', token: 'token', onUpdate: vi.fn() });
  sockets[0].onclose({ code: 4403 });
  vi.advanceTimersByTime(60000);
  expect(sockets).toHaveLength(1);
  stop();
});
