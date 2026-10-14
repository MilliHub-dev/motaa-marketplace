// Wallet PIN: the 4 digits that approve every payment, transfer and withdrawal from the wallet.
//
//   const { withPin } = useWalletPin();
//   const body = await withPin((pin) => api.post('/wallet/pay/', { order_id, pin }), {
//     title: 'Pay the balance from your wallet', amount: 50000, balance: 80000,
//   });
//
// withPin checks the user has a PIN (and asks them to create one if not), asks for it, and runs the
// request with it. A wrong PIN keeps the prompt open; a locked PIN offers "Reset PIN". It resolves with
// the request's answer, or rejects with the request's other errors (handle them as before) or with a
// cancelled error when the user closes the prompt (`isPinCancelled(error)`: nothing to show).
import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  VStack,
  VisuallyHidden,
} from '@chakra-ui/react';
import { GlobalStore } from '../App';
import { ApiError, toApiError } from '../api/client';
import {
  PIN_LENGTH, cleanPin, firstPinStep, lockedUntilText, newPinErrors, pinErrorStep, retryAfterSeconds,
} from '../utils/walletPin';

/** The error withPin rejects with when the user closes the prompt. */
export function isPinCancelled(error) {
  return error?.kind === 'cancelled';
}

const cancelled = () => new ApiError('Cancelled.', { kind: 'cancelled' });

// ---- the PIN boxes ---------------------------------------------------------------------------------

/**
 * Masked digit boxes over one numeric input (one field for screen readers, the numeric keypad on phones,
 * paste works). The input is plain text with autocomplete off so browsers don't offer to save the PIN.
 * `length`/`masked={false}`/`autoComplete="one-time-code"` make it the 6-digit email code too.
 * `size="lg"` and `centered` for the step-by-step PIN screens; `hideLabel` when a heading already says it.
 */
export const PinField = forwardRef(function PinField(
  {
    label, value, onChange, onComplete, error, helper, isDisabled, autoFocus,
    length = PIN_LENGTH, masked = true, size = 'md', centered = false, hideLabel = false, autoComplete = 'off',
  },
  ref,
) {
  const id = `pin-${useId().replace(/:/g, '')}`;
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);
  const large = size === 'lg';
  const box = length > PIN_LENGTH
    ? { w: { base: '42px', sm: '48px' }, h: { base: '52px', sm: '56px' } }
    : large ? { w: { base: '60px', sm: '64px' }, h: { base: '64px', sm: '68px' } } : { w: { base: '52px', sm: '56px' }, h: '56px' };

  function change(e) {
    const typed = String(e.target.value).replace(/\D/g, '');
    // typing into full boxes starts again with the new digit (e.g. after "too easy to guess")
    const next = value.length === length && typed.length > length ? cleanPin(typed.slice(length), length) : cleanPin(typed, length);
    onChange(next);
    if (next.length === length && next !== value) onComplete?.(next);
  }

  // keep the caret at the end so typing always fills the next box
  function keepCaretAtEnd(e) {
    const el = e.target;
    const end = el.value.length;
    if (el.selectionStart !== end || el.selectionEnd !== end) {
      try { el.setSelectionRange(end, end); } catch { /* not supported */ }
    }
  }

  const labelEl = <FormLabel mb={2} textAlign={centered ? 'center' : undefined} mr={centered ? 0 : undefined}>{label}</FormLabel>;
  return (
    <FormControl id={id} isInvalid={Boolean(error)} isDisabled={isDisabled}>
      {hideLabel ? <VisuallyHidden>{labelEl}</VisuallyHidden> : labelEl}
      <Box position="relative" w="fit-content" mx={centered ? 'auto' : undefined}>
        <HStack spacing={length > PIN_LENGTH ? { base: 2, sm: 2.5 } : 3} aria-hidden="true">
          {Array.from({ length }, (_, i) => (
            <Flex
              key={i}
              {...box}
              align="center"
              justify="center"
              borderWidth="2px"
              borderRadius={large ? 'xl' : 'md'}
              bg={isDisabled ? 'gray.50' : value[i] ? 'blue.50' : 'white'}
              borderColor={error ? 'red.500' : focused && i === active ? 'primary' : value[i] ? 'blue.200' : 'gray.300'}
              boxShadow={focused && i === active ? '0 0 0 3px rgba(0, 101, 181, 0.18)' : undefined}
              fontSize={large ? '2xl' : 'xl'}
              fontWeight="600"
              transition="border-color 0.15s, background-color 0.15s"
            >
              {value[i] && (masked ? <Box w={large ? '14px' : '12px'} h={large ? '14px' : '12px'} borderRadius="full" bg="gray.800" /> : value[i])}
            </Flex>
          ))}
        </HStack>
        <Input
          ref={ref}
          name={`${id}-code`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={autoComplete}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore=""
          data-form-type="other"
          autoFocus={autoFocus}
          value={value}
          onChange={change}
          onSelect={keepCaretAtEnd}
          onFocus={(e) => { setFocused(true); keepCaretAtEnd(e); }}
          onBlur={() => setFocused(false)}
          position="absolute"
          inset={0}
          w="100%"
          h="100%"
          p={0}
          border="none"
          opacity={0}
          fontSize="16px" // below 16px iOS zooms in on focus
          cursor="pointer"
          sx={masked ? { WebkitTextSecurity: 'disc', caretColor: 'transparent' } : { caretColor: 'transparent' }}
          _focusVisible={{ outline: 'none' }}
        />
      </Box>
      {error ? <FormErrorMessage justifyContent={centered ? 'center' : undefined} textAlign={centered ? 'center' : undefined}>{error}</FormErrorMessage>
        : helper ? <FormHelperText textAlign={centered ? 'center' : undefined}>{helper}</FormHelperText> : null}
    </FormControl>
  );
});

/**
 * New PIN + confirm. Moves to the confirm boxes when the PIN is complete, and calls
 * `onComplete(pin, confirm)` when both are filled in and valid.
 */
export function NewPinFields({ pin, confirm, onPinChange, onConfirmChange, onComplete, isDisabled, autoFocus, firstRef, pinLabel = 'New PIN', serverErrors = {} }) {
  const confirmRef = useRef(null);
  const typed = newPinErrors(pin, confirm);
  const pinError = (pin.length === PIN_LENGTH && typed.pin) || serverErrors.pin || '';
  const confirmError = typed.confirm || serverErrors.confirm || '';
  // a complete, valid PIN: move on to the confirm boxes (once they are enabled)
  const pinReady = pin.length === PIN_LENGTH && !typed.pin;
  const wasReady = useRef(pinReady);
  useEffect(() => {
    if (pinReady && !wasReady.current) confirmRef.current?.focus();
    wasReady.current = pinReady;
  }, [pinReady]);

  return (
    <Stack spacing={4}>
      <PinField
        ref={firstRef}
        label={pinLabel}
        value={pin}
        onChange={(next) => { onPinChange(next); if (confirm) onConfirmChange(''); }}
        error={pinError}
        helper="Avoid repeated digits and sequences like 1234."
        isDisabled={isDisabled}
        autoFocus={autoFocus}
      />
      <PinField
        ref={confirmRef}
        label="Confirm PIN"
        value={confirm}
        onChange={onConfirmChange}
        onComplete={(next) => {
          const errors = newPinErrors(pin, next);
          if (!errors.pin && !errors.confirm) onComplete?.(pin, next);
        }}
        error={confirmError}
        isDisabled={isDisabled || Boolean(typed.pin)}
      />
    </Stack>
  );
}

// ---- forgot PIN ------------------------------------------------------------------------------------

function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds];
}

/**
 * Forgot PIN: email a 6-digit code, then code + new PIN. `onDone(newPin, body)` when it's reset.
 * `autoSend` asks for the code straight away (when the user just tapped "Forgot PIN?").
 */
export function PinResetForm({ autoSend = false, onDone, onCancel, onNoPin, cancelLabel = 'Cancel' }) {
  const { api } = useContext(GlobalStore);
  const [sentTo, setSentTo] = useState(null); // masked email, '' when unknown, null before asking
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useCountdown();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const codeRef = useRef(null);
  const autoSent = useRef(false);

  const send = useCallback(async () => {
    setSending(true);
    setError('');
    try {
      const body = await api.post('/wallet/pin/reset/', {});
      setSentTo(body?.data?.email || '');
      setInfo(body?.message || 'We sent you a code.');
      setWait(60);
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (err) {
      const e = toApiError(err);
      if (e.status === 409 && onNoPin) return onNoPin(e.message);
      const seconds = retryAfterSeconds(e);
      if (seconds) {
        setWait(seconds);
        setSentTo((current) => current ?? ''); // a code was sent a moment ago: let them enter it
      }
      setError(e.message);
    } finally {
      setSending(false);
    }
  }, [api, onNoPin, setWait]);

  useEffect(() => {
    if (autoSend && !autoSent.current) {
      autoSent.current = true;
      send();
    }
  }, [autoSend, send]);

  const codeError = submitted && !/^\d{6}$/.test(code) ? 'Enter the 6-digit code from the email.' : '';

  async function submit(e) {
    e?.preventDefault();
    setSubmitted(true);
    const errors = newPinErrors(pin, confirm);
    if (!/^\d{6}$/.test(code) || errors.pin || errors.confirm || confirm.length < PIN_LENGTH) return;
    setSaving(true);
    setError('');
    try {
      const body = await api.post('/wallet/pin/reset/', { code, new_pin: pin, confirm_pin: confirm });
      await onDone?.(pin, body);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  if (sentTo === null) {
    return (
      <VStack align="stretch" spacing={4}>
        <Text>We'll email you a code to set a new PIN.</Text>
        {error && <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>}
        <HStack spacing={3} flexWrap="wrap">
          <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={send} isLoading={sending} loadingText="Sending">
            Email me a code
          </Button>
          {onCancel && <Button variant="ghost" onClick={onCancel} isDisabled={sending}>{cancelLabel}</Button>}
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack as="form" onSubmit={submit} noValidate align="stretch" spacing={4}>
      {info && <Text role="status">{info} It expires in 15 minutes.</Text>}
      {!info && sentTo === '' && <Text>Enter the code we emailed you.</Text>}
      <FormControl isInvalid={Boolean(codeError)} isDisabled={saving}>
        <FormLabel>Code from the email</FormLabel>
        <Input
          ref={codeRef}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxW="200px"
          fontSize="lg"
          letterSpacing="0.2em"
          placeholder="000000"
        />
        <FormErrorMessage>{codeError}</FormErrorMessage>
      </FormControl>
      <Button variant="link" size="sm" color="primary" alignSelf="start" onClick={send} isDisabled={wait > 0 || sending}>
        {wait > 0 ? `Send a new code in ${wait}s` : sending ? 'Sending…' : 'Send a new code'}
      </Button>
      <Divider />
      <NewPinFields pin={pin} confirm={confirm} onPinChange={setPin} onConfirmChange={setConfirm} isDisabled={saving} />
      {error && <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>}
      <HStack spacing={3} flexWrap="wrap">
        <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={saving} loadingText="Saving">
          Reset PIN
        </Button>
        {onCancel && <Button variant="ghost" onClick={onCancel} isDisabled={saving}>{cancelLabel}</Button>}
      </HStack>
    </VStack>
  );
}

// ---- the prompt before a wallet payment --------------------------------------------------------------

const WalletPinContext = createContext({
  withPin: async () => { throw new Error('useWalletPin needs <WalletPinProvider> above it'); },
});

export function useWalletPin() {
  return useContext(WalletPinContext);
}

function lockedMessage(status) {
  const until = lockedUntilText(status?.locked_until);
  return `Your wallet PIN is locked after too many wrong tries. Try again ${until || 'in 30 minutes'}, or reset it.`;
}

/** Amount / balance / custom rows shown above the PIN boxes. */
function Summary({ details }) {
  const { commaInt } = useContext(GlobalStore);
  const rows = details.rows || [
    ...(details.amount !== undefined ? [{ label: 'Amount', value: `₦${commaInt(details.amount)}`, bold: true }] : []),
    ...(details.balance !== undefined && details.balance !== null ? [{ label: 'Wallet balance', value: `₦${commaInt(details.balance)}` }] : []),
  ];
  if (!details.title && !rows.length && !details.note) return null;
  return (
    <Box bg="gray.50" borderRadius="md" p={3}>
      {details.title && <Text fontWeight="600" mb={rows.length ? 2 : 0}>{details.title}</Text>}
      {rows.length > 0 && (
        <VStack align="stretch" spacing={1}>
          {rows.map((row) => (
            <Flex key={row.label} justify="space-between" gap={4} fontSize="sm" fontWeight={row.bold ? 700 : 400}>
              <Text color={row.bold ? undefined : 'gray.600'}>{row.label}</Text>
              <Text textAlign="right">{row.value}</Text>
            </Flex>
          ))}
        </VStack>
      )}
      {details.note && <Text fontSize="sm" color="gray.600" mt={2}>{details.note}</Text>}
    </Box>
  );
}

const TITLES = {
  checking: 'Wallet PIN',
  create: 'Create your wallet PIN',
  enter: 'Enter your wallet PIN',
  locked: 'Wallet PIN locked',
  reset: 'Reset your wallet PIN',
  short: 'Not enough in your wallet',
};

/** Mount once inside GlobalStore: gives every page `useWalletPin().withPin`. */
export function WalletPinProvider({ children }) {
  const { api } = useContext(GlobalStore);
  const requestRef = useRef(null); // { action, resolve, reject }
  const busyRef = useRef(false);
  const pinRef = useRef(null);
  const newPinRef = useRef(null);
  const [step, setStep] = useState(null);
  const [details, setDetails] = useState({});
  const [message, setMessage] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusyState] = useState(false);
  const setBusy = (value) => { busyRef.current = value; setBusyState(value); };

  const close = useCallback(() => {
    requestRef.current = null;
    busyRef.current = false;
    setBusyState(false);
    setStep(null);
    setPin('');
    setConfirm('');
    setMessage('');
  }, []);

  const withPin = useCallback((action, options = {}) => new Promise((resolve, reject) => {
    requestRef.current?.reject(cancelled());
    const request = { action, resolve, reject };
    requestRef.current = request;
    busyRef.current = false;
    setBusyState(false);
    setDetails(options);
    setMessage('');
    setPin('');
    setConfirm('');
    const short = options.amount !== undefined && options.balance !== undefined && options.balance !== null
      && Number(options.balance) < Number(options.amount);
    if (short) { setStep('short'); return; }
    setStep('checking');
    api.get('/wallet/pin/').then((body) => {
      if (requestRef.current !== request) return;
      const status = body?.data;
      const next = firstPinStep(status);
      setStep(next);
      if (next === 'locked') setMessage(lockedMessage(status));
    }).catch((error) => {
      if (requestRef.current !== request) return;
      const e = toApiError(error);
      if (e.isNetworkError || e.isUnauthorized || e.status >= 500) {
        close();
        reject(e);
      } else {
        setStep('enter'); // couldn't check: ask for the PIN, the payment tells us if one is needed
      }
    });
  }), [api, close]);

  const run = useCallback(async (value) => {
    const request = requestRef.current;
    if (!request || busyRef.current) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await request.action(value);
      if (requestRef.current === request) close();
      request.resolve(result);
    } catch (error) {
      const e = toApiError(error);
      const next = pinErrorStep(e);
      if (requestRef.current !== request) { request.reject(e); return; }
      if (!next) {
        close();
        request.reject(e);
        return;
      }
      setBusy(false);
      setPin('');
      setConfirm('');
      setStep(next.step);
      setMessage(next.message);
    }
  }, [close]);

  async function createPin(value, confirmValue) {
    if (busyRef.current) return;
    const errors = newPinErrors(value, confirmValue);
    if (errors.pin || errors.confirm || confirmValue.length < PIN_LENGTH) return;
    setBusy(true);
    setMessage('');
    try {
      await api.post('/wallet/pin/', { pin: value, confirm_pin: confirmValue });
    } catch (error) {
      const e = toApiError(error);
      setBusy(false);
      if (e.status === 409) { // set from somewhere else in the meantime
        setPin('');
        setConfirm('');
        setStep('enter');
        setMessage(e.message);
        return;
      }
      setConfirm('');
      setMessage(e.message);
      return;
    }
    setBusy(false);
    await run(value); // the transaction goes ahead with the new PIN
  }

  function cancel() {
    if (busyRef.current) return;
    const request = requestRef.current;
    close();
    request?.reject(cancelled());
  }

  // put the cursor in the PIN boxes whenever they (re)appear or are cleared after a wrong PIN
  useEffect(() => {
    if (busy) return;
    if (step === 'enter') pinRef.current?.focus();
    if (step === 'create') newPinRef.current?.focus();
  }, [step, message, busy]);

  const submitLabel = details.submitLabel || 'Continue';

  return (
    <WalletPinContext.Provider value={{ withPin }}>
      {children}
      <Modal isOpen={Boolean(step)} onClose={cancel} isCentered closeOnOverlayClick={false} size={{ base: 'full', sm: 'md' }}
        scrollBehavior="inside" initialFocusRef={step === 'enter' ? pinRef : step === 'create' ? newPinRef : undefined}>
        <ModalOverlay />
        <ModalContent borderRadius={{ base: 0, sm: 'lg' }} mx={{ base: 0, sm: 4 }}>
          <ModalHeader pr={12}>{TITLES[step] || TITLES.checking}</ModalHeader>
          <ModalCloseButton aria-label="Close" isDisabled={busy} />
          <ModalBody>
            <VStack align="stretch" spacing={5}>
              {step !== 'reset' && <Summary details={details} />}

              {step === 'checking' && (
                <Flex justify="center" py={6} role="status" aria-label="Checking your wallet PIN"><Spinner color="primary" /></Flex>
              )}

              {step === 'short' && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>Your wallet balance is too low. Top up your wallet or choose another payment method.</AlertDescription>
                </Alert>
              )}

              {step === 'enter' && (
                <Box as="form" onSubmit={(e) => { e.preventDefault(); if (pin.length === PIN_LENGTH) run(pin); }} noValidate>
                  <PinField
                    ref={pinRef}
                    label="Wallet PIN"
                    value={pin}
                    onChange={(next) => { setPin(next); if (message) setMessage(''); }}
                    onComplete={run}
                    error={message}
                    isDisabled={busy}
                  />
                  <Button variant="link" size="sm" color="primary" mt={3} onClick={() => { setMessage(''); setStep('reset'); }} isDisabled={busy}>
                    Forgot PIN?
                  </Button>
                </Box>
              )}

              {step === 'create' && (
                <VStack as="form" align="stretch" spacing={4} noValidate
                  onSubmit={(e) => { e.preventDefault(); createPin(pin, confirm); }}>
                  <Text color="gray.700">You'll use this PIN to approve payments, transfers and withdrawals from your wallet.</Text>
                  {message && <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>{message}</AlertDescription></Alert>}
                  <NewPinFields
                    firstRef={newPinRef}
                    pinLabel="New PIN"
                    pin={pin}
                    confirm={confirm}
                    onPinChange={setPin}
                    onConfirmChange={setConfirm}
                    onComplete={createPin}
                    isDisabled={busy}
                  />
                </VStack>
              )}

              {step === 'locked' && (
                <Alert status="error" borderRadius="md" alignItems="start">
                  <AlertIcon />
                  <AlertDescription>{message || lockedMessage(null)}</AlertDescription>
                </Alert>
              )}

              {step === 'reset' && (
                <PinResetForm
                  autoSend
                  onDone={(newPin) => run(newPin)}
                  onNoPin={(text) => { setMessage(text); setStep('create'); }}
                  onCancel={cancel}
                />
              )}
            </VStack>
          </ModalBody>
          {step !== 'reset' && (
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={cancel} isDisabled={busy}>{step === 'short' || step === 'locked' ? 'Close' : 'Cancel'}</Button>
              {step === 'enter' && (
                <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={() => run(pin)} isLoading={busy}
                  loadingText="Checking" isDisabled={pin.length < PIN_LENGTH}>
                  {submitLabel}
                </Button>
              )}
              {step === 'create' && (
                <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={() => createPin(pin, confirm)} isLoading={busy}
                  loadingText="Saving" isDisabled={confirm.length < PIN_LENGTH}>
                  Set PIN and continue
                </Button>
              )}
              {step === 'locked' && (
                <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={() => { setMessage(''); setStep('reset'); }}>
                  Reset PIN
                </Button>
              )}
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </WalletPinContext.Provider>
  );
}
