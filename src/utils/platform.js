// iPhone / iPod, plus iPadOS 13+ which reports itself as "MacIntel" with touch.
export const isIOS = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
})();

// The glass look is on for iOS. `?glass=1` / `?glass=0` forces it on or off
// (remembered for the session) so it can be previewed on desktop.
export const glassEnabled = (() => {
  try {
    const param = new URLSearchParams(window.location.search).get('glass');
    if (param === '1' || param === '0') sessionStorage.setItem('motaa-glass', param);
    const saved = sessionStorage.getItem('motaa-glass');
    if (saved) return saved === '1';
  } catch (e) {
    // storage can be unavailable (private mode); fall back to detection
  }
  return isIOS;
})();
