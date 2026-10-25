import { describe, expect, it } from 'vitest';
import { carSearchPath, searchKind } from './carSearch';

describe('car search kind', () => {
  it('reads buy/rent in any form', () => {
    expect(searchKind('sale')).toBe('sale');
    expect(searchKind('Buy')).toBe('sale');
    expect(searchKind('rent')).toBe('rental');
    expect(searchKind('rental')).toBe('rental');
    expect(searchKind('boats')).toBe('');
    expect(searchKind(null)).toBe('');
  });

  it('builds the search path', () => {
    expect(carSearchPath(' Toyota Camry ', 'sale')).toBe('/search/cars/?find=Toyota+Camry&listing_type=sale');
    expect(carSearchPath('Prado', 'rental')).toBe('/search/cars/?find=Prado&listing_type=rental');
    expect(carSearchPath('Prado', '')).toBe('/search/cars/?find=Prado');
    expect(carSearchPath('', 'rental')).toBe('/rent');
    expect(carSearchPath('  ', 'sale')).toBe('/buy');
  });
});
