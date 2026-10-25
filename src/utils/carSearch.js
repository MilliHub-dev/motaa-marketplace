// Searching cars to buy or to rent (the "Buy / Rent" picker next to the search box).
// The API filters with ?listing_type=sale|rental; without it both are searched.

export const SEARCH_KINDS = [
  { value: 'sale', label: 'Buy' },
  { value: 'rental', label: 'Rent' },
];

/** 'sale' | 'rental' from a URL value (also accepts buy/rent), or '' for both. */
export function searchKind(value) {
  const kind = String(value || '').trim().toLowerCase();
  if (kind === 'sale' || kind === 'buy') return 'sale';
  if (kind === 'rental' || kind === 'rent') return 'rental';
  return '';
}

/** Where a search goes: the results page for some text, or the Buy / Rent pages when nothing was typed. */
export function carSearchPath(text, kind) {
  const find = String(text || '').trim();
  const type = searchKind(kind);
  if (!find) return type === 'rental' ? '/rent' : type === 'sale' ? '/buy' : '/search/cars/';
  const qs = new URLSearchParams({ find });
  if (type) qs.set('listing_type', type);
  return `/search/cars/?${qs.toString()}`;
}
