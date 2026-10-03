import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { CalendarCheck, Inbox, Search } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { asList } from '../../../utils';
import { BookingDetailsModal, BookingTable, useBookingActions } from './bookingParts';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'working', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'canceled', label: 'Cancelled' },
  { key: 'declined', label: 'Declined' },
];

function matchesSearch(booking, term) {
  if (!term) return true;
  const haystack = [booking?.customer?.name, booking?.location, ...asList(booking?.services)].join(' ').toLowerCase();
  return haystack.includes(term);
}

const Bookings = () => {
  const [params, setParams] = useSearchParams();
  const activeFilter = FILTERS.some((f) => f.key === params.get('status')) ? params.get('status') : 'all';
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState(null);

  const bookings = useApiQuery((api, signal) => api.get('/admin/mechanics/bookings/', { signal }), [], {
    select: (body) => {
      const data = body?.data || body?.bookings || {};
      return { requests: asList(data.requests), history: asList(data.history) };
    },
  });
  const actions = useBookingActions({
    onDone: (updated) => {
      bookings.reload();
      setDetails((current) => (current && updated && current.uuid === updated.uuid ? updated : current));
    },
  });

  const term = search.trim().toLowerCase();
  const history = useMemo(
    () => asList(bookings.data?.history)
      .filter((b) => activeFilter === 'all' || String(b?.status).toLowerCase() === activeFilter)
      .filter((b) => matchesSearch(b, term)),
    [bookings.data, activeFilter, term]
  );
  const requests = useMemo(() => asList(bookings.data?.requests).filter((b) => matchesSearch(b, term)), [bookings.data, term]);

  function chooseFilter(key) {
    const next = new URLSearchParams(params);
    if (key === 'all') next.delete('status');
    else next.set('status', key);
    setParams(next, { replace: true });
  }

  return (
    <Box py={4} maxW="1200px" mx="auto">
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4} mb={6}>
        <Heading as="h1" size="lg">Bookings</Heading>
        <InputGroup maxW={{ base: 'full', md: '320px' }}>
          <InputLeftElement pointerEvents="none"><Search size={18} color="#667085" aria-hidden="true" /></InputLeftElement>
          <Input
            placeholder="Search by client or service"
            aria-label="Search bookings by client or service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="white"
          />
        </InputGroup>
      </Flex>

      <AsyncState query={bookings} loadingLabel="Loading bookings…">
        {() => (
          <>
            <Box as="section" mb={10} aria-labelledby="requests-heading">
              <Heading as="h2" id="requests-heading" size="md" mb={4}>
                Pending requests {asList(bookings.data?.requests).length > 0 && `(${asList(bookings.data?.requests).length})`}
              </Heading>
              {requests.length ? (
                <BookingTable bookings={requests} actions={actions} onDetails={setDetails} />
              ) : (
                <EmptyState
                  icon={Inbox}
                  minH="140px"
                  title={term ? 'No matching requests' : 'No pending requests'}
                  description={term ? 'Try a different name or service.' : 'New booking requests from customers will appear here.'}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                />
              )}
            </Box>

            <Box as="section" aria-labelledby="history-heading">
              <Heading as="h2" id="history-heading" size="md" mb={4}>Booking history</Heading>
              <Wrap spacing={2} mb={4} role="group" aria-label="Filter bookings by status">
                {FILTERS.map((filter) => (
                  <WrapItem key={filter.key}>
                    <Button
                      size="sm"
                      variant={activeFilter === filter.key ? 'solid' : 'outline'}
                      colorScheme={activeFilter === filter.key ? 'blue' : 'gray'}
                      aria-pressed={activeFilter === filter.key}
                      onClick={() => chooseFilter(filter.key)}
                    >
                      {filter.label}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>

              {history.length ? (
                <BookingTable bookings={history} actions={actions} onDetails={setDetails} showStatus />
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  minH="160px"
                  title={term || activeFilter !== 'all' ? 'No bookings match' : 'No bookings yet'}
                  description={
                    term || activeFilter !== 'all'
                      ? 'Try another status or search term.'
                      : 'Bookings you accept, complete or decline will be listed here.'
                  }
                  action={term || activeFilter !== 'all' ? { label: 'Clear filters', onClick: () => { setSearch(''); chooseFilter('all'); } } : undefined}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                />
              )}
              {history.length > 0 && (
                <Text mt={3} fontSize="sm" color="gray.500">
                  Showing {history.length} booking{history.length === 1 ? '' : 's'}
                </Text>
              )}
            </Box>
          </>
        )}
      </AsyncState>

      <BookingDetailsModal booking={details} onClose={() => setDetails(null)} actions={actions} />
      {actions.dialog}
    </Box>
  );
};

export default Bookings;
