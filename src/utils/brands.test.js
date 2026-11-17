import { describe, expect, it } from 'vitest';
import { brandColor, hexToRgb, mix, shade, tint } from './brands';

describe('brand colours', () => {
  it('reads hex colours and falls back to Motaa blue', () => {
    expect(hexToRgb('#00AEEF')).toEqual([0, 174, 239]);
    expect(hexToRgb('fff')).toEqual([255, 255, 255]);
    expect(brandColor({ brand_color: 'not a colour' })).toBe('#0065b5');
    expect(brandColor({})).toBe('#0065b5');
  });

  it('mixes towards white and dark', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(tint('#00aeef', 1)).toBe('#ffffff');
    expect(shade('#00aeef', 1)).toBe('#0b1220');
    expect(tint('#00aeef', 0)).toBe('#00aeef');
  });
});
