// Towing vans and car haulers: the pieces shared by the customer pages, the chat and the dashboards.
// The server decides every state: buttons come from `job.actions`, wording from `status_label`,
// and every amount (total, commission, what the business receives) from the job itself.
import { useContext, useEffect, useId, useMemo, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, Badge, Box, Button, Divider, Flex, FormControl, FormErrorMessage, FormHelperText,
  FormLabel, HStack, Icon, Image, Input, InputGroup, InputLeftAddon, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Select, SimpleGrid, Skeleton, Stack, Text, Textarea, VStack,
} from '@chakra-ui/react';
import { ArrowRight, CircleAlert, CircleCheck, Clock, Fuel, MapPin, MessageCircle, Phone, Receipt, Truck, Wallet } from 'lucide-react';
import { GlobalStore } from '../App';
import { useApiQuery } from '../hooks/useApi';
import { asList } from '../utils';
import { formatOfferAmount } from '../utils/offers';
import {
  JOB_PROBLEM_MIN_LENGTH, emptyRequestForm, hasFuel, hasInvoice, invoicePayload, invoiceProblems, jobEventLabel, jobProblemNotice, jobStatusColor, requestPayload,
  requestProblems, servicePath, todayInput, tripFacts,
} from '../utils/transport';
import { PageControls } from '.';
import { CustomPlacesAutocomplete } from './maps';
import { ActionDialog } from './parts';
import { PaymentRecoveryNotice, newReference, usePaystack } from './wallet';
import { isPinCancelled, useWalletPin } from './walletPin';
import { ShareLiveLocation, TrackOnMapButton } from './tracking';

// ---------------------------------------------------------------- small pieces

/** A towing van or car hauler photo, or a grey box with a truck when there is none. */
export function TransportPhoto({ src, alt, iconSize = 8, ...props }) {
  const empty = (
    <Flex w="100%" h="100%" align="center" justify="center" bg="gray.100" color="gray.400" role="img" aria-label={`No photo of ${alt}`}>
      <Icon as={Truck} boxSize={iconSize} aria-hidden="true" />
    </Flex>
  );
  return (
    <Box overflow="hidden" bg="gray.100" flexShrink={0} {...props}>
      {src ? <Image src={src} alt={alt} w="100%" h="100%" objectFit="cover" loading="lazy" fallback={empty} /> : empty}
    </Box>
  );
}

/** "Available now" / "Busy right now" for a towing van (from the API's available_now). */
export function AvailableBadge({ available, ...props }) {
  if (available === null || available === undefined) return null;
  return (
    <Badge colorScheme={available ? 'green' : 'gray'} textTransform="none" borderRadius="full" px={2} {...props}>
      {available ? 'Available now' : 'Not available now'}
    </Badge>
  );
}

/** Call and Message buttons for a towing van or hauler's business. Requests and messages need a customer login. */
export function ContactButtons({ business, loginPath, onMessage, size = 'sm', ...props }) {
  const { authUser } = useContext(GlobalStore);
  const isCustomer = authUser?.user_type === 'customer';
  const name = business?.name || 'the business';
  return (
    <Flex gap={2} flexWrap="wrap" {...props}>
      {business?.phone && (
        <Button as="a" href={`tel:${String(business.phone).replace(/\s+/g, '')}`} size={size} variant="outline" leftIcon={<Phone size={14} />}
          aria-label={`Call ${name}`}>
          Call
        </Button>
      )}
      {!authUser ? (
        <Button as={RLink} to={loginPath} size={size} variant="outline" leftIcon={<MessageCircle size={14} />} aria-label={`Log in to message ${name}`}>
          Message
        </Button>
      ) : isCustomer && business?.chat_recipient && (
        <Button size={size} variant="outline" leftIcon={<MessageCircle size={14} />} onClick={onMessage} aria-label={`Message ${name}`}>
          Message
        </Button>
      )}
    </Flex>
  );
}

/**
 * Towing vans keep their phone number private until the customer has paid for a tow with them
 * (`business.phone` is null and `phone_after_booking` true then): say how to reach them instead.
 */
export function PhoneAfterBookingHint({ business, ...props }) {
  if (business?.phone || !business?.phone_after_booking) return null;
  return (
    <HStack spacing={1.5} align="start" fontSize="xs" color="gray.600" {...props}>
      <Icon as={Phone} boxSize={3.5} mt={0.5} flexShrink={0} aria-hidden="true" />
      <Text>Phone number shows after you book. Message them in chat to request a tow.</Text>
    </HStack>
  );
}

/**
 * An address field: suggestions as you type (Photon), or the typed address as it is.
 * `value`: { formatted_address, lat, lng, state } or null.
 */
export function PlaceField({ id, label, value, onChange, error, helper, isRequired, placeholder = 'Search an address' }) {
  return (
    <FormControl isRequired={isRequired} isInvalid={Boolean(error)}>
      <FormLabel htmlFor={id} mb={1}>{label}</FormLabel>
      {/* typing without picking a suggestion still counts: the text is sent without a map position */}
      <Box borderWidth="1px" borderColor={error ? 'red.400' : 'gray.200'} rounded="md"
        onInput={(e) => { if (e.target?.id === id) onChange(e.target.value ? { formatted_address: e.target.value, lat: null, lng: null } : null); }}>
        <CustomPlacesAutocomplete id={id} value={value?.formatted_address || ''} placeholder={placeholder} aria-label={label}
          onPlaceChange={(place) => onChange(place)} />
      </Box>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}

/** A labelled naira field that groups thousands as the user types. */
export function NairaField({ id, label, value, onChange, error, helper, isRequired, isDisabled, autoFocus }) {
  return (
    <FormControl isRequired={isRequired} isInvalid={Boolean(error)} isDisabled={isDisabled}>
      <FormLabel htmlFor={id} mb={1}>{label}</FormLabel>
      <InputGroup>
        <InputLeftAddon>₦</InputLeftAddon>
        <Input id={id} inputMode="numeric" autoComplete="off" placeholder="0" autoFocus={autoFocus}
          value={formatOfferAmount(value)} onChange={(e) => onChange(formatOfferAmount(e.target.value))} />
      </InputGroup>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}

function AmountRow({ label, value, bold, muted, color }) {
  return (
    <Flex justify="space-between" gap={3} fontWeight={bold ? 700 : 500} color={color || (muted ? 'gray.600' : undefined)} fontSize={bold ? 'md' : 'sm'}>
      <Text>{label}</Text>
      <Text textAlign="right" whiteSpace="nowrap">{value}</Text>
    </Flex>
  );
}

/** The invoice: service, fuel, total; the business also sees Motaa's commission and what it receives. */
export function JobAmounts({ job }) {
  const { commaInt } = useContext(GlobalStore);
  if (!hasInvoice(job)) return null;
  const naira = (value) => `₦${commaInt(value)}`;
  const business = job.side === 'business';
  return (
    <Stack spacing={1} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50" data-testid="job-amounts">
      <AmountRow label="Total" value={naira(job.total)} bold />
      <AmountRow label="Service" value={naira(job.service_amount)} muted />
      {hasFuel(job) && <AmountRow label={`of which fuel${job.fuel_released ? ' (released)' : ''}`} value={naira(job.fuel_amount)} muted />}
      {business && job.commission !== null && job.commission !== undefined && (
        <>
          <Divider my={1} />
          <AmountRow label="Motaa commission" value={`− ${naira(job.commission)}`} muted />
          {job.provider_amount !== null && job.provider_amount !== undefined && (
            <AmountRow label="You receive" value={naira(job.provider_amount)} bold color="green.700" />
          )}
        </>
      )}
    </Stack>
  );
}

/** Pickup → drop-off, then cars, date and how long. */
export function JobTrip({ job, compact = false }) {
  const facts = tripFacts(job);
  return (
    <Box fontSize="sm" color="gray.700">
      {job?.pickup_address && (
        <Flex gap={1.5} align="start">
          <Icon as={MapPin} boxSize={4} mt={0.5} color="primary" aria-hidden="true" flexShrink={0} />
          <Text noOfLines={compact ? 1 : undefined} overflowWrap="anywhere">
            <Text as="span" srOnly>From </Text>{job.pickup_address}
          </Text>
        </Flex>
      )}
      {job?.dropoff_address && (
        <Flex gap={1.5} align="start" mt={1}>
          <Icon as={ArrowRight} boxSize={4} mt={0.5} color="gray.500" aria-hidden="true" flexShrink={0} />
          <Text noOfLines={compact ? 1 : undefined} overflowWrap="anywhere">
            <Text as="span" srOnly>To </Text>{job.dropoff_address}
          </Text>
        </Flex>
      )}
      {facts.length > 0 && <Text mt={1} color="gray.600">{facts.join(' · ')}</Text>}
    </Box>
  );
}

// ---------------------------------------------------------------- the invoice form

/**
 * Invoice fields: service amount, fuel amount, note. Used for a job's invoice and for a new invoice
 * sent straight into a conversation. `fuelCap`: the towing fuel limit (percent) when known.
 */
function InvoiceFields({ idPrefix, value, onChange, errors = {}, kind, fuelCap, isDisabled }) {
  const fuelHelp = kind === 'towing'
    ? (fuelCap ? `Optional. For towing, fuel can be at most ${fuelCap}% of the invoice.` : 'Optional. For towing, fuel is limited to a share of the invoice; Motaa tells you if it is too much.')
    : 'Optional. The part of the price that is fuel. You can ask for it once the customer has paid.';
  return (
    <Stack spacing={4}>
      <NairaField id={`${idPrefix}-service`} label="Service amount" isRequired isDisabled={isDisabled} autoFocus
        value={value.service_amount} onChange={(v) => onChange({ ...value, service_amount: v })} error={errors.service_amount}
        helper="Your price for the job, without fuel." />
      <NairaField id={`${idPrefix}-fuel`} label="Fuel amount" isDisabled={isDisabled}
        value={value.fuel_amount} onChange={(v) => onChange({ ...value, fuel_amount: v })} error={errors.fuel_amount} helper={fuelHelp} />
      <FormControl isInvalid={Boolean(errors.note)} isDisabled={isDisabled}>
        <FormLabel htmlFor={`${idPrefix}-note`} mb={1}>Note (optional)</FormLabel>
        <Textarea id={`${idPrefix}-note`} rows={2} maxLength={500} placeholder="e.g. Includes loading and offloading"
          value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} />
        <FormErrorMessage>{errors.note}</FormErrorMessage>
      </FormControl>
    </Stack>
  );
}

/** The business's own settings for invoices (the towing fuel cap). Only fetched for mechanics and dealers. */
function useMyTransport(enabled) {
  return useApiQuery(
    (api, signal, { useCache }) => api.get('/transport/mine/', { signal, cacheTTL: useCache ? 60000 : 0 }),
    [enabled],
    { enabled, select: (body) => body?.data }
  );
}

function capPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? String(number) : '';
}

/** Send or update the invoice for a job. */
function InvoiceModal({ job, isOpen, onClose, onSubmit, isLoading, error }) {
  const { authUser } = useContext(GlobalStore);
  const id = useId();
  const mine = useMyTransport(isOpen && ['mechanic', 'dealer'].includes(authUser?.user_type));
  const [value, setValue] = useState({ service_amount: '', fuel_amount: '', note: '' });
  const [problems, setProblems] = useState({});
  useEffect(() => {
    if (!isOpen) return;
    const whole = (amount) => (amount === null || amount === undefined || amount === '' ? '' : formatOfferAmount(String(Math.round(Number(amount)))));
    setValue({ service_amount: whole(job?.service_amount), fuel_amount: hasFuel(job) ? whole(job.fuel_amount) : '', note: job?.invoice_note || '' });
    setProblems({});
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e) {
    e.preventDefault();
    const found = invoiceProblems(value);
    setProblems(found);
    if (!Object.keys(found).length) onSubmit(invoicePayload(value));
  }

  const updating = hasInvoice(job);
  return (
    <Modal isOpen={isOpen} onClose={() => { if (!isLoading) onClose(); }} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={submit} noValidate borderRadius={{ base: 0, sm: 'lg' }} mx={{ base: 0, sm: 4 }}>
        <ModalHeader pr={12}>{updating ? 'Update invoice' : 'Send invoice'}</ModalHeader>
        <ModalCloseButton aria-label="Close" isDisabled={isLoading} />
        <ModalBody>
          <Text fontSize="sm" color="gray.600" mb={4}>
            {job?.service?.title}{job?.number ? ` · Job ${job.number}` : ''}. The customer pays the total in the app and Motaa holds it until the job is done.
          </Text>
          <InvoiceFields idPrefix={id} value={value} onChange={(next) => { setValue(next); setProblems({}); }} errors={problems}
            kind={job?.kind} fuelCap={capPercent(mine.data?.towing_fuel_cap_percent)} isDisabled={isLoading} />
          {error && <Text color="red.600" fontSize="sm" mt={3} role="alert">{error}</Text>}
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>Cancel</Button>
          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={isLoading} loadingText="Sending">
            {updating ? 'Update invoice' : 'Send invoice'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------------- paying

const PENDING_KEY = (uuid) => `motaa-transport-payment:${uuid}`;
function readPending(uuid) {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY(uuid)) || 'null'); } catch { return null; }
}
function writePending(uuid, value) {
  try {
    if (value) localStorage.setItem(PENDING_KEY(uuid), JSON.stringify(value));
    else localStorage.removeItem(PENDING_KEY(uuid));
  } catch { /* storage unavailable: the notice still shows until the page closes */ }
}

/**
 * Pay an invoice: online with Paystack (exactly the total the server sends), or from the wallet.
 * `onPaid(body)` gets the API's answer.
 */
function PayJobModal({ job, isOpen, onClose, onPaid }) {
  const { api, commaInt } = useContext(GlobalStore);
  const pay = usePaystack();
  const { withPin } = useWalletPin();
  const [method, setMethod] = useState('card');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(() => readPending(job.uuid)); // a card charge the server hasn't recorded yet

  // the job as it stands now, and the wallet balance
  const fresh = useApiQuery(
    (client, signal) => client.get(`/transport/jobs/${encodeURIComponent(job.uuid)}/`, { signal }),
    [job.uuid, isOpen],
    { enabled: isOpen, select: (body) => body?.data }
  );
  useEffect(() => { if (isOpen) { setError(''); setPending(readPending(job.uuid)); } }, [isOpen, job.uuid]);

  const current = fresh.data?.job || null;
  const total = current?.total;
  const balance = fresh.data?.wallet_balance;
  const enough = balance !== null && balance !== undefined && Number(balance) >= Number(total);
  const stillDue = current && current.status === 'invoiced';

  async function submit(body) {
    setBusy(true);
    setError('');
    try {
      const url = `/transport/jobs/${encodeURIComponent(job.uuid)}/`;
      // from the wallet: approved with the wallet PIN; by card: no PIN
      const result = body.payment_option === 'wallet'
        ? await withPin((pin) => api.post(url, { action: 'pay', ...body, pin }), {
          title: 'Pay this invoice from your wallet', amount: total, balance, submitLabel: `Pay ₦${commaInt(total)}`,
        })
        : await api.post(url, { action: 'pay', ...body });
      writePending(job.uuid, null);
      setPending(null);
      onPaid(result);
      onClose();
    } catch (err) {
      if (isPinCancelled(err)) return;
      const message = err?.message || "That didn't work.";
      if (body.reference && (err?.isNetworkError || err?.status >= 500)) {
        // charged but not recorded: keep the reference so it can be retried (the server is safe to call again)
        const record = { reference: body.reference, message };
        writePending(job.uuid, record);
        setPending(record);
      } else {
        if (body.reference) { writePending(job.uuid, null); setPending(null); }
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function payNow(e) {
    e?.preventDefault();
    if (!current || busy) return;
    if (method === 'wallet') return submit({ payment_option: 'wallet' });
    const reference = newReference('mttr');
    setBusy(true);
    const response = await pay({ amount: total, reference, metadata: { purpose: 'transport', job: job.uuid } });
    setBusy(false);
    if (!response) return; // closed the popup without paying
    return submit({ payment_option: 'card', reference: response.reference || reference });
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!busy) onClose(); }} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={payNow} noValidate borderRadius={{ base: 0, sm: 'lg' }} mx={{ base: 0, sm: 4 }}>
        <ModalHeader pr={12}>Pay invoice</ModalHeader>
        <ModalCloseButton aria-label="Close" isDisabled={busy} />
        <ModalBody>
          {pending ? (
            <PaymentRecoveryNotice reference={pending.reference} message={pending.message} retrying={busy}
              onRetry={() => submit({ payment_option: 'card', reference: pending.reference })} />
          ) : fresh.loading && !current ? (
            <Stack spacing={3} role="status" aria-label="Loading the invoice"><Skeleton h="60px" /><Skeleton h="90px" /></Stack>
          ) : fresh.error && !current ? (
            <Text color="red.600" role="alert">{fresh.error.message}</Text>
          ) : !stillDue ? (
            <Text color="gray.700" role="status">{current?.status_label ? `This job is now: ${current.status_label}.` : 'This invoice is not waiting for payment.'}</Text>
          ) : (
            <Stack spacing={4}>
              <JobAmounts job={current} />
              <RadioGroup value={method} onChange={setMethod} name="transport-payment">
                <Stack spacing={3}>
                  <Box as="label" borderWidth="1px" borderColor={method === 'card' ? 'primary' : 'gray.200'} borderRadius="md" p={3} cursor="pointer">
                    <Radio value="card" isDisabled={busy}>
                      <Text fontWeight="600">Card, bank transfer or USSD</Text>
                      <Text fontSize="sm" color="gray.600">Pay ₦{commaInt(total)} securely with Paystack.</Text>
                    </Radio>
                  </Box>
                  <Box as="label" borderWidth="1px" borderColor={method === 'wallet' ? 'primary' : 'gray.200'} borderRadius="md" p={3} cursor="pointer">
                    <Radio value="wallet" isDisabled={busy}>
                      <Text fontWeight="600">Motaa wallet</Text>
                      <Text fontSize="sm" color="gray.600">Balance ₦{commaInt(balance)}</Text>
                    </Radio>
                  </Box>
                </Stack>
              </RadioGroup>
              {method === 'wallet' && !enough && (
                <Alert status="warning" borderRadius="md" fontSize="sm">
                  <AlertIcon />
                  <AlertDescription>
                    Your wallet balance is too low. <Text as={RLink} to="/wallet/deposit" color="primary" fontWeight="600">Top up your wallet</Text> or pay by card.
                  </AlertDescription>
                </Alert>
              )}
              <HStack align="start" spacing={2} color="gray.700" fontSize="sm">
                <Icon as={Wallet} boxSize={4} mt={0.5} aria-hidden="true" />
                <Text>Motaa holds your payment and only pays the business when you confirm the job is done.</Text>
              </HStack>
              {error && <Text color="red.600" fontSize="sm" role="alert">{error}</Text>}
            </Stack>
          )}
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={busy}>{stillDue && !pending ? 'Cancel' : 'Close'}</Button>
          {stillDue && !pending && (
            <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={busy} loadingText="Paying"
              isDisabled={method === 'wallet' && !enough}>
              Pay ₦{commaInt(total)}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------------- the card in the chat

/** The server's ready-made deadline line (e.g. when the payment is released, or when "It didn't come" opens). */
function JobDeadline({ job, ...props }) {
  const note = String(job?.deadline_note || '').trim();
  // with a reported problem the orange notice already says the payment is held: don't say it twice
  if (!note || job?.problem) return null;
  return (
    <HStack spacing={1.5} align="start" fontSize="sm" color="gray.600" {...props}>
      <Icon as={Clock} boxSize={3.5} mt={1} flexShrink={0} aria-hidden="true" />
      <Text overflowWrap="anywhere">{note}</Text>
    </HStack>
  );
}

/** A calm orange notice once the customer has reported a problem (the payment is held; Motaa settles it). */
function JobProblem({ job, ...props }) {
  const text = jobProblemNotice(job);
  if (!text) return null;
  return (
    <HStack spacing={2} align="start" bg="orange.50" borderLeftWidth="3px" borderColor="orange.400" borderRadius="md" px={3} py={2}
      fontSize="sm" color="orange.900" role="status" {...props}>
      <Icon as={CircleAlert} boxSize={4} mt={0.5} flexShrink={0} color="orange.500" aria-hidden="true" />
      <Text overflowWrap="anywhere">{text}</Text>
    </HStack>
  );
}

const CONFIRM = {
  confirm: {
    title: 'Is the job done?',
    body: 'Confirming pays the business what Motaa is holding for this job. Only confirm once your car has been delivered.',
    confirmLabel: 'Yes, the job is done', cancelLabel: 'Not yet', tone: 'primary',
  },
  customerCancel: {
    title: 'Cancel this request?',
    body: 'The business is told it is cancelled.',
    confirmLabel: 'Cancel request', cancelLabel: 'Keep it', tone: 'danger',
    field: { label: 'Reason (optional)', placeholder: 'e.g. I found another one', maxLength: 300 },
  },
  decline: {
    title: 'Decline this request?',
    body: 'The customer is told you can’t take this job.',
    confirmLabel: 'Decline', cancelLabel: 'Keep it', tone: 'danger',
    field: { label: 'Reason (optional)', placeholder: 'e.g. No truck free on that date', maxLength: 300 },
  },
  'release-fuel': {
    title: 'Release the fuel money?',
    body: 'The fuel part of the invoice is paid to your wallet now. If the job is cancelled later, fuel money already released is not refunded to the customer.',
    confirmLabel: 'Release fuel money', cancelLabel: 'Not now', tone: 'primary',
  },
  done: {
    title: 'Mark the job as done?',
    body: 'The customer is asked to confirm. If they don’t, the payment is released to you automatically after a few days.',
    confirmLabel: 'Mark as done', cancelLabel: 'Not yet', tone: 'primary',
  },
  'not-arrived': {
    title: "It didn't come?",
    body: 'Cancel this job and get back what’s still held? Fuel money already released to the driver isn’t refunded.',
    confirmLabel: 'Cancel and refund', cancelLabel: 'Keep waiting', tone: 'danger',
    field: { label: 'What happened? (optional)', placeholder: 'e.g. Nobody came and the phone was off', maxLength: 300, multiline: true },
  },
  'report-problem': {
    title: 'Report a problem',
    body: 'The payment stays held and Motaa will contact you.',
    confirmLabel: 'Send report', cancelLabel: 'Not now', tone: 'danger',
    field: {
      label: 'What went wrong?', placeholder: 'e.g. My car was dropped at the wrong address', maxLength: 1000, multiline: true,
      required: true, minLength: JOB_PROBLEM_MIN_LENGTH,
      helper: `At least ${JOB_PROBLEM_MIN_LENGTH} characters.`,
      requiredMessage: `Tell us what went wrong in at least ${JOB_PROBLEM_MIN_LENGTH} characters.`,
    },
  },
  businessCancel: {
    title: 'Cancel this job?',
    body: 'The customer is refunded whatever Motaa is still holding for it, to their Motaa wallet. Fuel money already released is not refunded.',
    confirmLabel: 'Cancel job', cancelLabel: 'Keep it', tone: 'danger',
    field: { label: 'Reason (optional)', placeholder: 'e.g. The truck broke down', maxLength: 300 },
  },
};

/**
 * One step of a towing or hauling job in a conversation (a chat message that has `transport_job`).
 * `latest`: the newest step, the only one with buttons. `onChanged(body?)` is called after every
 * action (and every refusal) so the room is loaded again.
 */
export function TransportJobCard({ msg, mine, latest, naturalTime, onChanged }) {
  const { api, notify } = useContext(GlobalStore);
  const job = msg?.transport_job || {};
  const actions = latest ? asList(job.actions) : [];
  const [dialog, setDialog] = useState(null); // a CONFIRM key, 'invoice' or 'pay'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const date = msg?.date_created ? new Date(msg.date_created) : null;
  const time = date && !Number.isNaN(date.getTime()) ? date : null;
  const label = jobEventLabel(msg?.transport_event, job.kind);
  const customer = job.side === 'customer';
  const finished = ['completed', 'declined', 'cancelled'].includes(job.status);

  // the buttons this step had are gone (someone answered): close what was open
  const actionKey = actions.join(',');
  useEffect(() => { if (!actions.length && dialog) setDialog(null); }, [actionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(action, extra = {}) {
    if (busy) return false;
    setBusy(true);
    setError('');
    try {
      const body = await api.post(`/transport/jobs/${encodeURIComponent(job.uuid)}/`, { action, ...extra });
      if (body?.message) notify({ title: 'Done', body: body.message });
      setDialog(null);
      onChanged?.(body);
      return true;
    } catch (err) {
      setError(err?.message || "That didn't work.");
      // dialogs without a text box can't show the reason: close them so the card shows it
      setDialog((open) => (open === 'invoice' || CONFIRM[open]?.field ? open : null));
      onChanged?.(); // a refusal usually means the job moved on: show what it is now
      return false;
    } finally {
      setBusy(false);
    }
  }

  const meta = (time || (mine && msg?.sent_by_name)) && (
    <Text fontSize="xs" color="gray.500" mt={1} textAlign={mine ? 'right' : 'left'}>
      {mine && msg?.sent_by_name && <>Sent by {msg.sent_by_name}{time ? ' · ' : ''}</>}
      {time && <time dateTime={time.toISOString()}>{naturalTime(time)}</time>}
    </Text>
  );

  if (!latest) {
    // an older step: what happened, without buttons
    return (
      <Box alignSelf={mine ? 'flex-end' : 'flex-start'} maxW={{ base: '85%', md: '70%' }} data-testid="job-step">
        <Box borderWidth="1px" borderColor="gray.200" bg="gray.50" borderRadius="lg" px={3} py={2} opacity={0.8}>
          <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">{label}</Text>
          <Text fontSize="sm" color="gray.700" overflowWrap="anywhere">{msg?.text}</Text>
        </Box>
        {meta}
      </Box>
    );
  }

  const serviceLink = customer && job.service?.uuid ? servicePath(job.service) : null;
  const cancelKey = customer ? 'customerCancel' : 'businessCancel';
  const primary = { size: 'sm', flex: 1, minW: '120px', bg: 'primary', color: 'white', _hover: { bg: 'secondary' } };
  const outline = { size: 'sm', flex: 1, minW: '120px', variant: 'outline' };

  return (
    <Box alignSelf={mine ? 'flex-end' : 'flex-start'} w="100%" maxW={{ base: '94%', sm: '380px' }} data-testid="job-card">
      <Box as="article" aria-label={`${label}: ${job.status_label || ''}`} borderWidth="1px" borderRadius="lg" bg="white" color="gray.800" overflow="hidden"
        borderColor={job.status === 'completed' ? 'green.300' : 'gray.200'} boxShadow="sm">
        <Flex justify="space-between" align="center" gap={2} px={3} py={2} bg={job.status === 'completed' ? 'green.50' : 'gray.50'} borderBottomWidth="1px" borderColor="gray.200">
          <HStack spacing={1.5} minW={0}>
            <Icon as={job.status === 'completed' ? CircleCheck : msg?.transport_event === 'problem' ? CircleAlert : msg?.transport_event === 'fuel' ? Fuel : msg?.transport_event === 'invoiced' ? Receipt : Truck}
              boxSize={4} color={job.status === 'completed' ? 'green.600' : 'primary'} aria-hidden="true" />
            <Text fontSize="sm" fontWeight="700" noOfLines={1}>{label}</Text>
          </HStack>
          {job.status_label && (
            <Badge colorScheme={jobStatusColor(job.status)} variant="subtle" textTransform="none" borderRadius="full" px={2} flexShrink={1} noOfLines={1} maxW="60%">
              {job.status_label}
            </Badge>
          )}
        </Flex>

        <Stack p={3} spacing={3}>
          <Flex gap={3} align="center">
            <TransportPhoto src={job.service?.image} alt={job.service?.title || 'Truck'} boxSize="48px" borderRadius="md" iconSize={5} />
            <Box minW={0}>
              {serviceLink
                ? <Text as={RLink} to={serviceLink} fontWeight="600" noOfLines={2} _hover={{ color: 'primary', textDecoration: 'underline' }}>{job.service?.title}</Text>
                : <Text fontWeight="600" noOfLines={2}>{job.service?.title}</Text>}
              {job.number && <Text fontSize="xs" color="gray.500">Job {job.number}</Text>}
            </Box>
          </Flex>

          <JobTrip job={job} />
          {job.notes && <Text fontSize="sm" color="gray.600" overflowWrap="anywhere">“{job.notes}”</Text>}

          <JobAmounts job={job} />
          {job.invoice_note && <Text fontSize="sm" color="gray.600" overflowWrap="anywhere">Note: {job.invoice_note}</Text>}
          {/* older servers without `deadline_note` */}
          {job.status === 'done' && job.release_due && !job.deadline_note && !job.problem && (
            <Text fontSize="sm" color="gray.600">
              {customer ? 'If you don’t confirm, the payment is released to the business automatically' : 'If the customer doesn’t confirm, you are paid automatically'} on {new Date(job.release_due).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}.
            </Text>
          )}
          {job.cancel_reason && <Text fontSize="sm" color="gray.600">Reason: {job.cancel_reason}</Text>}
          <JobProblem job={job} />
          <JobDeadline job={job} />

          {/* live tracking while the job is paid: the customer follows the truck, the business shares */}
          {job.live_tracking && customer && <TrackOnMapButton uuid={job.uuid} title={`${job.service?.title || 'Your tow'}: live location`} alignSelf="flex-start" />}
          {!customer && <ShareLiveLocation kind="transport" uuid={job.uuid} active={Boolean(job.live_tracking)} label="the customer" />}

          {/* the business's number, for the customer, once the job is paid */}
          {customer && job.business_phone && !finished && (
            <Button as="a" href={`tel:${String(job.business_phone).replace(/\s+/g, '')}`} size="sm" variant="outline" leftIcon={<Phone size={14} />}
              borderColor="primary" color="primary" aria-label={`Call the business on ${job.business_phone}`}>
              Call {job.business_phone}
            </Button>
          )}

          {actions.length > 0 && !finished && (
            <Flex gap={2} flexWrap="wrap">
              {actions.includes('pay') && <Button {...primary} onClick={() => setDialog('pay')}>Pay</Button>}
              {actions.includes('invoice') && <Button {...primary} onClick={() => setDialog('invoice')}>{hasInvoice(job) ? 'Update invoice' : 'Send invoice'}</Button>}
              {actions.includes('release-fuel') && <Button {...outline} borderColor="primary" color="primary" onClick={() => setDialog('release-fuel')}>Release fuel money</Button>}
              {actions.includes('done') && <Button {...primary} onClick={() => setDialog('done')}>Mark done</Button>}
              {actions.includes('confirm') && <Button {...primary} onClick={() => setDialog('confirm')}>Confirm job done</Button>}
              {actions.includes('report-problem') && <Button {...outline} colorScheme="orange" onClick={() => setDialog('report-problem')}>Report a problem</Button>}
              {actions.includes('not-arrived') && <Button {...outline} colorScheme="red" onClick={() => setDialog('not-arrived')}>It didn't come</Button>}
              {actions.includes('decline') && <Button {...outline} colorScheme="red" onClick={() => setDialog('decline')}>Decline</Button>}
              {actions.includes('cancel') && <Button {...outline} variant="ghost" colorScheme="red" onClick={() => setDialog(cancelKey)}>Cancel</Button>}
            </Flex>
          )}
          {error && !dialog && <Text fontSize="sm" color="red.600" role="alert">{error}</Text>}
        </Stack>
      </Box>
      {meta}

      <ActionDialog
        isOpen={Boolean(CONFIRM[dialog])}
        onClose={() => setDialog(null)}
        isLoading={busy}
        config={CONFIRM[dialog]}
        error={CONFIRM[dialog]?.field ? error : undefined}
        onConfirm={(text) => {
          if (dialog === 'report-problem') return run('report-problem', { details: text });
          return run(dialog === 'customerCancel' || dialog === 'businessCancel' ? 'cancel' : dialog, text ? { reason: text } : {});
        }}
      />
      {dialog === 'invoice' && (
        <InvoiceModal job={job} isOpen onClose={() => { setDialog(null); setError(''); }} isLoading={busy} error={error}
          onSubmit={(body) => run('invoice', body)} />
      )}
      {dialog === 'pay' && (
        <PayJobModal job={job} isOpen onClose={() => setDialog(null)}
          onPaid={(body) => { if (body?.message) notify({ title: 'Paid', body: body.message }); onChanged?.(body); }} />
      )}
    </Box>
  );
}

// ---------------------------------------------------------------- invoicing from the chat

/**
 * "Send invoice" in a conversation with a customer, for a mechanic or dealer with at least one towing
 * van / car hauler: invoice straight away (e.g. after a phone call). Renders nothing otherwise.
 */
export function ChatInvoiceButton({ room, recipient, onSent }) {
  const { authUser, api, notify } = useContext(GlobalStore);
  const id = useId();
  const business = ['mechanic', 'dealer'].includes(authUser?.user_type);
  const enabled = business && recipient?.user_type === 'customer';
  const mine = useMyTransport(enabled);
  const services = asList(mine.data?.results);
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [trip, setTrip] = useState(emptyRequestForm());
  const [invoice, setInvoice] = useState({ service_amount: '', fuel_amount: '', note: '' });
  const [problems, setProblems] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const service = services.find((item) => item.uuid === serviceId) || null;
  const kind = service?.kind || mine.data?.kind || 'towing';

  useEffect(() => {
    if (!open) return;
    setServiceId(services.length === 1 ? services[0].uuid : '');
    setTrip(emptyRequestForm());
    setInvoice({ service_amount: '', fuel_amount: '', note: '' });
    setProblems({});
    setError('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const noun = mine.data?.kind === 'hauler' ? 'car hauler' : 'towing van';
  if (!enabled || !services.length) return null;

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const found = { ...requestProblems(trip, kind), ...invoiceProblems(invoice) };
    if (!service) found.service = `Choose which ${noun} this is for.`;
    setProblems(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const body = await api.post('/transport/jobs/new/', { service: service.uuid, room, ...requestPayload(trip, kind), ...invoicePayload(invoice) });
      notify({ title: 'Invoice sent', body: body?.message });
      setOpen(false);
      onSent?.(body);
    } catch (err) {
      setError(err?.message || "That didn't work.");
      if (err?.fieldErrors) setProblems((current) => ({ ...current, ...mapTripErrors(err.fieldErrors) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" leftIcon={<Receipt size={14} />} onClick={() => setOpen(true)} flexShrink={0}>Send invoice</Button>
      <Modal isOpen={open} onClose={() => { if (!busy) setOpen(false); }} size={{ base: 'full', sm: 'lg' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={submit} noValidate borderRadius={{ base: 0, sm: 'lg' }} mx={{ base: 0, sm: 4 }}>
          <ModalHeader pr={12}>Send invoice to {recipient?.name || 'this customer'}</ModalHeader>
          <ModalCloseButton aria-label="Close" isDisabled={busy} />
          <ModalBody>
            <Text fontSize="sm" color="gray.600" mb={4}>
              For a job you agreed outside the app, e.g. on the phone. The customer pays the total here and Motaa holds it until the job is done.
            </Text>
            <Stack spacing={4}>
              <FormControl isRequired isInvalid={Boolean(problems.service)}>
                <FormLabel htmlFor={`${id}-service`} mb={1}>{kind === 'hauler' ? 'Car hauler' : 'Towing van'}</FormLabel>
                <Select id={`${id}-service`} placeholder={`Choose a ${noun}`} value={serviceId}
                  onChange={(e) => { setServiceId(e.target.value); setProblems((p) => ({ ...p, service: '' })); }}>
                  {services.map((item) => <option key={item.uuid} value={item.uuid}>{item.title}</option>)}
                </Select>
                <FormErrorMessage>{problems.service}</FormErrorMessage>
              </FormControl>
              <TripFields idPrefix={id} kind={kind} value={trip} onChange={(next) => { setTrip(next); setProblems({}); }} errors={problems} isDisabled={busy} />
              <Divider />
              <InvoiceFields idPrefix={`${id}-inv`} value={invoice} onChange={(next) => { setInvoice(next); setProblems({}); }} errors={problems}
                kind={kind} fuelCap={capPercent(mine.data?.towing_fuel_cap_percent)} isDisabled={busy} />
              {error && <Text color="red.600" fontSize="sm" role="alert">{error}</Text>}
            </Stack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={() => setOpen(false)} isDisabled={busy}>Cancel</Button>
            <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={busy} loadingText="Sending">Send invoice</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/** The API names trip fields pickup_address etc.; the form names them pickup, dropoff. */
export function mapTripErrors(fields = {}) {
  const out = {};
  for (const [key, message] of Object.entries(fields || {})) {
    const name = { pickup_address: 'pickup', dropoff_address: 'dropoff' }[key] || key;
    out[name] = message;
  }
  return out;
}

/**
 * The trip a customer asks for: pickup, drop-off, and for a car hauler how many cars, the date and how
 * long. Used on the request form and in "Send invoice".
 */
export function TripFields({ idPrefix, kind, value, onChange, errors = {}, isDisabled }) {
  const set = (key) => (next) => onChange({ ...value, [key]: next });
  const digits = (key, max) => (e) => onChange({ ...value, [key]: e.target.value.replace(/\D/g, '').slice(0, max) });
  const hauler = kind === 'hauler';
  return (
    <Stack spacing={4}>
      <PlaceField id={`${idPrefix}-pickup`} label="Pickup" isRequired value={value.pickup} onChange={set('pickup')} error={errors.pickup}
        placeholder="Where is the car?" />
      <PlaceField id={`${idPrefix}-dropoff`} label={hauler ? 'Drop-off' : 'Drop-off (optional)'} isRequired={hauler} value={value.dropoff}
        onChange={set('dropoff')} error={errors.dropoff} placeholder="Where should it go?" />
      {hauler && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <FormControl isRequired isInvalid={Boolean(errors.cars)} isDisabled={isDisabled}>
            <FormLabel htmlFor={`${idPrefix}-cars`} mb={1}>Cars</FormLabel>
            <Input id={`${idPrefix}-cars`} inputMode="numeric" value={value.cars} onChange={digits('cars', 2)} />
            <FormErrorMessage>{errors.cars}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={Boolean(errors.date)} isDisabled={isDisabled} gridColumn={{ base: 'span 1', md: 'span 1' }}>
            <FormLabel htmlFor={`${idPrefix}-date`} mb={1}>Date</FormLabel>
            <Input id={`${idPrefix}-date`} type="date" min={todayInput()} value={value.date} onChange={(e) => onChange({ ...value, date: e.target.value })} />
            <FormErrorMessage>{errors.date}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={Boolean(errors.days)} isDisabled={isDisabled}>
            <FormLabel htmlFor={`${idPrefix}-days`} mb={1}>Days (optional)</FormLabel>
            <Input id={`${idPrefix}-days`} inputMode="numeric" value={value.days} onChange={digits('days', 3)} />
            <FormErrorMessage>{errors.days}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={Boolean(errors.hours)} isDisabled={isDisabled}>
            <FormLabel htmlFor={`${idPrefix}-hours`} mb={1}>Hours (optional)</FormLabel>
            <Input id={`${idPrefix}-hours`} inputMode="numeric" value={value.hours} onChange={digits('hours', 4)} />
            <FormErrorMessage>{errors.hours}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>
      )}
      <FormControl isInvalid={Boolean(errors.notes)} isDisabled={isDisabled}>
        <FormLabel htmlFor={`${idPrefix}-notes`} mb={1}>Notes (optional)</FormLabel>
        <Textarea id={`${idPrefix}-notes`} rows={3} maxLength={1000} value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder={hauler ? 'e.g. Two SUVs and a saloon, keys with the security man' : 'e.g. Toyota Camry, front tyre burst, on the hard shoulder'} />
        <FormErrorMessage>{errors.notes}</FormErrorMessage>
      </FormControl>
    </Stack>
  );
}

// ---------------------------------------------------------------- lists of jobs

/** One job in a list (customer's cart page, business dashboard), with a link to its conversation. */
export function TransportJobRow({ job }) {
  const { commaInt, naturalDate } = useContext(GlobalStore);
  const created = job?.date_created ? new Date(job.date_created) : null;
  const when = created && !Number.isNaN(created.getTime()) ? naturalDate(created) : '';
  const business = job?.side === 'business';
  return (
    <Flex as="li" direction={{ base: 'column', sm: 'row' }} gap={4} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white"
      align={{ base: 'stretch', sm: 'center' }}>
      <Flex gap={3} flex={1} minW={0} align="start">
        <TransportPhoto src={job?.service?.image} alt={job?.service?.title || 'Truck'} boxSize={{ base: '56px', md: '72px' }} borderRadius="md" iconSize={6} />
        <Box flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap" mb={1}>
            <Badge colorScheme={jobStatusColor(job?.status)} textTransform="none" borderRadius="full" px={2}>{job?.status_label}</Badge>
            <Text fontSize="xs" color="gray.500">{[job?.number && `Job ${job.number}`, when].filter(Boolean).join(' · ')}</Text>
          </HStack>
          <Text fontWeight="600" noOfLines={1}>{job?.service?.title}</Text>
          <JobTrip job={job} compact />
          <JobProblem job={job} mt={2} />
          <JobDeadline job={job} mt={1} />
          {business && <ShareLiveLocation kind="transport" uuid={job.uuid} active={Boolean(job.live_tracking)} label="the customer" mt={2} />}
          {hasInvoice(job) && (
            <Text fontSize="sm" fontWeight="600" mt={1}>
              ₦{commaInt(job.total)}
              {business && job.provider_amount != null && <Text as="span" fontWeight="400" color="gray.600"> · you receive ₦{commaInt(job.provider_amount)}</Text>}
            </Text>
          )}
        </Box>
      </Flex>
      <Flex gap={2} flexShrink={0} direction={{ base: 'row', sm: 'column' }} flexWrap="wrap">
        {!business && job?.live_tracking && <TrackOnMapButton uuid={job.uuid} title={`${job.service?.title || 'Your tow'}: live location`} />}
        {!business && job?.business_phone && !['completed', 'declined', 'cancelled'].includes(job?.status) && (
          <Button as="a" href={`tel:${String(job.business_phone).replace(/\s+/g, '')}`} size="sm" variant="outline" leftIcon={<Phone size={14} />}
            aria-label={`Call the business on ${job.business_phone}`}>
            Call
          </Button>
        )}
        {job?.room && (
          <Button as={RLink} to={`/chat/${job.room}`} size="sm" variant="outline" borderColor="primary" color="primary" leftIcon={<MessageCircle size={14} />}>
            Open chat
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

const JOB_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'In progress' },
  { value: 'done', label: 'Finished' },
];

/** GET /transport/jobs/ with All / In progress / Finished and page buttons. `empty`: what to show with no jobs. */
export function TransportJobList({ empty }) {
  const [filter, setFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (offset) params.set('offset', String(offset));
    return params.toString();
  }, [filter, offset]);
  const query = useApiQuery(
    (api, signal) => api.get(`/transport/jobs/${qs ? `?${qs}` : ''}`, { signal }),
    [qs],
    { select: (body) => body?.data, keepAs: `transport-jobs:${qs}` }
  );
  const jobs = asList(query.data?.results);
  const pagination = query.data?.pagination || {};

  return (
    <Box>
      <HStack role="group" aria-label="Show" spacing={2} mb={4} overflowX="auto" className="hidden-scroll">
        {JOB_FILTERS.map((item) => {
          const selected = item.value === filter;
          return (
            <Button key={item.value || 'all'} size="sm" flexShrink={0} aria-pressed={selected} onClick={() => { setFilter(item.value); setOffset(0); }}
              variant={selected ? 'solid' : 'outline'} bg={selected ? 'primary' : 'white'} color={selected ? 'white' : 'gray.700'} _hover={{ bg: selected ? 'primary' : 'gray.50' }}>
              {item.label}
            </Button>
          );
        })}
      </HStack>
      {query.loading && query.data === undefined ? (
        <Stack spacing={3} role="status" aria-label="Loading jobs">{[0, 1, 2].map((i) => <Skeleton key={i} h="96px" borderRadius="lg" />)}</Stack>
      ) : query.error && query.data === undefined ? (
        <VStack align="start" spacing={2} p={3} rounded="md" bg="red.50" color="red.700" role="alert">
          <Text fontSize="sm">{query.error.message}</Text>
          <Button size="sm" variant="link" color="red.700" onClick={query.reload}>Try again</Button>
        </VStack>
      ) : jobs.length === 0 ? (
        filter ? <Text color="gray.600" py={6} textAlign="center">No jobs here.</Text> : empty
      ) : (
        <Box opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
          <Stack as="ul" listStyleType="none" spacing={3}>
            {jobs.map((job) => <TransportJobRow key={job.uuid} job={job} />)}
          </Stack>
          <PageControls offset={pagination.offset} limit={pagination.limit || 25} count={pagination.count} isLoading={query.loading}
            onPage={(next) => setOffset(next || 0)} />
        </Box>
      )}
    </Box>
  );
}
