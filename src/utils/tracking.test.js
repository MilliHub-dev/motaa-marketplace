import { describe, expect, it } from 'vitest';
import {
  WATCH_OPTIONS, liveAgeSeconds, metresBetween, nextPollDelay, positionPayload, sharingErrorMessage, shouldSendPosition, stopsSharing,
  trackingPath, updatedAgoText,
} from './tracking';

const at = (lat, lng, time) => ({ lat, lng, at: time });

describe('sharing a live location', () => {
  it('uses fresh, precise positions', () => {
    expect(WATCH_OPTIONS).toEqual({ enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    expect(trackingPath('booking', 'b 1')).toBe('/tracking/booking/b%201/');
    expect(trackingPath('transport', 'J1')).toBe('/tracking/transport/J1/');
  });

  it('measures metres', () => {
    expect(Math.round(metresBetween({ lat: 9, lng: 7 }, { lat: 9.001, lng: 7 }))).toBe(111);
  });

  it('sends at most every 8 s, or sooner after moving 30 m, never within 2 s', () => {
    const t = 1_000_000;
    expect(shouldSendPosition(null, { lat: 9, lng: 7 }, t)).toBe(true);
    const last = at(9, 7, t);
    expect(shouldSendPosition(last, { lat: 9.00001, lng: 7 }, t + 5000)).toBe(false); // ~1 m, 5 s
    expect(shouldSendPosition(last, { lat: 9.00001, lng: 7 }, t + 8000)).toBe(true); // 8 s
    expect(shouldSendPosition(last, { lat: 9.0005, lng: 7 }, t + 3000)).toBe(true); // ~55 m, 3 s
    expect(shouldSendPosition(last, { lat: 9.0005, lng: 7 }, t + 1500)).toBe(false); // too soon for the server
  });

  it('builds the body from the device position', () => {
    expect(positionPayload({ coords: { latitude: 9.07654321, longitude: 7.39861234, accuracy: 12.6, heading: 91.4, speed: 8.27 } }))
      .toEqual({ lat: 9.076543, lng: 7.398612, accuracy: 13, heading: 91, speed: 8.3 });
    expect(positionPayload({ coords: { latitude: 9, longitude: 7, accuracy: 30, heading: null, speed: NaN } }))
      .toEqual({ lat: 9, lng: 7, accuracy: 30 });
  });

  it('explains errors and knows which ones stop sharing', () => {
    expect(sharingErrorMessage({ code: 1 })).toMatch(/Allow location for motaa.net/);
    expect(sharingErrorMessage({ status: 409 })).toMatch(/can't be tracked any more/);
    expect(stopsSharing({ status: 409 })).toBe(true);
    expect(stopsSharing({ code: 1 })).toBe(true);
    expect(stopsSharing({ status: 0 })).toBe(false);
    expect(stopsSharing({ code: 3 })).toBe(false);
  });
});

describe('following a live location', () => {
  it('polls every poll_seconds and backs off after errors', () => {
    expect(nextPollDelay(10)).toBe(10000);
    expect(nextPollDelay(10, 1)).toBe(20000);
    expect(nextPollDelay(10, 5)).toBe(60000);
    expect(nextPollDelay(undefined)).toBe(10000);
    expect(nextPollDelay(1)).toBe(3000);
  });

  it('ages the position since it was fetched', () => {
    expect(liveAgeSeconds({ age_seconds: 4 }, 1000, 13000)).toBe(16);
    expect(liveAgeSeconds({ updated_at: new Date(50000).toISOString() }, null, 80000)).toBe(30);
    expect(liveAgeSeconds(null, 1000, 2000)).toBeNull();
  });

  it('says how long ago it was updated', () => {
    expect(updatedAgoText(2)).toBe('Updated just now');
    expect(updatedAgoText(12)).toBe('Updated 12 s ago');
    expect(updatedAgoText(185)).toBe('Updated 3 min ago');
    expect(updatedAgoText(7300)).toBe('Updated 2 h ago');
    expect(updatedAgoText(null)).toBe('');
  });
});
