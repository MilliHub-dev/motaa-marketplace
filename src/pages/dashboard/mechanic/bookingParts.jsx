// Shared booking UI for the mechanic dashboard: status badge, client cell,
// action buttons (accept / decline / start / finish / cancel) with
// confirmation for the irreversible ones, and a booking details modal.
import { useContext, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useBreakpointValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Eye, MapPin } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiMutation } from '../../../hooks/useApi';
import { asList } from '../../../utils';

export const STATUS_COLORS = {
  requested: 'cyan',
  pending: 'cyan',
  accepted: 'blue',
  working: 'purple',
  completed: 'green',
  declined: 'yellow',
  expired: 'gray',
  canceled: 'red',
};

export const STATUS_LABELS = {
  requested: 'Requested',
  pending: 'Requested',
  accepted: 'Accepted',
  working: 'In progress',
  completed: 'Completed',
  declined: 'Declined',
  expired: 'Expired',
  canceled: 'Canceled',
};

export function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  return (
    <Badge colorScheme={STATUS_COLORS[key] || 'gray'} px={2} py={1} borderRadius="full" textTransform="none">
      {STATUS_LABELS[key] || status || 'Unknown'}
    </Badge>
  );
}

export function ClientInfo({ customer, location }) {
  const name = customer?.name?.trim() || 'Customer';
  return (
    <Flex align="center" minW="160px">
      <Avatar src={customer?.image || undefined} name={name} size="sm" mr={3} />
      <Box minW={0}>
        <Text fontWeight="medium" noOfLines={1}>{name}</Text>
        {location && (
          <Flex align="center" color="gray.500" fontSize="xs">
            <MapPin size={12} style={{ marginRight: 4 }} aria-hidden="true" />
            {location}
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

export function servicesSummary(booking) {
  const services = asList(booking?.services);
  if (!services.length) return '—';
  return services.length > 1 ? `${services[0]} + ${services.length - 1} more` : services[0];
}

export function useBookingDate() {
  const { naturalDate, naturalTime } = useContext(GlobalStore);
  return (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '—';
    return `${naturalDate(date)} · ${naturalTime(date)}`;
  };
}

const ACTIONS = {
  accept: {
    label: 'Accept', colorScheme: 'blue', done: 'Booking accepted',
  },
  decline: {
    label: 'Decline', colorScheme: 'red', variant: 'outline', done: 'Booking declined',
    confirm: {
      title: 'Decline this booking?',
      body: (name) => `${name} will be told you can't take this job. This can't be undone.`,
      cta: 'Decline booking',
    },
  },
  start: { label: 'Start job', colorScheme: 'blue', done: 'Job started' },
  complete: {
    label: 'Finish job', colorScheme: 'green', done: 'Job marked as completed',
    confirm: {
      title: 'Mark this job as completed?',
      body: (name) => `${name} will be notified that the work is done.`,
      cta: 'Mark completed',
      colorScheme: 'green',
    },
  },
  cancel: {
    label: 'Cancel job', colorScheme: 'red', variant: 'outline', done: 'Job canceled',
    confirm: {
      title: 'Cancel this job?',
      body: (name) => `${name} will be told you canceled the booking. This can't be undone.`,
      cta: 'Cancel job',
    },
  },
};

export const ACTIONS_FOR_STATUS = {
  requested: ['accept', 'decline'],
  pending: ['accept', 'decline'],
  accepted: ['start', 'cancel'],
  working: ['complete', 'cancel'],
};

/**
 * Runs booking actions against POST /admin/mechanics/bookings/<uuid>/ and
 * renders the confirmation dialog. `onDone(updatedBooking)` runs after success.
 */
export function useBookingActions({ onDone } = {}) {
  const [pending, setPending] = useState(null); // { uuid, action }
  const [confirming, setConfirming] = useState(null); // { booking, action }
  const cancelRef = useRef();

  const mutation = useApiMutation(
    (api, uuid, action) => api.post(`/admin/mechanics/bookings/${uuid}/`, { action }),
    {
      successMessage: (body) => body?.message || 'Booking updated',
      errorTitle: "Couldn't update the booking",
      onSuccess: (body) => onDone?.(body?.data),
    }
  );

  async function execute(booking, action) {
    setPending({ uuid: booking?.uuid, action });
    try {
      return await mutation.mutate(booking?.uuid, action);
    } finally {
      setPending(null);
      setConfirming(null);
    }
  }

  function run(booking, action) {
    if (!booking?.uuid || pending) return;
    if (ACTIONS[action]?.confirm) setConfirming({ booking, action });
    else execute(booking, action);
  }

  const confirm = confirming && ACTIONS[confirming.action].confirm;
  const dialog = (
    <AlertDialog isOpen={!!confirming} leastDestructiveRef={cancelRef} onClose={() => !pending && setConfirming(null)} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent mx={4}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">{confirm?.title}</AlertDialogHeader>
          <AlertDialogBody>
            {confirm?.body(confirming?.booking?.customer?.name?.trim() || 'The customer')}
            <Text mt={2} color="gray.600" fontSize="sm">{servicesSummary(confirming?.booking)}</Text>
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
            <Button ref={cancelRef} onClick={() => setConfirming(null)} isDisabled={!!pending}>Go back</Button>
            <Button
              colorScheme={confirm?.colorScheme || 'red'}
              onClick={() => execute(confirming.booking, confirming.action)}
              isLoading={!!pending}
            >
              {confirm?.cta}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );

  return { run, pending, dialog };
}

/** Buttons for whatever the booking's status allows, plus a details button. */
export function BookingActionButtons({ booking, actions, onDetails }) {
  const allowed = ACTIONS_FOR_STATUS[String(booking?.status || '').toLowerCase()] || [];
  const busy = actions.pending?.uuid === booking?.uuid ? actions.pending.action : null;
  return (
    <HStack spacing={2}>
      {allowed.map((action) => {
        const meta = ACTIONS[action];
        return (
          <Button
            key={action}
            size="sm"
            colorScheme={meta.colorScheme}
            variant={meta.variant || 'solid'}
            onClick={() => actions.run(booking, action)}
            isLoading={busy === action}
            isDisabled={!!actions.pending && busy !== action}
          >
            {meta.label}
          </Button>
        );
      })}
      {onDetails && (
        <IconButton
          size="sm"
          variant="ghost"
          icon={<Eye size={16} />}
          aria-label={`View booking details for ${booking?.customer?.name || 'customer'}`}
          onClick={() => onDetails(booking)}
        />
      )}
    </HStack>
  );
}

function DetailRow({ label, children }) {
  return (
    <Flex justify="space-between" gap={4} fontSize="sm">
      <Text color="gray.500">{label}</Text>
      <Box textAlign="right">{children}</Box>
    </Flex>
  );
}

export function BookingDetailsModal({ booking, onClose, actions }) {
  const { commaInt } = useContext(GlobalStore);
  const formatDate = useBookingDate();
  return (
    <Modal isOpen={!!booking} onClose={onClose} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Booking details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {booking && (
            <VStack align="stretch" spacing={3}>
              <ClientInfo customer={booking.customer} location={booking.location} />
              <Divider />
              <DetailRow label="Status"><StatusBadge status={booking.status} /></DetailRow>
              {booking.type && <DetailRow label="Type">{booking.type}</DetailRow>}
              <DetailRow label="Requested">{formatDate(booking.date_created)}</DetailRow>
              {booking.started_on && <DetailRow label="Started">{formatDate(booking.started_on)}</DetailRow>}
              {booking.ended_on && <DetailRow label="Ended">{formatDate(booking.ended_on)}</DetailRow>}
              <DetailRow label="Total">₦{commaInt(booking.sub_total)}</DetailRow>
              <Box>
                <Text color="gray.500" fontSize="sm" mb={2}>Services</Text>
                <Wrap>
                  {asList(booking.services).map((service) => (
                    <WrapItem key={service}><Tag>{service}</Tag></WrapItem>
                  ))}
                  {!asList(booking.services).length && <Text fontSize="sm">No services listed</Text>}
                </Wrap>
              </Box>
              {booking.problem_description && (
                <Box>
                  <Text color="gray.500" fontSize="sm" mb={1}>Problem description</Text>
                  <Text fontSize="sm" whiteSpace="pre-wrap">{booking.problem_description}</Text>
                </Box>
              )}
              {booking.rating != null && (
                <Box>
                  <Text color="gray.500" fontSize="sm" mb={1}>Customer review ({booking.rating}/5)</Text>
                  <Text fontSize="sm">{booking.review}</Text>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          {booking && <BookingActionButtons booking={booking} actions={actions} />}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Bookings table with client, services, total, date, optional status and actions. */
export function BookingTable({ bookings, actions, onDetails, showStatus }) {
  const { commaInt } = useContext(GlobalStore);
  const formatDate = useBookingDate();
  const compact = useBreakpointValue({ base: true, md: false }, { ssr: false });

  if (compact) {
    // phones: stacked cards so the actions are visible without scrolling sideways
    return (
      <VStack as="ul" listStyleType="none" spacing={3} align="stretch">
        {bookings.map((booking) => (
          <Box as="li" key={booking?.uuid} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" p={4}>
            <Flex justify="space-between" align="start" gap={3}>
              <ClientInfo customer={booking?.customer} location={booking?.location} />
              {showStatus && <StatusBadge status={booking?.status} />}
            </Flex>
            <Text mt={3} fontSize="sm">{servicesSummary(booking)}</Text>
            <Flex mt={1} justify="space-between" fontSize="sm" color="gray.600" gap={2} wrap="wrap">
              <Text>{formatDate(booking?.date_created)}</Text>
              <Text fontWeight="semibold" color="gray.800">₦{commaInt(booking?.sub_total)}</Text>
            </Flex>
            <Box mt={3}><BookingActionButtons booking={booking} actions={actions} onDetails={onDetails} /></Box>
          </Box>
        ))}
      </VStack>
    );
  }

  return (
    <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th py={3}>Client</Th>
            <Th>Services</Th>
            <Th isNumeric>Total</Th>
            <Th>Date</Th>
            {showStatus && <Th>Status</Th>}
            <Th><Box as="span" srOnly>Actions</Box></Th>
          </Tr>
        </Thead>
        <Tbody>
          {bookings.map((booking) => (
            <Tr key={booking?.uuid}>
              <Td py={3}><ClientInfo customer={booking?.customer} location={booking?.location} /></Td>
              <Td>{servicesSummary(booking)}</Td>
              <Td isNumeric>₦{commaInt(booking?.sub_total)}</Td>
              <Td>{formatDate(booking?.date_created)}</Td>
              {showStatus && <Td><StatusBadge status={booking?.status} /></Td>}
              <Td><BookingActionButtons booking={booking} actions={actions} onDetails={onDetails} /></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
