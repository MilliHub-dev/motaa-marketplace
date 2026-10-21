// /bookings/:bookingId — follow a paid mechanic booking: where it is up to, who is coming and how to reach
// them, the map, and what happened to the booking fee. Refreshes itself while the booking is still moving.
// Once the mechanic marks it done: confirm (pays them now) or report a problem by `confirm_by`, and rate them.
import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink, useLocation, useParams } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader,
  AlertDialogOverlay, AlertIcon, Avatar, Badge, Box, Button, Container, Flex, FormControl, FormErrorMessage, FormHelperText,
  FormLabel, Heading, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  SimpleGrid, Skeleton, Stack, Tag, Text, Textarea, Wrap, useDisclosure,
} from '@chakra-ui/react';
import { Check, CircleAlert, Clock, MapPin, MessageCircle, Phone, Star, ThumbsUp, X } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ChatPopup } from '../../../components/chat';
import { MapComponent } from '../../../components/maps';
import { BackButton } from '../../../components/nav';
import { useDateTime } from '../../../components/parts';
import { ErrorState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { PROBLEM_MIN_LENGTH, bookingDeadline, cleanStars, hasServiceCharge, nextStar, problemError } from '../../../utils/bookings';
import { distanceLabel } from '../../../utils/transport';

const REFRESH_MS = 20000;
const STATUS_COLORS = {
  requested: 'yellow', pending: 'yellow', accepted: 'blue', working: 'blue', completed: 'green',
  declined: 'red', canceled: 'gray', expired: 'orange',
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

const STAR_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Five stars as a radio group: click or use the arrow keys. */
export function StarPicker({ value, onChange, label, isDisabled }) {
  const refs = useRef([]);
  const current = cleanStars(value);
  function onKeyDown(e) {
    // move from the focused star (the first one is focused before anything is chosen)
    const from = Number(e.target?.dataset?.stars) || current;
    const next = nextStar(from, e.key);
    if (next === from && !['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    onChange(next);
    refs.current[next - 1]?.focus();
  }
  return (
    <HStack role="radiogroup" aria-label={label} spacing={1} onKeyDown={onKeyDown}>
      {[1, 2, 3, 4, 5].map((stars) => {
        const on = stars <= current;
        return (
          <Box
            as="button"
            type="button"
            key={stars}
            ref={(el) => { refs.current[stars - 1] = el; }}
            role="radio"
            data-stars={stars}
            aria-checked={stars === current}
            aria-label={`${stars} star${stars === 1 ? '' : 's'}${STAR_WORDS[stars] ? ` (${STAR_WORDS[stars]})` : ''}`}
            tabIndex={stars === (current || 1) ? 0 : -1}
            disabled={isDisabled}
            onClick={() => onChange(stars)}
            p={1}
            borderRadius="md"
            lineHeight={0}
            _hover={{ transform: 'scale(1.1)' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'primary', outlineOffset: '1px' }}
            transition="transform 0.1s"
          >
            <Star size={30} aria-hidden="true" fill={on ? '#ECC94B' : 'none'} color={on ? '#D69E2E' : '#A0AEC0'} strokeWidth={1.5} />
          </Box>
        );
      })}
      <Text ml={2} fontSize="sm" color="gray.600" aria-hidden="true">{STAR_WORDS[current]}</Text>
    </HStack>
  );
}

function StarsShown({ stars }) {
  const value = cleanStars(stars);
  return (
    <HStack spacing={0.5} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={18} aria-hidden="true" fill={n <= value ? '#ECC94B' : 'none'} color={n <= value ? '#D69E2E' : '#A0AEC0'} strokeWidth={1.5} />
      ))}
    </HStack>
  );
}

/** "Is the job done?": confirm (pays the mechanic now) or report a problem, by the deadline. */
function ConfirmJobCard({ data, bookingId, onUpdated }) {
  const { commaInt, notify } = useContext(GlobalStore);
  const confirmDialog = useDisclosure();
  const problemModal = useDisclosure();
  const keepRef = useRef(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const name = data.mechanic?.name || 'your mechanic';
  const fee = `₦${commaInt(data.payment?.fee)}`;
  const deadline = bookingDeadline(data.confirm_by);

  const confirm = useApiMutation((api) => api.post(`/mechanics/bookings/${bookingId}/confirm/`), {
    errorTitle: "Couldn't confirm the job",
    onSuccess: (body) => {
      notify({ title: 'Thanks!', body: body?.message || `${fee} was paid to ${name}.` });
      confirmDialog.onClose();
      onUpdated(body?.data);
    },
  });
  const report = useApiMutation((api, text) => api.post(`/mechanics/bookings/${bookingId}/problem/`, { details: text }), {
    errorTitle: "Couldn't send your report",
    onSuccess: (body) => {
      notify({ title: 'Problem reported', body: body?.message || 'Motaa will contact you.', color: 'blue', duration: 6000 });
      problemModal.onClose();
      setDetails('');
      setSubmitted(false);
      onUpdated(body?.data);
    },
  });
  const error = submitted ? problemError(details) : '';

  function sendReport(e) {
    e.preventDefault();
    setSubmitted(true);
    if (problemError(details)) return;
    report.mutate(details.trim());
  }

  return (
    <Section as="section" borderColor="blue.200" borderWidth="2px" aria-labelledby="confirm-heading">
      <Flex gap={4} direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }}>
        <Box flex={1}>
          <Heading as="h2" size="md" id="confirm-heading" mb={1}>Is the job done?</Heading>
          <Text color="gray.700">{name} marked the job as done. Confirm it if you're happy, or tell us if something isn't right.</Text>
          {deadline && (
            <HStack align="start" spacing={2} mt={2} fontSize="sm" color="gray.600">
              <Clock size={16} aria-hidden="true" style={{ marginTop: 2, flexShrink: 0 }} />
              <Text>Confirm or report a problem by <b>{deadline}</b>. If you do neither, the fee is paid to them then.</Text>
            </HStack>
          )}
        </Box>
        <Stack direction={{ base: 'column', sm: 'row', md: 'column', lg: 'row' }} spacing={3} flexShrink={0}>
          {data.can_confirm && (
            <Button leftIcon={<Check size={18} />} bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={confirmDialog.onOpen}>
              Confirm job done
            </Button>
          )}
          {data.can_report_problem && (
            <Button leftIcon={<CircleAlert size={18} />} variant="outline" colorScheme="orange" onClick={problemModal.onOpen}>
              Report a problem
            </Button>
          )}
        </Stack>
      </Flex>

      <AlertDialog isOpen={confirmDialog.isOpen} leastDestructiveRef={keepRef} onClose={confirmDialog.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader fontSize="lg">Confirm the job is done?</AlertDialogHeader>
            <AlertDialogBody>{fee} is paid to {name} now. Only confirm if you're happy with the work.</AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={keepRef} variant="ghost" onClick={confirmDialog.onClose} isDisabled={confirm.loading}>Not yet</Button>
              <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={confirm.loading} loadingText="Confirming"
                onClick={() => confirm.mutate()}>Confirm job done</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal isOpen={problemModal.isOpen} onClose={() => { if (!report.loading) problemModal.onClose(); }} isCentered size={{ base: 'full', sm: 'md' }}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={sendReport} noValidate mx={{ base: 0, sm: 4 }} borderRadius={{ base: 0, sm: 'lg' }}>
          <ModalHeader pr={12}>Report a problem</ModalHeader>
          <ModalCloseButton isDisabled={report.loading} />
          <ModalBody>
            <Text color="gray.700" mb={4}>
              The {fee} booking fee stays held while Motaa looks into it. We'll contact you.
            </Text>
            <FormControl isInvalid={Boolean(error)} isRequired>
              <FormLabel>What went wrong?</FormLabel>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value.slice(0, 2000))} rows={5}
                placeholder="e.g. The engine light came back on the same day." autoFocus />
              {error ? <FormErrorMessage>{error}</FormErrorMessage>
                : <FormHelperText>At least {PROBLEM_MIN_LENGTH} characters.</FormHelperText>}
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={problemModal.onClose} isDisabled={report.loading}>Cancel</Button>
            <Button type="submit" colorScheme="orange" isLoading={report.loading} loadingText="Sending">Send report</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Section>
  );
}

/** "Rate <mechanic>": stars + optional comment; shows their review with "Edit" once given. */
function ReviewCard({ data, bookingId, onUpdated }) {
  const { notify } = useContext(GlobalStore);
  const mine = data.my_review;
  const name = data.mechanic?.name || 'your mechanic';
  const [editing, setEditing] = useState(!mine);
  const [stars, setStars] = useState(cleanStars(mine?.stars));
  const [comment, setComment] = useState(mine?.comment || '');
  const [submitted, setSubmitted] = useState(false);
  const save = useApiMutation((api) => api.post(`/mechanics/bookings/${bookingId}/review/`, { stars, comment: comment.trim() }), {
    errorTitle: "Couldn't save your review",
    onSuccess: (body) => {
      notify({ title: 'Thanks for your review', body: body?.message || `Your rating helps others choose ${name}.` });
      setEditing(false);
      setSubmitted(false);
      onUpdated(body?.data);
    },
  });

  function startEdit() {
    setStars(cleanStars(mine?.stars));
    setComment(mine?.comment || '');
    setEditing(true);
  }

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!stars) return;
    save.mutate();
  }

  if (mine && !editing) {
    return (
      <Section as="section" aria-labelledby="review-heading">
        <Flex justify="space-between" align="start" gap={3}>
          <Box>
            <Heading as="h2" size="sm" id="review-heading" mb={2}>Your review of {name}</Heading>
            <StarsShown stars={mine.stars} />
            {mine.comment && <Text mt={2} color="gray.700" whiteSpace="pre-wrap">“{mine.comment}”</Text>}
          </Box>
          <Button size="sm" variant="ghost" color="primary" onClick={startEdit}>Edit</Button>
        </Flex>
      </Section>
    );
  }

  return (
    <Section as="section" aria-labelledby="review-heading">
      <Box as="form" onSubmit={submit} noValidate>
        <HStack spacing={2} mb={1}>
          <ThumbsUp size={18} aria-hidden="true" />
          <Heading as="h2" size="sm" id="review-heading">Rate {name}</Heading>
        </HStack>
        <Text fontSize="sm" color="gray.600" mb={3}>How did it go? Your rating helps other drivers.</Text>
        <FormControl isInvalid={submitted && !stars} mb={4}>
          <StarPicker value={stars} onChange={setStars} label={`Rate ${name} from 1 to 5 stars`} isDisabled={save.loading} />
          <FormErrorMessage>Choose from 1 to 5 stars.</FormErrorMessage>
        </FormControl>
        <FormControl mb={4}>
          <FormLabel fontSize="sm">Comment (optional)</FormLabel>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 1000))} rows={3}
            placeholder="What went well? What could be better?" isDisabled={save.loading} />
        </FormControl>
        <HStack spacing={3}>
          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} loadingText="Saving">
            {mine ? 'Save review' : 'Submit'}
          </Button>
          {mine && <Button variant="ghost" onClick={() => setEditing(false)} isDisabled={save.loading}>Cancel</Button>}
        </HStack>
      </Box>
    </Section>
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

  // keep it current while the mechanic can still change it, or while the job waits for the customer's
  // confirmation (it is paid automatically at the deadline) — only when the tab is visible
  const { reload, setData } = query;
  const live = Boolean(data?.is_live);
  const refreshing = live || Boolean(data?.can_confirm);
  const updated = (payload) => { if (payload) setData(payload); else reload(); };
  useEffect(() => {
    if (!refreshing) return undefined;
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') reload(); }, REFRESH_MS);
    const onShow = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onShow); };
  }, [refreshing, reload]);

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
  // done but not settled yet: waiting for the customer (info) or held over a problem (warning)
  const tone = data.problem ? 'warning' : data.can_confirm ? 'info' : data.status === 'completed' ? 'success' : ['declined', 'canceled', 'expired'].includes(data.status) ? 'warning' : 'info';

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
            {data.expires_at && ['requested', 'pending'].includes(data.status) && bookingDeadline(data.expires_at) && (
              <Text fontSize="sm" mt={2}>
                If {mechanic.name || 'the mechanic'} doesn't reply by <b>{bookingDeadline(data.expires_at)}</b>, the request is cancelled and you're refunded.
              </Text>
            )}
            {refreshing && refreshedAt && (
              <Text fontSize="xs" color="gray.600" mt={2}>This page updates by itself. Last checked {format(refreshedAt.toISOString())}.</Text>
            )}
          </Box>
        </Alert>

        {(data.can_confirm || data.can_report_problem) && (
          <Box mb={6}><ConfirmJobCard data={data} bookingId={bookingId} onUpdated={updated} /></Box>
        )}

        {data.problem && (
          <Alert status="warning" variant="subtle" borderRadius="xl" mb={6} alignItems="flex-start">
            <AlertIcon mt={1} />
            <Box>
              <Heading as="h2" size="sm" mb={1}>What you reported{data.problem.reported_on ? ` on ${format(data.problem.reported_on)}` : ''}</Heading>
              {data.problem.details && <Text whiteSpace="pre-wrap" color="gray.800" mb={1}>“{data.problem.details}”</Text>}
              <Text fontSize="sm" color="gray.700">Motaa will contact you. Your booking fee stays held until it's sorted out.</Text>
            </Box>
          </Alert>
        )}

        {data.can_review && (
          <Box mb={6}><ReviewCard key={data.my_review ? 'reviewed' : 'new'} data={data} bookingId={bookingId} onUpdated={updated} /></Box>
        )}

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
                {data.distance_km != null && (
                  <Text color="gray.600">
                    {distanceLabel(data.distance_km, data.drive_minutes)?.replace(' away', data.distance_by_road === false ? ' apart (approx.)' : ' by road')}
                  </Text>
                )}
              </Stack>
            </Section>

            <Section title="Booking details">
              {services.length > 0 && <Wrap spacing={2} mb={3}>{services.map((service) => <Tag key={service}>{service}</Tag>)}</Wrap>}
              <Row label="Type">{booking.type === 'emergency' ? 'Emergency' : 'Routine'}</Row>
              <Row label="Booked">{format(booking.date_created)}</Row>
              <Row label="Booking fee">₦{commaInt(data.payment?.fee)}</Row>
              {hasServiceCharge(data.payment?.service_charge) && (
                <>
                  <Row label={Number(data.payment?.service_charge_km) > 0 ? `Service charge (${Number(data.payment.service_charge_km).toFixed(1)} km)` : 'Service charge'}>
                    ₦{commaInt(data.payment.service_charge)}
                  </Row>
                  <Row label="Total paid"><Text as="span" fontWeight="700">₦{commaInt(data.payment?.total ?? Number(data.payment?.fee) + Number(data.payment?.service_charge))}</Text></Row>
                </>
              )}
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
            <AlertDialogBody>
              Your request to {mechanic.name} will be cancelled.{' '}
              {hasServiceCharge(data.payment?.service_charge)
                ? <>Your ₦{commaInt(data.payment?.fee)} booking fee comes back to your wallet. <b>The ₦{commaInt(data.payment.service_charge)} service charge isn't refundable.</b></>
                : <>The ₦{commaInt(data.payment?.fee)} booking fee is returned to your Motaa wallet.</>}
            </AlertDialogBody>
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
