// Installing the website as an app ("Add to Home screen").
// Chrome, Edge and Samsung Internet offer it through a `beforeinstallprompt` event, which fires
// once, early, so it is captured here as soon as the site loads. Safari on iPhone has no such
// event: people add the site from the Share menu, so they get instructions instead.
const DISMISSED_KEY = 'motaa-install-dismissed';
const ASK_AGAIN_MS = 14 * 24 * 60 * 60 * 1000;
const CHANGE_EVENT = 'motaa:install-change';

let promptEvent = null;
let installed = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // we show our own banner instead of the browser's mini bar
    promptEvent = event;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    promptEvent = null;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  });
}

export const INSTALL_CHANGE_EVENT = CHANGE_EVENT;

/** Already opened from the home screen / as an installed app. */
export function isInstalled(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win) return false;
  return installed || Boolean(win.matchMedia?.('(display-mode: standalone)').matches) || win.navigator?.standalone === true;
}

/** iPhone / iPad browsers, which can only install from the Share menu. */
export function isIos(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '', touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0) {
  return /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}

/** 'prompt' (one-tap install), 'ios' (show the steps) or null (nothing to offer here). */
export function installMethod() {
  if (isInstalled()) return null;
  if (promptEvent) return 'prompt';
  return isIos() ? 'ios' : null;
}

/** Show the browser's install dialog. Resolves true when the person accepted. */
export async function promptInstall() {
  if (!promptEvent) return false;
  const event = promptEvent;
  promptEvent = null; // a prompt can be used once
  event.prompt();
  const choice = await event.userChoice.catch(() => null);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return choice?.outcome === 'accepted';
}

/** "Not now" hides the banner for two weeks. */
export function wasDismissed(now = Date.now(), storage = typeof localStorage !== 'undefined' ? localStorage : undefined) {
  try {
    const at = Number(storage?.getItem(DISMISSED_KEY) || 0);
    return at > 0 && now - at < ASK_AGAIN_MS;
  } catch (e) {
    return false;
  }
}

export function dismissInstall(now = Date.now(), storage = typeof localStorage !== 'undefined' ? localStorage : undefined) {
  try { storage?.setItem(DISMISSED_KEY, String(now)); } catch (e) { /* private mode: it will simply ask again */ }
}
