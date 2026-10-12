// How many chat messages are waiting for the signed-in user, for the badge on the chat icon.
// Checked when the page opens, every 30 seconds while the tab is visible, when the tab is
// looked at again, and straight after a conversation is read.
import { useContext, useEffect, useState } from 'react';
import { GlobalStore } from '../App';

const CHAT_EVENT = 'motaa:chat-changed';
export const CHAT_REFRESH_MS = 30000;

/** Call after reading or receiving messages so the badge updates without waiting. */
export function announceChatChanged() {
  window.dispatchEvent(new Event(CHAT_EVENT));
}

/**
 * Run `callback` every `ms` while the tab is visible, and once when the tab becomes visible again.
 * Does nothing while the tab is in the background, so an idle tab doesn't keep calling the server.
 */
export function useVisibleInterval(callback, ms, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const run = () => { if (document.visibilityState === 'visible') callback(); };
    const timer = window.setInterval(run, ms);
    document.addEventListener('visibilitychange', run);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', run); };
  // the caller passes a stable callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ms, enabled]);
}

export function useChatUnread() {
  const { api, authUser } = useContext(GlobalStore);
  const [count, setCount] = useState(0);
  const token = authUser?.token;

  useEffect(() => {
    if (!token) { setCount(0); return undefined; }
    let active = true;
    const load = () => {
      if (document.visibilityState !== 'visible') return;
      api.get('/chat/unread/').then((body) => { if (active) setCount(Number(body?.data?.count) || 0); }).catch(() => {});
    };
    load();
    const timer = window.setInterval(load, CHAT_REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    window.addEventListener(CHAT_EVENT, load);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
      window.removeEventListener(CHAT_EVENT, load);
    };
  }, [api, token]);

  return count;
}
