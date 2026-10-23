import { describe, expect, it } from 'vitest';
import {
  PRECISE_POSITION, accuracyNote, geolocationMessage, hasPin, locationErrors, locationPayload, locationToForm, placeToLocation,
} from './location';

describe('business location', () => {
  it('knows a usable pin', () => {
    expect(hasPin({ lat: 9.0765, lng: 7.3986 })).toBe(true);
    expect(hasPin({ lat: '9.07', lng: '7.39' })).toBe(true);
    expect(hasPin({ lat: null, lng: 7.3 })).toBe(false);
    expect(hasPin({ lat: 0, lng: 0 })).toBe(false);
    expect(hasPin({ lat: 95, lng: 7 })).toBe(false);
    expect(hasPin(undefined)).toBe(false);
  });

  it('reads the saved location into the form', () => {
    expect(locationToForm({ address: 'Apo Mechanic Village', city: 'Abuja', state: 'FCT', lat: '8.99', lng: '7.50', has_pin: true }))
      .toEqual({ address: 'Apo Mechanic Village', city: 'Abuja', state: 'FCT', lat: 8.99, lng: 7.5, place_id: '' });
    expect(locationToForm({ address: '', lat: null, lng: null, has_pin: false })).toMatchObject({ lat: null, lng: null });
  });

  it('takes a picked place, or keeps the exact GPS point with its address text', () => {
    const place = { place_id: 'g1', formatted_address: 'Wuse 2, Abuja', city: 'Abuja', state: 'FCT', lat: 9.08, lng: 7.47 };
    expect(placeToLocation(place)).toEqual({ address: 'Wuse 2, Abuja', city: 'Abuja', state: 'FCT', lat: 9.08, lng: 7.47, place_id: 'g1' });
    expect(placeToLocation(place, { lat: 9.081234, lng: 7.471234 })).toMatchObject({ lat: 9.081234, lng: 7.471234, place_id: '' });
  });

  it('will not save without an address and a pin', () => {
    expect(locationErrors({ address: ' ', lat: null, lng: null })).toEqual({
      address: 'Enter your business address',
      lat: 'Set your pin: search your address, or use your current location at the workshop.',
    });
    expect(locationErrors({ address: 'Wuse 2', lat: 9, lng: 7 })).toEqual({ address: '', lat: '' });
  });

  it('builds the request body', () => {
    expect(locationPayload({ address: ' Wuse 2 ', city: '', state: 'FCT', lat: 9.0812345678, lng: 7.47, place_id: '' }))
      .toEqual({ address: 'Wuse 2', city: undefined, state: 'FCT', lat: 9.081235, lng: 7.47, place_id: undefined });
  });

  it('warns about a rough position and explains location errors', () => {
    expect(PRECISE_POSITION).toEqual({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    expect(accuracyNote(25)).toBe('');
    expect(accuracyNote(1450.4)).toBe('Your location is only accurate to about 1,450 m. Drag the pin onto your workshop, or try again outside.');
    expect(geolocationMessage({ code: 1 })).toMatch(/blocked/);
    expect(geolocationMessage({ code: 3 })).toMatch(/too long/);
    expect(geolocationMessage({ code: 2 })).toMatch(/couldn't find/);
  });
});
