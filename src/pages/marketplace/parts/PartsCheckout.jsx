// /parts/checkout — delivery details and payment for the parts cart. One payment, one order per seller.
// Every amount shown (and charged) is the API's quote for the chosen state and delivery method.
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useNavigate } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Collapse, Container, Divider, Flex, FormControl,
  FormErrorMessage, FormHelperText, FormLabel, Heading, HStack, Icon, Input, ListItem, Select, SimpleGrid, Skeleton,
  Stack, Text, Textarea, UnorderedList, useDisclosure, useRadio, useRadioGroup,
} from '@chakra-ui/react';
import { CreditCard, Lock, MapPin, ShieldCheck, ShoppingCart, Truck, Wallet as WalletIcon } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { toApiError } from '../../../api/client';
import { PartPhoto, ReturnPolicy, SummaryRow, announcePartsCart } from '../../../components/parts';
import { EmptyState, ErrorState } from '../../../components/states';
import { newReference, PaymentRecoveryNotice, usePaystack, WalletPayDialog } from '../../../components/wallet';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { NIGERIAN_STATES } from '../../../data/nigeria';
import { PLACED_ORDERS_KEY, validateDelivery } from '../../../utils/parts';

const PENDING_KEY = 'motaa:pending-parts-checkout';

const OPTION_META = {
  card: { icon: CreditCard, title: 'Pay online', hint: 'Card, bank transfer or USSD via Paystack' },
  wallet: { icon: WalletIcon, title: 'Motaa wallet', hint: 'Pay from your wallet balance' },
};
const METHODS = [
  { value: 'delivery', icon: Truck, title: 'Delivery', hint: 'The seller sends it to your address' },
  { value: 'pickup', icon: MapPin, title: 'Pickup', hint: "Collect it from the seller's address" },
];

function readPending() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PENDING_KEY) || 'null');
    return saved?.reference && saved?.payload ? saved : null;
  } catch { return null; }
}
function writePending(value) {
  try {
    if (value) window.localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(PENDING_KEY);
  } catch { /* storage unavailable */ }
}

function ChoiceCard({ icon, title, hint, note, problem, disabled, ...radioProps }) {
  const { getInputProps, getRadioProps, state } = useRadio({ ...radioProps, isDisabled: disabled });
  return (
    <Box as="label" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? 0.6 : 1}>
      <input {...getInputProps()} />
      <Flex {...getRadioProps()} borderWidth="2px" borderRadius="lg" p={4} gap={3} align="start" h="100%"
        borderColor={state.isChecked ? 'primary' : 'gray.200'} bg={state.isChecked ? 'blue.50' : 'white'} _focusVisible={{ boxShadow: 'outline' }}>
        <Icon as={icon} boxSize={6} color="primary" mt={0.5} aria-hidden="true" />
        <Box flex={1} minW={0}>
          <Text className="bold">{title}</Text>
          <Text fontSize="sm" color="gray.600">{hint}</Text>
          {note && <Text fontSize="sm" mt={1} className="bold" color="secondary">{note}</Text>}
          {problem && <Text fontSize="xs" color="red.600" mt={1}>{problem}</Text>}
        </Box>
      </Flex>
    </Box>
  );
}

export default function PartsCheckout() {
  const navigate = useNavigate();
  const { api, commaInt, notifyError } = useContext(GlobalStore);
  const pay = usePaystack();
  const walletDialog = useDisclosure();
  const policy = useDisclosure();

  const [form, setForm] = useState({
    delivery_method: 'delivery', delivery_address: '', state: '', city: '', phone_number: '', note: '', payment_option: 'card',
  });
  const [methods, setMethods] = useState({}); // { store uuid: 'delivery' | 'pickup' }, used when the cart has several sellers
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState(readPending); // { reference, payload, message }: charged, not yet recorded
  const [notice, setNotice] = useState(''); // the API's last word on a payment that could not become an order

  useEffect(() => { document.title = 'Checkout | Motaa spare parts'; }, []);

  const qs = new URLSearchParams({ delivery_method: form.delivery_method });
  if (form.state) qs.set('state', form.state);
  const methodsKey = Object.keys(methods).length ? JSON.stringify(methods) : '';
  if (methodsKey) qs.set('methods', methodsKey);
  const query = useApiQuery(
    (client, signal) => client.get(`/parts/checkout/?${qs.toString()}`, { signal }),
    [form.state, form.delivery_method, methodsKey],
    { select: (body) => body?.data }
  );
  const data = query.data;
  const groups = asList(data?.groups);
  const problems = asList(data?.problems);
  const options = asList(data?.payment_options).filter((option) => OPTION_META[option.value]);
  const selected = options.find((option) => option.value === form.payment_option);
  const needsAddress = groups.some((group) => group.method === 'delivery');
  const pickupOffered = groups.some((group) => group.pickup_available);
  const perSeller = groups.length > 1; // each seller's delivery or pickup is chosen separately
  const waitingForState = needsAddress && !form.state;

  // the phone number on the account is the default
  const accountPhone = data?.customer?.phone_number || '';
  useEffect(() => {
    if (accountPhone) setForm((f) => (f.phone_number ? f : { ...f, phone_number: accountPhone }));
  }, [accountPhone]);

  // keep the payment choice valid (e.g. the wallet can't cover the new total)
  useEffect(() => {
    if (options.length && (!selected || !selected.available)) {
      const first = options.find((option) => option.available);
      if (first && first.value !== form.payment_option) setForm((f) => ({ ...f, payment_option: first.value }));
    }
  }, [options, selected, form.payment_option]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setServerErrors((e) => ({ ...e, [name]: '' }));
  }

  const methodGroup = useRadioGroup({ name: 'delivery-method', value: form.delivery_method, onChange: (value) => setField('delivery_method', value) });
  const paymentGroup = useRadioGroup({ name: 'payment-option', value: form.payment_option, onChange: (value) => setField('payment_option', value) });

  const clientErrors = validateDelivery(form, { needsAddress });
  if (!selected?.available) clientErrors.payment_option = 'Choose an available payment option.';
  const errorFor = (name) => serverErrors[name] || (submitted ? clientErrors[name] : '') || '';
  const valid = Object.keys(clientErrors).length === 0;
  const blocked = problems.length > 0;
  const quoteReady = Boolean(data) && !query.loading && !query.error;

  function payload(reference) {
    return {
      payment_option: form.payment_option,
      reference,
      delivery_method: perSeller ? 'delivery' : form.delivery_method,
      // send each seller's method exactly as the quote priced it
      ...(perSeller || methodsKey ? { methods: Object.fromEntries(groups.map((group) => [group.store?.uuid, group.method])) } : {}),
      delivery_address: form.delivery_address.trim(),
      state: form.state,
      city: form.city.trim(),
      phone_number: form.phone_number.trim(),
      note: form.note.trim(),
    };
  }

  /** POST the checkout. Resolves on success (and leaves the page), or throws the ApiError. */
  async function submitOrder(body) {
    setPlacing(true);
    try {
      const result = await api.post('/parts/checkout/', body);
      const orders = asList(result?.data?.orders);
      writePending(null);
      setPending(null);
      announcePartsCart(0);
      try { window.sessionStorage.setItem(PLACED_ORDERS_KEY, JSON.stringify(orders)); } catch { /* storage unavailable */ }
      navigate('/parts/checkout/placed', { replace: true, state: { orders } });
    } finally {
      setPlacing(false);
    }
  }

  /** A paid checkout the server refused for good (409): the money is in the wallet, nothing to retry. */
  function settleRefused(error) {
    writePending(null);
    setPending(null);
    setNotice(error.message);
    query.reload();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function proceed(e) {
    e?.preventDefault();
    setSubmitted(true);
    setNotice('');
    if (!valid || blocked || !quoteReady || waitingForState || pending) return;
    if (form.payment_option === 'wallet') return walletDialog.onOpen();

    setPaying(true);
    const reference = newReference('mtprt');
    const response = await pay({ amount: data.total, reference, metadata: { purpose: 'parts-order', items: data.count } });
    setPaying(false);
    if (!response) return; // closed the popup without paying
    const body = payload(response.reference || reference);
    // remember the charge until the server records it (survives a reload)
    const record = { reference: body.reference, payload: body };
    writePending(record);
    setPending(record);
    try {
      await submitOrder(body);
    } catch (err) {
      const error = toApiError(err);
      if (error.status === 409) return settleRefused(error);
      const next = { ...record, message: error.message };
      writePending(next);
      setPending(next);
    }
  }

  async function retryPending() {
    try {
      await submitOrder(pending.payload);
    } catch (err) {
      const error = toApiError(err);
      if (error.status === 409) return settleRefused(error);
      const next = { ...pending, message: error.message || 'Still no luck. Check your connection, or contact support with this reference.' };
      writePending(next);
      setPending(next);
    }
  }

  async function payWithWallet() {
    try {
      await submitOrder(payload(undefined));
    } catch (err) {
      const error = toApiError(err);
      const fields = error.fieldErrors;
      if (error.status === 400 && Object.keys(fields).length) setServerErrors(fields);
      if (!error.isNetworkError && !(error.status >= 500)) notifyError(error, "Couldn't place your order");
      if (error.status === 409 || error.status === 402) query.reload();
    } finally {
      walletDialog.onClose();
    }
  }

  const header = (
    <Box bg="primary" py={{ base: 6, md: 8 }} mb={{ base: 6, md: 8 }}>
      <Container maxW="container.xl" textAlign="center">
        <Heading as="h1" color="white" size="lg" fontWeight="500">Checkout</Heading>
        <Text color="whiteAlpha.900" mt={2}>Spare parts</Text>
      </Container>
    </Box>
  );

  if (query.error && !data) {
    return <Box minH="70vh">{header}<Container maxW="container.md"><ErrorState error={query.error} onRetry={query.reload} /></Container></Box>;
  }
  const loadingFirst = query.loading && !data;
  if (data && groups.length === 0 && !pending) {
    return (
      <Box minH="70vh">{header}
        <Container maxW="container.md">
          {notice && <Alert status="warning" borderRadius="md" mb={4}><AlertIcon /><AlertDescription>{notice}</AlertDescription></Alert>}
          <EmptyState icon={ShoppingCart} title="Your parts cart is empty" description="Add the parts you need, then come back to check out." action={{ label: 'Browse spare parts', to: '/parts' }} />
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="white" minH="100vh">
      {header}
      <Container maxW="container.xl" pb={16}>
        {pending && (
          <Box mb={6}><PaymentRecoveryNotice reference={pending.reference} message={pending.message} onRetry={retryPending} retrying={placing} /></Box>
        )}
        {notice && (
          <Alert status="warning" variant="left-accent" borderRadius="md" mb={6} alignItems="start" role="alert">
            <AlertIcon />
            <Box>
              <AlertTitle>Your order was not placed</AlertTitle>
              <AlertDescription display="block" fontSize="sm">{notice}</AlertDescription>
              <Button as={RLink} to="/wallet" size="sm" variant="link" color="primary" mt={1}>Open your wallet</Button>
            </Box>
          </Alert>
        )}
        {blocked && (
          <Alert status="error" borderRadius="md" mb={6} alignItems="start" role="alert">
            <AlertIcon />
            <Box>
              <AlertTitle>You can't check out yet</AlertTitle>
              <AlertDescription display="block">
                <UnorderedList mt={1} spacing={1}>{problems.map((problem, index) => <ListItem key={index}>{problem}</ListItem>)}</UnorderedList>
              </AlertDescription>
              <Button as={RLink} to="/parts/cart" size="sm" variant="link" color="red.700" mt={2}>Go back to your cart</Button>
            </Box>
          </Alert>
        )}

        <Flex gap={8} direction={{ base: 'column', lg: 'row' }} align="start">
          {/* Order summary: first on phones, a sticky column on wide screens */}
          <Box w="100%" maxW={{ lg: '400px' }} order={{ base: 0, lg: 1 }} position={{ lg: 'sticky' }} top={{ lg: '90px' }}>
            {loadingFirst ? <Skeleton h="320px" borderRadius="xl" /> : (
              <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 5 }} opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
                <Heading as="h2" size="sm" mb={4}>Your order</Heading>
                <Stack spacing={5} divider={<Divider />}>
                  {groups.map((group) => (
                    <Box key={group.store?.uuid}>
                      <Text fontWeight="600" mb={2}>{group.store?.name}</Text>
                      <Stack as="ul" listStyleType="none" spacing={2}>
                        {asList(group.items).map((line) => (
                          <Flex as="li" key={line.part?.uuid} gap={3} align="center">
                            <PartPhoto src={line.part?.image} alt={line.part?.name || 'Part'} boxSize="44px" borderRadius="md" iconSize={5} />
                            <Box flex={1} minW={0}>
                              <Text fontSize="sm" noOfLines={2}>{line.part?.name}</Text>
                              <Text fontSize="xs" color="gray.600">Qty {line.quantity}</Text>
                            </Box>
                            <Text fontSize="sm" fontWeight="600" whiteSpace="nowrap">₦{commaInt(line.line_total)}</Text>
                          </Flex>
                        ))}
                      </Stack>
                      <Box mt={3} fontSize="sm">
                        {group.method === 'pickup' ? (
                          <SummaryRow muted label={`Pickup${group.store?.pickup_address ? ` at ${group.store.pickup_address}` : ''}`} value="Free" />
                        ) : (
                          <SummaryRow muted
                            label={`Delivery${form.state ? ` to ${form.state}` : ''}${group.store?.delivery_days ? ` (${group.store.delivery_days})` : ''}`}
                            value={!form.state ? 'Choose a state' : group.delivery_fee_quote === null ? 'Not available' : `₦${commaInt(group.delivery_fee)}`} />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
                <Divider my={4} />
                <Stack spacing={2}>
                  <SummaryRow label={`Parts (${data?.count})`} value={`₦${commaInt(data?.items_total)}`} />
                  <SummaryRow muted label="Delivery" value={waitingForState ? 'Choose a state' : `₦${commaInt(data?.delivery_total)}`} />
                  <Divider />
                  <SummaryRow bold label="Total" value={waitingForState ? '—' : `₦${commaInt(data?.total)}`} />
                </Stack>
              </Box>
            )}
          </Box>

          <Box as="form" noValidate onSubmit={proceed} flex={1} w="100%" minW={0} order={{ base: 1, lg: 0 }}>
            <Heading as="h2" size="md" mb={4}>How do you want to get it?</Heading>
            {perSeller ? (
              <Stack spacing={3}>
                <Text fontSize="sm" color="gray.600">Your parts come from {groups.length} sellers. Choose delivery or pickup for each one.</Text>
                {groups.map((group) => {
                  const uuid = group.store?.uuid;
                  const choices = [
                    { value: 'delivery', label: 'Delivery', icon: Truck, available: group.delivery_available, why: form.state ? `Does not deliver to ${form.state}` : 'Does not deliver' },
                    { value: 'pickup', label: 'Pickup', icon: MapPin, available: group.pickup_available, why: 'No pickup' },
                  ];
                  return (
                    <Box key={uuid} role="radiogroup" aria-label={`How to get your parts from ${group.store?.name}`} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={3}>
                      <Text fontWeight="600" mb={2}>{group.store?.name}</Text>
                      <Stack direction={{ base: 'column', sm: 'row' }} spacing={2}>
                        {choices.map((choice) => {
                          const active = group.method === choice.value;
                          return (
                            <Button key={choice.value} role="radio" aria-checked={active} isDisabled={!choice.available && !active} flex={1} h="auto" py={2}
                              variant="outline" borderWidth="2px" borderColor={active ? 'primary' : 'gray.200'} bg={active ? 'blue.50' : 'white'} whiteSpace="normal"
                              leftIcon={<Icon as={choice.icon} aria-hidden="true" />}
                              onClick={() => { if (!active) setMethods((current) => ({ ...Object.fromEntries(groups.map((g) => [g.store?.uuid, g.method])), ...current, [uuid]: choice.value })); }}>
                              <Box textAlign="left">
                                <Text>{choice.label}</Text>
                                {!choice.available && <Text fontSize="xs" fontWeight="500" color="red.600">{choice.why}</Text>}
                                {choice.available && choice.value === 'pickup' && group.store?.pickup_address && <Text fontSize="xs" fontWeight="500" color="gray.600">{group.store.pickup_address}</Text>}
                              </Box>
                            </Button>
                          );
                        })}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
            <>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} {...methodGroup.getRootProps()}>
              {METHODS.map((method) => {
                const disabled = method.value === 'pickup' && !loadingFirst && !pickupOffered;
                return (
                  <ChoiceCard key={method.value} icon={method.icon} title={method.title} hint={method.hint} disabled={disabled}
                    problem={disabled ? 'None of these sellers offer pickup.' : ''}
                    {...methodGroup.getRadioProps({ value: method.value })} />
                );
              })}
            </SimpleGrid>
            {form.delivery_method === 'pickup' && needsAddress && (
              <Text fontSize="sm" color="gray.600" mt={2}>This seller doesn't offer pickup, so your parts will be delivered.</Text>
            )}
            </>
            )}

            <Heading as="h2" size="md" mt={8} mb={4}>{needsAddress ? 'Delivery details' : 'Your contact'}</Heading>
            <Stack spacing={4}>
              {needsAddress && (
                <>
                  <FormControl isRequired isInvalid={Boolean(errorFor('delivery_address'))}>
                    <FormLabel>Delivery address</FormLabel>
                    <Input autoComplete="street-address" placeholder="House number, street and area" maxLength={300}
                      value={form.delivery_address} onChange={(e) => setField('delivery_address', e.target.value)} />
                    <FormErrorMessage>{errorFor('delivery_address')}</FormErrorMessage>
                  </FormControl>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired isInvalid={Boolean(errorFor('state'))}>
                      <FormLabel>State</FormLabel>
                      <Select placeholder="Choose a state" value={form.state} onChange={(e) => setField('state', e.target.value)}>
                        {NIGERIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                      </Select>
                      {errorFor('state')
                        ? <FormErrorMessage>{errorFor('state')}</FormErrorMessage>
                        : <FormHelperText>Delivery fees depend on the state.</FormHelperText>}
                    </FormControl>
                    <FormControl isInvalid={Boolean(errorFor('city'))}>
                      <FormLabel>City or town (optional)</FormLabel>
                      <Input autoComplete="address-level2" maxLength={100} value={form.city} onChange={(e) => setField('city', e.target.value)} />
                      <FormErrorMessage>{errorFor('city')}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                </>
              )}
              <FormControl isRequired isInvalid={Boolean(errorFor('phone_number'))}>
                <FormLabel>Phone number</FormLabel>
                <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" maxLength={20}
                  value={form.phone_number} onChange={(e) => setField('phone_number', e.target.value)} />
                {errorFor('phone_number')
                  ? <FormErrorMessage>{errorFor('phone_number')}</FormErrorMessage>
                  : <FormHelperText>The seller calls this number about your order.</FormHelperText>}
              </FormControl>
              <FormControl>
                <FormLabel>Note for the seller (optional)</FormLabel>
                <Textarea rows={2} maxLength={500} placeholder="e.g. Call before you come" value={form.note} onChange={(e) => setField('note', e.target.value)} />
              </FormControl>
            </Stack>

            <Heading as="h2" size="md" mt={8} mb={4}>Payment</Heading>
            {loadingFirst ? <Skeleton h="96px" borderRadius="lg" /> : (
              <FormControl isInvalid={Boolean(errorFor('payment_option'))}>
                <FormLabel srOnly>Payment option</FormLabel>
                <SimpleGrid columns={{ base: 1, md: Math.max(1, options.length) }} spacing={3} {...paymentGroup.getRootProps()}>
                  {options.map((option) => (
                    <ChoiceCard key={option.value} icon={OPTION_META[option.value].icon} title={OPTION_META[option.value].title}
                      hint={OPTION_META[option.value].hint} disabled={!option.available}
                      note={option.value === 'wallet' ? `Balance ₦${commaInt(data?.wallet_balance)}` : ''}
                      problem={!option.available ? option.reason : ''}
                      {...paymentGroup.getRadioProps({ value: option.value })} />
                  ))}
                </SimpleGrid>
                <FormErrorMessage>{errorFor('payment_option')}</FormErrorMessage>
                {options.some((option) => option.value === 'wallet' && !option.available) && (
                  <Button as={RLink} to="/wallet/deposit" size="sm" variant="link" color="primary" mt={2}>Top up your wallet</Button>
                )}
              </FormControl>
            )}

            <Box mt={6} p={4} borderWidth={1} borderColor="primary" bg="blue.50" borderRadius="lg">
              <HStack align="start" spacing={3}>
                <Icon as={ShieldCheck} boxSize={5} color="primary" mt={0.5} aria-hidden="true" />
                <Box>
                  <Text fontSize="sm">
                    Motaa holds your payment in escrow. The seller is paid when you confirm you have received your order
                    {data?.release_days ? `, or automatically ${data.release_days} days after delivery if you do nothing` : ''}.
                    {data?.return_days ? ` You can ask for a return within ${data.return_days} days of delivery.` : ''}
                  </Text>
                  <Button variant="link" size="sm" color="primary" mt={1} onClick={policy.onToggle} aria-expanded={policy.isOpen}>
                    {policy.isOpen ? 'Hide the return policy' : 'Read the return policy'}
                  </Button>
                </Box>
              </HStack>
              <Collapse in={policy.isOpen} animateOpacity>
                <ReturnPolicy text={data?.return_policy} mt={4} />
              </Collapse>
            </Box>

            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={6}>
              <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} size="lg" flex={1}
                isLoading={paying || placing} loadingText={paying ? 'Opening Paystack' : 'Placing order'}
                isDisabled={!quoteReady || blocked || waitingForState || Boolean(pending)} leftIcon={<Lock size={18} />}>
                {waitingForState || !data ? 'Pay' : form.payment_option === 'wallet' ? `Pay ₦${commaInt(data.total)} from wallet` : `Pay ₦${commaInt(data.total)}`}
              </Button>
              <Button as={RLink} to="/parts/cart" variant="ghost" size="lg" color="primary">Back to cart</Button>
            </Stack>
            {waitingForState && <Text fontSize="sm" color="gray.600" mt={2}>Choose your state to see the delivery fee and total.</Text>}
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
        amount={data?.total}
        balance={data?.wallet_balance}
        title="Pay for these parts from your wallet"
        description="The money is held in escrow and released to the seller once you confirm you have received your order."
      />
    </Box>
  );
}
