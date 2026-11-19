// The mechanic's Overview: earnings and jobs at a glance, the job in progress, requests to accept or decline,
// earnings over the year and recent bookings. Data: /admin/mechanics/dashboard/ and /admin/mechanics/analytics/.
import { useContext, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Avatar, Box, Flex, Grid, HStack, Link, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Banknote, BadgeCheck, CalendarCheck, Images, Inbox, Lightbulb, Plus, Timer, Wrench } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { ErrorState } from '../../../components/states';
import { asList } from '../../../utils';
import { CardEmpty, chartOptions, compactNumber, DASH, DashCard, naira, PageHeader, PillButton, StatTile } from '../../../components/dashboard/ui';
import { BookingActionButtons, BookingDetailsModal, BookingTable, servicesSummary, StatusBadge, useBookingActions, useBookingDate } from './bookingParts';
import { MechanicContext } from './Layout';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function CurrentJob({ job, actions, onDetails }) {
  const name = job?.customer?.name?.trim() || 'Customer';
  return (
    <DashCard dark title="Current job" subtitle="The job you're working on now.">
      <Flex gap={4} align={{ base: 'flex-start', md: 'center' }} justify="space-between" direction={{ base: 'column', md: 'row' }}>
        <HStack spacing={3} minW={0}>
          <Avatar size="lg" src={job?.customer?.image || undefined} name={name} border="3px solid" borderColor="whiteAlpha.300" />
          <Box minW={0}>
            <Text fontWeight="600" fontSize="lg" noOfLines={1}>{name}</Text>
            <Text color="whiteAlpha.700" fontSize="sm" noOfLines={1}>{servicesSummary(job)}{job?.location ? ` · ${job.location}` : ''}</Text>
            <Text fontWeight="700" mt={1}>{naira(job?.sub_total)}</Text>
          </Box>
        </HStack>
        <Box bg="white" color={DASH.ink} borderRadius="16px" p={2}><BookingActionButtons booking={job} actions={actions} onDetails={onDetails} /></Box>
      </Flex>
    </DashCard>
  );
}

function Available({ mechanic }) {
  return (
    <DashCard dark>
      <Flex gap={4} align="center">
        <Flex w={14} h={14} borderRadius="full" bg="whiteAlpha.200" align="center" justify="center" flexShrink={0}><Wrench size={26} /></Flex>
        <Box>
          <Text fontWeight="600" fontSize="lg">{mechanic?.available === false ? "You're marked as unavailable" : "You're free for new jobs"}</Text>
          <Text color="whiteAlpha.700" fontSize="sm">
            {mechanic?.available === false ? 'Customers can still see your profile, but you won’t get new requests.' : 'New requests from customers nearby show up below and in your notifications.'}
          </Text>
        </Box>
      </Flex>
    </DashCard>
  );
}

function RecentBookings({ bookings, onOpen }) {
  const formatDate = useBookingDate();
  return (
    <DashCard title="Recent bookings" subtitle="Newest first." menu={[{ label: 'All bookings', to: '/bookings' }]}>
      {bookings.length ? (
        <Stack spacing={1}>
          {bookings.slice(0, 6).map((booking) => {
            const name = booking?.customer?.name?.trim() || 'Customer';
            return (
              <Flex key={booking.uuid} as="button" type="button" onClick={() => onOpen(booking)} align="center" gap={3} p={2} mx={-2}
                borderRadius="14px" textAlign="left" _hover={{ bg: DASH.page }}>
                <Avatar size="md" name={name} src={booking?.customer?.image || undefined} bg={DASH.blueWash} color={DASH.blue} />
                <Box flex={1} minW={0}>
                  <Text fontWeight="600" noOfLines={1}>{name}</Text>
                  <Text fontSize="sm" color={DASH.muted} noOfLines={1}>{servicesSummary(booking)} · {formatDate(booking?.date_created)}</Text>
                </Box>
                <Stack spacing={1} align="flex-end" flexShrink={0}>
                  <Text fontWeight="700">{naira(booking?.sub_total, { short: true })}</Text>
                  <StatusBadge status={booking?.status} />
                </Stack>
              </Flex>
            );
          })}
        </Stack>
      ) : (
        <CardEmpty icon={CalendarCheck} title="No bookings yet" body="Keep your services and prices up to date so customers can find and book you." action={{ label: 'Manage services', to: '/services' }} />
      )}
    </DashCard>
  );
}

function Tips({ data, mechanic }) {
  const tips = [];
  if (Number(data?.unpriced_completed) > 0) tips.push({ icon: Banknote, title: 'Set your prices', body: `${data.unpriced_completed} job${Number(data.unpriced_completed) === 1 ? '' : 's'} had no price. Priced services get booked more.`, to: '/services' });
  if (!mechanic?.verified_business) tips.push({ icon: BadgeCheck, title: 'Get verified', body: 'Verified mechanics show a badge and appear higher in search.', to: '/settings' });
  tips.push({ icon: Images, title: 'Show your work', body: 'Add photos of jobs you have done to your gallery.', to: '/gallery' });
  return (
    <DashCard title="Tips" subtitle="Small things that bring more customers.">
      <Stack spacing={3}>
        {tips.slice(0, 3).map((tip) => (
          <Flex key={tip.title} as={RLink} to={tip.to} gap={3} p={3} borderRadius="16px" bg={DASH.page} _hover={{ bg: '#E9ECF1' }}>
            <Flex w={10} h={10} borderRadius="full" bg="white" color={DASH.blue} align="center" justify="center" flexShrink={0}><tip.icon size={18} /></Flex>
            <Box><Text fontWeight="600">{tip.title}</Text><Text fontSize="sm" color={DASH.muted}>{tip.body}</Text></Box>
          </Flex>
        ))}
      </Stack>
    </DashCard>
  );
}

export const MechanicOverview = () => {
  const { authUser } = useContext(GlobalStore);
  const { mechanic, reload: reloadProfile } = useContext(MechanicContext);
  const [details, setDetails] = useState(null);
  const dashboard = useApiQuery((api, signal) => api.get('/admin/mechanics/dashboard/', { signal }), [], { select: (body) => body?.data || {} });
  const analytics = useApiQuery((api, signal) => api.get('/admin/mechanics/analytics/', { signal }), [], { select: (body) => body?.data || {} });
  const actions = useBookingActions({
    onDone: (updated) => {
      dashboard.reload();
      reloadProfile?.();
      setDetails((current) => (current && updated && current.uuid === updated.uuid ? updated : current));
    },
  });

  const data = dashboard.data;
  const loading = dashboard.loading && !data;
  const pending = asList(data?.pending_requests);
  const history = asList(data?.booking_history);
  const current = data?.current_job;
  const chart = analytics.data?.revenue?.chart_data;
  const hasChart = (chart?.datasets?.[0]?.data || []).some(Boolean);

  const header = (
    <PageHeader
      title="Overview"
      subtitle={`Welcome back${authUser?.first_name ? `, ${authUser.first_name}` : ''}. Your requests, jobs and earnings.`}
      actions={<PillButton dark icon={Plus} as={RLink} to="/services/add">Add a service</PillButton>}
    />
  );
  if (dashboard.error && !data) return <>{header}<ErrorState error={dashboard.error} onRetry={dashboard.reload} title="We couldn't load your overview" /></>;

  return (
    <Box>
      {header}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={{ base: 4, md: 5 }} mb={{ base: 4, md: 5 }}>
        {/* what Motaa has paid them: booking fee + service charge, less commission */}
        <StatTile loading={loading} icon={Banknote} color={DASH.blue} label="Earned through Motaa" value={naira(data?.total_earned, { short: true })}
          progress={null} footnote="Paid to your wallet" />
        <StatTile loading={loading} icon={BadgeCheck} color={DASH.green} label="Completed jobs" value={naira(data?.total_revenue, { short: true })}
          progress={null} footnote={Number(data?.unpriced_completed) > 0 ? `${data.unpriced_completed} without a price` : 'Quoted value'} />
        <StatTile loading={loading} icon={Wrench} color={DASH.violet} label="Hires" value={compactNumber(data?.total_hires)}
          progress={null} footnote={`${compactNumber(data?.total_bookings)} bookings in all`} />
        <StatTile loading={loading} icon={Timer} color={DASH.amber} label="Pending requests" value={compactNumber(data?.total_pending ?? pending.length)}
          progress={null} footnote="Waiting for your answer" />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(320px, 1fr)' }} gap={{ base: 4, md: 5 }} alignItems="start">
        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          {loading ? <Skeleton h="140px" borderRadius="24px" /> : current?.uuid ? <CurrentJob job={current} actions={actions} onDetails={setDetails} /> : <Available mechanic={mechanic} />}

          <DashCard title="Requests" subtitle="Customers waiting for you to accept or decline." menu={[{ label: 'All bookings', to: '/bookings' }]}>
            {loading ? <Skeleton h="160px" borderRadius="16px" /> : pending.length ? (
              <BookingTable bookings={pending} actions={actions} onDetails={setDetails} />
            ) : (
              <CardEmpty icon={Inbox} title="No requests right now" body="New booking requests appear here and in your notifications." />
            )}
          </DashCard>

          <DashCard title="Earnings" subtitle="Completed jobs, last 12 months." menu={[{ label: 'Open analytics', to: '/analytics' }]}>
            <Box h={{ base: '220px', md: '280px' }}>
              {analytics.loading && !analytics.data ? <Skeleton h="100%" borderRadius="16px" /> : hasChart ? (
                <Bar options={chartOptions({ money: true })} data={{
                  labels: chart.labels,
                  datasets: [{ label: 'Earnings', data: chart.datasets[0].data, backgroundColor: DASH.blue, hoverBackgroundColor: DASH.blueSoft, borderRadius: 10, borderSkipped: false, maxBarThickness: 34 }],
                }} />
              ) : <CardEmpty icon={Banknote} title="No completed jobs yet" body="Your earnings from completed jobs will show here month by month." />}
            </Box>
          </DashCard>
        </Stack>

        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          <RecentBookings bookings={history} onOpen={setDetails} />
          <Tips data={data} mechanic={mechanic} />
          <Text fontSize="xs" color={DASH.muted} px={2}>
            <Lightbulb size={12} style={{ display: 'inline', marginRight: 4 }} />
            Need help with a booking? <Link as={RLink} to="/support" color={DASH.blue}>Contact support</Link>
          </Text>
        </Stack>
      </Grid>

      <BookingDetailsModal booking={details} onClose={() => setDetails(null)} actions={actions} />
      {actions.dialog}
    </Box>
  );
};

export default MechanicOverview;
