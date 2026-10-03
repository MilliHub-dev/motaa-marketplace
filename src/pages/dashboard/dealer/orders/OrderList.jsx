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
} from '@chakra-ui/react';
import { MdMoreVert, MdSearch } from 'react-icons/md';
import { ImageOff, ShoppingBag } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { asList } from '../../../../utils';
import { useApiQuery, useApiMutation } from '../../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../../components/states';
import { optionLabel } from '../../../../components/forms';

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
  const known = ORDER_STATUS[status];
  const label = known?.label || (status ? String(status).replace(/-/g, ' ') : 'Unknown');
  return (
    <Badge colorScheme={known?.color || 'gray'} borderRadius="full" px={3} py={1} textTransform="none" fontWeight="600" fontSize="xs">
      {label}
    </Badge>
  );
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
      </Box>
    </Flex>
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
  const { commaInt } = useContext(GlobalStore);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [contact, setContact] = useState(null);

  const orders = useApiQuery(
    (api, signal) => api.get('/admin/dealership/orders/', { signal }),
    [],
    { select: (body) => asList(body?.data) }
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const match = FILTERS.find((f) => f.key === filter)?.match || (() => true);
    return asList(orders.data).filter((order) => {
      if (!match(order?.order_status)) return false;
      if (!term) return true;
      return [orderTitle(order), customerName(order), order?.order_item?.vehicle?.brand, String(order?.id ?? '')]
        .some((field) => String(field || '').toLowerCase().includes(term));
    });
  }, [orders.data, filter, search]);

  return (
    <Box flex={1} pt={5} minW={0}>
      <Box mb={5}>
        <Heading as="h1" size="md">Orders</Heading>
        <Text color="gray.600" fontSize="sm">Purchases and rentals of your listings.</Text>
      </Box>

      <Flex justify="space-between" mb={5} gap={3} direction={{ base: 'column', lg: 'row' }}>
        <HStack spacing={2} overflowX="auto" className="hidden-scroll" maxW="100%" role="group" aria-label="Filter orders by status" pb={1}>
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <Button
                key={key}
                size="sm"
                flexShrink={0}
                variant="outline"
                aria-pressed={active}
                bg={active ? 'blue.50' : 'white'}
                color={active ? 'primary' : 'gray.700'}
                borderColor={active ? 'primary' : 'gray.200'}
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            );
          })}
        </HStack>
        <InputGroup maxW={{ base: '100%', lg: '300px' }}>
          <InputLeftElement pointerEvents="none"><MdSearch size={18} color="#667085" /></InputLeftElement>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search car or customer"
            aria-label="Search orders by car or customer"
            borderColor="gray.200"
            bg="white"
          />
        </InputGroup>
      </Flex>

      <AsyncState
        query={orders}
        loadingLabel="Loading orders…"
        isEmpty={(items) => items.length === 0}
        empty={<EmptyState icon={ShoppingBag} title="No orders yet" description="When customers buy or rent your cars, their orders will show up here." action={{ label: 'Go to inventory', to: '/inventory' }} />}
      >
        {() => visible.length === 0 ? (
          <EmptyState
            icon={MdSearch}
            title="No matching orders"
            description="Try a different search or status filter."
            action={{ label: 'Clear filters', onClick: () => { setFilter('all'); setSearch(''); } }}
          />
        ) : (
          <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th py={3}>Car</Th>
                  <Th isNumeric>Amount</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Customer</Th>
                  <Th><VisuallyHidden>Actions</VisuallyHidden></Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.map((order) => (
                  <Tr key={order?.uuid || order?.id}>
                    <Td py={3}><OrderCarCell order={order} /></Td>
                    <Td isNumeric>
                      {/* what the dealer earns for this order (rentals: rate × period), not the listing's unit price */}
                      <Text fontWeight="600" color="green.600">₦{commaInt(order?.sub_total ?? order?.order_item?.price)}</Text>
                    </Td>
                    <Td><OrderDate value={order?.date_created || order?.last_updated} /></Td>
                    <Td><OrderStatusBadge status={order?.order_status} /></Td>
                    <Td>
                      <HStack spacing={2}>
                        <Avatar size="xs" name={customerName(order)} />
                        <Text fontSize="sm" noOfLines={1} maxW="140px">{customerName(order)}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Menu placement="bottom-end">
                        <MenuButton as={IconButton} aria-label={`Actions for order ${order?.id ?? ''}`} icon={<MdMoreVert size={16} />} variant="ghost" size="sm" />
                        <MenuList>
                          <MenuItem onClick={() => setSelected(order)}>View details</MenuItem>
                          {order?.customer_info?.user_id && (
                            <MenuItem onClick={() => setContact(order)}>Message customer</MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </AsyncState>

      <OrderDetailsDrawer order={selected} onClose={() => setSelected(null)} onContact={(order) => { setSelected(null); setContact(order); }} />
      <ContactCustomerModal order={contact} onClose={() => setContact(null)} />
    </Box>
  );
};

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
                <DetailRow label={isRental ? 'Rental amount' : 'Sale amount'}>₦{commaInt(order.sub_total ?? order.order_item?.price)}</DetailRow>
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
