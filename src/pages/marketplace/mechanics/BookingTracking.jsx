// /bookings/:bookingId — follow a paid mechanic booking: where it is up to, who is coming and how to reach
// them, the map, and what happened to the booking fee. Refreshes itself while the booking is still moving.
import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink, useLocation, useParams } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader,
  AlertDialogOverlay, AlertIcon, Avatar, Badge, Box, Button, Container, Flex, Heading, HStack, SimpleGrid, Skeleton,
  Stack, Tag, Text, Wrap, useDisclosure,
} from '@chakra-ui/react';
import { Check, MapPin, MessageCircle, Phone, Star, X } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ChatPopup } from '../../../components/chat';
import { MapComponent } from '../../../components/maps';
import { BackButton } from '../../../components/nav';
import { useDateTime } from '../../../components/parts';
import { ErrorState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';

const REFRESH_MS = 20000;
const STATUS_COLORS = {
  requested: 'yellow', pending: 'yellow', accepted: 'blue', working: 'blue', completed: 'green',
  declined: 'red', canceled: 'gray', expired: 'gray',
};

function Section({ title, children, ...props }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 5 }} bg="white" {...props}>
      {title && <Heading as="h2" size="sm" mb={4}>{title}</Heading>}
      {children}
    </Box>
  );
}

function Row({ label, children }) {
  return (
    <Flex justify="space-between" gap={4} py={1.5} fontSize="sm">
      <Text color="gray.600">{label}</Text>
      <Box textAlign="right" fontWeight="500">{children}</Box>
    </Flex>
  );
}

/** The four stages: paid → accepted → working → done (or stopped when declined/cancelled). */
export function BookingSteps({ steps }) {
  const format = useDateTime();
  const list = asList(steps);
  return (
    <Stack as="ol" listStyleType="none" spacing={0} aria-label="Booking progress">
      {list.map((step, index) => {
        const last = index === list.length - 1;
        const done = step.state === 'done';
        const current = step.state === 'current';
        const stopped = step.state === 'stopped';
        const nextDone = list[index + 1]?.state === 'done' || list[index + 1]?.state === 'stopped';
        return (
          <Flex as="li" key={step.key} gap={3} aria-current={current ? 'step' : undefined}>
            <Flex direction="column" align="center">
              <Flex boxSize={7} rounded="full" align="center" justify="center" flexShrink={0} color="white"
                bg={stopped ? 'red.500' : done ? 'green.500' : current ? 'primary' : 'white'}
                borderWidth={done || stopped || current ? 0 : '2px'} borderColor="gray.300"
                sx={current ? { animation: 'motaaPulse 1.6s ease-in-out infinite' } : undefined}>
                {done && <Check size={15} aria-hidden="true" />}
                {stopped && <X size={15} aria-hidden="true" />}
                {current && <Box boxSize={2.5} rounded="full" bg="white" />}
              </Flex>
              {!last && <Box w="2px" flex={1} minH={6} bg={done && nextDone ? 'green.500' : 'gray.200'} />}
            </Flex>
            <Box pb={last ? 0 : 5} pt={0.5}>
              <Text fontWeight={done || current || stopped ? 600 : 400} color={stopped ? 'red.600' : done || current ? 'gray.800' : 'gray.500'}>
                {step.label}{current ? <Text as="span" fontWeight="400" color="primary"> · next</Text> : null}
              </Text>
              <Text fontSize="sm" color="gray.600">{step.at ? format(step.at) : step.detail}</Text>
            </Box>
          </Flex>
        );
      })}
    </Stack>
  );
}

export default function BookingTracking() {
  const { bookingId } = useParams();
  const { state: routeState } = useLocation();
  const { commaInt, notify } = useContext(GlobalStore);
  const format = useDateTime();
  const chat = useDisclosure();
  const cancelDialog = useDisclosure();
  const cancelRef = useRef(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const query = useApiQuery((api, signal) => api.get(`/mechanics/bookings/${bookingId}/`, { signal }), [bookingId],
    { select: (body) => body?.data });
  const data = query.data;
  const booking = data?.booking || {};
  const mechanic = data?.mechanic || {};

  useEffect(() => { document.title = data?.title ? `${data.title} | Motaa` : 'Track your booking | Motaa'; }, [data?.title]);
  useEffect(() => { if (data) setRefreshedAt(new Date()); }, [data]);

  // keep it current while the mechanic can still change it (only when the tab is visible)
  const { reload } = query;
  const live = Boolean(data?.is_live);
  useEffect(() => {
    if (!live) return undefined;
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') reload(); }, REFRESH_MS);
    const onShow = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onShow); };
  }, [live, reload]);

  const cancel = useApiMutation((api) => api.post(`/mechanics/bookings/${bookingId}/cancel/`), {
    errorTitle: "Couldn't cancel the booking",
    onSuccess: (body) => {
      notify({ title: 'Booking cancelled', body: body?.message || 'Your booking fee is back in your Motaa wallet.' });
      reload();
    },
  });

  if (query.error && !data) {
    return (
      <Container maxW="container.lg" py={8}>
        <BackButton />
        <ErrorState title={query.error?.isNotFound ? 'Booking not found' : "We couldn't load this booking"} error={query.error} onRetry={() => reload()} />
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxW="container.lg" py={8} aria-busy="true">
        <Skeleton h="28px" w="220px" mb={6} />
        <Skeleton h="110px" borderRadius="xl" mb={6} />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Skeleton h="320px" borderRadius="xl" />
          <Skeleton h="320px" borderRadius="xl" />
        </SimpleGrid>
      </Container>
    );
  }

  const job = data.job?.coordinates;
  const workshop = mechanic.coordinates;
  const pins = workshop ? [{ id: 'workshop', ...workshop, title: mechanic.name, subtitle: mechanic.address || 'Workshop' }] : [];
  const services = asList(booking.services);
  const rating = Number(mechanic.rating);
  const tone = data.status === 'completed' ? 'success' : ['declined', 'canceled', 'expired'].includes(data.status) ? 'warning' : 'info';

  return (
    <Box bg="gray.50" minH="100vh">
      <style>{'@keyframes motaaPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(4,96,204,.45) } 50% { box-shadow: 0 0 0 7px rgba(4,96,204,0) } }'}</style>
      <Container maxW="container.lg" py={{ base: 5, md: 8 }}>
        <BackButton />
        <Flex justify="space-between" align="center" gap={3} flexWrap="wrap" mt={3} mb={4}>
          <Heading as="h1" size="lg">Track your booking</Heading>
          <Badge colorScheme={STATUS_COLORS[data.status] || 'gray'} fontSize="sm" px={3} py={1} borderRadius="full" textTransform="none">
            {data.status_label}
          </Badge>
        </Flex>

        {routeState?.justBooked && (
          <Alert status="success" borderRadius="lg" mb={4}>
            <AlertIcon />
            <AlertDescription>Payment received and your booking request has been sent.</AlertDescription>
          </Alert>
        )}

        <Alert status={tone} variant="left-accent" borderRadius="xl" mb={6} alignItems="flex-start" role="status" aria-live="polite">
          <AlertIcon mt={1} />
          <Box>
            <Heading as="h2" size="md" mb={1}>{data.title}</Heading>
            <Text>{data.message}</Text>
            {live && refreshedAt && (
              <Text fontSize="xs" color="gray.600" mt={2}>This page updates by itself. Last checked {format(refreshedAt.toISOString())}.</Text>
            )}
          </Box>
        </Alert>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} alignItems="start">
          <Stack spacing={6}>
            <Section title="Progress">
              <BookingSteps steps={data.steps} />
            </Section>

            <Section title="Your mechanic">
              <Flex gap={4} align="center">
                <Avatar size="lg" name={mechanic.name} src={mechanic.logo || undefined} />
                <Box minW={0}>
                  <Heading as="h3" size="md" noOfLines={1}>{mechanic.name}</Heading>
                  {rating > 0 && (
                    <HStack spacing={1} fontSize="sm" mt={1}><Star size={14} fill="#ECC94B" color="#ECC94B" aria-hidden="true" /><Text>{rating.toFixed(1)}</Text></HStack>
                  )}
                  {mechanic.address && (
                    <HStack spacing={1} fontSize="sm" color="gray.600" mt={1}><MapPin size={14} aria-hidden="true" /><Text noOfLines={1}>{mechanic.address}</Text></HStack>
                  )}
                </Box>
              </Flex>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={5} flexWrap="wrap">
                {mechanic.phone && (
                  <Button as="a" href={`tel:${mechanic.phone}`} leftIcon={<Phone size={16} />} bg="primary" color="white" _hover={{ bg: 'secondary' }}>
                    Call {mechanic.phone}
                  </Button>
                )}
                {!['declined', 'canceled', 'expired'].includes(data.status) && (
                  <Button onClick={chat.onOpen} leftIcon={<MessageCircle size={16} />} variant="outline" color="primary" borderColor="primary">Message</Button>
                )}
                <Button as={RLink} to={`/mechanics/${mechanic.uuid}`} variant="ghost">View profile</Button>
              </Stack>
              {!mechanic.phone && ['requested', 'pending'].includes(data.status) && (
                <Text fontSize="sm" color="gray.600" mt={3}>Their phone number appears here once they accept.</Text>
              )}
            </Section>
          </Stack>

          <Stack spacing={6}>
            <Section title="Where">
              {job || workshop ? (
                <Box h="260px" borderRadius="lg" overflow="hidden">
                  <MapComponent location={job || workshop} pins={job ? pins : []} fitPins={Boolean(job && workshop)} zoom={13}
                    label={job ? 'Map of where you asked the mechanic to come' : 'Map of the mechanic\'s workshop'} style={{ height: '100%' }} />
                </Box>
              ) : null}
              <Stack spacing={1} mt={job || workshop ? 3 : 0} fontSize="sm">
                {data.job?.address && <Text><Text as="span" color="gray.600">You: </Text>{data.job.address}</Text>}
                {mechanic.address && <Text><Text as="span" color="gray.600">Workshop: </Text>{mechanic.address}</Text>}
                {data.distance_km != null && <Text color="gray.600">About {data.distance_km} km apart</Text>}
              </Stack>
            </Section>

            <Section title="Booking details">
              {services.length > 0 && <Wrap spacing={2} mb={3}>{services.map((service) => <Tag key={service}>{service}</Tag>)}</Wrap>}
              <Row label="Type">{booking.type === 'emergency' ? 'Emergency' : 'Routine'}</Row>
              <Row label="Booked">{format(booking.date_created)}</Row>
              <Row label="Booking fee">₦{commaInt(data.payment?.fee)}</Row>
              <Row label="Fee status">{data.payment?.label}</Row>
              {booking.payment_method && <Row label="Paid with">{booking.payment_method === 'wallet' ? 'Motaa wallet' : 'Card / bank'}</Row>}
              {Number(booking.quoted_total) > 0 && <Row label="Services quote (paid to the mechanic)">from ₦{commaInt(booking.quoted_total)}</Row>}
              {booking.problem_description && (
                <Box mt={3} fontSize="sm"><Text color="gray.600">Problem</Text><Text whiteSpace="pre-wrap">{booking.problem_description}</Text></Box>
              )}
              {data.can_cancel && (
                <Button mt={5} w="full" variant="outline" colorScheme="red" onClick={cancelDialog.onOpen}>Cancel booking</Button>
              )}
            </Section>
          </Stack>
        </SimpleGrid>
      </Container>

      <ChatPopup isOpen={chat.isOpen} onClose={chat.onClose} recipient_type="mechanic" recipient_id={mechanic.uuid} recipient_name={mechanic.name} />

      <AlertDialog isOpen={cancelDialog.isOpen} leastDestructiveRef={cancelRef} onClose={cancelDialog.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg">Cancel this booking?</AlertDialogHeader>
            <AlertDialogBody>Your request to {mechanic.name} will be cancelled and the ₦{commaInt(data.payment?.fee)} booking fee returned to your Motaa wallet.</AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={cancelDialog.onClose} isDisabled={cancel.loading}>Keep booking</Button>
              <Button colorScheme="red" isLoading={cancel.loading} loadingText="Cancelling"
                onClick={async () => { await cancel.mutate(); cancelDialog.onClose(); }}>Cancel booking</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
