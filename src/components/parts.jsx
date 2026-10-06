// Shared pieces of the spare-parts marketplace, used by the customer pages
// (src/pages/marketplace/parts) and the seller pages (src/pages/dashboard/parts).
import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Badge, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, HStack, Icon,
  IconButton, Image, Input, LinkBox, LinkOverlay, ListItem, OrderedList, Skeleton, Stack, Text, Textarea, UnorderedList,
} from '@chakra-ui/react';
import { BadgeCheck, Check, MapPin, Minus, Package, Plus, Store, Truck } from 'lucide-react';
import { GlobalStore } from '../App';
import { deadlineWords, orderTimeline, policyBlocks, storePlace } from '../utils/parts';

// ---------------------------------------------------------------- parts cart count (navbar)

const CART_EVENT = 'motaa:parts-cart';

/** Tell the navbar how many parts are in the cart now (call with the `count` of any cart response). */
export function announcePartsCart(count) {
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: Number(count) || 0 }));
}

/** Number of parts in the logged-in customer's cart (0 for everyone else). */
export function usePartsCartCount() {
  const { api, authUser } = useContext(GlobalStore);
  const [count, setCount] = useState(0);
  const isCustomer = authUser?.user_type === 'customer';

  useEffect(() => {
    if (!isCustomer) { setCount(0); return undefined; }
    let active = true;
    api.get('/parts/cart/').then((body) => { if (active) setCount(Number(body?.data?.count) || 0); }).catch(() => {});
    const onChange = (event) => setCount(Number(event.detail) || 0);
    window.addEventListener(CART_EVENT, onChange);
    return () => { active = false; window.removeEventListener(CART_EVENT, onChange); };
  }, [api, isCustomer, authUser?.token]);

  return count;
}

// ---------------------------------------------------------------- parts

/** A part's photo, or a grey box with an icon when there is none (or it fails to load). */
export function PartPhoto({ src, alt, iconSize = 8, ...props }) {
  const empty = (
    <Flex w="100%" h="100%" align="center" justify="center" bg="gray.100" color="gray.400" role="img" aria-label={`No photo of ${alt}`}>
      <Icon as={Package} boxSize={iconSize} aria-hidden="true" />
    </Flex>
  );
  return (
    <Box overflow="hidden" bg="gray.100" flexShrink={0} {...props}>
      {src ? <Image src={src} alt={alt} w="100%" h="100%" objectFit="cover" loading="lazy" fallback={empty} /> : empty}
    </Box>
  );
}

/** "Fits any car" or the first cars a part fits. */
export function fitsLine(part) {
  if (part?.universal) return 'Fits any car';
  const fits = Array.isArray(part?.fits) ? part.fits : [];
  return fits.length ? `Fits ${fits.join(', ')}` : '';
}

/** A part in a grid: photo, name, price, condition, what it fits and who sells it. */
export function PartCard({ part }) {
  const { commaInt } = useContext(GlobalStore);
  const fits = fitsLine(part);
  return (
    <LinkBox as="article" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden" bg="white"
      display="flex" flexDirection="column" h="100%" _hover={{ boxShadow: 'md' }} transition="box-shadow .2s">
      <Box position="relative">
        <PartPhoto src={part?.image} alt={part?.name || 'Part'} h={{ base: '150px', md: '180px' }} iconSize={10} />
        {!part?.in_stock && (
          <Badge position="absolute" top={2} left={2} colorScheme="red" borderRadius="full" px={2} textTransform="none">Out of stock</Badge>
        )}
      </Box>
      <Stack spacing={1} p={3} flex={1}>
        <HStack spacing={2} flexWrap="wrap">
          {part?.condition_label && <Badge textTransform="none" borderRadius="full" px={2}>{part.condition_label}</Badge>}
          {part?.category?.name && <Text fontSize="xs" color="gray.500" noOfLines={1}>{part.category.name}</Text>}
        </HStack>
        <Heading as="h3" size="sm" noOfLines={2} lineHeight="short">
          <LinkOverlay as={RLink} to={`/parts/${part?.uuid}`}>{part?.name}</LinkOverlay>
        </Heading>
        <Text className="bold" color="secondary" fontSize="lg">₦{commaInt(part?.price)}</Text>
        {fits && <Text fontSize="sm" color="gray.600" noOfLines={2}>{fits}</Text>}
        {part?.store?.name && (
          <HStack spacing={1} fontSize="sm" color="gray.600" mt="auto" pt={1}>
            <Icon as={Store} boxSize={3.5} aria-hidden="true" />
            <Text noOfLines={1}>{part.store.name}{part.store.state ? ` · ${part.store.state}` : ''}</Text>
          </HStack>
        )}
      </Stack>
    </LinkBox>
  );
}

/** − 2 + stepper. `max` is the stock left. */
export function QuantityInput({ value, max, onChange, isDisabled, label = 'Quantity', size = 'sm' }) {
  const quantity = Number(value) || 1;
  const limit = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : Infinity;
  return (
    <HStack spacing={1} role="group" aria-label={label}>
      <IconButton size={size} variant="outline" aria-label="Reduce quantity" icon={<Minus size={14} />}
        isDisabled={isDisabled || quantity <= 1} onClick={() => onChange(quantity - 1)} />
      <Text minW="32px" textAlign="center" fontWeight="600" aria-live="polite">{quantity}</Text>
      <IconButton size={size} variant="outline" aria-label="Increase quantity" icon={<Plus size={14} />}
        isDisabled={isDisabled || quantity >= limit} onClick={() => onChange(quantity + 1)} />
    </HStack>
  );
}

// ---------------------------------------------------------------- sellers

export function VerifiedSeller() {
  return (
    <HStack spacing={1} color="green.600" fontSize="sm" flexShrink={0}>
      <Icon as={BadgeCheck} boxSize={4} aria-hidden="true" /><Text>Verified</Text>
    </HStack>
  );
}

/** How a seller gets orders to customers, from the store the API sent (needs the full store). */
export function StoreDelivery({ store, ...props }) {
  const { commaInt } = useContext(GlobalStore);
  if (!store) return null;
  const zones = Array.isArray(store.zones) ? store.zones : [];
  const hasFee = store.delivery_fee !== undefined && store.delivery_fee !== null;
  return (
    <Stack spacing={2} fontSize="sm" color="gray.700" {...props}>
      {store.delivers ? (
        <HStack align="start" spacing={2}>
          <Icon as={Truck} boxSize={4} mt={0.5} color="primary" aria-hidden="true" />
          <Box>
            <Text>
              {store.delivers_nationwide === false
                ? `Delivers to ${zones.length ? zones.map((zone) => zone.state).join(', ') : 'selected states'} only.`
                : 'Delivers anywhere in Nigeria.'}
              {store.delivery_days ? ` Usually ${store.delivery_days}.` : ''}
            </Text>
            {hasFee && store.delivers_nationwide !== false && (
              <Text color="gray.600">
                Delivery fee: {Number(store.delivery_fee) > 0 ? `₦${commaInt(store.delivery_fee)}` : 'free'} per order
                {zones.length ? ` (${zones.map((zone) => `${zone.state} ₦${commaInt(zone.fee)}`).join(', ')})` : ''}.
              </Text>
            )}
            {hasFee && store.delivers_nationwide === false && zones.length > 0 && (
              <Text color="gray.600">Delivery fee per order: {zones.map((zone) => `${zone.state} ₦${commaInt(zone.fee)}`).join(', ')}.</Text>
            )}
          </Box>
        </HStack>
      ) : (
        <HStack align="start" spacing={2}>
          <Icon as={Truck} boxSize={4} mt={0.5} color="gray.400" aria-hidden="true" />
          <Text>This seller does not deliver.</Text>
        </HStack>
      )}
      {store.offers_pickup && (
        <HStack align="start" spacing={2}>
          <Icon as={MapPin} boxSize={4} mt={0.5} color="primary" aria-hidden="true" />
          <Text>Pickup available{store.pickup_address ? `: ${store.pickup_address}` : storePlace(store) ? ` in ${storePlace(store)}` : ''}.</Text>
        </HStack>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------- return policy

/** The return policy text from the API, laid out as paragraphs, bullets and steps. */
export function ReturnPolicy({ text, ...props }) {
  const blocks = policyBlocks(text);
  if (!blocks.length) return <Text fontSize="sm" color="gray.600" {...props}>The return policy is not available right now.</Text>;
  return (
    <Stack spacing={3} fontSize="sm" color="gray.700" {...props}>
      {blocks.map((block, index) => {
        if (block.type === 'p') return <Text key={index} fontWeight={/:$/.test(block.text) ? 600 : 400}>{block.text}</Text>;
        const List = block.type === 'ol' ? OrderedList : UnorderedList;
        return <List key={index} spacing={1} pl={1}>{block.items.map((item, i) => <ListItem key={i}>{item}</ListItem>)}</List>;
      })}
    </Stack>
  );
}

// ---------------------------------------------------------------- orders

const STATUS_COLORS = {
  paid: 'orange', accepted: 'blue', shipped: 'blue', delivered: 'purple', completed: 'green', cancelled: 'gray',
  'return-requested': 'yellow', 'return-approved': 'yellow', disputed: 'red', refunded: 'gray',
};

/** The order's status in the API's own words. */
export function PartsOrderBadge({ order, ...props }) {
  if (!order?.status_label && !order?.status) return null;
  return (
    <Badge colorScheme={STATUS_COLORS[order.status] || 'gray'} textTransform="none" px={2} py={0.5} borderRadius="full" whiteSpace="normal" {...props}>
      {order.status_label || order.status}
    </Badge>
  );
}

/** "Oct 6, 2026, 2:15 pm" (or '' for a missing date). */
export function useDateTime() {
  const { naturalDate, naturalTime } = useContext(GlobalStore);
  return (value, { time = true } = {}) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return time ? `${naturalDate(date)}, ${naturalTime(date)}` : naturalDate(date);
  };
}

/** The lines of an order with their photos, quantities and totals (all from the API). */
export function OrderItems({ items, linkParts = false }) {
  const { commaInt } = useContext(GlobalStore);
  return (
    <Stack as="ul" listStyleType="none" spacing={3}>
      {(Array.isArray(items) ? items : []).map((item, index) => (
        <Flex as="li" key={`${item?.part || item?.name}-${index}`} gap={3} align="center">
          <PartPhoto src={item?.image} alt={item?.name || 'Part'} boxSize="56px" borderRadius="md" iconSize={5} />
          <Box flex={1} minW={0}>
            {linkParts && item?.part
              ? <Text as={RLink} to={`/parts/${item.part}`} fontWeight="600" noOfLines={2} _hover={{ color: 'primary' }}>{item?.name}</Text>
              : <Text fontWeight="600" noOfLines={2}>{item?.name}</Text>}
            <Text fontSize="sm" color="gray.600">
              {[item?.condition_label, item?.part_number && `Part no. ${item.part_number}`].filter(Boolean).join(' · ')}
            </Text>
            <Text fontSize="sm" color="gray.600">₦{commaInt(item?.unit_price)} × {item?.quantity}</Text>
          </Box>
          <Text fontWeight="600" whiteSpace="nowrap">₦{commaInt(item?.line_total)}</Text>
        </Flex>
      ))}
    </Stack>
  );
}

/** One order in a list: used here and on the seller's orders page. */
export function PartsOrderRow({ order, to, seller = false }) {
  const { commaInt } = useContext(GlobalStore);
  const format = useDateTime();
  const items = Array.isArray(order?.items) ? order.items : [];
  const names = items.map((item) => item?.name).filter(Boolean);
  return (
    <LinkBox as="li" display="flex" gap={3} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="xl" bg="white" alignItems="center" _hover={{ borderColor: 'primary' }}>
      <PartPhoto src={items[0]?.image} alt={names[0] || 'Part'} boxSize={{ base: '56px', md: '72px' }} borderRadius="md" iconSize={6} />
      <Box flex={1} minW={0}>
        <Flex gap={2} align="center" flexWrap="wrap" mb={1}>
          <LinkOverlay as={RLink} to={to} fontWeight="600">Order {order?.number}</LinkOverlay>
          <PartsOrderBadge order={order} />
        </Flex>
        <Text fontSize="sm" noOfLines={1}>{names[0]}{names.length > 1 ? ` and ${names.length - 1} more` : ''}</Text>
        <Text fontSize="sm" color="gray.600" noOfLines={1}>
          {[seller ? order?.customer?.name : order?.store?.name, order?.delivery_method === 'pickup' ? 'Pickup' : 'Delivery', format(order?.date, { time: false })].filter(Boolean).join(' · ')}
        </Text>
      </Box>
      <Box textAlign="right" flexShrink={0}>
        <Text fontWeight="700">₦{commaInt(seller ? order?.seller_amount : order?.total)}</Text>
        <Text fontSize="xs" color="gray.600">{seller ? 'you receive' : `${order?.items_count} ${Number(order?.items_count) === 1 ? 'item' : 'items'}`}</Text>
      </Box>
    </LinkBox>
  );
}

export function OrderListSkeleton() {
  return (
    <Stack spacing={3} role="status" aria-label="Loading orders">
      {[0, 1, 2].map((i) => <Skeleton key={i} h="96px" borderRadius="xl" />)}
    </Stack>
  );
}

/** One line of a price summary. */
export function SummaryRow({ label, value, bold, muted }) {
  return (
    <Flex justify="space-between" gap={4} fontWeight={bold ? 700 : 500} color={muted ? 'gray.600' : undefined}>
      <Text>{label}</Text>
      <Text textAlign="right" whiteSpace="nowrap">{value}</Text>
    </Flex>
  );
}

/** What has happened to the order so far, top to bottom. */
export function OrderTimeline({ order }) {
  const format = useDateTime();
  const steps = orderTimeline(order);
  return (
    <Stack as="ol" listStyleType="none" spacing={0}>
      {steps.map((step, index) => {
        const cancelled = step.key === 'cancelled';
        const last = index === steps.length - 1;
        return (
          <Flex as="li" key={step.key} gap={3} aria-current={step.done && (last || !steps[index + 1]?.done) ? 'step' : undefined}>
            <Flex direction="column" align="center">
              <Flex boxSize={6} rounded="full" align="center" justify="center" flexShrink={0}
                bg={cancelled ? 'red.500' : step.done ? 'green.500' : 'white'} color="white"
                borderWidth={step.done ? 0 : '2px'} borderColor="gray.300">
                {step.done && !cancelled && <Check size={14} aria-hidden="true" />}
              </Flex>
              {!last && <Box w="2px" flex={1} minH={5} bg={step.done && steps[index + 1]?.done ? 'green.500' : 'gray.200'} />}
            </Flex>
            <Box pb={last ? 0 : 4}>
              <Text fontWeight={step.done ? 600 : 400} color={step.done ? 'gray.800' : 'gray.500'}>{step.label}</Text>
              {step.at && <Text fontSize="sm" color="gray.600">{format(step.at)}</Text>}
            </Box>
          </Flex>
        );
      })}
    </Stack>
  );
}

/** A return request: where it stands, what the customer said, the seller's answer and Motaa's note. */
export function ReturnDetails({ request, forSeller = false }) {
  const format = useDateTime();
  if (!request) return null;
  const photos = (Array.isArray(request.images) ? request.images : []).filter(Boolean);
  return (
    <Box borderWidth="1px" borderColor="yellow.300" bg="yellow.50" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="start" gap={3} flexWrap="wrap">
        <Heading as="h2" size="sm">Return request</Heading>
        <Badge colorScheme="yellow" textTransform="none" borderRadius="full" px={2} whiteSpace="normal">{request.status_label || request.status}</Badge>
      </Flex>
      <Stack spacing={3} mt={3} fontSize="sm">
        <Box>
          <Text color="gray.600">{forSeller ? "Customer's reason" : 'Your reason'}{request.date ? ` · ${format(request.date)}` : ''}</Text>
          <Text fontWeight="600">{request.reason_label || request.reason}</Text>
          {request.details && <Text whiteSpace="pre-wrap" mt={1}>{request.details}</Text>}
        </Box>
        {photos.length > 0 && (
          <HStack spacing={2} flexWrap="wrap">
            {photos.map((url, index) => (
              <Box as="a" key={url} href={url} target="_blank" rel="noopener noreferrer" borderRadius="md" overflow="hidden" borderWidth="1px">
                <Image src={url} alt={`Return photo ${index + 1}`} boxSize="72px" objectFit="cover" />
              </Box>
            ))}
          </HStack>
        )}
        {request.seller_response && (
          <Box>
            <Text color="gray.600">{forSeller ? 'Your response' : "Seller's response"}</Text>
            <Text whiteSpace="pre-wrap">{request.seller_response}</Text>
          </Box>
        )}
        {request.motaa_note && (
          <Box>
            <Text color="gray.600">Note from Motaa</Text>
            <Text whiteSpace="pre-wrap">{request.motaa_note}</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

/** "on Oct 13, 2026 (in 5 days)" for a deadline the API sent; '' when it has passed or is missing. */
export function useDeadline() {
  const format = useDateTime();
  return (value) => {
    const words = deadlineWords(value);
    if (!words) return '';
    return `${format(value, { time: false })} (${words})`;
  };
}

/**
 * Confirmation for an order action, with an optional text box (a reason, a tracking number…).
 * config: { title, body, confirmLabel, tone: 'primary' | 'danger', field?: { label, placeholder, required, minLength, multiline, helper } }
 * onConfirm(text) is awaited; the dialog stays open while it runs. `error` is the API's message for the field.
 */
export function ActionDialog({ config, isOpen, onClose, onConfirm, isLoading, error }) {
  const cancelRef = useRef(null);
  const [text, setText] = useState('');
  const [problem, setProblem] = useState('');
  useEffect(() => { if (isOpen) { setText(''); setProblem(''); } }, [isOpen, config?.title]);
  if (!config) return null;
  const field = config.field;

  function submit(e) {
    e?.preventDefault();
    const value = text.trim();
    if (field?.required && value.length < (field.minLength || 1)) {
      setProblem(field.requiredMessage || 'This is required.');
      return;
    }
    onConfirm(value);
  }

  const Control = field?.multiline ? Textarea : Input;
  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={() => { if (!isLoading) onClose(); }} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent mx={4} as="form" onSubmit={submit} noValidate>
          <AlertDialogHeader fontSize="lg">{config.title}</AlertDialogHeader>
          <AlertDialogBody>
            {config.body && <Text color="gray.700" mb={field ? 4 : 0}>{config.body}</Text>}
            {field && (
              <FormControl isRequired={field.required} isInvalid={Boolean(problem || error)}>
                <FormLabel>{field.label}</FormLabel>
                <Control value={text} placeholder={field.placeholder} maxLength={field.maxLength || 300}
                  onChange={(e) => { setText(e.target.value); setProblem(''); }} />
                {problem || error
                  ? <FormErrorMessage>{problem || error}</FormErrorMessage>
                  : field.helper && <FormHelperText>{field.helper}</FormHelperText>}
              </FormControl>
            )}
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
            <Button ref={cancelRef} onClick={onClose} isDisabled={isLoading}>{config.cancelLabel || 'Not now'}</Button>
            <Button type="submit" isLoading={isLoading}
              {...(config.tone === 'danger' ? { colorScheme: 'red' } : { bg: 'primary', color: 'white', _hover: { bg: 'secondary' } })}>
              {config.confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
