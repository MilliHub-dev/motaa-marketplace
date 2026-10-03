// Order result / status page: /checkout/status?order=<uuid>
// Shows what was paid, what's held in escrow, and the next step (inspection,
// paying the balance, confirming receipt to release the dealer's payment).
import { useContext, useRef, useState } from 'react';
import { Link as RLink, useSearchParams } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Car, CheckCircle2, ClipboardCheck, Clock, FileText, PackageCheck, Receipt, XCircle } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { newReference, PaymentRecoveryNotice, TRANSACTION_STATUS_COLORS, usePaystack, WalletPayDialog } from '../../../components/wallet';
import { asList } from '../../../utils';

const STATUS_VIEW = {
  'awaiting-payment': { icon: Clock, color: 'yellow', title: 'Awaiting payment' },
  'awaiting-inspection': { icon: ClipboardCheck, color: 'yellow', title: 'Reserved — awaiting inspection' },
  inspecting: { icon: ClipboardCheck, color: 'blue', title: 'Inspection in progress' },
  pending: { icon: CheckCircle2, color: 'green', title: 'Payment received' },
  completed: { icon: PackageCheck, color: 'green', title: 'Order complete' },
  cancelled: { icon: XCircle, color: 'red', title: 'Order cancelled' },
  expired: { icon: XCircle, color: 'gray', title: 'Rental ended' },
  renewed: { icon: CheckCircle2, color: 'green', title: 'Rental renewed' },
};

function Row({ label, value, bold }) {
  return (
    <Flex justify="space-between" gap={4} fontWeight={bold ? 700 : 500}>
      <Text color={bold ? undefined : 'gray.600'}>{label}</Text>
      <Text textAlign="right">{value}</Text>
    </Flex>
  );
}

function nextStep(order) {
  if (order.order_status === 'awaiting-inspection') {
    return order.inspection
      ? 'Your inspection is booked. After it, pay the balance to complete your order.'
      : 'Schedule your inspection. You only pay the balance if you are happy with the car.';
  }
  if (order.order_status === 'pending') {
    return order.order_type === 'rental'
      ? 'The dealer will contact you about pickup. Confirm below once you have the car to release their payment.'
      : 'The dealer will contact you about delivery. Confirm below once you have the car to release their payment.';
  }
  if (order.order_status === 'completed') return 'Thanks for confirming. The dealer has been paid.';
  return null;
}

function OrderView({ order, reload, setOrder }) {
  const { commaInt, naturalDate } = useContext(GlobalStore);
  const [params] = useSearchParams();
  const isRental = order.order_type === 'rental';
  const view = STATUS_VIEW[order.order_status] || STATUS_VIEW.pending;
  const listing = order.listing || {};
  const pay = usePaystack();
  const walletDialog = useDisclosure();
  const confirmDialog = useDisclosure();
  const cancelDialog = useDisclosure();
  const cancelRef = useRef();
  const keepRef = useRef();
  const [paying, setPaying] = useState(false);
  const [pending, setPending] = useState(null); // { reference, message }
  const balanceQuery = useApiQuery((api, signal) => api.get('/wallet/balance/', { signal }), [], {
    enabled: order.can_pay_balance, select: (b) => b?.data,
  });

  const payByCard = useApiMutation((api, reference) => api.post(`/listings/orders/${order.uuid}/pay/`, { method: 'card', reference }), {
    notifyOnError: false,
    successMessage: 'Payment received and held in escrow.',
    onSuccess: (body) => { setPending(null); if (body?.data) setOrder(body.data); },
    onError: (error) => setPending((p) => p && { ...p, message: error.message }),
  });
  const payByWallet = useApiMutation((api) => api.post('/wallet/pay/', { order_id: order.uuid }), {
    successMessage: (body) => body?.message || 'Paid from your wallet.',
    errorTitle: "Couldn't pay from your wallet",
    onSuccess: () => { walletDialog.onClose(); reload(); balanceQuery.reload(); },
  });
  const complete = useApiMutation((api) => api.post(`/listings/orders/${order.uuid}/complete/`), {
    successMessage: 'Thanks! The dealer has been paid.',
    errorTitle: "Couldn't confirm your order",
    onSuccess: (body) => { confirmDialog.onClose(); if (body?.data) setOrder(body.data); },
  });

  const cancelOrder = useApiMutation((api) => api.post(`/listings/orders/${order.uuid}/cancel/`), {
    successMessage: (body) => body?.message || 'Order cancelled.',
    errorTitle: "Couldn't cancel your order",
    onSuccess: (body) => { cancelDialog.onClose(); if (body?.data) setOrder(body.data); },
  });

  async function payBalance() {
    setPaying(true);
    const reference = newReference('mtbal');
    const response = await pay({ amount: order.amount_outstanding, reference, metadata: { purpose: 'order-balance', order_id: order.uuid } });
    setPaying(false);
    if (!response) return;
    const ref = response.reference || reference;
    setPending({ reference: ref });
    await payByCard.mutate(ref);
  }

  const payments = asList(order.payments);
  const step = nextStep(order);
  const justPlaced = params.get('placed') === '1';

  return (
    <VStack align="stretch" spacing={6}>
      <Flex direction="column" align="center" textAlign="center" gap={3} pt={2}>
        <Flex w={16} h={16} rounded="full" bg={`${view.color}.50`} color={`${view.color}.500`} align="center" justify="center">
          <Icon as={view.icon} boxSize={8} aria-hidden="true" />
        </Flex>
        <Heading as="h1" size="lg">
          {justPlaced && order.order_status === 'pending'
            ? (isRental ? 'Rental booked!' : 'Order placed!')
            : (isRental && order.order_status === 'completed' ? 'Rental confirmed' : view.title)}
        </Heading>
        <Text color="gray.600">Order #{order.id} · {order.status_label}</Text>
        {step && <Text maxW="520px">{step}</Text>}
      </Flex>

      {pending && (
        <PaymentRecoveryNotice reference={pending.reference} message={pending.message} retrying={payByCard.loading}
          onRetry={() => payByCard.mutate(pending.reference)} />
      )}

      <Flex gap={4} borderWidth={1} borderRadius="lg" p={4} align="center">
        <Box w={{ base: '88px', sm: '120px' }} h={{ base: '66px', sm: '90px' }} borderRadius="md" overflow="hidden" bg="gray.100" flexShrink={0}>
          {listing.image
            ? <Image src={listing.image} alt={listing.title || 'Car'} w="100%" h="100%" objectFit="cover" />
            : <Flex h="100%" align="center" justify="center" color="gray.400"><Icon as={Car} boxSize={8} aria-hidden="true" /></Flex>}
        </Box>
        <Box minW={0}>
          <Text className="bold" noOfLines={2}>{listing.title || 'Your car'}</Text>
          <Text fontSize="sm" color="gray.600">{listing.dealer?.business_name}</Text>
          {order.order_type === 'rental' && order.rent_from && (
            <Text fontSize="sm" color="gray.600">
              {naturalDate(new Date(`${order.rent_from}T00:00`))} → {naturalDate(new Date(`${order.rent_until}T00:00`))}
              {order.with_driver ? ' · driver requested' : ''}
            </Text>
          )}
          {order.delivery_address && <Text fontSize="sm" color="gray.600" noOfLines={2}>{order.delivery_address}</Text>}
        </Box>
      </Flex>

      <Box borderWidth={1} borderRadius="lg" p={4}>
        <VStack align="stretch" spacing={2}>
          <Row label={order.order_type === 'rental' ? `Rental (${order.units} × ₦${commaInt(listing.price)})` : 'Car price'} value={`₦${commaInt(order.sub_total)}`} />
          <Row label="VAT" value={`₦${commaInt(order.tax)}`} />
          <Row label="Motaa service fee" value={`₦${commaInt(order.motaa_fee)}`} />
          <Row label="Inspection fee" value={`₦${commaInt(order.inspection_fee)}`} />
          <Divider />
          <Row bold label="Total" value={`₦${commaInt(order.total_amount)}`} />
          <Row
            label={{ released: 'Paid', refunded: 'Paid (refunded to your wallet)' }[order.payment_status] || 'Paid (held in escrow)'}
            value={`₦${commaInt(order.amount_paid)}`}
          />
          {Number(order.amount_outstanding) > 0 && <Row bold label="Balance due" value={`₦${commaInt(order.amount_outstanding)}`} />}
        </VStack>
      </Box>

      {order.inspection && (
        <HStack borderWidth={1} borderRadius="lg" p={4} spacing={3}>
          <Icon as={ClipboardCheck} color="primary" aria-hidden="true" />
          <Text>
            Inspection {order.inspection.completed ? 'completed' : 'scheduled'} for{' '}
            <b>{naturalDate(new Date(`${order.inspection.date}T00:00`))}</b> at <b>{String(order.inspection.time || '').slice(0, 5)}</b>
          </Text>
        </HStack>
      )}

      {payments.length > 0 && (
        <Box>
          <Heading as="h2" size="sm" mb={2}>Payments</Heading>
          <VStack align="stretch" spacing={2}>
            {payments.map((payment) => (
              <Flex key={payment.reference} justify="space-between" gap={3} fontSize="sm" flexWrap="wrap">
                <HStack spacing={2} minW={0}>
                  <Icon as={Receipt} aria-hidden="true" />
                  <Text>{payment.source === 'wallet' ? 'Wallet' : 'Paystack'}</Text>
                  <Text color="gray.500" fontFamily="mono" noOfLines={1} wordBreak="break-all">{payment.reference}</Text>
                </HStack>
                <HStack spacing={2}>
                  <Text className="bold">₦{commaInt(payment.amount)}</Text>
                  <Badge colorScheme={TRANSACTION_STATUS_COLORS[payment.status] || 'gray'} textTransform="none">{payment.status_label}</Badge>
                </HStack>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
        {order.order_status === 'awaiting-inspection' && !order.inspection && (
          <Button as={RLink} to={`/checkout/inspection?order=${order.uuid}`} bg="primary" color="white" _hover={{ bg: 'secondary' }}>
            Schedule inspection
          </Button>
        )}
        {order.can_pay_balance && (
          <>
            <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={payBalance} isLoading={paying || payByCard.loading}
              isDisabled={Boolean(pending)} loadingText="Processing">
              Pay ₦{commaInt(order.amount_outstanding)} online
            </Button>
            <Button variant="outline" color="primary" borderColor="primary" onClick={walletDialog.onOpen}>Pay from wallet</Button>
          </>
        )}
        {order.can_complete && (
          <Button colorScheme="green" onClick={confirmDialog.onOpen}>{isRental ? 'I’ve picked up the car' : 'I’ve received my car'}</Button>
        )}
        <Button as={RLink} to={`/checkout/docs?docType=order-slip&orderId=${order.uuid}`} variant="ghost" leftIcon={<FileText size={18} />} color="primary">
          Order agreement
        </Button>
        {order.inspection && (
          <Button as={RLink} to={`/checkout/docs?docType=inspection-slip&orderId=${order.uuid}`} variant="ghost" leftIcon={<FileText size={18} />} color="primary">
            Inspection agreement
          </Button>
        )}
      </Stack>
      <HStack spacing={4} flexWrap="wrap">
        <Button as={RLink} to="/home" variant="link" color="gray.600">Back to home</Button>
        {order.can_cancel && <Button variant="link" colorScheme="red" onClick={cancelDialog.onOpen}>Cancel order</Button>}
      </HStack>

      <AlertDialog isOpen={cancelDialog.isOpen} leastDestructiveRef={keepRef} onClose={cancelDialog.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>Cancel this order?</AlertDialogHeader>
            <AlertDialogBody>
              {Number(order.amount_paid) > 0
                ? `The ₦${commaInt(order.amount_paid)} you paid will be returned to your Motaa wallet, and the car will be released.`
                : 'The car will be released for other buyers.'} This can’t be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={keepRef} variant="ghost" onClick={cancelDialog.onClose} isDisabled={cancelOrder.loading}>Keep order</Button>
              <Button colorScheme="red" onClick={() => cancelOrder.mutate()} isLoading={cancelOrder.loading}>Cancel order</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <WalletPayDialog
        isOpen={walletDialog.isOpen}
        onClose={walletDialog.onClose}
        onConfirm={() => payByWallet.mutate()}
        isLoading={payByWallet.loading}
        amount={order.amount_outstanding}
        balance={balanceQuery.data?.balance}
        title="Pay the balance from your wallet"
      />

      <AlertDialog isOpen={confirmDialog.isOpen} leastDestructiveRef={cancelRef} onClose={confirmDialog.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>{isRental ? 'Confirm you’ve picked up the car?' : 'Confirm you’ve received the car?'}</AlertDialogHeader>
            <AlertDialogBody>
              This releases ₦{commaInt(order.sub_total)} from escrow to {listing.dealer?.business_name || 'the dealer'}. Only confirm once
              you have the car and you’re happy with it — this can’t be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={confirmDialog.onClose} isDisabled={complete.loading}>Not yet</Button>
              <Button colorScheme="green" onClick={() => complete.mutate()} isLoading={complete.loading}>Yes, release payment</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}

export function CheckoutStatus() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const query = useApiQuery((api, signal) => api.get(`/listings/orders/${orderId}/`, { signal }), [orderId], {
    enabled: Boolean(orderId), select: (body) => body?.data,
  });

  return (
    <Box minH="70vh" bg="white">
      <Container maxW="container.md" py={{ base: 6, md: 10 }}>
        {!orderId ? (
          <EmptyState icon={Receipt} title="No order to show" description="Your orders appear in your cart once you check out." action={{ label: 'Go to cart', to: '/cart' }} />
        ) : (
          <AsyncState query={query} loadingLabel="Loading your order…" errorTitle={query.error?.isNotFound ? "We couldn't find this order" : undefined}>
            {(order) => <OrderView order={order} reload={query.reload} setOrder={query.setData} />}
          </AsyncState>
        )}
      </Container>
    </Box>
  );
}

export default CheckoutStatus;
