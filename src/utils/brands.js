// Colours for sponsored brands: each brand has a main colour (set in the admin); these helpers turn it
// into tints for backgrounds and shades dark enough for white text, whatever colour staff pick.
export const DEFAULT_BRAND_COLOR = '#0065B5';

/** '#0b4a8b' / '#0B4' → [r, g, b], or the default colour's when the value isn't a hex colour. */
export function hexToRgb(hex) {
  let value = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(value)) value = value.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(value)) return hexToRgb(DEFAULT_BRAND_COLOR);
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

const toHex = (rgb) => `#${rgb.map((n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')).join('')}`;

/** Mix `hex` towards `withHex` by `amount` (0 = unchanged, 1 = all `withHex`). */
export function mix(hex, withHex, amount) {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  return toHex(a.map((n, i) => n + (b[i] - n) * amount));
}

export const tint = (hex, amount) => mix(hex, '#ffffff', amount);
export const shade = (hex, amount) => mix(hex, '#0b1220', amount);

/** The brand's colour, or Motaa blue when none (or an invalid one) is set. */
export const brandColor = (brand) => toHex(hexToRgb(brand?.brand_color));
