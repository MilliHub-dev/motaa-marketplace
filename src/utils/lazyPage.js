// Route pages are code-split. After a new deploy, a tab that is still running the
// previous build asks for chunk files that no longer exist, and the import fails.
// Reloading picks up the new index.html (and its new chunk names), so do that once
// instead of showing an error screen.
import { lazy } from 'react';

const RELOAD_KEY = 'motaa-new-version-reload';
const RELOAD_COOLDOWN_MS = 10000;

export function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Expected a JavaScript/i.test(message);
}

/** Reload to get the latest build. Returns false when we just did (so a broken server can't cause a loop). */
export function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch (e) {
    // storage unavailable: still reload once
  }
  window.location.reload();
  return true;
}

/** React.lazy that reloads the page (once) when the chunk belongs to an older deploy. */
export function lazyPage(factory) {
  const Page = lazy(() =>
    factory().catch((error) => {
      if (isChunkLoadError(error) && reloadForNewVersion()) {
        return new Promise(() => {}); // keep suspended while the page reloads
      }
      throw error;
    })
  );
  // download the page's code ahead of time (see preloadPages); a failure here is ignored
  // and handled properly when the page is actually opened
  Page.preload = () => factory().catch(() => {});
  return Page;
}

/**
 * Download the code for pages the visitor is likely to open next, once the browser is idle,
 * so opening them doesn't start with a "Loading…" screen. Skipped on data-saver connections.
 */
export function preloadPages(pages) {
  if (typeof window === 'undefined') return () => {};
  const connection = navigator.connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return () => {};
  let cancelled = false;
  const run = () => {
    // one at a time, so this never competes with what the current page is loading
    pages.reduce((chain, page) => chain.then(() => (cancelled ? undefined : page?.preload?.())), Promise.resolve());
  };
  const idle = window.requestIdleCallback
    ? window.requestIdleCallback(run, { timeout: 4000 })
    : window.setTimeout(run, 1500);
  return () => {
    cancelled = true;
    if (window.cancelIdleCallback && window.requestIdleCallback) window.cancelIdleCallback(idle);
    else window.clearTimeout(idle);
  };
}
