/** Account-scoped, read-only verification updates. Returns an unsubscribe function. */
export function watchVerification({ url, token, onUpdate }) {
  let socket;
  let timer;
  let stopped = false;
  let attempts = 0;
  const connect = () => {
    if (stopped) return;
    try {
      socket = new WebSocket(`${url}/ws/verification/?token=${encodeURIComponent(token)}`);
    } catch {
      retry();
      return;
    }
    socket.onopen = () => { attempts = 0; };
    socket.onmessage = ({ data }) => {
      if (stopped) return;
      try {
        const event = JSON.parse(data);
        if (['verification.status', 'verification.updated'].includes(event.type)) onUpdate();
      } catch { /* Ignore malformed/non-verification messages. */ }
    };
    socket.onerror = () => socket.close();
    socket.onclose = ({ code }) => {
      if (![4401, 4403].includes(code)) retry();
    };
  };
  const retry = () => {
    if (stopped) return;
    clearTimeout(timer);
    timer = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)));
  };
  connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
    }
  };
}
