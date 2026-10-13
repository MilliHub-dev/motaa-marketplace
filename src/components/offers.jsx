// Price negotiation in chat: the offer card shown in a conversation, and "Make an offer" on a
// car, rental or spare part page. The server decides every state: buttons come from `offer.actions`,
// checkout from `offer.can_checkout`, wording from `offer.status_label`.
import { useContext, useEffect, useId, useState } from 'react';
import { Link as RLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Badge, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, HStack, Icon, Image, Input,
  InputGroup, InputLeftAddon, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  Tag, Text, VStack,
} from '@chakra-ui/react';
import { Car, CheckCircle, Handshake, Package, Tag as TagIcon } from 'lucide-react';
import { GlobalStore } from '../App';
import { useApiMutation, useApiQuery } from '../hooks/useApi';
import { asList } from '../utils';
import {
  formatOfferAmount, offerAmountProblem, offerCheckoutPath, offerEventLabel, parseOfferAmount, validForWords,
} from '../utils/offers';
import { ActionDialog, announcePartsCart } from './parts';

const CONFIRM = {
  decline: { title: 'Decline this price?', body: 'This ends the negotiation. A new offer can still be made afterwards.', confirmLabel: 'Decline', cancelLabel: 'Keep it open', tone: 'danger' },
  withdraw: { title: 'Withdraw your offer?', body: 'The seller will no longer be able to accept it. You can make a new offer afterwards.', confirmLabel: 'Withdraw offer', cancelLabel: 'Keep it', tone: 'danger' },
};

/** "₦8,000,000 per day" */
function priceText(amount, unit, commaInt) {
  return `₦${commaInt(amount)}${unit ? ` ${unit}` : ''}`;
}

function ItemThumb({ item, size = '48px' }) {
  if (item?.image) return <Image src={item.image} alt="" boxSize={size} objectFit="cover" borderRadius="md" flexShrink={0} />;
  return (
    <Flex boxSize={size} bg="gray.100" borderRadius="md" align="center" justify="center" color="gray.400" flexShrink={0}>
      <Icon as={item?.kind === 'part' ? Package : Car} boxSize={5} aria-hidden="true" />
    </Flex>
  );
}

/** Small tag for a price that came from a negotiation (checkout, parts cart). */
export function AgreedPriceTag(props) {
  return (
    <Tag size="sm" colorScheme="green" borderRadius="full" gap={1} {...props}>
      <Icon as={Handshake} boxSize={3} aria-hidden="true" />
      Price agreed in chat
    </Tag>
  );
}

/** A labelled naira field that groups thousands as the user types. `value` is the text shown. */
export function OfferAmountField({ id, label, value, onChange, error, helper, autoFocus, isDisabled, size = 'md' }) {
  return (
    <FormControl isInvalid={Boolean(error)} isDisabled={isDisabled}>
      <FormLabel htmlFor={id} fontSize={size === 'sm' ? 'sm' : undefined} mb={1}>{label}</FormLabel>
      <InputGroup size={size}>
        <InputLeftAddon>₦</InputLeftAddon>
        <Input id={id} inputMode="numeric" autoComplete="off" placeholder="0" autoFocus={autoFocus}
          value={formatOfferAmount(value)} onChange={(e) => onChange(formatOfferAmount(e.target.value))} />
      </InputGroup>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}

/**
 * Take the customer to pay at an agreed price: the car checkout, the rental page (dates are chosen
 * there), or the parts checkout once the part is in the parts cart.
 * → { go(offer), loading }
 */
export function useOfferCheckout() {
  const navigate = useNavigate();
  const addPart = useApiMutation(
    async (api, offer) => {
      const cart = await api.get('/parts/cart/');
      const lines = asList(cart?.data?.groups).flatMap((group) => asList(group?.items));
      if (lines.some((line) => line?.part?.uuid === offer.item.uuid)) return cart;
      const body = await api.post('/parts/cart/', { part: offer.item.uuid, quantity: 1, add: true });
      announcePartsCart(body?.data?.count);
      return body;
    },
    { errorTitle: "Couldn't add this to your cart", onSuccess: () => navigate('/parts/checkout') }
  );

  function go(offer) {
    const path = offerCheckoutPath(offer);
    if (path) navigate(path);
    else if (offer?.item?.uuid) addPart.mutate(offer);
  }
  return { go, loading: addPart.loading };
}

// ---------------------------------------------------------------- in the conversation

function CounterForm({ offer, onSubmit, onCancel, isLoading, error }) {
  const id = useId();
  const [amount, setAmount] = useState('');
  const [problem, setProblem] = useState('');

  function submit(e) {
    e.preventDefault();
    const invalid = offerAmountProblem(amount);
    setProblem(invalid);
    if (!invalid) onSubmit(parseOfferAmount(amount));
  }

  return (
    <Box as="form" onSubmit={submit} noValidate mt={3}>
      <OfferAmountField id={`${id}-counter`} size="sm" autoFocus isDisabled={isLoading}
        label={`Your price${offer.unit ? ` (${offer.unit})` : ''}`}
        value={amount} onChange={(value) => { setAmount(value); setProblem(''); }} error={problem || error} />
      <HStack mt={2} spacing={2}>
        <Button type="submit" size="sm" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={isLoading} loadingText="Sending">Send counter offer</Button>
        <Button size="sm" variant="ghost" onClick={onCancel} isDisabled={isLoading}>Cancel</Button>
      </HStack>
    </Box>
  );
}

/**
 * One step of a negotiation in a conversation (a chat message that has `offer`).
 *
 * `latest`: this is the newest step, the only one with buttons. Older steps are compact and dimmed.
 * `onAction(offer, action, amount?)` resolves true when the server accepted it; `error` is the
 * server's refusal for this offer. `onCheckout(offer)` pays at the agreed price.
 */
export function OfferCard({ msg, mine, latest, naturalTime, onAction, isBusy, error, onCheckout, isCheckingOut }) {
  const { commaInt } = useContext(GlobalStore);
  const [countering, setCountering] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'decline' | 'withdraw'
  const offer = msg?.offer || {};
  const item = offer.item || {};
  const actions = latest ? asList(offer.actions) : [];
  const date = msg?.date_created ? new Date(msg.date_created) : null;
  const time = date && !Number.isNaN(date.getTime()) ? date : null;
  const label = offerEventLabel(msg?.offer_event, mine);
  const stepPrice = msg?.offer_amount != null && msg.offer_amount !== '' ? priceText(msg.offer_amount, offer.unit, commaInt) : '';
  const agreedStep = msg?.offer_event === 'accepted';
  const validFor = latest && offer.can_checkout ? validForWords(offer.expires_at) : null;

  // the buttons this step had are gone (someone answered): close what was open
  useEffect(() => { if (!actions.includes('counter')) setCountering(false); }, [actions.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(action, amount) {
    const done = await onAction?.(offer, action, amount);
    if (done) setCountering(false);
    setConfirm(null);
  }

  const meta = (time || (mine && msg?.sent_by_name)) && (
    <Text fontSize="xs" color="gray.500" mt={1} textAlign={mine ? 'right' : 'left'}>
      {/* only a business sees which of its team members answered */}
      {mine && msg?.sent_by_name && <>Sent by {msg.sent_by_name}{time ? ' · ' : ''}</>}
      {time && <time dateTime={time.toISOString()}>{naturalTime(time)}</time>}
    </Text>
  );

  if (!latest) {
    return (
      <Box alignSelf={mine ? 'flex-end' : 'flex-start'} maxW={{ base: '85%', md: '70%' }} data-testid="offer-step">
        <Box borderWidth="1px" borderColor="gray.200" bg="gray.50" borderRadius="lg" px={3} py={2} opacity={0.75}>
          <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">{label}</Text>
          <Text fontSize="sm" color="gray.700" overflowWrap="anywhere">
            {stepPrice && <Text as="span" fontWeight="600">{stepPrice}</Text>}
            {stepPrice && item.title ? ' · ' : ''}{item.title}
          </Text>
        </Box>
        {meta}
      </Box>
    );
  }

  return (
    <Box alignSelf={mine ? 'flex-end' : 'flex-start'} w="100%" maxW={{ base: '92%', sm: '360px' }} data-testid="offer-card">
      <Box as="article" aria-label={`${label}${stepPrice ? `: ${stepPrice}` : ''}`} borderWidth="1px" borderRadius="lg" bg="white" color="gray.800" overflow="hidden"
        borderColor={agreedStep ? 'green.300' : 'gray.200'} boxShadow="sm">
        <Flex justify="space-between" align="center" gap={2} px={3} py={2} bg={agreedStep ? 'green.50' : 'gray.50'} borderBottomWidth="1px" borderColor={agreedStep ? 'green.100' : 'gray.200'}>
          <HStack spacing={1.5} minW={0}>
            <Icon as={agreedStep ? Handshake : TagIcon} boxSize={4} color={agreedStep ? 'green.600' : 'primary'} aria-hidden="true" />
            <Text fontSize="sm" fontWeight="700" noOfLines={1}>{label}</Text>
          </HStack>
          {offer.status_label && offer.status_label !== label && (
            <Badge colorScheme={offer.can_checkout || agreedStep ? 'green' : 'gray'} variant="subtle" textTransform="none" borderRadius="full" px={2} flexShrink={0}>
              {offer.status_label}
            </Badge>
          )}
        </Flex>

        <Box p={3}>
          <Flex gap={3} align="center">
            <ItemThumb item={item} />
            <Box minW={0}>
              {item.path
                ? <Text as={RLink} to={item.path} fontWeight="600" noOfLines={2} _hover={{ color: 'primary', textDecoration: 'underline' }}>{item.title}</Text>
                : <Text fontWeight="600" noOfLines={2}>{item.title}</Text>}
              <Text fontSize="sm" color="gray.600">
                Asking <Text as="s">₦{commaInt(offer.listed_price)}</Text>{offer.unit ? ` ${offer.unit}` : ''}
              </Text>
            </Box>
          </Flex>

          {stepPrice && (
            <Text mt={3} fontSize="xl" fontWeight="700" color={agreedStep ? 'green.700' : 'secondary'}>
              ₦{commaInt(msg.offer_amount)}
              {offer.unit && <Text as="span" fontSize="sm" fontWeight="500" color="gray.600"> {offer.unit}</Text>}
            </Text>
          )}

          {offer.can_checkout && (
            <Box mt={3}>
              <Button w="100%" bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={() => onCheckout?.(offer)} isLoading={isCheckingOut}>
                Checkout at ₦{commaInt(offer.amount)}
              </Button>
              {validFor && <Text fontSize="sm" color="gray.600" mt={2}>Agreed price valid {validFor}.</Text>}
            </Box>
          )}

          {countering ? (
            <CounterForm offer={offer} isLoading={isBusy} error={error} onSubmit={(amount) => run('counter', amount)} onCancel={() => setCountering(false)} />
          ) : actions.length > 0 && (
            <Flex mt={3} gap={2} flexWrap="wrap">
              {actions.includes('accept') && (
                <Button size="sm" flex={1} minW="96px" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={isBusy} onClick={() => run('accept')}>
                  Accept
                </Button>
              )}
              {actions.includes('counter') && (
                <Button size="sm" flex={1} minW="96px" variant="outline" borderColor="primary" color="primary" isDisabled={isBusy} onClick={() => setCountering(true)}>
                  Counter
                </Button>
              )}
              {actions.includes('decline') && (
                <Button size="sm" flex={1} minW="96px" variant="outline" colorScheme="red" isDisabled={isBusy} onClick={() => setConfirm('decline')}>
                  Decline
                </Button>
              )}
              {actions.includes('withdraw') && (
                <Button size="sm" flex={1} minW="96px" variant="ghost" colorScheme="red" isDisabled={isBusy} onClick={() => setConfirm('withdraw')}>
                  Withdraw
                </Button>
              )}
            </Flex>
          )}
          {error && !countering && <Text fontSize="sm" color="red.600" mt={2} role="alert">{error}</Text>}
        </Box>
      </Box>
      {meta}

      <ActionDialog isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} isLoading={isBusy} config={CONFIRM[confirm]} onConfirm={() => run(confirm)} />
    </Box>
  );
}

// ---------------------------------------------------------------- on the item's page

/**
 * "Make an offer" modal. `target`: { listing: uuid } or { part: uuid }.
 * `item`: { title, image, price, unit, kind } of what is being bought.
 */
export function MakeOfferModal({ isOpen, onClose, target, item, validHours = 48, onSent }) {
  const { commaInt } = useContext(GlobalStore);
  const id = useId();
  const [amount, setAmount] = useState('');
  const [problem, setProblem] = useState('');
  const [sent, setSent] = useState(null); // the API's answer once the offer is in

  useEffect(() => { if (isOpen) { setAmount(''); setProblem(''); setSent(null); } }, [isOpen]);

  const send = useApiMutation(
    (api, value) => api.post('/chat/offers/', { ...target, amount: value }),
    {
      notifyOnError: false, // the server's reason is shown under the field
      onSuccess: (body) => { setSent({ ...body?.data, text: body?.message }); onSent?.(body?.data); },
      onError: (error) => setProblem(error.message),
    }
  );

  function handleClose() {
    if (!send.loading) onClose?.();
  }

  function submit(e) {
    e.preventDefault();
    const invalid = offerAmountProblem(amount);
    setProblem(invalid);
    if (!invalid && !send.loading) send.mutate(parseOfferAmount(amount));
  }

  const room = sent?.room;
  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, sm: 'lg' }} mx={{ base: 0, sm: 4 }}>
        <ModalHeader pr={12}>{sent ? 'Offer sent' : 'Make an offer'}</ModalHeader>
        <ModalCloseButton aria-label="Close" isDisabled={send.loading} />

        {sent ? (
          <>
            <ModalBody>
              <VStack spacing={3} textAlign="center" py={4}>
                <Flex w={14} h={14} rounded="full" bg="green.50" align="center" justify="center" color="green.500">
                  <Icon as={CheckCircle} boxSize={7} aria-hidden="true" />
                </Flex>
                <Text fontWeight="600">You offered {priceText(sent.offer?.amount, sent.offer?.unit, commaInt)}</Text>
                <Text color="gray.600">{sent.text || 'The seller will reply in your messages.'}</Text>
              </VStack>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={handleClose}>Close</Button>
              <Button as={RLink} to={room ? `/chat/${room}` : '/chat'} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Open chat</Button>
            </ModalFooter>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <ModalBody>
              <Flex gap={3} align="center" p={2} pr={3} mb={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg">
                <ItemThumb item={item} size="56px" />
                <Box minW={0}>
                  <Text fontWeight="600" noOfLines={2}>{item?.title}</Text>
                  <Text fontSize="sm" color="gray.600">Asking price {priceText(item?.price, item?.unit, commaInt)}</Text>
                </Box>
              </Flex>
              <OfferAmountField id={`${id}-amount`} autoFocus isDisabled={send.loading}
                label={`Your offer${item?.unit ? ` (${item.unit})` : ''}`}
                value={amount} onChange={(value) => { setAmount(value); setProblem(''); }} error={problem}
                helper="Offer less than the asking price." />
              <Text fontSize="sm" color="gray.600" mt={4}>
                If the seller accepts, you can check out at that price for {validHours} hours. The seller may also reply with a different price.
              </Text>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={handleClose} isDisabled={send.loading}>Cancel</Button>
              <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={send.loading} loadingText="Sending">Send offer</Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}

/**
 * Negotiation for one item on its own page, for customers: the "Make an offer" button, the state of
 * an open offer, or the agreed price with a way to pay it. Renders nothing for businesses.
 *
 * kind: 'sale' | 'rental' | 'part'. `unit`: 'per day', 'each' or ''.
 * `onCheckout(offer)`: replaces the default way to pay at the agreed price (the rental page uses
 * its own booking form). `checkoutLabel`: that button's text.
 */
export function ItemOffer({ kind, itemId, title, image, price, unit = '', onCheckout, checkoutLabel = 'Checkout at this price', ...props }) {
  const { authUser, commaInt } = useContext(GlobalStore);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const checkout = useOfferCheckout();
  const isCustomer = authUser?.user_type === 'customer';
  const target = kind === 'part' ? { part: itemId } : { listing: itemId };
  const canNegotiate = Boolean(itemId) && Number(price) > 0;

  const query = useApiQuery(
    (api, signal) => api.get(`/chat/offers/?${kind === 'part' ? 'part' : 'listing'}=${encodeURIComponent(itemId)}`, { signal }),
    [kind, itemId, isCustomer],
    { enabled: isCustomer && canNegotiate, select: (body) => body?.data }
  );
  const withdraw = useApiMutation(
    (api, offer) => api.post(`/chat/offers/${offer.uuid}/`, { action: 'withdraw' }),
    {
      errorTitle: "Couldn't withdraw your offer",
      successMessage: (body) => body?.message || 'Offer withdrawn.',
      onSuccess: () => query.reload(),
      onError: () => query.reload(), // it was answered in the meantime: show what it is now
    }
  );

  if (!canNegotiate || (authUser && !isCustomer)) return null;

  const outline = { variant: 'outline', borderColor: 'primary', color: 'primary', w: '100%' };
  if (!authUser) {
    return (
      <Button as={RLink} to={`/login?next=${encodeURIComponent(location.pathname)}`} leftIcon={<TagIcon size={16} />} {...outline} {...props}>
        Make an offer
      </Button>
    );
  }

  const data = query.data;
  const offer = data?.offer;
  const validHours = data?.valid_hours || 48;
  if (!data) return null; // still loading, or the item can't take offers

  if (offer?.can_checkout) {
    const validFor = validForWords(offer.expires_at);
    return (
      <Box role="status" borderWidth="1px" borderColor="green.300" bg="green.50" borderRadius="lg" p={4} data-testid="offer-agreed" {...props}>
        <HStack spacing={2} mb={1} color="green.700">
          <Icon as={Handshake} boxSize={5} aria-hidden="true" />
          <Text fontWeight="700">Agreed price</Text>
        </HStack>
        <Text fontSize="2xl" fontWeight="700" lineHeight="short">
          ₦{commaInt(offer.amount)}
          {offer.unit && <Text as="span" fontSize="sm" fontWeight="500" color="gray.600"> {offer.unit}</Text>}
        </Text>
        <Text fontSize="sm" color="gray.700">
          Was <Text as="s">₦{commaInt(offer.listed_price)}</Text>{validFor ? `. Valid ${validFor}.` : '.'}
        </Text>
        <Flex gap={2} mt={3} flexWrap="wrap">
          <Button flex="1 1 180px" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={checkout.loading}
            onClick={() => (onCheckout ? onCheckout(offer) : checkout.go(offer))}>
            {checkoutLabel}
          </Button>
          <Button as={RLink} to={`/chat/${offer.room}`} variant="outline" bg="white" flex="0 1 auto">Open chat</Button>
        </Flex>
      </Box>
    );
  }

  if (offer) {
    const canWithdraw = asList(offer.actions).includes('withdraw');
    return (
      <Box role="status" borderWidth="1px" borderColor="blue.200" bg="blue.50" borderRadius="lg" p={4} data-testid="offer-pending" {...props}>
        <HStack spacing={2} align="start">
          <Icon as={TagIcon} boxSize={4} mt={1} color="primary" aria-hidden="true" />
          <Box>
            <Text fontWeight="600">
              {offer.mine
                ? `Your offer of ${priceText(offer.amount, offer.unit, commaInt)} is waiting for the seller`
                : `The seller countered with ${priceText(offer.amount, offer.unit, commaInt)}`}
            </Text>
            <Text fontSize="sm" color="gray.700">
              {offer.mine ? "You'll be told when they reply." : 'Open the chat to accept it, decline it or name another price.'}
            </Text>
          </Box>
        </HStack>
        <HStack spacing={2} mt={3} flexWrap="wrap">
          <Button as={RLink} to={`/chat/${offer.room}`} size="sm" bg="primary" color="white" _hover={{ bg: 'secondary' }}>Open chat</Button>
          {canWithdraw && <Button size="sm" variant="ghost" colorScheme="red" onClick={() => setConfirmWithdraw(true)}>Withdraw</Button>}
        </HStack>
        <ActionDialog isOpen={confirmWithdraw} onClose={() => setConfirmWithdraw(false)} isLoading={withdraw.loading} config={CONFIRM.withdraw}
          onConfirm={async () => { await withdraw.mutate(offer); setConfirmWithdraw(false); }} />
      </Box>
    );
  }

  if (!data.can_offer) return null;
  return (
    <>
      <Button leftIcon={<TagIcon size={16} />} onClick={() => setOpen(true)} {...outline} {...props}>Make an offer</Button>
      <MakeOfferModal isOpen={open} onClose={() => { setOpen(false); query.reload(); }} target={target} validHours={validHours}
        item={{ title, image, price, unit, kind }} />
    </>
  );
}
