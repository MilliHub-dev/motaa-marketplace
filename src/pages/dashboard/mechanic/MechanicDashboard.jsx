import { useContext, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { CalendarCheck, Inbox } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { asList } from '../../../utils';
import {
  BookingActionButtons,
  BookingDetailsModal,
  BookingTable,
  ClientInfo,
  servicesSummary,
  useBookingActions,
} from './bookingParts';

function MetricCard({ title, value }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4} bg="white">
      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>{title}</Text>
      <Text fontSize="2xl" fontWeight="bold" noOfLines={1}>{value}</Text>
    </Box>
  );
}

export const MechanicOverview = () => {
  const { authUser, commaInt } = useContext(GlobalStore);
  const [details, setDetails] = useState(null);
  const dashboard = useApiQuery((api, signal) => api.get('/admin/mechanics/dashboard/', { signal }), [], {
    select: (body) => body?.data || {},
  });
  const actions = useBookingActions({
    onDone: (updated) => {
      dashboard.reload();
      setDetails((current) => (current && updated && current.uuid === updated.uuid ? updated : current));
    },
  });

  return (
    <Box py={4} maxW="1200px" mx="auto">
      <Box mb={6}>
        <Heading as="h1" size="lg" mb={1}>
          Welcome back{authUser?.first_name ? `, ${authUser.first_name}` : ''} <span role="img" aria-label="wave">👋</span>
        </Heading>
        <Text color="gray.600">Manage your booking requests, jobs and earnings.</Text>
      </Box>

      <AsyncState query={dashboard} loadingLabel="Loading your dashboard…">
        {(data) => {
          const pending = asList(data?.pending_requests);
          const history = asList(data?.booking_history);
          const current = data?.current_job;
          return (
            <>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <Box gridColumn={{ base: 'span 2', md: 'auto' }}>
                  <MetricCard title="Revenue (completed)" value={`₦${commaInt(data?.total_revenue)}`} />
                </Box>
                <MetricCard title="Hires" value={commaInt(data?.total_hires)} />
                <MetricCard title="Bookings" value={commaInt(data?.total_bookings)} />
                <MetricCard title="Pending requests" value={commaInt(data?.total_pending ?? pending.length)} />
              </SimpleGrid>

              {current?.uuid && (
                <Box mb={8} p={4} borderWidth="1px" borderColor="purple.200" bg="purple.50" borderRadius="lg">
                  <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={3}>Current job</Text>
                  <Flex gap={4} align={{ base: 'start', md: 'center' }} justify="space-between" direction={{ base: 'column', md: 'row' }}>
                    <Box>
                      <ClientInfo customer={current.customer} location={current.location} />
                      <Text mt={2} fontSize="sm" color="gray.700">{servicesSummary(current)} · ₦{commaInt(current.sub_total)}</Text>
                    </Box>
                    <BookingActionButtons booking={current} actions={actions} onDetails={setDetails} />
                  </Flex>
                </Box>
              )}

              <Box as="section" mb={8} aria-labelledby="pending-heading">
                <Heading as="h2" id="pending-heading" size="md" mb={4}>Pending requests</Heading>
                {pending.length ? (
                  <BookingTable bookings={pending} actions={actions} onDetails={setDetails} />
                ) : (
                  <EmptyState
                    icon={Inbox}
                    minH="160px"
                    title="No pending requests"
                    description="New booking requests from customers will appear here for you to accept or decline."
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                  />
                )}
              </Box>

              <Box as="section" aria-labelledby="history-heading">
                <Flex justify="space-between" align="center" mb={4} gap={3}>
                  <Heading as="h2" id="history-heading" size="md">Recent bookings</Heading>
                  {history.length > 0 && (
                    <Button as={RLink} to="/bookings" size="sm" variant="outline">View all</Button>
                  )}
                </Flex>
                {history.length ? (
                  <BookingTable bookings={history} actions={actions} onDetails={setDetails} showStatus />
                ) : (
                  <EmptyState
                    icon={CalendarCheck}
                    minH="160px"
                    title="No bookings yet"
                    description="Bookings you accept will show up here. Keep your services up to date so customers can find you."
                    action={{ label: 'Manage services', to: '/services' }}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                  />
                )}
              </Box>
            </>
          );
        }}
      </AsyncState>

      <BookingDetailsModal booking={details} onClose={() => setDetails(null)} actions={actions} />
      {actions.dialog}
    </Box>
  );
};

export default MechanicOverview;
