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
  HStack,
  Stack,
} from '@chakra-ui/react';
import { CalendarCheck, Inbox, Search, Wrench } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { asList } from '../../../utils';
import { splitBookingHistory } from '../../../utils/bookings';
import { BookingDetailsModal, BookingTable, useBookingActions } from './bookingParts';
import { SharingStatusBar } from '../../../components/tracking';
import { CardEmpty, DASH, DashCard, PageHeader } from '../../../components/dashboard/ui';

// history only holds finished bookings; accepted / in-progress jobs have their own "Active jobs" section
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'canceled', label: 'Cancelled' },
  { key: 'declined', label: 'Declined' },
  { key: 'expired', label: 'Expired' },
];

function matchesSearch(booking, term) {
  if (!term) return true;
  const haystack = [booking?.customer?.name, booking?.location, ...asList(booking?.services)].join(' ').toLowerCase();
  return haystack.includes(term);
}

const Bookings = () => {
  const [params, setParams] = useSearchParams();
  const activeFilter = FILTERS.some((f) => f.key === params.get('status')) ? params.get('status') : 'all';
  const [search, setSearch] = useState(params.get('q') || '');
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
  const split = useMemo(() => splitBookingHistory(bookings.data?.history), [bookings.data]);
  const active = useMemo(() => split.active.filter((b) => matchesSearch(b, term)), [split, term]);
  const history = useMemo(
    () => split.finished
      .filter((b) => activeFilter === 'all' || String(b?.status).toLowerCase() === activeFilter)
      .filter((b) => matchesSearch(b, term)),
    [split, activeFilter, term]
  );
  const requests = useMemo(() => asList(bookings.data?.requests).filter((b) => matchesSearch(b, term)), [bookings.data, term]);

  function chooseFilter(key) {
    const next = new URLSearchParams(params);
    if (key === 'all') next.delete('status');
    else next.set('status', key);
    setParams(next, { replace: true });
  }

  const pill = (active) => ({
    h: '40px', px: 4, borderRadius: 'full', flexShrink: 0, fontWeight: 500,
    bg: active ? DASH.ink : DASH.page, color: active ? 'white' : DASH.ink, _hover: { bg: active ? DASH.ink : '#E7EAF0' },
  });
  const empty = (icon, title, body) => <CardEmpty icon={icon} title={title} body={body} />;

  return (
    <Box>
      <PageHeader
        title="Bookings"
        subtitle="Requests to answer, jobs in progress and your booking history."
        actions={(
          <InputGroup w={{ base: '100%', md: '320px' }}>
            <InputLeftElement h="48px" pointerEvents="none"><Search size={18} color={DASH.muted} aria-hidden="true" /></InputLeftElement>
            <Input placeholder="Search by client or service" aria-label="Search bookings by client or service" value={search}
              onChange={(e) => setSearch(e.target.value)} h="48px" borderRadius="full" bg="white" border="none" />
          </InputGroup>
        )}
      />

      <SharingStatusBar mb={5} />
      <AsyncState query={bookings} loadingLabel="Loading bookings…">
        {() => (
          <Stack spacing={{ base: 4, md: 5 }}>
            <DashCard title={`Requests${asList(bookings.data?.requests).length ? ` (${asList(bookings.data?.requests).length})` : ''}`}
              subtitle="Customers waiting for you to accept or decline.">
              {requests.length ? <BookingTable bookings={requests} actions={actions} onDetails={setDetails} />
                : empty(Inbox, term ? 'No matching requests' : 'No requests right now', term ? 'Try a different name or service.' : 'New booking requests from customers appear here.')}
            </DashCard>

            <DashCard title={`Active jobs${split.active.length ? ` (${split.active.length})` : ''}`} subtitle="Jobs you've accepted or are working on.">
              {active.length ? <BookingTable bookings={active} actions={actions} onDetails={setDetails} showStatus />
                : empty(Wrench, term ? 'No matching jobs' : 'No active jobs', term ? 'Try a different name or service.' : 'Requests you accept show here until you finish them.')}
            </DashCard>

            <DashCard title="History" subtitle="Finished, cancelled, declined and expired bookings.">
              <HStack spacing={2} mb={5} overflowX="auto" className="hidden-scroll" role="group" aria-label="Filter bookings by status" pb={1}>
                {FILTERS.map((filter) => (
                  <Button key={filter.key} {...pill(activeFilter === filter.key)} aria-pressed={activeFilter === filter.key} onClick={() => chooseFilter(filter.key)}>
                    {filter.label}
                  </Button>
                ))}
              </HStack>
              {history.length ? (
                <>
                  <BookingTable bookings={history} actions={actions} onDetails={setDetails} showStatus />
                  <Text mt={3} fontSize="sm" color={DASH.muted}>Showing {history.length} booking{history.length === 1 ? '' : 's'}</Text>
                </>
              ) : (
                <Stack align="center" spacing={3}>
                  {empty(CalendarCheck, term || activeFilter !== 'all' ? 'No bookings match' : 'No bookings yet',
                    term || activeFilter !== 'all' ? 'Try another status or search term.' : 'Finished bookings will be listed here.')}
                  {(term || activeFilter !== 'all') && (
                    <Button size="sm" borderRadius="full" onClick={() => { setSearch(''); chooseFilter('all'); }}>Clear filters</Button>
                  )}
                </Stack>
              )}
            </DashCard>
          </Stack>
        )}
      </AsyncState>

      <BookingDetailsModal booking={details} onClose={() => setDetails(null)} actions={actions} />
      {actions.dialog}
    </Box>
  );
};

export default Bookings;
