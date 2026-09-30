import { useContext, useEffect, useMemo, useState } from 'react';
import { Link as RLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  Container,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
  useDisclosure,
  useRadio,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react';
import { Car, CreditCard, Fuel, Gauge, Lock, MapPin, Search, ShieldCheck, Wallet as WalletIcon, ClipboardCheck } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { EmptyState, ErrorState } from '../../../components/states';
import { CustomPlacesAutocomplete } from '../../../components/maps';
import { newReference, PaymentRecoveryNotice, usePaystack, WalletPayDialog } from '../../../components/wallet';

const OPTION_META = {
  card: { icon: CreditCard, title: 'Pay online', hint: 'Card, bank transfer or USSD via Paystack' },
  wallet: { icon: WalletIcon, title: 'Motaa wallet', hint: 'Pay from your wallet balance' },
  'pay-after-inspection': { icon: ClipboardCheck, title: 'Pay after inspection', hint: 'Pay only the inspection fee today' },
};
const PENDING_KEY = 'motaa:pending-checkout';

function readPending(listingId) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PENDING_KEY) || 'null');
    return saved?.listingId === listingId ? saved : null;
  } catch { return null; }
}
function writePending(value) {
  try {
    if (value) window.localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(PENDING_KEY);
  } catch { /* storage unavailable */ }
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function PaymentOptionCard({ option, meta, amountLabel, ...radioProps }) {
  const { getInputProps, getRadioProps, state } = useRadio(radioProps);
  const disabled = !option.available;
  return (
    <Box as="label" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? 0.6 : 1}>
      <input {...getInputProps()} />
      <Flex
        {...getRadioProps()}
        borderWidth="2px"
        borderRadius="lg"
        p={4}
        gap={3}
        align="start"
        h="100%"
        borderColor={state.isChecked ? 'primary' : 'gray.200'}
        bg={state.isChecked ? 'blue.50' : 'white'}
        _focusVisible={{ boxShadow: 'outline' }}
      >
        <Icon as={meta.icon} boxSize={6} color="primary" mt={0.5} aria-hidden="true" />
        <Box flex={1} minW={0}>
          <Text className="bold">{meta.title}</Text>
          <Text fontSize="sm" color="gray.600">{meta.hint}</Text>
          <Text fontSize="sm" mt={1} className="bold" color="secondary">{amountLabel}</Text>
          {disabled && option.reason && <Text fontSize="xs" color="red.600" mt={1}>{option.reason}</Text>}
        </Box>
      </Flex>
    </Box>
  );
}

function SummaryRow({ label, value, bold, muted }) {
  return (
    <Flex justify="space-between" gap={4} fontWeight={bold ? 700 : 500} color={muted ? 'gray.600' : undefined}>
      <Text>{label}</Text>
      <Text textAlign="right" whiteSpace="nowrap">{value}</Text>
    </Flex>
  );
}

function CarCard({ listing, commaInt }) {
  const vehicle = listing?.vehicle || {};
  const dealer = listing?.dealer;
  return (
    <Box borderWidth={1} borderRadius="20px" overflow="hidden" bg="white">
      <Box h={{ base: '180px', md: '220px' }} bg="gray.100">
        {listing?.image
          ? <Image src={listing.image} alt={listing?.title || 'Car'} w="100%" h="100%" objectFit="cover" />
          : <Flex h="100%" align="center" justify="center" color="gray.400"><Icon as={Car} boxSize={12} aria-hidden="true" /></Flex>}
      </Box>
      <Box p={5}>
        <Flex justify="space-between" align="start" gap={2}>
          <Heading as="h2" size="md">{listing?.title}</Heading>
          {vehicle.condition && <Badge flexShrink={0}>{vehicle.condition}</Badge>}
        </Flex>
        <Text mt={1} color="secondary" className="bold">
          ₦{commaInt(listing?.price)}{listing?.listing_type === 'rental' && listing?.payment_cycle && listing.payment_cycle !== 'single' ? ` / ${listing.payment_cycle}` : ''}
        </Text>
        <HStack mt={3} spacing={4} flexWrap="wrap" color="gray.700" fontSize="sm">
          {vehicle.mileage && <HStack spacing={1}><Icon as={Gauge} aria-hidden="true" /><Text>{/\d/.test(vehicle.mileage) && !/km|mi/i.test(vehicle.mileage) ? `${commaInt(String(vehicle.mileage).replace(/\D/g, ''))} km` : vehicle.mileage}</Text></HStack>}
          {vehicle.transmission && <Text>{vehicle.transmission}</Text>}
          {vehicle.fuel_system && <HStack spacing={1}><Icon as={Fuel} aria-hidden="true" /><Text>{vehicle.fuel_system}</Text></HStack>}
        </HStack>
        {dealer && (
          <>
            <Divider my={3} />
            <Text fontSize="sm" className="bold">{dealer.business_name}</Text>
            {dealer.location && <HStack spacing={1} color="gray.600" fontSize="sm"><Icon as={MapPin} aria-hidden="true" /><Text>{dealer.location}</Text></HStack>}
          </>
        )}
      </Box>
    </Box>
  );
}

function CheckoutPage() {
  const [params] = useSearchParams();
  const listingId = params.get('listingId');
  const navigate = useNavigate();
  const { api, commaInt, authUser, notifyError, naturalDate } = useContext(GlobalStore);
  const pay = usePaystack();
  const walletDialog = useDisclosure();
  const escrowInfo = useDisclosure();

  const [dates, setDates] = useState({ from: params.get('from') || '', until: params.get('until') || '' });
  const [form, setForm] = useState({
    area: params.get('location') || params.get('where') || '',
    lat: params.get('lat') || '',
    lng: params.get('lng') || '',
    street: '',
    postal_code: '',
    phone: '',
    with_driver: params.get('driver') === '1',
    payment_option: 'card',
    consent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pending, setPending] = useState(() => readPending(listingId)); // { listingId, reference, payload, message }

  const qs = new URLSearchParams();
  if (dates.from) qs.set('from', dates.from);
  if (dates.until) qs.set('until', dates.until);
  const query = useApiQuery(
    (api, signal) => api.get(`/listings/checkout/${listingId}/?${qs.toString()}`, { signal }),
    [listingId, dates.from, dates.until],
    { enabled: Boolean(listingId), select: (body) => body?.data }
  );
  const data = query.data;
  const listing = data?.listing;
  const pricing = data?.pricing;
  const isRental = listing?.listing_type === 'rental';
  const customerPhone = data?.customer?.phone_number || authUser?.phone_number || '';

  const options = useMemo(() => (data?.payment_options || [])
    .filter((o) => OPTION_META[o.value])
    .filter((o) => !(isRental && o.value === 'pay-after-inspection')), [data, isRental]);
  const selected = options.find((o) => o.value === form.payment_option);
  const amountDue = selected?.amount_due ?? pricing?.total;

  // keep the choice valid when options change (e.g. wallet becomes unavailable)
  useEffect(() => {
    if (options.length && (!selected || !selected.available)) {
      const first = options.find((o) => o.available);
      if (first && first.value !== form.payment_option) setForm((f) => ({ ...f, payment_option: first.value }));
    }
  }, [options, selected, form.payment_option]);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'payment-option',
    value: form.payment_option,
    onChange: (value) => setForm((f) => ({ ...f, payment_option: value })),
  });

  const phoneDigits = form.phone.replace(/\D/g, '').replace(/^234/, '').replace(/^0/, '');
  const errors = {
    area: !form.area.trim() ? (isRental ? 'Choose the pickup or delivery area' : 'Choose the delivery area') : '',
    street: !form.street.trim() ? 'Enter the street address' : '',
    postal_code: form.postal_code && !/^\d{4,8}$/.test(form.postal_code) ? 'Postal codes are 4–8 digits' : '',
    phone: !customerPhone && phoneDigits.length !== 10 ? 'Enter a valid Nigerian phone number' : '',
    dates: isRental ? (data?.dates_error || (!dates.from || !dates.until ? 'Choose your rental dates' : '')) : '',
    consent: !form.consent ? 'Please confirm you understand how escrow works' : '',
    option: !selected?.available ? 'Choose an available payment option' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const blocked = Boolean(data?.unavailable_reason);

  const [placing, setPlacing] = useState(false);

  function payload(reference) {
    const phone = customerPhone || (phoneDigits ? `+234${phoneDigits}` : '');
    return {
      payment_option: form.payment_option,
      reference,
      delivery_address: [form.street.trim(), form.area.trim()].filter(Boolean).join(', '),
      postal_code: form.postal_code.trim(),
      lat: form.lat || undefined,
      lng: form.lng || undefined,
      phone_number: phone,
      rent_from: isRental ? dates.from : undefined,
      rent_until: isRental ? dates.until : undefined,
      with_driver: isRental && form.with_driver,
    };
  }

  /** POST the order. Resolves the order, or throws the ApiError. */
  async function submitOrder(body) {
    setPlacing(true);
    try {
      const result = await api.post(`/listings/checkout/${listingId}/`, body);
      const order = result?.data?.order;
      writePending(null);
      setPending(null);
      if (order?.order_status === 'awaiting-inspection') navigate(`/checkout/inspection?order=${order.uuid}`);
      else navigate(`/checkout/status?order=${order?.uuid}&placed=1`);
      return order;
    } finally {
      setPlacing(false);
    }
  }

  async function proceed(e) {
    e?.preventDefault();
    setSubmitted(true);
    if (!valid || blocked || !pricing) return;
    if (form.payment_option === 'wallet') return walletDialog.onOpen();

    setPaying(true);
    const reference = newReference('mtord');
    const response = await pay({
      amount: amountDue,
      reference,
      metadata: { purpose: 'order', listing_id: listingId, payment_option: form.payment_option },
    });
    setPaying(false);
    if (!response) return; // closed the popup without paying
    const body = payload(response.reference || reference);
    // remember the charge until the server records it (survives a reload)
    const record = { listingId, reference: body.reference, payload: body };
    writePending(record);
    setPending(record);
    try {
      await submitOrder(body);
    } catch (error) {
      const next = { ...record, message: error?.message };
      writePending(next);
      setPending(next);
    }
  }

  async function retryPending() {
    try {
      await submitOrder(pending.payload);
    } catch (error) {
      const next = { ...pending, message: error?.message || 'Still no luck. Check your connection, or contact support with this reference.' };
      writePending(next);
      setPending(next);
    }
  }

  async function payWithWallet() {
    try {
      await submitOrder(payload(undefined));
    } catch (error) {
      if (!error?.isNetworkError && !(error?.status >= 500)) notifyError(error, "Couldn't place your order");
    } finally {
      walletDialog.onClose();
    }
  }

  if (!listingId) {
    return (
      <Container maxW="container.md" py={16}>
        <EmptyState icon={Search} title="No car selected" description="Choose a car to buy or rent, then come back to check out." action={{ label: 'Browse cars', to: '/buy' }} />
      </Container>
    );
  }

  const header = (
    <Box bg="primary" py={{ base: 6, md: 8 }} mb={{ base: 6, md: 8 }}>
      <Container maxW="container.xl" textAlign="center">
        <Heading as="h1" color="white" size="lg" fontWeight="500">Checkout</Heading>
        <Text color="whiteAlpha.900" mt={2}>{isRental ? 'Set up your rental' : 'Get ready to own your car'}</Text>
      </Container>
    </Box>
  );

  if (query.error && !data) {
    return (
      <Box minH="70vh">{header}
        <Container maxW="container.md"><ErrorState error={query.error} onRetry={query.reload} title={query.error.isNotFound ? 'This car is no longer available' : undefined} /></Container>
      </Box>
    );
  }

  const loadingFirst = query.loading && !data;
  const optionAmount = (o) => o.value === 'pay-after-inspection'
    ? `₦${commaInt(o.amount_due)} today`
    : `₦${commaInt(o.amount_due)}`;

  return (
    <Box bg="white" minH="100vh">
      {header}
      <Container maxW="container.xl" pb={16}>
        {pending && (
          <Box mb={6}>
            <PaymentRecoveryNotice reference={pending.reference} message={pending.message} onRetry={retryPending} retrying={placing} />
          </Box>
        )}

        <Flex gap={8} direction={{ base: 'column', lg: 'row' }} align="start">
          {/* Car summary first on phones */}
          <Box w="100%" maxW={{ lg: '360px' }} order={{ base: 0, lg: 1 }} position={{ lg: 'sticky' }} top={{ lg: '90px' }}>
            {loadingFirst ? <Skeleton h="360px" borderRadius="20px" /> : <CarCard listing={listing} commaInt={commaInt} />}
          </Box>

          <Box as="form" noValidate onSubmit={proceed} flex={1} w="100%" minW={0} order={{ base: 1, lg: 0 }}>
            {blocked && (
              <Alert status="error" borderRadius="md" mb={6}><AlertIcon /><AlertDescription>{data.unavailable_reason}</AlertDescription></Alert>
            )}

            <Heading as="h2" size="md" mb={4}>Your details</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isReadOnly>
                <FormLabel>Name</FormLabel>
                <Input value={`${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim()} readOnly bg="gray.50" />
              </FormControl>
              <FormControl isReadOnly>
                <FormLabel>Email</FormLabel>
                <Input value={authUser?.email || ''} readOnly bg="gray.50" />
              </FormControl>
              <FormControl isRequired={!customerPhone} isInvalid={submitted && Boolean(errors.phone)}>
                <FormLabel>Phone number</FormLabel>
                {customerPhone ? (
                  <Input value={customerPhone} readOnly bg="gray.50" />
                ) : (
                  <InputGroup>
                    <InputLeftAddon>🇳🇬 +234</InputLeftAddon>
                    <Input type="tel" inputMode="tel" autoComplete="tel-national" placeholder="803 123 4567"
                      value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </InputGroup>
                )}
                <FormErrorMessage>{errors.phone}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <Heading as="h2" size="md" mt={8} mb={4}>{isRental ? 'Pickup & trip' : 'Delivery'}</Heading>
            <VStack spacing={4} align="stretch">
              {isRental && (
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <FormControl isRequired isInvalid={submitted && Boolean(errors.dates)}>
                    <FormLabel htmlFor="rent-from">Pick-up date</FormLabel>
                    <Input id="rent-from" type="date" min={todayISO()} value={dates.from}
                      onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))} />
                  </FormControl>
                  <FormControl isRequired isInvalid={submitted && Boolean(errors.dates)}>
                    <FormLabel htmlFor="rent-until">Return date</FormLabel>
                    <Input id="rent-until" type="date" min={dates.from || todayISO()} value={dates.until}
                      onChange={(e) => setDates((d) => ({ ...d, until: e.target.value }))} />
                    <FormErrorMessage>{errors.dates}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>
              )}
              {isRental && data?.dates_error && !submitted && (
                <Text fontSize="sm" color="orange.600" role="status">{data.dates_error}</Text>
              )}

              <FormControl isRequired isInvalid={submitted && Boolean(errors.area)}>
                <FormLabel htmlFor="checkout-area">{isRental ? 'Pickup / delivery area' : 'Delivery area'}</FormLabel>
                <Box borderWidth="1px" borderRadius="md" borderColor={submitted && errors.area ? 'red.500' : 'inherit'}>
                  <CustomPlacesAutocomplete
                    id="checkout-area"
                    aria-label={isRental ? 'Pickup or delivery area' : 'Delivery area'}
                    placeholder="Search your area, e.g. Lekki Phase 1"
                    value={form.area}
                    onPlaceChange={(p) => setForm((f) => ({ ...f, area: p.formatted_address || '', lat: p.lat ?? '', lng: p.lng ?? '', postal_code: f.postal_code || p.zip_code || '' }))}
                    inputProps={{ onInput: (e) => setForm((f) => ({ ...f, area: e.target.value, lat: '', lng: '' })) }}
                  />
                </Box>
                <FormErrorMessage>{errors.area}</FormErrorMessage>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired isInvalid={submitted && Boolean(errors.street)}>
                  <FormLabel htmlFor="checkout-street">Street address</FormLabel>
                  <Input id="checkout-street" autoComplete="street-address" placeholder="House number and street"
                    value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
                  <FormErrorMessage>{errors.street}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={Boolean(errors.postal_code)}>
                  <FormLabel htmlFor="checkout-postal">Postal code (optional)</FormLabel>
                  <Input id="checkout-postal" inputMode="numeric" autoComplete="postal-code" maxLength={8}
                    value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value.replace(/\D/g, '') }))} />
                  <FormErrorMessage>{errors.postal_code}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              {isRental && data?.driver_available && (
                <FormControl display="flex" alignItems="center" gap={3}>
                  <Switch id="with-driver" isChecked={form.with_driver} onChange={(e) => setForm((f) => ({ ...f, with_driver: e.target.checked }))} />
                  <FormLabel htmlFor="with-driver" mb={0}>Request a driver <Text as="span" color="gray.600" fontSize="sm">(the dealer confirms driver charges)</Text></FormLabel>
                </FormControl>
              )}
            </VStack>

            <Heading as="h2" size="md" mt={8} mb={4}>Summary</Heading>
            <Box borderWidth={1} borderRadius="lg" p={{ base: 4, md: 5 }}>
              {loadingFirst || !pricing ? (
                <VStack align="stretch" spacing={3}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h="18px" />)}</VStack>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {isRental ? (
                    <SummaryRow
                      label={`₦${commaInt(pricing.price)} × ${pricing.units} ${pricing.unit_label || 'period'}${Number(pricing.units) === 1 ? '' : 's'}${pricing.days && pricing.unit_label !== 'day' ? ` (${pricing.days} day${pricing.days === 1 ? '' : 's'})` : ''}`}
                      value={`₦${commaInt(pricing.sub_total)}`}
                    />
                  ) : (
                    <SummaryRow label="Car price" value={`₦${commaInt(pricing.sub_total)}`} />
                  )}
                  <SummaryRow muted label={`VAT (${Number(pricing.tax_rate) * 100}%)`} value={`₦${commaInt(pricing.tax)}`} />
                  <SummaryRow muted label={`Motaa service fee (${Number(pricing.motaa_fee_rate) * 100}%)`} value={`₦${commaInt(pricing.motaa_fee)}`} />
                  <SummaryRow muted label="Inspection fee" value={`₦${commaInt(pricing.inspection_fee)}`} />
                  <Divider my={2} />
                  <SummaryRow bold label="Total" value={`₦${commaInt(pricing.total)}`} />
                  {form.payment_option === 'pay-after-inspection' && (
                    <>
                      <SummaryRow bold label="Due today (inspection fee)" value={`₦${commaInt(pricing.inspection_fee)}`} />
                      <Text fontSize="sm" color="gray.600">You'll pay the remaining ₦{commaInt(Number(pricing.total) - Number(pricing.inspection_fee))} after the inspection.</Text>
                    </>
                  )}
                  {isRental && dates.from && dates.until && !data?.dates_error && (
                    <Text fontSize="sm" color="gray.600">{naturalDate(new Date(`${dates.from}T00:00`))} → {naturalDate(new Date(`${dates.until}T00:00`))}</Text>
                  )}
                </VStack>
              )}
            </Box>

            <Heading as="h2" size="md" mt={8} mb={4}>Payment</Heading>
            {loadingFirst ? <Skeleton h="96px" borderRadius="lg" /> : (
              <FormControl isInvalid={submitted && Boolean(errors.option)}>
                <FormLabel srOnly>Payment option</FormLabel>
                <SimpleGrid columns={{ base: 1, md: options.length }} spacing={3} {...getRootProps()}>
                  {options.map((option) => (
                    <PaymentOptionCard
                      key={option.value}
                      option={option}
                      meta={OPTION_META[option.value]}
                      amountLabel={option.value === 'wallet' ? `Balance ₦${commaInt(data?.wallet_balance)}` : optionAmount(option)}
                      {...getRadioProps({ value: option.value, isDisabled: !option.available })}
                    />
                  ))}
                </SimpleGrid>
                <FormErrorMessage>{errors.option}</FormErrorMessage>
                {form.payment_option === 'wallet' && selected && !selected.available && (
                  <Button as={RLink} to="/wallet/deposit" size="sm" variant="link" color="primary" mt={2}>Top up your wallet</Button>
                )}
              </FormControl>
            )}

            <FormControl isRequired isInvalid={submitted && Boolean(errors.consent)} mt={6}>
              <HStack align="start" spacing={3} p={4} borderWidth={1} borderColor="primary" bg="blue.50" borderRadius="lg">
                <Checkbox mt={1} isChecked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} aria-describedby="escrow-copy" />
                <Box>
                  <Text id="escrow-copy" fontSize="sm">
                    I understand that Motaa doesn't sell cars. My payment is held in escrow and only released to the dealer after I confirm I've received the car.
                  </Text>
                  <Button variant="link" size="sm" color="primary" mt={1} onClick={escrowInfo.onToggle} aria-expanded={escrowInfo.isOpen}>
                    What is escrow?
                  </Button>
                  <Collapse in={escrowInfo.isOpen} animateOpacity>
                    <Text fontSize="sm" color="gray.700" mt={2}>
                      Escrow means Motaa holds your money safely while the deal happens. The dealer is paid only when you tap
                      “I’ve received my car” on your order. If the dealer can’t deliver, your money isn’t released to them.
                    </Text>
                  </Collapse>
                </Box>
              </HStack>
              <FormErrorMessage>{errors.consent}</FormErrorMessage>
            </FormControl>

            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={6}>
              <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} size="lg" flex={1}
                isLoading={paying || placing} loadingText={paying ? 'Opening Paystack' : 'Placing order'}
                isDisabled={loadingFirst || blocked || Boolean(pending)} leftIcon={<Lock size={18} />}>
                {pricing ? (form.payment_option === 'wallet' ? `Pay ₦${commaInt(amountDue)} from wallet` : `Pay ₦${commaInt(amountDue)}`) : 'Pay'}
              </Button>
              <Button as={RLink} to={listing ? `/${isRental ? 'rent' : 'buy'}/${listing.uuid}` : '/home'} variant="ghost" size="lg" color="primary">
                Cancel
              </Button>
            </Stack>
            <HStack mt={3} spacing={2} color="gray.600" fontSize="sm">
              <Icon as={ShieldCheck} aria-hidden="true" />
              <Text>Online payments are processed securely by Paystack. Motaa never stores your card details.</Text>
            </HStack>
          </Box>
        </Flex>
      </Container>

      <WalletPayDialog
        isOpen={walletDialog.isOpen}
        onClose={walletDialog.onClose}
        onConfirm={payWithWallet}
        isLoading={placing}
        amount={amountDue}
        balance={data?.wallet_balance}
        title="Pay for this car from your wallet"
      />
    </Box>
  );
}

export default CheckoutPage;
