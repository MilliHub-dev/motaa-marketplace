// /parts-store/orders/:orderId — one parts order for the seller, with the buttons the API allows
// right now (order.actions): accept, decline, ship, deliver, approve-return, reject-return, refund-return.
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertIcon, Box, Button, Divider, Flex, Heading, HStack, Link, SimpleGrid, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { MessageCircle, Phone } from 'lucide-react';
import { ChatPopup } from '../../../components/chat';
import { GlobalStore } from '../../../App';
import { BackButton } from '../../../components/nav';
import { ActionDialog, OrderItems, OrderTimeline, PartsOrderBadge, ReturnDetails, SummaryRow, useDateTime, useDeadline } from '../../../components/parts';
import { ErrorState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { usePartsShop } from './shop';

/** How each action is offered. `send` names the field the typed text is posted as. */
function actionConfig(action, order) {
  const pickup = order?.delivery_method === 'pickup';
  switch (action) {
    case 'accept':
      return { label: 'Accept order', title: 'Accept this order?', body: 'You are telling the customer you have these parts and will get them ready.', confirmLabel: 'Accept order' };
    case 'decline':
      return {
        label: 'Decline order', tone: 'danger', outline: true, send: 'reason',
        title: 'Decline this order?', body: 'The order is cancelled and the customer is refunded in full.', confirmLabel: 'Decline order', cancelLabel: 'Keep order',
        field: { label: "Why can't you supply it?", placeholder: 'e.g. The last one was sold in my shop today', required: true, minLength: 5, requiredMessage: 'Give the customer a reason (at least 5 characters).', multiline: true },
      };
    case 'ship':
      return pickup
        ? { label: 'Ready for pickup', title: 'Is this order ready for pickup?', body: 'The customer is told they can come and collect it.', confirmLabel: 'Mark ready for pickup' }
        : {
          label: 'Mark as sent', send: 'tracking', title: 'Mark this order as sent?', body: 'The customer is told their order is on the way.', confirmLabel: 'Mark as sent',
          field: { label: 'Tracking details (optional)', placeholder: 'e.g. GIG Logistics, waybill 123456', helper: 'A waybill number, or the rider\'s name and phone number.', maxLength: 200 },
        };
    case 'deliver':
      return {
        label: pickup ? 'Mark as collected' : 'Mark as delivered',
        title: pickup ? 'Has the customer collected this order?' : 'Has this order been delivered?',
        body: `You are paid when the customer confirms, or automatically after ${order?.release_days ?? 7} days.`,
        confirmLabel: pickup ? 'Mark as collected' : 'Mark as delivered',
      };
    case 'approve-return':
      return {
        label: 'Accept return', send: 'response', title: 'Accept this return?', body: 'Refund the customer once you have the part back.', confirmLabel: 'Accept return',
        field: { label: 'Message to the customer (optional)', placeholder: 'e.g. Send it back with GIG to our Ladipo shop', multiline: true, maxLength: 1000 },
      };
    case 'reject-return':
      return {
        label: 'Refuse return', tone: 'danger', outline: true, send: 'response',
        title: 'Refuse this return?', body: 'Motaa will review the return and decide. The payment stays on hold until then.', confirmLabel: 'Refuse return', cancelLabel: 'Not now',
        field: { label: 'Why are you refusing it?', placeholder: 'Explain what you sent and why the return is not valid', required: true, minLength: 5, requiredMessage: 'Explain why you are refusing the return.', multiline: true, maxLength: 1000 },
      };
    case 'refund-return':
      return {
        label: 'Refund customer', tone: 'danger', title: 'Refund the customer now?',
        body: 'Only do this when you have the part back. The customer is refunded in full, including the delivery fee, and this cannot be undone.',
        confirmLabel: 'Refund customer',
      };
    default:
      return null;
  }
}

function Section({ title, children }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 5 }} bg="white">
      {title && <Heading as="h2" size="sm" mb={3}>{title}</Heading>}
      {children}
    </Box>
  );
}

export default function PartsShopOrderDetail() {
  const { orderId } = useParams();
  const { commaInt, notify } = useContext(GlobalStore);
  const { reload: reloadShop } = usePartsShop();
  const format = useDateTime();
  const deadline = useDeadline();
  const chat = useDisclosure();
  const [action, setAction] = useState(null);
  const [fieldError, setFieldError] = useState('');

  const query = useApiQuery((api, signal) => api.get(`/parts/seller/orders/${orderId}/`, { signal }), [orderId], { select: (body) => body?.data });
  const order = query.data;

  useEffect(() => { document.title = order?.number ? `Order ${order.number} | Motaa parts shop` : 'Parts order | Motaa'; }, [order?.number]);

  const act = useApiMutation(
    (api, name, text) => {
      const field = actionConfig(name, order)?.send;
      return api.post(`/parts/seller/orders/${orderId}/`, { action: name, ...(field && text ? { [field]: text } : {}) });
    },
    {
      errorTitle: "That didn't work",
      onSuccess: (body) => {
        if (body?.data) query.setData(body.data);
        notify({ title: 'Done', body: body?.message });
        setAction(null);
        reloadShop();
      },
      onError: (error) => {
        const fields = error.fieldErrors || {};
        setFieldError(fields.reason || fields.response || fields.tracking || '');
        if (error.status === 409) { setAction(null); query.reload(); }
      },
    }
  );

  if (query.loading && !order) {
    return (
      <Box py={6} role="status" aria-label="Loading this order">
        <Skeleton h="36px" w="50%" mb={6} />
        <Skeleton h="220px" borderRadius="xl" mb={4} />
        <Skeleton h="160px" borderRadius="xl" />
      </Box>
    );
  }
  if (query.error && !order) {
    return (
      <Box py={8}>
        <ErrorState error={query.error} onRetry={query.reload} title={query.error.isNotFound ? "We couldn't find this order" : undefined} />
        <Flex justify="center"><Button as={RLink} to="/parts-store/orders" variant="link" color="primary">All parts orders</Button></Flex>
      </Box>
    );
  }
  if (!order) return null;

  const actions = Array.isArray(order.actions) ? order.actions : [];
  const pickup = order.delivery_method === 'pickup';
  const customer = order.customer || {};
  const phone = order.contact_phone || customer.phone;
  const releaseDue = deadline(order.release_due);
  const config = actionConfig(action, order);

  return (
    <Box w="100%" py={6}>
      <BackButton to="/parts-store/orders" />

      <HStack spacing={3} flexWrap="wrap">
        <Heading as="h1" size="lg">Order {order.number}</Heading>
        <PartsOrderBadge order={order} fontSize="sm" />
      </HStack>
      <Text color="gray.600" mt={1} mb={4}>Placed {format(order.date)}</Text>

      {(releaseDue || order.cancel_reason) && (
        <Stack spacing={3} mb={4}>
          {releaseDue && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription>You are paid when the customer confirms the order. If they do nothing, you are paid automatically on {releaseDue}.</AlertDescription>
            </Alert>
          )}
          {order.cancel_reason && (
            <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Reason for cancelling: {order.cancel_reason}</AlertDescription></Alert>
          )}
        </Stack>
      )}

      {actions.length > 0 && (
        <Flex gap={3} flexWrap="wrap" mb={6} sx={{ '& > *': { flex: { base: '1 1 100%', sm: '0 0 auto' } } }}>
          {actions.map((name) => {
            const item = actionConfig(name, order);
            if (!item) return null;
            const open = () => { setFieldError(''); setAction(name); };
            return item.outline
              ? <Button key={name} variant="outline" colorScheme="red" onClick={open}>{item.label}</Button>
              : <Button key={name} bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={open}>{item.label}</Button>;
          })}
        </Flex>
      )}

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5} alignItems="start">
        <Stack spacing={5} gridColumn={{ xl: 'span 2' }} minW={0}>
          {order.return && <ReturnDetails request={order.return} forSeller />}

          <Section title="Items">
            <OrderItems items={order.items} />
            <Divider my={4} />
            <Stack spacing={2}>
              <SummaryRow label="Parts" value={`₦${commaInt(order.items_total)}`} />
              <SummaryRow muted label={pickup ? 'Pickup' : 'Delivery fee'} value={pickup ? 'Free' : `₦${commaInt(order.delivery_fee)}`} />
              <SummaryRow label="Customer paid" value={`₦${commaInt(order.total)}`} />
              <SummaryRow muted label="Motaa commission" value={`− ₦${commaInt(order.commission)}`} />
              <Divider />
              <SummaryRow bold label="You receive" value={`₦${commaInt(order.seller_amount)}`} />
            </Stack>
          </Section>

          <Section title={pickup ? 'Pickup' : 'Deliver to'}>
            <Stack spacing={3} fontSize="sm">
              <Box>
                <Text color="gray.600">Customer</Text>
                <Text fontWeight="600">{order.contact_name || customer.name || 'Customer'}</Text>
                <Flex gap={3} align="center" flexWrap="wrap" mt={1}>
                  {phone && (
                    <Link href={`tel:${phone}`} color="primary" display="inline-flex" alignItems="center" gap={1}>
                      <Phone size={14} aria-hidden="true" /> {phone}
                    </Link>
                  )}
                  {customer.chat_recipient && (
                    <Button size="sm" variant="outline" leftIcon={<MessageCircle size={14} />} onClick={chat.onOpen}>Message customer</Button>
                  )}
                </Flex>
              </Box>
              {pickup ? (
                <Box>
                  <Text color="gray.600">Collects from</Text>
                  <Text fontWeight="600">{order.pickup_address || 'Your pickup address'}</Text>
                </Box>
              ) : (
                <Box>
                  <Text color="gray.600">Address</Text>
                  <Text fontWeight="600">{[order.delivery_address, order.delivery_city, order.delivery_state].filter(Boolean).join(', ')}</Text>
                </Box>
              )}
              {order.tracking && (
                <Box>
                  <Text color="gray.600">Tracking</Text>
                  <Text fontWeight="600" wordBreak="break-word">{order.tracking}</Text>
                </Box>
              )}
              {order.note && (
                <Box>
                  <Text color="gray.600">Note from the customer</Text>
                  <Text>{order.note}</Text>
                </Box>
              )}
            </Stack>
          </Section>
        </Stack>

        <Stack spacing={5} minW={0}>
          <Section title="Progress"><OrderTimeline order={order} /></Section>
          <Text fontSize="sm" color="gray.600">
            Problem with this order? <Text as={RLink} to="/support" color="primary" fontWeight="600">Contact Motaa support</Text>
          </Text>
        </Stack>
      </SimpleGrid>

      <ActionDialog
        config={config}
        isOpen={Boolean(config)}
        onClose={() => setAction(null)}
        isLoading={act.loading}
        error={fieldError}
        onConfirm={(text) => { setFieldError(''); act.mutate(action, text); }}
      />
      {customer.chat_recipient && (
        <ChatPopup isOpen={chat.isOpen} onClose={chat.onClose} recipient={customer.chat_recipient}
          recipient_name={order.contact_name || customer.name} placeholder={`Hello, this is about your order ${order.number}.`} />
      )}
    </Box>
  );
}
