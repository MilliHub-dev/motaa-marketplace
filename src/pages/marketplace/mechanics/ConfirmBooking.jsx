import { useContext, useState } from 'react';
import { Link as RLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Check, CheckCircle2, CreditCard, Info, Send, Star, Wallet as WalletIcon } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { CustomPlacesAutocomplete, MapComponent } from '../../../components/maps';
import { BackButton } from '../../../components/nav';
import { ChatPopup } from '../../../components/chat';
import { AsyncState } from '../../../components/states';
import { MechanicListSkeleton } from '../../../components/loaders';
import { newReference, PaymentRecoveryNotice, usePaystack } from '../../../components/wallet';
import { isPinCancelled, useWalletPin } from '../../../components/walletPin';
import { asList } from '../../../utils';
import { bookingAmountDue, bookingErrorCode, hasServiceCharge, serviceChargeLabel } from '../../../utils/bookings';
import { distanceLabel } from '../../../utils/transport';

/** Toggleable service chips — real buttons, so they work with keyboard and screen readers. */
const ServicePicker = ({ options, selected, onChange, invalid }) => (
  <Wrap spacing={2} role="group" aria-label="Services">
    {options.map((option) => {
      const on = selected.includes(option);
      return (
        <WrapItem key={option}>
          <Button
            size="sm"
            borderRadius="full"
            variant={on ? 'solid' : 'outline'}
            bg={on ? 'primary' : undefined}
            color={on ? 'white' : 'gray.700'}
            borderColor={invalid ? 'red.400' : 'gray.300'}
            _hover={{ bg: on ? 'secondary' : 'gray.50' }}
            aria-pressed={on}
            leftIcon={on ? <Check size={14} /> : undefined}
            onClick={() => onChange(on ? selected.filter((s) => s !== option) : [...selected, option])}
          >
            {option}
          </Button>
        </WrapItem>
      );
    })}
  </Wrap>
);

function BookingForm({ mechanic }) {
  const { mechId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { api, commaInt, notify, notifyError } = useContext(GlobalStore);
  const pay = usePaystack();
  const { withPin } = useWalletPin();
  const chat = useDisclosure();

  const [point, setPoint] = useState(() => {
    const lat = Number(params.get('lat'));
    const lng = Number(params.get('lng'));
    return params.get('lat') !== null && params.get('lng') !== null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const hasPoint = Boolean(point);
  const { lat, lng } = point || {};
  const [address, setAddress] = useState(params.get('address') || '');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState([]);
  const [method, setMethod] = useState('card');
  const [submitted, setSubmitted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(null); // { reference, payload, message }
  const [booked, setBooked] = useState(null);
  const [addressProblem, setAddressProblem] = useState(''); // the server needs a picked address (needs_location)

  // the price for this address: booking fee + service charge (the mechanic's transport), fetched again
  // whenever the picked point changes; older requests are cancelled by useApiQuery
  const pointKey = point ? `${point.lat.toFixed(6)},${point.lng.toFixed(6)}` : '';
  const quoteQuery = useApiQuery((a, signal) => {
    const qs = new URLSearchParams(point ? { lat: point.lat.toFixed(6), lng: point.lng.toFixed(6) } : {});
    return a.get(`/mechanics/${mechId}/quote/${qs.toString() ? `?${qs}` : ''}`, { signal });
  }, [mechId, pointKey], { select: (b) => b?.data });
  const quote = quoteQuery.data;
  const fee = quote?.booking_fee ?? mechanic?.booking?.fee ?? mechanic?.booking_fee;
  const due = bookingAmountDue(quote, { fee, quoteFailed: Boolean(quoteQuery.error) && !quoteQuery.loading });
  const amount = due.amount;
  const showCharge = Boolean(quote?.enabled) || hasServiceCharge(quote?.service_charge);
  const name = mechanic?.business_name || mechanic?.user?.name || 'this mechanic';
  const serviceOptions = asList(mechanic?.services).map((s) => s?.service).filter(Boolean);
  const wallet = useApiQuery((a, signal) => a.get('/wallet/balance/', { signal }), [], { select: (b) => b?.data });
  const walletBalance = wallet.data?.balance;

  const errors = {
    services: services.length === 0 ? 'Choose at least one service' : '',
    description: description.trim().length < 10 ? 'Describe the problem in a few words (at least 10 characters)' : '',
    address: !address.trim() ? 'Enter where the mechanic should meet you'
      : due.needsLocation ? 'Pick your address from the suggestions so we can work out the service charge.'
        : addressProblem,
  };
  const valid = !errors.services && !errors.description && !errors.address;

  function payload(reference) {
    return {
      payment_method: method,
      reference,
      services,
      problem_description: description.trim(),
      address: address.trim(),
      lat: hasPoint ? lat : undefined,
      lng: hasPoint ? lng : undefined,
      // the signed price the customer was shown (the server charges exactly this, or says it changed)
      quote_token: quote?.quote_token || undefined,
      service_charge: quote?.service_charge ?? undefined,
    };
  }

  /** The server refused the price (409 quote_changed) or needs a picked address (400 needs_location). */
  function handleBookingRefusal(error) {
    const code = bookingErrorCode(error);
    if (code === 'quote_changed') {
      if (error.data?.quote) quoteQuery.setData(error.data.quote);
      else quoteQuery.reload();
      notify({ title: 'The price changed', body: error.message, color: 'orange', duration: 9000 });
      return true;
    }
    if (code === 'needs_location') {
      setSubmitted(true);
      setAddressProblem(error.data?.details?.address || 'Pick your address from the suggestions so we can work out the service charge.');
      return true;
    }
    return false;
  }

  async function send(body) {
    setSending(true);
    try {
      const result = await api.post(`/mechanics/${mechId}/`, body);
      setPending(null);
      // paid: follow the booking on its tracking page
      if (result?.data?.uuid) {
        navigate(`/bookings/${result.data.uuid}`, { replace: true, state: { justBooked: true } });
        return true;
      }
      setBooked(result?.data || {});
      return true;
    } finally {
      setSending(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid || !due.ready) return;
    if (method === 'wallet') return payFromWallet();

    setPaying(true);
    const reference = newReference('mtbk');
    // the whole total: booking fee + service charge
    const response = await pay({ amount, reference, metadata: { purpose: 'booking', mechanic_id: mechId } });
    setPaying(false);
    if (!response) return;
    const body = payload(response.reference || reference);
    setPending({ reference: body.reference, payload: body });
    try {
      await send(body);
    } catch (error) {
      // a different price: the card payment was put in their wallet, nothing to retry
      if (handleBookingRefusal(error)) { setPending(null); return; }
      setPending({ reference: body.reference, payload: body, message: error?.message });
    }
  }

  async function retry() {
    try {
      await send(pending.payload);
    } catch (error) {
      if (handleBookingRefusal(error)) { setPending(null); return; }
      setPending((p) => ({ ...p, message: error?.message }));
    }
  }

  // the total from the wallet, approved with the wallet PIN
  async function payFromWallet() {
    try {
      await withPin((pin) => send({ ...payload(undefined), pin }), {
        title: `Book ${name}`,
        amount,
        balance: walletBalance,
        note: hasServiceCharge(quote?.service_charge)
          ? 'Held in escrow and paid to the mechanic when the job is done. The service charge isn’t refunded if you cancel.'
          : 'The booking fee is held in escrow and released to the mechanic when the job is done.',
        submitLabel: `Pay ₦${commaInt(amount)}`,
      });
    } catch (error) {
      if (isPinCancelled(error)) return;
      if (handleBookingRefusal(error)) return;
      if (!error?.isNetworkError && !(error?.status >= 500)) notifyError(error, "Couldn't book this mechanic");
    }
  }

  if (booked) {
    return (
      <Flex direction="column" align="center" textAlign="center" gap={4} py={16} px={6}>
        <Icon as={CheckCircle2} boxSize={14} color="green.500" aria-hidden="true" />
        <Heading as="h1" size="lg">Booking request sent</Heading>
        <Text maxW="440px" color="gray.700">
          We've told {name} you need help with {services.join(', ')}. Your ₦{commaInt(amount ?? fee)} payment is held in escrow until the job is done.
          You'll get a notification when they respond.
        </Text>
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
          <Button onClick={chat.onOpen} leftIcon={<Send size={16} />} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Message {name}</Button>
          <Button as={RLink} to="/mechanics" variant="outline" color="primary" borderColor="primary">Find more mechanics</Button>
        </Stack>
        <ChatPopup isOpen={chat.isOpen} onClose={chat.onClose} recipient_type="mechanic" recipient_id={mechanic?.uuid} />
      </Flex>
    );
  }

  return (
    <Flex direction={{ base: 'column', md: 'row' }} minH={{ md: 'calc(100vh - 80px)' }}>
      <Box as="form" onSubmit={confirm} noValidate w={{ base: '100%', md: '45%', xl: '40%' }} p={{ base: 4, md: 6 }} borderRightWidth={{ md: 1 }}>
        <VStack align="stretch" spacing={5}>
          <Box><BackButton /></Box>
          <Heading as="h1" size="lg">Confirm your booking</Heading>

          {pending && <PaymentRecoveryNotice reference={pending.reference} message={pending.message} onRetry={retry} retrying={sending} />}

          <Flex align="center" gap={4}>
            <Avatar size="lg" src={mechanic?.logo || undefined} name={name} />
            <Box minW={0}>
              <Heading as="h2" size="md" noOfLines={1}>{name}</Heading>
              <HStack spacing={2} color="gray.700" fontSize="sm" flexWrap="wrap">
                {mechanic?.level && <Text textTransform="capitalize">{mechanic.level}</Text>}
                {Number(mechanic?.rating) > 0 && (
                  <HStack spacing={1}><Icon as={Star} color="yellow.400" fill="currentColor" aria-hidden="true" /><Text className="bold">{mechanic.rating}</Text>
                    <Text color="gray.500">({asList(mechanic?.reviews).length} review{asList(mechanic?.reviews).length === 1 ? '' : 's'})</Text></HStack>
                )}
              </HStack>
            </Box>
          </Flex>

          <FormControl isRequired isInvalid={submitted && Boolean(errors.address)}>
            <FormLabel htmlFor="booking-address">Where should they meet you?</FormLabel>
            <CustomPlacesAutocomplete
              id="booking-address"
              aria-label="Where should they meet you?"
              placeholder="Search a street, area or landmark"
              value={address}
              onPlaceChange={(p) => {
                setAddress(p.formatted_address || '');
                setAddressProblem('');
                if (p.lat != null && p.lng != null) setPoint({ lat: Number(p.lat), lng: Number(p.lng) });
              }}
              // typing a different address drops the picked point: the price is for a picked address
              inputProps={{ onInput: (e) => { setAddress(e.target.value); setPoint(null); } }}
            />
            {quote?.distance_km != null && !due.needsLocation && (
              <FormHelperText>{name} is {distanceLabel(quote.distance_km, quote.drive_minutes)}{quote.distance_by_road === false ? ' (approx.)' : ''}.</FormHelperText>
            )}
            <FormErrorMessage>{errors.address}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={submitted && Boolean(errors.services)}>
            <FormLabel>Services you need</FormLabel>
            {serviceOptions.length
              ? <ServicePicker options={serviceOptions} selected={services} onChange={setServices} invalid={submitted && Boolean(errors.services)} />
              : <Text color="gray.600" fontSize="sm">This mechanic hasn't listed any services yet. Message them before booking.</Text>}
            <FormErrorMessage>{errors.services}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={submitted && Boolean(errors.description)}>
            <FormLabel htmlFor="booking-description">Describe the problem</FormLabel>
            <Textarea id="booking-description" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. The engine light came on and the car shakes when idling" rows={4} maxLength={2000} />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>

          <Box as="section" aria-labelledby="price-heading" borderWidth={1} borderRadius="lg" p={4} aria-busy={quoteQuery.loading}>
            <Heading as="h2" id="price-heading" size="sm" mb={3}>What you pay now</Heading>
            <VStack align="stretch" spacing={2} fontSize="sm">
              <Flex justify="space-between" gap={3}>
                <Text color="gray.700">Booking fee</Text>
                <Text>{fee !== undefined && fee !== null ? `₦${commaInt(fee)}` : '—'}</Text>
              </Flex>
              {showCharge && (
                <Flex justify="space-between" gap={3}>
                  <Text color="gray.700">{due.needsLocation ? 'Service charge' : serviceChargeLabel(quote)}</Text>
                  <Text textAlign="right">
                    {due.needsLocation ? <Text as="span" color="gray.500">Pick your address to see it</Text> : `₦${commaInt(quote?.service_charge)}`}
                  </Text>
                </Flex>
              )}
              <Flex justify="space-between" align="center" gap={3} borderTopWidth={1} pt={2} mt={1}>
                <Text className="bold" fontSize="md">Total</Text>
                {quoteQuery.loading && !quote ? <Skeleton h="20px" w="90px" />
                  : <Text className="bold" fontSize="lg">{amount !== null && amount !== undefined ? `₦${commaInt(amount)}` : '—'}</Text>}
              </Flex>
            </VStack>
            {quote?.note && (hasServiceCharge(quote?.service_charge) || due.needsLocation) && (
              <Text fontSize="sm" color="orange.800" bg="orange.50" borderRadius="md" px={3} py={2} mt={3}>{quote.note}</Text>
            )}
            <HStack align="start" spacing={2} mt={3} color="gray.600" fontSize="sm">
              <Icon as={Info} mt={0.5} aria-hidden="true" />
              <Text>This is held in escrow and paid to the mechanic when the job is done. It doesn't cover repairs — you agree those with the mechanic.</Text>
            </HStack>
            {quoteQuery.error && !quote && (
              <Text fontSize="sm" color="gray.600" mt={2} role="status">We couldn't work out the service charge just now, so only the booking fee is shown.</Text>
            )}
          </Box>

          <FormControl>
            <FormLabel>Pay with</FormLabel>
            <RadioGroup value={method} onChange={setMethod}>
              <Stack spacing={3}>
                <Radio value="card"><HStack spacing={2}><Icon as={CreditCard} aria-hidden="true" /><Text>Card, transfer or USSD (Paystack)</Text></HStack></Radio>
                <Radio value="wallet">
                  <HStack spacing={2}><Icon as={WalletIcon} aria-hidden="true" />
                    <Text>Motaa wallet {walletBalance !== undefined && <Text as="span" color="gray.600">(₦{commaInt(walletBalance)} available)</Text>}</Text>
                  </HStack>
                </Radio>
              </Stack>
            </RadioGroup>
            {method === 'wallet' && walletBalance !== undefined && amount != null && Number(walletBalance) < Number(amount) && (
              <FormHelperText color="red.600">Your wallet balance is too low. <Button as={RLink} to="/wallet/deposit" variant="link" size="sm" color="primary">Top up</Button></FormHelperText>
            )}
          </FormControl>

          <VStack spacing={3}>
            {mechanic?.available === false && (
              <Text role="alert" color="orange.700" bg="orange.50" p={3} borderRadius="md" fontSize="sm">
                {mechanic?.business_name || 'This mechanic'} is busy with another job and isn't taking new bookings right now. Please check back later or choose another mechanic.
              </Text>
            )}
            <Button type="submit" w="full" size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }}
              isLoading={paying || sending} loadingText={paying ? 'Opening Paystack' : 'Sending request'}
              isDisabled={!due.ready || quoteQuery.loading || Boolean(pending) || serviceOptions.length === 0 || mechanic?.available === false}>
              {due.ready ? `Pay ₦${commaInt(amount)} & book` : due.needsLocation ? 'Pick your address to continue' : 'Book'}
            </Button>
            <Button w="full" variant="outline" size="lg" color="gray.700" leftIcon={<Send size={16} />} onClick={chat.onOpen}>
              Message {name}
            </Button>
          </VStack>
        </VStack>
      </Box>

      <Box w={{ base: '100%', md: '55%', xl: '60%' }} minH={{ base: '280px', md: 'auto' }} position="relative">
        {hasPoint ? (
          <MapComponent location={{ lat, lng, name: address || 'Your location' }} label="Map of your location" w="100%" h="100%" minH="280px" />
        ) : (
          <Alert status="info" m={{ base: 4, md: 6 }} borderRadius="md" w="auto">
            <AlertIcon /><AlertDescription>Your address is shared with {name} when you book.</AlertDescription>
          </Alert>
        )}
      </Box>

      <ChatPopup isOpen={chat.isOpen} onClose={chat.onClose} recipient_type="mechanic" recipient_id={mechanic?.uuid} />
    </Flex>
  );
}

const ConfirmBooking = () => {
  const { mechId } = useParams();
  const query = useApiQuery((api, signal) => api.get(`/mechanics/${mechId}/`, { signal }), [mechId], { select: (b) => b?.data });
  return (
    <AsyncState query={query} skeleton={<Box p={6}><MechanicListSkeleton /></Box>} errorTitle={query.error?.isNotFound ? "We couldn't find this mechanic" : undefined}>
      {(mechanic) => <BookingForm mechanic={mechanic} />}
    </AsyncState>
  );
};

export default ConfirmBooking;
