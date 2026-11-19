// The mechanic's analytics: earnings by month and how their requests turn into jobs.
// Data: /admin/mechanics/analytics/.
import { Box, Flex, Grid, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Banknote, BadgeCheck, Timer, XCircle } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { ErrorState } from '../../../components/states';
import { CardEmpty, chartOptions, compactNumber, DASH, DashCard, LegendDot, naira, PageHeader, StatTile } from '../../../components/dashboard/ui';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip);

export default function MechanicAnalytics() {
  const analytics = useApiQuery((api, signal) => api.get('/admin/mechanics/analytics/', { signal }), [], { select: (body) => body?.data || {} });
  const data = analytics.data;
  const loading = analytics.loading && !data;
  const header = <PageHeader title="Analytics" subtitle="Your earnings and how your requests turn into jobs." />;
  if (analytics.error && !data) return <>{header}<ErrorState error={analytics.error} onRetry={analytics.reload} /></>;

  const chart = data?.revenue?.chart_data;
  const hasRevenue = (chart?.datasets?.[0]?.data || []).some((v) => Number(v) > 0);
  const jobs = data?.jobs || {};
  const rows = [
    { label: 'Completed', value: Number(jobs.completed) || 0, color: DASH.green },
    { label: 'In progress', value: Math.max(0, (Number(jobs.hires) || 0) - (Number(jobs.completed) || 0)), color: DASH.blue },
    { label: 'Waiting for you', value: Number(jobs.pending) || 0, color: DASH.amber },
    { label: 'Cancelled / declined', value: Number(jobs.canceled) || 0, color: '#D1D5DB' },
  ];
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const acceptance = (Number(jobs.hires) || 0) + (Number(jobs.canceled) || 0)
    ? Math.round(((Number(jobs.hires) || 0) / ((Number(jobs.hires) || 0) + (Number(jobs.canceled) || 0))) * 100) : null;

  return (
    <Box>
      {header}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={{ base: 4, md: 5 }} mb={{ base: 4, md: 5 }}>
        <StatTile loading={loading} icon={Banknote} color={DASH.blue} label="Revenue" value={naira(data?.revenue?.amount, { short: true })} progress={null} footnote="From completed jobs" />
        <StatTile loading={loading} icon={BadgeCheck} color={DASH.green} label="Hires" value={compactNumber(jobs.hires)} progress={null} footnote={`${compactNumber(jobs.completed)} completed`} />
        <StatTile loading={loading} icon={Timer} color={DASH.amber} label="Pending requests" value={compactNumber(jobs.pending)} progress={null} footnote="Waiting for your answer" />
        <StatTile loading={loading} icon={XCircle} color="#9CA3AF" label="Accepted" value={acceptance === null ? '—' : `${acceptance}%`}
          progress={acceptance} progressLabel="Requests you took on" footnote={`${compactNumber(jobs.canceled)} cancelled or declined`} />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }} gap={{ base: 4, md: 5 }}>
        <DashCard title="Earnings" subtitle="Completed jobs by month, this year.">
          <Box h={{ base: '240px', md: '320px' }}>
            {loading ? <Skeleton h="100%" borderRadius="16px" /> : hasRevenue ? (
              <Bar options={chartOptions({ money: true })} data={{
                labels: chart.labels,
                datasets: [{ label: 'Earnings', data: chart.datasets[0].data, backgroundColor: DASH.blue, hoverBackgroundColor: DASH.blueSoft, borderRadius: 10, borderSkipped: false, maxBarThickness: 40 }],
              }} />
            ) : <CardEmpty icon={Banknote} title="No completed jobs yet" body="Revenue from completed jobs will be charted here." />}
          </Box>
        </DashCard>
        <DashCard title="Jobs" subtitle="All your bookings by status.">
          {total ? (
            <Flex direction="column" align="center" gap={5}>
              <Box position="relative" w="200px" h="200px">
                <Doughnut data={{ labels: rows.map((r) => r.label), datasets: [{ data: rows.map((r) => r.value), backgroundColor: rows.map((r) => r.color), borderWidth: 0, borderRadius: 6, spacing: 3 }] }}
                  options={{ cutout: '72%', plugins: { legend: { display: false }, tooltip: { backgroundColor: DASH.ink, cornerRadius: 12, padding: 10 } } }} />
                <Stack position="absolute" inset={0} align="center" justify="center" spacing={0} pointerEvents="none">
                  <Text fontSize="3xl" fontWeight="600">{total}</Text><Text fontSize="xs" color={DASH.muted}>bookings</Text>
                </Stack>
              </Box>
              <Stack w="100%" spacing={3}>
                {rows.map((row) => (
                  <Flex key={row.label} justify="space-between"><LegendDot color={row.color}>{row.label}</LegendDot><Text fontWeight="600">{row.value}</Text></Flex>
                ))}
              </Stack>
            </Flex>
          ) : loading ? <Skeleton h="260px" borderRadius="16px" /> : <CardEmpty icon={BadgeCheck} title="No bookings yet" />}
        </DashCard>
      </Grid>
    </Box>
  );
}
