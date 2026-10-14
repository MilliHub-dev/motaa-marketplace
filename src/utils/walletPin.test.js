import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import {
  PIN_FLOW_STEPS, PIN_LENGTH, cleanPin, firstPinStep, lockedUntilText, newPinErrors, newPinProblem, pinErrorCode, pinErrorStep,
  pinFlowErrorStep, retryAfterSeconds, unlockTime,
} from './walletPin';

const forbidden = (data) => new ApiError(data.message || 'x', { status: 403, data: { error: true, ...data } });

describe('cleanPin', () => {
  it('keeps digits only, at most 4', () => {
    expect(PIN_LENGTH).toBe(4);
    expect(cleanPin('12a3')).toBe('123');
    expect(cleanPin(' 12 34 5')).toBe('1234');
    expect(cleanPin('••7')).toBe('7');
    expect(cleanPin(null)).toBe('');
  });
});

describe('new PIN rules (same as the server)', () => {
  it('needs exactly 4 digits', () => {
    expect(newPinProblem('123')).toBe('Your PIN must be exactly 4 digits.');
    expect(newPinProblem('12345')).toBe('Your PIN must be exactly 4 digits.');
    expect(newPinProblem('12a4')).toBe('Your PIN must be exactly 4 digits.');
    expect(newPinProblem('')).toBe('Your PIN must be exactly 4 digits.');
  });

  it('refuses repeated digits and sequences', () => {
    for (const pin of ['0000', '7777', '1234', '4321', '0123', '9876', '3210']) {
      expect(newPinProblem(pin)).toMatch(/too easy/);
    }
  });

  it('accepts other PINs', () => {
    for (const pin of ['2580', '1357', '0912', '1123']) expect(newPinProblem(pin)).toBe('');
  });

  it('checks the confirmation once it is complete', () => {
    expect(newPinErrors('2580', '')).toEqual({ pin: '', confirm: '' });
    expect(newPinErrors('2580', '25')).toEqual({ pin: '', confirm: '' });
    expect(newPinErrors('2580', '2581')).toEqual({ pin: '', confirm: "The PINs don't match." });
    expect(newPinErrors('2580', '2580')).toEqual({ pin: '', confirm: '' });
    expect(newPinErrors('1111', '1111').pin).toMatch(/too easy/);
  });
});

describe('PIN errors from a payment', () => {
  it('reads the code of a 403 PIN answer only', () => {
    expect(pinErrorCode(forbidden({ code: 'pin_incorrect' }))).toBe('pin_incorrect');
    expect(pinErrorCode(forbidden({ code: 'something_else' }))).toBe('');
    expect(pinErrorCode(new ApiError('Insufficient funds', { status: 402, data: { code: 'pin_incorrect' } }))).toBe('');
    expect(pinErrorCode(new ApiError('offline', { kind: 'network' }))).toBe('');
    expect(pinErrorCode(undefined)).toBe('');
  });

  it('keeps the prompt open on a wrong PIN, with the server message', () => {
    const error = forbidden({ code: 'pin_incorrect', message: 'That PIN is incorrect. 3 tries left before it locks.', attempts_left: 3 });
    expect(pinErrorStep(error)).toEqual({ step: 'enter', message: 'That PIN is incorrect. 3 tries left before it locks.' });
    expect(pinErrorStep(forbidden({ code: 'pin_required' }))).toEqual({ step: 'enter', message: 'Enter your 4-digit wallet PIN to continue.' });
  });

  it('asks to create a PIN when none is set, and offers a reset when locked', () => {
    expect(pinErrorStep(forbidden({ code: 'pin_not_set', message: 'Set a PIN.' }))).toEqual({ step: 'create', message: 'Set a PIN.' });
    expect(pinErrorStep(forbidden({ code: 'pin_locked', message: 'Locked.', locked_until: '2026-01-01T10:00:00Z' })).step).toBe('locked');
  });

  it('falls back to plain words when the server sent no message', () => {
    const error = new ApiError('', { status: 403, data: { code: 'pin_locked' } });
    expect(pinErrorStep(error).message).toMatch(/locked/);
  });

  it('leaves every other error to the caller', () => {
    expect(pinErrorStep(new ApiError('Your wallet balance is too low.', { status: 402, data: {} }))).toBeNull();
    expect(pinErrorStep(new ApiError("You don't have permission to do that.", { status: 403, data: {} }))).toBeNull();
  });
});

describe('the first step of the prompt', () => {
  it('follows GET /wallet/pin/', () => {
    expect(firstPinStep({ has_pin: false })).toBe('create');
    expect(firstPinStep(undefined)).toBe('create');
    expect(firstPinStep({ has_pin: true, locked: false })).toBe('enter');
    expect(firstPinStep({ has_pin: true, locked: true })).toBe('locked');
  });
});

describe('forgot PIN', () => {
  it('reads the wait before another code from a 429', () => {
    expect(retryAfterSeconds(new ApiError('wait', { status: 429, data: { retry_after: 42 } }))).toBe(42);
    expect(retryAfterSeconds(new ApiError('wait', { status: 429, data: { retry_after: 4.2 } }))).toBe(5);
    expect(retryAfterSeconds(new ApiError('wait', { status: 429, data: {} }))).toBe(0);
    expect(retryAfterSeconds(new ApiError('bad', { status: 400, data: { retry_after: 10 } }))).toBe(0);
  });

  it('says until when a PIN is locked', () => {
    expect(lockedUntilText('2026-01-01T15:45:00', 'en-US')).toBe('until 3:45 PM');
    expect(lockedUntilText(null)).toBe('');
    expect(lockedUntilText('not a date')).toBe('');
  });
});

describe('the PIN screens in Wallet settings', () => {
  it('has one entry per step', () => {
    expect(PIN_FLOW_STEPS.change).toEqual(['current', 'new', 'confirm']);
    expect(PIN_FLOW_STEPS.set).toEqual(['new', 'confirm']);
    expect(PIN_FLOW_STEPS.reset).toEqual(['email', 'new', 'confirm']);
  });

  it('says when a locked PIN unlocks', () => {
    expect(unlockTime('2026-01-01T15:45:00', 'en-US')).toBe('3:45 pm');
    expect(unlockTime('')).toBe('');
  });

  it('sends a wrong current PIN back to the first step, and a lock to the reset offer', () => {
    const wrong = forbidden({ code: 'pin_incorrect', message: 'That PIN is incorrect. 4 tries left before it locks.' });
    expect(pinFlowErrorStep('change', wrong)).toEqual({ step: 'current', message: 'That PIN is incorrect. 4 tries left before it locks.' });
    expect(pinFlowErrorStep('change', forbidden({ code: 'pin_locked', message: 'Locked.' }))).toEqual({ step: 'locked', message: 'Locked.' });
  });

  it('sends a weak or mismatched new PIN back to "Choose a new PIN"', () => {
    const weak = new ApiError('Too easy.', { status: 400, data: { details: { new_pin: ['Too easy.'] } } });
    expect(pinFlowErrorStep('change', weak)).toEqual({ step: 'new', message: 'Too easy.' });
    const first = new ApiError('Bad PIN', { status: 400, data: { details: { pin: ['Bad PIN'] } } });
    expect(pinFlowErrorStep('set', first)).toEqual({ step: 'new', message: 'Bad PIN' });
  });

  it('sends a wrong or expired reset code back to the email step', () => {
    expect(pinFlowErrorStep('reset', new ApiError('That code is incorrect.', { status: 400, data: {} })).step).toBe('email');
    expect(pinFlowErrorStep('reset', new ApiError('That PIN is too easy to guess.', { status: 400, data: {} })).step).toBe('new');
    expect(pinFlowErrorStep('reset', new ApiError('Set one instead.', { status: 409, data: {} })).step).toBe('switch-set');
  });

  it('keeps other errors on the last step', () => {
    expect(pinFlowErrorStep('set', new ApiError('You already have a wallet PIN.', { status: 409, data: {} }))).toEqual({ step: 'confirm', message: 'You already have a wallet PIN.' });
  });
});
