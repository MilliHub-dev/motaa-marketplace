import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  VisuallyHidden,
  Stack,
} from '@chakra-ui/react';
import { MdMoreVert, MdSearch } from 'react-icons/md';
import { CheckCircle2, Clock, Download, ImageOff, ScanSearch, ShoppingBag, XCircle } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { asList } from '../../../../utils';
import { useApiQuery, useApiMutation } from '../../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../../components/states';
import { optionLabel } from '../../../../components/forms';
import { dealerPayout } from '../../../../utils/payouts';
import { CardEmpty, DASH, DashCard, IconBubble, naira, OrderPill, PageHeader, PillButton } from '../../../../components/dashboard/ui';
import { exportOrders } from '../../../../components/dashboard/exportOrders';

// Backend Order.order_status slugs → label + colour.
export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'orange' },
  'awaiting-inspection': { label: 'Awaiting inspection', color: 'blue' },
  inspecting: { label: 'Inspecting', color: 'cyan' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
  expired: { label: 'Expired', color: 'gray' },
  renewed: { label: 'Renewed', color: 'purple' },
};

const PAYMENT_OPTIONS = {
  'pay-after-inspection': 'Pay after inspection',
  wallet: 'Motaa Wallet',
  card: 'Debit / credit card',
  'financial-aid': 'Financing',
};

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'pending', label: 'Pending', match: (s) => s === 'pending' },
  { key: 'inspection', label: 'Inspection', match: (s) => s === 'awaiting-inspection' || s === 'inspecting' },
  { key: 'completed', label: 'Completed', match: (s) => s === 'completed' },
  { key: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
];

export function OrderStatusBadge({ status }) {
  return <OrderPill status={status} />;
}

export function orderTitle(order) {
  return order?.order_item?.title || order?.order_item?.vehicle?.name || 'Listing no longer available';
}

function customerName(order) {
  return order?.customer_info?.name || (typeof order?.customer === 'string' ? order.customer : '') || 'Customer';
}

/** Thumbnail, title and order type for an order row. */
export function OrderCarCell({ order }) {
  const cover = order?.order_item?.vehicle?.images?.[0]?.url;
  return (
    <Flex align="center" gap={3} minW="200px">
      {cover ? (
        <Image src={cover} alt="" w="64px" h="48px" objectFit="cover" borderRadius="md" flexShrink={0} />
      ) : (
        <Flex w="64px" h="48px" borderRadius="md" bg="gray.100" align="center" justify="center" color="gray.400" flexShrink={0}>
          <ImageOff size={18} aria-hidden="true" />
        </Flex>
      )}
      <Box minW={0}>
        <Text fontWeight="600" noOfLines={1} whiteSpace="normal" maxW="240px">{orderTitle(order)}</Text>
        <Text color="gray.600" fontSize="sm">{order?.order_type === 'rental' ? 'Rental' : 'Purchase'}</Text>
        {order?.order_type === 'rental' && order?.rental_purpose_label && (
          <Text color="gray.600" fontSize="xs" noOfLines={1} whiteSpace="normal" maxW="240px" title={order.rental_purpose_label}>
            For: {order.rental_purpose_label}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

/** What the dealer is paid for an order (after Motaa's commission), with the commission underneath. */
export function OrderPayoutCell({ order }) {
  const { commaInt } = useContext(GlobalStore);
  const { amount, commission } = dealerPayout(order);
  return (
    <Box textAlign="right">
      <Text fontWeight="600" color="green.600" aria-label={`You receive ₦${commaInt(amount)}`}>₦{commaInt(amount)}</Text>
      {commission > 0 && <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">after ₦{commaInt(commission)} commission</Text>}
    </Box>
  );
}

/** "Mar 3, 2026" + "4:05 pm", or a dash when the date is missing/invalid. */
export function OrderDate({ value }) {
  const { naturalDate, naturalTime } = useContext(GlobalStore);
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <Text color="gray.500">—</Text>;
  return (
    <Box>
      <Text>{naturalDate(date)}</Text>
      <Text color="gray.500" fontSize="sm">{naturalTime(date)}</Text>
    </Box>
  );
}

const OrderListAdmin = () => {
  const { naturalDate, api, notifyError } = useContext(GlobalStore);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [contact, setContact] = useState(null);
  const [exporting, setExporting] = useState(false);

  const orders = useApiQuery(
    (client, signal) => client.get('/admin/dealership/orders/', { signal }),
    [],
    { select: (body) => asList(body?.data) }
  );
  const all = asList(orders.data);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const match = FILTERS.find((f) => f.key === filter)?.match || (() => true);
    return all.filter((order) => {
      if (!match(order?.order_status)) return false;
      if (!term) return true;
      return [orderTitle(order), customerName(order), order?.order_item?.vehicle?.brand, String(order?.id ?? '')]
        .some((field) => String(field || '').toLowerCase().includes(term));
    });
  }, [all, filter, search]);

  const count = (key) => all.filter((order) => (FILTERS.find((f) => f.key === key)?.match || (() => true))(order?.order_status)).length;
  const waiting = all.filter((order) => order?.paid && order?.order_status === 'pending');
  const waitingAmount = waiting.reduce((sum, order) => sum + (dealerPayout(order).amount || 0), 0);

  return (
    <Box flex={1} minW={0}>
      <PageHeader
        title="Orders"
        subtitle="Purchases and rentals of your cars."
        actions={(
          <PillButton icon={Download} isLoading={exporting} onClick={async () => { setExporting(true); await exportOrders(api, '12m', notifyError); setExporting(false); }}>
            Export last 12 months
          </PillButton>
        )}
      />

      <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={{ base: 3, md: 5 }} mb={{ base: 4, md: 5 }}>
        <SummaryTile icon={Clock} color={DASH.amber} label="To hand over" value={waiting.length} note={waitingAmount ? `${naira(waitingAmount, { short: true })} in escrow` : 'Nothing waiting'} />
        <SummaryTile icon={ScanSearch} color={DASH.violet} label="Inspections" value={count('inspection')} note="Buyers inspecting first" />
        <SummaryTile icon={CheckCircle2} color={DASH.green} label="Completed" value={count('completed')} note="Money released" />
        <SummaryTile icon={XCircle} color="#9CA3AF" label="Cancelled" value={count('cancelled')} note="Refunded to buyers" />
      </SimpleGrid>

      <DashCard>
        <Flex justify="space-between" mb={5} gap={3} direction={{ base: 'column', lg: 'row' }}>
          <HStack spacing={2} overflowX="auto" className="hidden-scroll" maxW="100%" role="group" aria-label="Filter orders by status" pb={1}>
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <Button key={key} onClick={() => setFilter(key)} aria-pressed={active} flexShrink={0} h="40px" px={4} borderRadius="full"
                  bg={active ? DASH.ink : DASH.page} color={active ? 'white' : DASH.ink} fontWeight="500" _hover={{ bg: active ? DASH.ink : '#E7EAF0' }}
                  rightIcon={<Box as="span" minW="24px" px={1.5} py={0.5} borderRadius="full" fontSize="xs" bg={active ? 'whiteAlpha.300' : 'white'}>{orders.data ? count(key) : '–'}</Box>}>
                  {label}
                </Button>
              );
            })}
          </HStack>
          <InputGroup maxW={{ base: '100%', lg: '300px' }}>
            <InputLeftElement h="44px" pointerEvents="none"><MdSearch size={18} color="#6B7280" /></InputLeftElement>
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search car or customer"
              aria-label="Search orders by car or customer" h="44px" borderRadius="full" bg={DASH.page} border="none" />
          </InputGroup>
        </Flex>

        <AsyncState
          query={orders}
          loadingLabel="Loading orders…"
          isEmpty={(items) => items.length === 0}
          empty={<CardEmpty icon={ShoppingBag} title="No orders yet" body="When customers buy or rent your cars, their orders show up here." action={{ label: 'Go to inventory', to: '/inventory' }} />}
        >
          {() => visible.length === 0 ? (
            <Stack align="center" py={10} spacing={3}>
              <Text fontWeight="600">No matching orders</Text>
              <Button size="sm" borderRadius="full" onClick={() => { setFilter('all'); setSearch(''); }}>Clear filters</Button>
            </Stack>
          ) : (
            <>
              <Stack spacing={3} display={{ base: 'flex', md: 'none' }}>
                {visible.map((order) => (
                  <Box key={order?.uuid || order?.id} as="button" type="button" onClick={() => setSelected(order)} textAlign="left"
                    borderWidth="1px" borderColor={DASH.line} borderRadius="18px" p={3} w="100%">
                    <OrderCarCell order={order} />
                    <Flex justify="space-between" align="center" mt={3} pt={3} borderTopWidth="1px" borderColor={DASH.line} gap={2}>
                      <Box minW={0}>
                        <Text fontSize="sm" noOfLines={1}>{customerName(order)}</Text>
                        <OrderStatusBadge status={order?.order_status} />
                      </Box>
                      <OrderPayoutCell order={order} />
                    </Flex>
                  </Box>
                ))}
              </Stack>
              <TableContainer display={{ base: 'none', md: 'block' }}>
                <Table variant="unstyled" size="md">
                  <Thead>
                    <Tr color={DASH.muted} fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
                      <Th py={2} color="inherit">Car</Th>
                      <Th color="inherit">Customer</Th>
                      <Th color="inherit">Date</Th>
                      <Th color="inherit">Status</Th>
                      <Th color="inherit" isNumeric>You receive</Th>
                      <Th><VisuallyHidden>Actions</VisuallyHidden></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {visible.map((order) => (
                      <Tr key={order?.uuid || order?.id} borderTopWidth="1px" borderColor={DASH.line} _hover={{ bg: '#FAFBFC' }} cursor="pointer"
                        onClick={(e) => { if (!e.target.closest('button, a, [role="menu"]')) setSelected(order); }}>
                        <Td py={3}><OrderCarCell order={order} /></Td>
                        <Td>
                          <HStack spacing={2}>
                            <Avatar size="sm" name={customerName(order)} bg={DASH.blueWash} color={DASH.blue} />
                            <Text fontSize="sm" noOfLines={1} maxW="150px">{customerName(order)}</Text>
                          </HStack>
                        </Td>
                        <Td><OrderDate value={order?.date_created || order?.last_updated} /></Td>
                        <Td>
                          <OrderStatusBadge status={order?.order_status} />
                          {inspectionText(order, naturalDate) && (
                            <Text fontSize="xs" color={DASH.muted} mt={1} whiteSpace="nowrap">{inspectionText(order, naturalDate)}</Text>
                          )}
                        </Td>
                        {/* what the dealer is paid (car amount − Motaa's commission), never the customer's total with VAT/fees */}
                        <Td isNumeric><OrderPayoutCell order={order} /></Td>
                        <Td>
                          <Menu placement="bottom-end">
                            <MenuButton as={IconButton} aria-label={`Actions for order ${order?.id ?? ''}`} icon={<MdMoreVert size={16} />} isRound size="sm" bg={DASH.page} />
                            <MenuList>
                              <MenuItem onClick={() => setSelected(order)}>View details</MenuItem>
                              {order?.customer_info?.user_id && <MenuItem onClick={() => setContact(order)}>Message customer</MenuItem>}
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </>
          )}
        </AsyncState>
      </DashCard>

      <OrderDetailsDrawer order={selected} onClose={() => setSelected(null)} onContact={(order) => { setSelected(null); setContact(order); }} />
      <ContactCustomerModal order={contact} onClose={() => setContact(null)} />
    </Box>
  );
};

function SummaryTile({ icon: Icon, color, label, value, note }) {
  return (
    <DashCard p={{ base: 4, md: 5 }}>
      <HStack spacing={3} align="center">
        <IconBubble icon={Icon} color={color} size={10} />
        <Box minW={0}>
          <Text fontSize="sm" color={DASH.muted} noOfLines={1}>{label}</Text>
          <Text fontSize="2xl" fontWeight="600" lineHeight={1.2}>{value}</Text>
        </Box>
      </HStack>
      <Text fontSize="xs" color={DASH.muted} mt={2} noOfLines={1}>{note}</Text>
    </DashCard>
  );
}

/** "Inspection Thu 16 Oct, 2:00 pm" for pay-after-inspection orders, or that the buyer hasn't booked one yet. */
export function inspectionText(order, naturalDate) {
  const inspection = order?.inspection;
  if (!inspection?.date) {
    return ['awaiting-inspection', 'inspecting'].includes(order?.order_status) ? 'Inspection not booked yet' : '';
  }
  const at = new Date(`${inspection.date}T${inspection.time || '00:00'}`);
  if (Number.isNaN(at.getTime())) return '';
  const time = inspection.time ? at.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : '';
  return `${inspection.completed ? 'Inspected' : 'Inspection'} ${naturalDate(at)}${time ? `, ${time}` : ''}`;
}

function DetailRow({ label, children }) {
  return (
    <SimpleGrid columns={2} spacing={3} py={2} borderBottomWidth={1} borderColor="gray.100">
      <Text color="gray.600" fontSize="sm">{label}</Text>
      <Box fontSize="sm" textAlign="right">{children}</Box>
    </SimpleGrid>
  );
}

export function OrderDetailsDrawer({ order, onClose, onContact }) {
  const { commaInt, naturalDate } = useContext(GlobalStore);
  const fmt = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? naturalDate(date) : '—';
  };
  const isRental = order?.order_type === 'rental';
  const cover = order?.order_item?.vehicle?.images?.[0]?.url;

  return (
    <Drawer isOpen={Boolean(order)} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth={1}>Order #{order?.id ?? ''}</DrawerHeader>
        <DrawerBody>
          {order && (
            <VStack align="stretch" spacing={4} py={2}>
              {cover && <Image src={cover} alt={`Photo of ${orderTitle(order)}`} borderRadius="md" h="180px" objectFit="cover" />}
              <Box>
                <Heading as="h3" size="sm">{orderTitle(order)}</Heading>
                <Text color="gray.600" fontSize="sm">{isRental ? 'Rental' : 'Purchase'}</Text>
              </Box>
              <Box>
                <DetailRow label="Status"><OrderStatusBadge status={order.order_status} /></DetailRow>
                {inspectionText(order, naturalDate) && (
                  <DetailRow label="Inspection">
                    {inspectionText(order, naturalDate).replace(/^Inspection(ed)? /, '').replace(/^not booked yet$/, '') || 'Not booked yet'}
                  </DetailRow>
                )}
                <DetailRow label={isRental ? 'Rental amount' : 'Sale amount'}>₦{commaInt(order.sub_total ?? order.order_item?.price)}</DetailRow>
                {dealerPayout(order).commission > 0 && (
                  <DetailRow label="Motaa commission">− ₦{commaInt(dealerPayout(order).commission)}</DetailRow>
                )}
                <DetailRow label="You receive">
                  <Text as="span" fontWeight="700" color="green.600">₦{commaInt(dealerPayout(order).amount)}</Text>
                </DetailRow>
                <DetailRow label="Listing price">
                  ₦{commaInt(order.order_item?.price)}
                  {isRental && order.order_item?.payment_cycle && ` ${optionLabel('payment_cycle', order.order_item.payment_cycle).toLowerCase()}`}
                </DetailRow>
                <DetailRow label="Payment">
                  <Badge colorScheme={order.paid ? 'green' : 'orange'}>{order.paid ? 'Paid' : 'Not paid yet'}</Badge>
                </DetailRow>
                <DetailRow label="Payment method">{PAYMENT_OPTIONS[order.payment_option] || '—'}</DetailRow>
                <DetailRow label="Customer">{customerName(order)}</DetailRow>
                {order.contact_phone && <DetailRow label="Customer phone"><a href={`tel:${order.contact_phone}`}>{order.contact_phone}</a></DetailRow>}
                {order.delivery_address && <DetailRow label={isRental ? 'Pickup / delivery address' : 'Delivery address'}>{order.delivery_address}</DetailRow>}
                {isRental && order.with_driver && <DetailRow label="Driver">Requested</DetailRow>}
                <DetailRow label="Ordered on">{fmt(order.date_created)}</DetailRow>
                {isRental && (
                  <>
                    <DetailRow label="Rental period">{order.rent_from || order.rent_until ? `${fmt(order.rent_from)} – ${fmt(order.rent_until)}` : '—'}</DetailRow>
                    {order.rental_purpose_label && <DetailRow label="Purpose">{order.rental_purpose_label}</DetailRow>}
                    {order.next_payment && <DetailRow label="Next payment">{fmt(order.next_payment)}</DetailRow>}
                  </>
                )}
                <DetailRow label="Last updated">{fmt(order.last_updated)}</DetailRow>
              </Box>
            </VStack>
          )}
        </DrawerBody>
        <DrawerFooter borderTopWidth={1} gap={3}>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {order?.customer_info?.user_id && (
            <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={() => onContact(order)}>Message customer</Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function ContactCustomerModal({ order, onClose }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const send = useApiMutation(
    (api, payload) => api.post('/chat/new/', payload),
    {
      successMessage: 'Message sent',
      errorTitle: "Couldn't send your message",
      onSuccess: () => { setMessage(''); setTouched(false); onClose(); navigate('/chat'); },
    }
  );
  const invalid = touched && !message.trim();

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (!message.trim()) return;
    send.mutate({ recipient: order.customer_info.user_id, message: message.trim() });
  }

  return (
    <Modal isOpen={Boolean(order)} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={submit} mx={4}>
        <ModalHeader>Message {order ? customerName(order) : 'customer'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.600" mb={3}>About: {order ? orderTitle(order) : ''}</Text>
          <FormControl isRequired isInvalid={invalid}>
            <FormLabel>Message</FormLabel>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, thanks for your order. When would you like to come for the inspection?"
              maxLength={1000}
              rows={4}
            />
            <FormErrorMessage>Write a message first.</FormErrorMessage>
          </FormControl>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="outline" onClick={onClose} isDisabled={send.loading}>Cancel</Button>
          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={send.loading} loadingText="Sending…">Send message</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default OrderListAdmin;
