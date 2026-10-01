import { useContext, useEffect, useRef } from 'react';
import { GlobalStore } from '../App';
import { WS_URL } from '../config';
import { watchVerification } from '../api/verificationSocket';

/** Reconnect snapshots and pending-state polling recover missed broadcasts. */
export function useVerificationUpdates({ onUpdate, pending = false }) {
  const { authUser } = useContext(GlobalStore);
  const token = authUser?.token;
  const callback = useRef(onUpdate);
  callback.current = onUpdate;

  useEffect(() => {
    if (!token) return undefined;
    return watchVerification({ url: WS_URL, token, onUpdate: () => callback.current() });
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const refresh = () => callback.current();
    window.addEventListener('focus', refresh);
    const timer = pending ? window.setInterval(refresh, 30000) : null;
    return () => {
      window.removeEventListener('focus', refresh);
      if (timer) window.clearInterval(timer);
    };
  }, [token, pending]);
}
