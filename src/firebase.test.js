import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ popup: vi.fn(), signOut: vi.fn(), token: vi.fn() }));
vi.mock('./config', () => ({ FIREBASE_CONFIG: { apiKey: 'test', authDomain: 'test.firebaseapp.com', projectId: 'test' } }));
vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/app', () => {
  const auth = Object.assign(() => ({ signInWithPopup: mocks.popup, signOut: mocks.signOut }), {
    GoogleAuthProvider: class { setCustomParameters() {} },
  });
  return { default: { apps: [{}], app: () => ({}), auth } };
});
import { signInWithGoogle, GoogleSignInCancelled } from './firebase';

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  mocks.signOut.mockResolvedValue();
  mocks.token.mockResolvedValue('signed-token');
  mocks.popup.mockResolvedValue({ user: { getIdToken: mocks.token, displayName: 'Ada Lovelace', email: 'ada@example.com' } });
});
afterEach(() => vi.useRealTimers());

describe('Google sign-in', () => {
  it('returns verified credentials and clears its timers', async () => {
    await expect(signInWithGoogle()).resolves.toEqual({ idToken: 'signed-token', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' });
    expect(vi.getTimerCount()).toBe(0);
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
  it('recovers from a popup that never completes and allows another attempt', async () => {
    let resolvePopup;
    mocks.popup.mockImplementationOnce(() => new Promise(resolve => { resolvePopup = resolve; }));
    const pending = expect(signInWithGoogle()).rejects.toThrow('Google sign-in took too long');
    await vi.advanceTimersByTimeAsync(90000);
    await pending;
    resolvePopup({ user: { getIdToken: mocks.token } });
    await Promise.resolve();
    expect(mocks.token).not.toHaveBeenCalled();
    await expect(signInWithGoogle()).resolves.toHaveProperty('idToken', 'signed-token');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('recovers when the token request stalls', async () => {
    mocks.token.mockReturnValue(new Promise(() => {}));
    const pending = expect(signInWithGoogle()).rejects.toThrow('Google could not finish');
    await vi.advanceTimersByTimeAsync(20000);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });
  it('treats closing the popup as cancellation', async () => {
    mocks.popup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    await expect(signInWithGoogle()).rejects.toBeInstanceOf(GoogleSignInCancelled);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('explains a blocked popup', async () => {
    mocks.popup.mockRejectedValue({ code: 'auth/popup-blocked' });
    await expect(signInWithGoogle()).rejects.toThrow('Allow pop-ups');
  });
});
