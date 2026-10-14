// Wallet settings → Wallet PIN: an overview card (status + actions + safety tips) and step-by-step screens to
// create, change or reset the PIN, one entry per step.
//   Create: choose → confirm.  Change: current → new → confirm.  Reset: email code → new → confirm.
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  Check, ChevronLeft, ChevronRight, EyeOff, KeyRound, LockKeyhole, Mail, PhoneOff, ShieldAlert, ShieldCheck, ShieldPlus, Timer,
} from 'lucide-react';
import { GlobalStore } from '../../../App';
import { toApiError } from '../../../api/client';
import { useApiQuery } from '../../../hooks/useApi';
import { ErrorState } from '../../../components/states';
import { PinField } from '../../../components/walletPin';
import { PIN_FLOW_STEPS, PIN_LENGTH, newPinProblem, pinFlowErrorStep, retryAfterSeconds, unlockTime } from '../../../utils/walletPin';

const CODE_LENGTH = 6;
const primaryButton = { bg: 'primary', color: 'white', _hover: { bg: 'secondary' } };

const CHOOSE_HELP = "4 digits you'll remember. Avoid repeated digits and sequences like 1234.";
const COPY = {
  set: {
    heading: 'Create PIN',
    new: { title: 'Choose a PIN', helper: CHOOSE_HELP, label: 'New PIN' },
    confirm: { title: 'Confirm it', helper: 'Enter the same 4 digits again.', label: 'Confirm PIN' },
    success: { title: 'PIN created', text: "You'll use it to approve payments, transfers and withdrawals from your wallet." },
  },
  change: {
    heading: 'Change PIN',
    current: { title: 'Enter your current PIN', helper: "First, let's make sure it's you.", label: 'Current PIN' },
    new: { title: 'Choose a new PIN', helper: CHOOSE_HELP, label: 'New PIN' },
    confirm: { title: 'Confirm your new PIN', helper: 'Enter the same 4 digits again.', label: 'Confirm new PIN' },
    success: { title: 'PIN changed', text: 'Use your new PIN the next time you pay from your wallet.' },
  },
  reset: {
    heading: 'Reset PIN',
    email: { title: 'Check your email', helper: '', label: 'Code from the email' },
    new: { title: 'Choose a new PIN', helper: CHOOSE_HELP, label: 'New PIN' },
    confirm: { title: 'Confirm your new PIN', helper: 'Enter the same 4 digits again.', label: 'Confirm new PIN' },
    success: { title: 'PIN reset', text: 'Your new PIN is ready and your wallet is unlocked.' },
  },
};

const EMPTY = { current: '', email: '', new: '', confirm: '' };

const popIn = keyframes`
  from { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.08); opacity: 1; }
  to { transform: scale(1); }
`;

function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds];
}

/** The create / change / reset screens. Mount it to open; `onClose` to cancel, `onDone` after success. */
export function PinFlowModal({ flow: startFlow, onClose, onDone }) {
  const { api } = useContext(GlobalStore);
  const [flow, setFlow] = useState(startFlow);
  const [step, setStep] = useState(PIN_FLOW_STEPS[startFlow][0]);
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(''); // message when the PIN locked mid-change
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null); // masked email; '' when a code was sent but we don't know where
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useCountdown();
  const fieldRef = useRef(null);
  const doneRef = useRef(null);
  const askedForCode = useRef(false);

  const steps = PIN_FLOW_STEPS[flow];
  const index = steps.indexOf(step);
  const copy = COPY[flow];
  const text = copy[step] || {};
  const success = step === 'success';
  const fieldLength = step === 'email' ? CODE_LENGTH : PIN_LENGTH;
  const value = values[step] || '';

  const set = (patch) => setValues((v) => ({ ...v, ...patch }));
  const goTo = (next, message = '') => { setStep(next); setError(message); };

  const sendCode = useCallback(async () => {
    setSending(true);
    setError('');
    try {
      const body = await api.post('/wallet/pin/reset/', {});
      setSentTo(body?.data?.email || '');
      setWait(60);
    } catch (err) {
      const e = toApiError(err);
      if (e.status === 409) { // no PIN yet: create one instead
        setFlow('set');
        setValues(EMPTY);
        goTo('new', e.message);
        return;
      }
      const seconds = retryAfterSeconds(e);
      if (seconds) { setWait(seconds); setSentTo((current) => current ?? ''); }
      setError(e.message);
    } finally {
      setSending(false);
    }
  }, [api, setWait]);

  // Reset starts by emailing the code
  useEffect(() => {
    if (flow === 'reset' && !askedForCode.current) {
      askedForCode.current = true;
      sendCode();
    }
  }, [flow, sendCode]);

  // the cursor is always in the boxes of the current step (and on "Done" at the end)
  useEffect(() => {
    if (busy) return undefined;
    const timer = setTimeout(() => (success ? doneRef.current : fieldRef.current)?.focus(), 60);
    return () => clearTimeout(timer);
  }, [step, flow, error, busy, success, locked]);

  async function submit(all) {
    setBusy(true);
    setError('');
    try {
      if (flow === 'set') await api.post('/wallet/pin/', { pin: all.new, confirm_pin: all.confirm });
      else if (flow === 'change') await api.post('/wallet/pin/change/', { current_pin: all.current, new_pin: all.new, confirm_pin: all.confirm });
      else await api.post('/wallet/pin/reset/', { code: all.email, new_pin: all.new, confirm_pin: all.confirm });
      setStep('success');
    } catch (err) {
      const next = pinFlowErrorStep(flow, toApiError(err));
      if (next.step === 'locked') {
        setLocked(next.message);
      } else if (next.step === 'switch-set') {
        setFlow('set');
        setValues(EMPTY);
        goTo('new', next.message);
      } else {
        // clear the step we go back to (and a new PIN's confirmation); keep the rest so it can go straight through
        set(next.step === 'new' ? { new: '', confirm: '' } : { [next.step]: '' });
        goTo(next.step, next.message);
      }
    } finally {
      setBusy(false);
    }
  }

  // a valid new PIN and confirmation already entered (coming back to fix the current PIN or the code)
  const pinsReady = (all) => all.new.length === PIN_LENGTH && !newPinProblem(all.new) && all.confirm === all.new;

  function complete(entered) {
    if (busy) return;
    const all = { ...values, [step]: entered };
    setValues(all);
    if (step === 'current' || step === 'email') {
      if (pinsReady(all)) return submit(all);
      return goTo('new');
    }
    if (step === 'new') {
      const problem = newPinProblem(entered);
      if (problem) return setError(problem);
      return goTo('confirm');
    }
    if (step === 'confirm') {
      if (entered !== all.new) {
        set({ new: '', confirm: '' });
        return goTo('new', "The PINs don't match. Choose your new PIN again.");
      }
      return submit(all);
    }
    return undefined;
  }

  function back() {
    if (index <= 0 || busy) return;
    const previous = steps[index - 1];
    set({ [step]: '', [previous]: '', ...(previous === 'new' ? { confirm: '' } : {}) });
    goTo(previous);
  }

  function startReset() {
    setLocked('');
    setValues(EMPTY);
    setFlow('reset');
    goTo('email');
  }

  const helper = step === 'email'
    ? (sending && sentTo === null ? 'Sending a 6-digit code to your email…'
      : sentTo ? `We sent a 6-digit code to ${sentTo}. It expires in 15 minutes.` : 'Enter the 6-digit code we emailed you.')
    : text.helper;

  return (
    <Modal isOpen onClose={() => { if (!busy) onClose(); }} isCentered closeOnOverlayClick={false} size={{ base: 'full', sm: 'md' }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, sm: '2xl' }} mx={{ base: 0, sm: 4 }} overflow="hidden">
        <ModalHeader pb={2} pr={12}>
          <Flex justify="space-between" align="baseline" gap={3} fontSize="sm" fontWeight="600">
            <Text color="gray.700">{copy.heading}</Text>
            {!success && !locked && <Text color="gray.500" fontWeight="500">Step {index + 1} of {steps.length}</Text>}
          </Flex>
          <Progress value={success ? 100 : locked ? 0 : ((index + 1) / steps.length) * 100} size="xs" borderRadius="full" mt={3}
            colorScheme={success ? 'green' : 'blue'} aria-hidden="true" sx={{ '& > div': { transition: 'width 0.3s ease' } }} />
        </ModalHeader>
        <ModalCloseButton aria-label="Close" isDisabled={busy} top={3} />

        <ModalBody py={{ base: 8, sm: 6 }} display="flex" flexDirection="column" justifyContent={{ base: 'center', sm: 'flex-start' }}>
          {locked ? (
            <VStack spacing={5} textAlign="center" py={2}>
              <Flex w={16} h={16} borderRadius="full" bg="red.50" color="red.500" align="center" justify="center">
                <Icon as={LockKeyhole} boxSize={8} aria-hidden="true" />
              </Flex>
              <Heading as="h2" size="md">Your PIN is locked</Heading>
              <Text color="gray.600" role="alert">{locked}</Text>
              <Button {...primaryButton} onClick={startReset}>Reset PIN</Button>
            </VStack>
          ) : success ? (
            <VStack spacing={4} textAlign="center" py={4} role="status">
              <Flex w={20} h={20} borderRadius="full" bg="green.500" color="white" align="center" justify="center"
                boxShadow="0 0 0 10px var(--chakra-colors-green-50)"
                sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: `${popIn} 0.45s ease-out both` } }}>
                <Icon as={Check} boxSize={10} strokeWidth={3} aria-hidden="true" />
              </Flex>
              <Heading as="h2" size="lg" pt={3}>{copy.success.title}</Heading>
              <Text color="gray.600" maxW="320px">{copy.success.text}</Text>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Heading as="h2" size="lg" mb={2}>{text.title}</Heading>
                <Text color="gray.600" minH="1.5em">{helper}</Text>
              </Box>
              <PinField
                key={`${flow}-${step}`}
                ref={fieldRef}
                label={text.label}
                hideLabel
                centered
                size="lg"
                length={fieldLength}
                masked={step !== 'email'}
                autoComplete={step === 'email' ? 'one-time-code' : 'off'}
                value={value}
                onChange={(next) => { set({ [step]: next }); if (error) setError(''); }}
                onComplete={complete}
                error={error}
                isDisabled={busy || (step === 'email' && sending && sentTo === null)}
              />
              {step === 'email' && (
                <Button variant="link" size="sm" color="primary" alignSelf="center" onClick={sendCode} isDisabled={wait > 0 || sending}>
                  {wait > 0 ? `Send a new code in ${wait}s` : sending ? 'Sending…' : 'Send a new code'}
                </Button>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter gap={3} borderTopWidth={1} borderColor="gray.100">
          {success ? (
            <Button ref={doneRef} {...primaryButton} w="full" size="lg" onClick={onDone}>Done</Button>
          ) : (
            <>
              {index > 0 && !locked && (
                <Button variant="ghost" leftIcon={<ChevronLeft size={18} />} onClick={back} isDisabled={busy} mr="auto">Back</Button>
              )}
              <Button variant="ghost" onClick={onClose} isDisabled={busy} ml={index > 0 && !locked ? 0 : 'auto'}>Cancel</Button>
              {!locked && (
                <Button {...primaryButton} onClick={() => complete(value)} isLoading={busy} loadingText="Saving"
                  isDisabled={value.length < fieldLength}>
                  {step === 'confirm' ? 'Save PIN' : 'Continue'}
                </Button>
              )}
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** One settings row: icon tile, title, one line, chevron. The whole row is the button. */
function ActionRow({ icon, title, description, note, onClick, isDisabled, tone = 'default' }) {
  const tile = tone === 'primary' ? { bg: 'primary', color: 'white' } : tone === 'danger' ? { bg: 'red.50', color: 'red.500' } : { bg: 'blue.50', color: 'primary' };
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      display="flex"
      alignItems="center"
      gap={4}
      w="full"
      textAlign="left"
      px={{ base: 4, md: 6 }}
      py={4}
      bg={tone === 'primary' ? 'blue.50' : undefined}
      opacity={isDisabled ? 0.55 : 1}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      transition="background-color 0.15s"
      _hover={isDisabled ? undefined : { bg: tone === 'primary' ? 'blue.100' : 'gray.50' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'primary', outlineOffset: '-2px' }}
    >
      <Flex w="44px" h="44px" borderRadius="xl" align="center" justify="center" flexShrink={0} {...tile}>
        <Icon as={icon} boxSize={5} aria-hidden="true" />
      </Flex>
      <Box as="span" display="block" flex={1} minW={0}>
        <Text as="span" display="block" fontWeight="600" color={tone === 'danger' ? 'red.600' : 'gray.800'}>{title}</Text>
        <Text as="span" display="block" fontSize="sm" color="gray.600">{description}</Text>
        {note && <Text as="span" display="block" fontSize="xs" color="orange.600" mt={1}>{note}</Text>}
      </Box>
      <Icon as={ChevronRight} boxSize={5} color="gray.400" flexShrink={0} aria-hidden="true" />
    </Box>
  );
}

const TIPS = [
  { icon: EyeOff, text: 'Never share your PIN with anyone, not even Motaa staff.' },
  { icon: PhoneOff, text: 'Motaa will never ask for it by call, SMS or email.' },
  { icon: Timer, text: '5 wrong tries locks it for 30 minutes.' },
];

function PinHero({ info }) {
  const { naturalDate } = useContext(GlobalStore);
  const changed = info.changed_at ? new Date(info.changed_at) : null;
  const state = info.locked ? 'locked' : info.has_pin ? 'on' : 'off';
  const badge = { on: ['green', 'On'], off: ['orange', 'Not set'], locked: ['red', 'Locked'] }[state];
  const line = state === 'locked'
    ? `${unlockTime(info.locked_until) ? `Unlocks at ${unlockTime(info.locked_until)}` : 'Locked for 30 minutes'}. Reset it to use your wallet now.`
    : state === 'on'
      ? (changed && !Number.isNaN(changed.getTime()) ? `Last changed ${naturalDate(changed)}` : 'Your wallet payments are protected.')
      : 'Create one to pay, transfer and withdraw from your wallet.';
  return (
    <Flex bgGradient="linear(to-br, #0065B5, #003D70)" color="white" px={{ base: 5, md: 6 }} py={{ base: 5, md: 6 }}
      gap={4} align={{ base: 'start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }}>
      <Flex w={12} h={12} borderRadius="full" bg="whiteAlpha.200" align="center" justify="center" flexShrink={0}>
        <Icon as={state === 'on' ? ShieldCheck : state === 'locked' ? ShieldAlert : ShieldPlus} boxSize={6} aria-hidden="true" />
      </Flex>
      <Box flex={1} minW={0}>
        <HStack spacing={3} flexWrap="wrap">
          <Heading as="h2" size="md" id="wallet-pin-heading" color="white">Wallet PIN</Heading>
          <Badge colorScheme={badge[0]} variant="solid" borderRadius="full" px={2.5} textTransform="none" fontSize="xs">{badge[1]}</Badge>
        </HStack>
        <Text mt={1} color="whiteAlpha.900" fontSize="sm">{line}</Text>
      </Box>
      <HStack spacing={2.5} aria-hidden="true" alignSelf={{ base: 'start', sm: 'center' }}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <Box key={i} w="14px" h="14px" borderRadius="full" borderWidth="2px" borderColor="whiteAlpha.800"
            bg={info.has_pin ? 'white' : 'transparent'} />
        ))}
      </HStack>
    </Flex>
  );
}

/** The Wallet PIN card on the Wallet settings page. */
export function WalletPinSettings() {
  const status = useApiQuery((api, signal) => api.get('/wallet/pin/', { signal }), [], { select: (b) => b?.data || {} });
  const [flow, setFlow] = useState(null); // 'set' | 'change' | 'reset'
  const info = status.data;

  let body;
  if (!info && status.loading) {
    body = <Box p={6}><Skeleton h="72px" borderRadius="lg" mb={4} /><Skeleton h="56px" mb={2} /><Skeleton h="56px" /></Box>;
  } else if (!info && status.error) {
    body = <Box p={4}><ErrorState error={status.error} onRetry={status.reload} /></Box>;
  } else {
    body = (
      <>
        <PinHero info={info} />
        <VStack align="stretch" spacing={0} divider={<Divider />}>
          {!info.has_pin && (
            <ActionRow tone="primary" icon={KeyRound} title="Create your wallet PIN"
              description="You'll need it to pay, transfer and withdraw from your wallet." onClick={() => setFlow('set')} />
          )}
          {info.has_pin && info.locked && (
            <ActionRow tone="danger" icon={Mail} title="Reset PIN" description="We'll email you a code to set a new PIN and unlock your wallet."
              onClick={() => setFlow('reset')} />
          )}
          {info.has_pin && (
            <ActionRow icon={KeyRound} title="Change PIN" description="Use your current PIN to choose a new one"
              isDisabled={info.locked} note={info.locked ? 'Unavailable while your PIN is locked. Reset it instead.' : ''}
              onClick={() => setFlow('change')} />
          )}
          {info.has_pin && !info.locked && (
            <ActionRow icon={Mail} title="Forgot PIN?" description="We'll email you a code to reset it" onClick={() => setFlow('reset')} />
          )}
        </VStack>
        <Box bg="gray.50" borderTopWidth={1} px={{ base: 4, md: 6 }} py={4}>
          <Text fontWeight="600" fontSize="sm" mb={3}>Keep your wallet safe</Text>
          <List spacing={2.5}>
            {TIPS.map((tip) => (
              <ListItem key={tip.text} display="flex" alignItems="start" gap={3} fontSize="sm" color="gray.700">
                <Icon as={tip.icon} boxSize={4} mt={0.5} color="primary" flexShrink={0} aria-hidden="true" />
                <Text as="span">{tip.text}</Text>
              </ListItem>
            ))}
          </List>
        </Box>
      </>
    );
  }

  return (
    <Box as="section" aria-labelledby="wallet-pin-heading" aria-busy={status.loading} borderWidth={1} borderRadius="2xl" overflow="hidden" bg="white">
      {!info && <Heading as="h2" size="md" id="wallet-pin-heading" px={6} pt={5}>Wallet PIN</Heading>}
      {body}
      {flow && (
        <PinFlowModal
          key={flow}
          flow={flow}
          onClose={() => setFlow(null)}
          onDone={() => { setFlow(null); status.reload(); }}
        />
      )}
    </Box>
  );
}
