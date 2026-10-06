// /parts/orders/:orderId — one parts order for the customer: progress, items, delivery, and the
// buttons the API allows right now (order.actions): cancel, confirm, return, withdraw-return.
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Link as RLink, useParams } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, Avatar, Box, Button, Collapse, Container, Divider, Flex, FormControl,
  FormErrorMessage, FormHelperText, FormLabel, Heading, HStack, IconButton, Image, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Skeleton, Stack, Text, Textarea, useDisclosure,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { ImagePlus, MessageCircle } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ChatPopup } from '../../../components/chat';
import { BackButton } from '../../../components/nav';
import {
  ActionDialog, OrderItems, OrderTimeline, PartsOrderBadge, ReturnDetails, ReturnPolicy, SummaryRow, useDateTime, useDeadline,
} from '../../../components/parts';
import { ErrorState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { profilePicture } from '../../../utils';
import { MAX_RETURN_PHOTOS, RETURN_REASONS, storePlace } from '../../../utils/parts';

const MAX_PHOTO_MB = 5;

function actionConfig(action, order) {
  const pickup = order?.delivery_method === 'pickup';
  switch (action) {
    case 'cancel':
      return {
        label: 'Cancel order', tone: 'danger', outline: true,
        title: 'Cancel this order?', body: 'The order is cancelled and you are refunded in full to your Motaa wallet.',
        confirmLabel: 'Cancel order', cancelLabel: 'Keep order',
        field: { label: 'Reason (optional)', placeholder: 'e.g. I ordered the wrong part', maxLength: 300 },
      };
    case 'confirm':
      return {
        label: pickup ? "I've collected my order" : "I've received my order",
        title: 'Confirm you have your order?',
        body: 'The payment is released to the seller now. After this, the order can no longer be returned through Motaa.',
        confirmLabel: 'Yes, pay the seller',
      };
    case 'withdraw-return':
      return {
        label: 'Withdraw return', tone: 'danger', outline: true,
        title: 'Withdraw your return?', body: 'The return is closed and the order carries on as before.',
        confirmLabel: 'Withdraw return', cancelLabel: 'Keep return',
      };
    default:
      return null;
  }
}

function Section({ title, children, ...props }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 5 }} {...props}>
      {title && <Heading as="h2" size="sm" mb={3}>{title}</Heading>}
      {children}
    </Box>
  );
}

/** Ask to return an order: reason, what is wrong, and up to four photos. */
function ReturnModal({ order, isOpen, onClose, onDone }) {
  const inputId = useId();
  const policy = useDisclosure();
  const [form, setForm] = useState({ reason: '', details: '' });
  const [photos, setPhotos] = useState([]); // [{ file, url }]
  const [errors, setErrors] = useState({});
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url)), []);
  useEffect(() => {
    if (!isOpen) return;
    setForm({ reason: '', details: '' });
    setErrors({});
    setPhotos((current) => { current.forEach((photo) => URL.revokeObjectURL(photo.url)); return []; });
  }, [isOpen]);

  const policyQuery = useApiQuery(
    (api, signal, { useCache }) => api.get('/parts/return-policy/', { signal, cacheTTL: useCache ? 300000 : 0 }),
    [],
    { enabled: isOpen && !order?.return_policy, select: (body) => body?.data }
  );
  // reasons and policy come with the order; the built-in list is only a fallback for an older API
  const policyText = order?.return_policy || policyQuery.data?.return_policy;
  const apiReasons = Array.isArray(order?.return_reasons) && order.return_reasons.length ? order.return_reasons : policyQuery.data?.return_reasons;
  const reasons = Array.isArray(apiReasons) && apiReasons.length ? apiReasons : RETURN_REASONS;

  const send = useApiMutation(
    (api, body) => api.post(`/parts/orders/${order.uuid}/`, body),
    {
      successMessage: (body) => body?.message || 'Return requested.',
      errorTitle: "Couldn't request the return",
      onSuccess: (body) => { onDone(body?.data); onClose(); },
      onError: (error) => setErrors(error.fieldErrors || {}),
    }
  );

  function addPhotos(fileList) {
    const next = [...photos];
    let problem = '';
    for (const file of Array.from(fileList || [])) {
      if (!file.type?.startsWith('image/')) { problem = `${file.name} isn't an image.`; continue; }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) { problem = `${file.name} is larger than ${MAX_PHOTO_MB} MB.`; continue; }
      if (next.length >= MAX_RETURN_PHOTOS) { problem = `You can add up to ${MAX_RETURN_PHOTOS} photos.`; break; }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setPhotos(next);
    setErrors((e) => ({ ...e, images: problem }));
  }

  function removePhoto(photo) {
    URL.revokeObjectURL(photo.url);
    setPhotos((current) => current.filter((item) => item !== photo));
  }

  function submit(e) {
    e.preventDefault();
    const found = {};
    if (!form.reason) found.reason = 'Choose a reason.';
    if (form.reason !== 'not-received' && form.details.trim().length < 10) found.details = 'Tell the seller what is wrong (at least 10 characters).';
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = new FormData();
    body.append('action', 'return');
    body.append('reason', form.reason);
    body.append('details', form.details.trim());
    photos.forEach((photo) => body.append('images', photo.file, photo.file.name));
    send.mutate(body);
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!send.loading) onClose(); }} size={{ base: 'full', md: 'lg' }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent as="form" noValidate onSubmit={submit} borderRadius={{ base: 0, md: 'lg' }}>
        <ModalHeader pr={12}>Return order {order?.number}</ModalHeader>
        <ModalCloseButton isDisabled={send.loading} />
        <ModalBody>
          <Stack spacing={4}>
            <Text fontSize="sm" color="gray.600">Your payment stays on hold with Motaa until the return is settled.</Text>
            <FormControl isRequired isInvalid={Boolean(errors.reason)}>
              <FormLabel>What is wrong?</FormLabel>
              <Select placeholder="Choose a reason" value={form.reason} onChange={(e) => { setForm((f) => ({ ...f, reason: e.target.value })); setErrors((x) => ({ ...x, reason: '' })); }}>
                {reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
              </Select>
              <FormErrorMessage>{errors.reason}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired={form.reason !== 'not-received'} isInvalid={Boolean(errors.details)}>
              <FormLabel>Tell the seller more</FormLabel>
              <Textarea rows={4} maxLength={1500} placeholder="What did you get, and how is it different from the listing?"
                value={form.details} onChange={(e) => { setForm((f) => ({ ...f, details: e.target.value })); setErrors((x) => ({ ...x, details: '' })); }} />
              <FormErrorMessage>{errors.details}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={Boolean(errors.images)}>
              <FormLabel htmlFor={inputId}>Photos (optional, up to {MAX_RETURN_PHOTOS})</FormLabel>
              <HStack spacing={2} flexWrap="wrap">
                {photos.map((photo, index) => (
                  <Box key={photo.url} position="relative" borderRadius="md" overflow="hidden" borderWidth="1px">
                    <Image src={photo.url} alt={`Photo ${index + 1} for your return`} boxSize="72px" objectFit="cover" />
                    <IconButton size="xs" position="absolute" top={1} right={1} borderRadius="full" colorScheme="red"
                      icon={<CloseIcon boxSize={2} />} aria-label={`Remove photo ${index + 1}`} onClick={() => removePhoto(photo)} />
                  </Box>
                ))}
                {photos.length < MAX_RETURN_PHOTOS && (
                  <Button as="label" htmlFor={inputId} variant="outline" leftIcon={<ImagePlus size={16} />} cursor="pointer" h="72px">Add photo</Button>
                )}
              </HStack>
              <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" multiple
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
                onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
              {errors.images
                ? <FormErrorMessage>{errors.images}</FormErrorMessage>
                : <FormHelperText>Photos of the part and its packaging help settle a return faster.</FormHelperText>}
            </FormControl>

            <Box>
              <Button variant="link" size="sm" color="primary" onClick={policy.onToggle} aria-expanded={policy.isOpen}>
                {policy.isOpen ? 'Hide the return policy' : 'Read the return policy'}
              </Button>
              <Collapse in={policy.isOpen} animateOpacity>
                <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                  {policyText
                    ? <ReturnPolicy text={policyText} />
                    : policyQuery.loading
                    ? <Skeleton h="80px" />
                    : policyQuery.error
                      ? <Text fontSize="sm" color="red.600">{policyQuery.error.message} <Button variant="link" size="sm" onClick={() => policyQuery.reload()}>Try again</Button></Text>
                      : <ReturnPolicy text={policyQuery.data?.return_policy} />}
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={send.loading}>Not now</Button>
          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={send.loading} loadingText="Sending">Request return</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function PartsOrderDetail() {
  const { orderId } = useParams();
  const { commaInt, notify } = useContext(GlobalStore);
  const format = useDateTime();
  const deadline = useDeadline();
  const chat = useDisclosure();
  const returnModal = useDisclosure();
  const [action, setAction] = useState(null);

  const query = useApiQuery((api, signal) => api.get(`/parts/orders/${orderId}/`, { signal }), [orderId], { select: (body) => body?.data });
  const order = query.data;

  useEffect(() => { document.title = order?.number ? `Order ${order.number} | Motaa spare parts` : 'Parts order | Motaa'; }, [order?.number]);

  const act = useApiMutation(
    (api, name, reason) => api.post(`/parts/orders/${orderId}/`, { action: name, ...(reason ? { reason } : {}) }),
    {
      errorTitle: "That didn't work",
      onSuccess: (body) => {
        if (body?.data) query.setData(body.data);
        notify({ title: 'Done', body: body?.message });
        setAction(null);
      },
      onError: () => query.reload(),
    }
  );

  if (query.loading && !order) {
    return (
      <Container maxW="container.lg" py={6} role="status" aria-label="Loading your order">
        <Skeleton h="40px" w="60%" mb={6} />
        <Skeleton h="220px" borderRadius="xl" mb={4} />
        <Skeleton h="160px" borderRadius="xl" />
      </Container>
    );
  }
  if (query.error && !order) {
    return (
      <Container maxW="container.md" py={10}>
        <ErrorState error={query.error} onRetry={query.reload} title={query.error.isNotFound ? "We couldn't find this order" : undefined} />
        <Flex justify="center"><Button as={RLink} to="/parts/orders" variant="link" color="primary">My parts orders</Button></Flex>
      </Container>
    );
  }
  if (!order) return null;

  const actions = Array.isArray(order.actions) ? order.actions : [];
  const pickup = order.delivery_method === 'pickup';
  const store = order.store || {};
  const releaseDue = deadline(order.release_due);
  const returnBy = actions.includes('return') ? deadline(order.return_deadline) : '';
  const config = actionConfig(action, order);

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 6 }}>
      <BackButton to="/parts/orders" />

      <Flex justify="space-between" align="start" gap={3} flexWrap="wrap" mb={4}>
        <Box>
          <HStack spacing={3} flexWrap="wrap">
            <Heading as="h1" size="lg">Order {order.number}</Heading>
            <PartsOrderBadge order={order} fontSize="sm" />
          </HStack>
          <Text color="gray.600" mt={1}>Placed {format(order.date)}</Text>
        </Box>
      </Flex>

      {(releaseDue || returnBy || order.cancel_reason) && (
        <Stack spacing={3} mb={4}>
          {releaseDue && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                Happy with your order? Confirm it so the seller is paid. If you do nothing, the payment is released to the seller automatically on {releaseDue}.
              </AlertDescription>
            </Alert>
          )}
          {returnBy && !releaseDue && (
            <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription>You can ask to return this order until {returnBy}.</AlertDescription></Alert>
          )}
          {returnBy && releaseDue && <Text fontSize="sm" color="gray.600">Something wrong? You can ask to return this order until {returnBy}.</Text>}
          {order.cancel_reason && (
            <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Reason for cancelling: {order.cancel_reason}</AlertDescription></Alert>
          )}
        </Stack>
      )}

      {actions.length > 0 && (
        <Flex gap={3} flexWrap="wrap" mb={6} sx={{ '& > *': { flex: { base: '1 1 100%', sm: '0 0 auto' } } }}>
          {actions.map((name) => {
            if (name === 'return') {
              return <Button key={name} variant="outline" borderColor="primary" color="primary" onClick={returnModal.onOpen}>Return this order</Button>;
            }
            const item = actionConfig(name, order);
            if (!item) return null;
            return item.outline
              ? <Button key={name} variant="outline" colorScheme="red" onClick={() => setAction(name)}>{item.label}</Button>
              : <Button key={name} bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={() => setAction(name)}>{item.label}</Button>;
          })}
        </Flex>
      )}

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5} alignItems="start">
        <Stack spacing={5} gridColumn={{ lg: 'span 2' }} minW={0}>
          {order.return && <ReturnDetails request={order.return} />}

          <Section title="Items">
            <OrderItems items={order.items} linkParts />
            <Divider my={4} />
            <Stack spacing={2}>
              <SummaryRow label="Parts" value={`₦${commaInt(order.items_total)}`} />
              <SummaryRow muted label={pickup ? 'Pickup' : 'Delivery fee'} value={pickup ? 'Free' : `₦${commaInt(order.delivery_fee)}`} />
              <Divider />
              <SummaryRow bold label="Total paid" value={`₦${commaInt(order.total)}`} />
            </Stack>
            <Text fontSize="sm" color="gray.600" mt={2}>
              {order.payment_method_label ? `Payment: ${order.payment_method_label}. ` : ''}Held in escrow by Motaa until the order is completed.
            </Text>
          </Section>

          <Section title={pickup ? 'Pickup' : 'Delivery'}>
            <Stack spacing={2} fontSize="sm">
              {pickup ? (
                <Box>
                  <Text color="gray.600">Collect from</Text>
                  <Text fontWeight="600">{order.pickup_address || `${store.name}${storePlace(store) ? `, ${storePlace(store)}` : ''}`}</Text>
                </Box>
              ) : (
                <Box>
                  <Text color="gray.600">Deliver to</Text>
                  <Text fontWeight="600">{[order.delivery_address, order.delivery_city, order.delivery_state].filter(Boolean).join(', ')}</Text>
                </Box>
              )}
              <Box>
                <Text color="gray.600">Contact</Text>
                <Text fontWeight="600">{[order.contact_name, order.contact_phone].filter(Boolean).join(' · ')}</Text>
              </Box>
              {order.tracking && (
                <Box>
                  <Text color="gray.600">Tracking</Text>
                  <Text fontWeight="600" wordBreak="break-word">{order.tracking}</Text>
                </Box>
              )}
              {order.note && (
                <Box>
                  <Text color="gray.600">Your note</Text>
                  <Text>{order.note}</Text>
                </Box>
              )}
            </Stack>
          </Section>
        </Stack>

        <Stack spacing={5} minW={0}>
          <Section title="Progress"><OrderTimeline order={order} /></Section>

          <Section title="Seller">
            <Flex gap={3} align="center">
              <Avatar size="md" src={profilePicture(store)} name={store.name} />
              <Box minW={0}>
                <Text as={RLink} to={`/parts/stores/${store.uuid}`} fontWeight="600" _hover={{ color: 'primary' }} noOfLines={1}>{store.name}</Text>
                <Text fontSize="sm" color="gray.600">{[store.kind_label, storePlace(store)].filter(Boolean).join(' · ')}</Text>
              </Box>
            </Flex>
            <Button mt={4} w="100%" variant="outline" leftIcon={<MessageCircle size={16} />} onClick={chat.onOpen}>Message seller</Button>
          </Section>

          <Text fontSize="sm" color="gray.600">
            Need help with this order? <Text as={RLink} to="/support" color="primary" fontWeight="600">Contact Motaa support</Text>
          </Text>
        </Stack>
      </SimpleGrid>

      <ActionDialog
        config={config}
        isOpen={Boolean(config)}
        onClose={() => setAction(null)}
        isLoading={act.loading}
        onConfirm={(text) => act.mutate(action, text)}
      />
      <ReturnModal order={order} isOpen={returnModal.isOpen} onClose={returnModal.onClose} onDone={(next) => { if (next) query.setData(next); else query.reload(); }} />
      <ChatPopup isOpen={chat.isOpen} onClose={chat.onClose} recipient={store.chat_recipient} recipient_name={store.name} placeholder={`Hi, I'm asking about my order ${order.number}.`} />
    </Container>
  );
}
