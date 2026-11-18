// Analytics: the dealer's sales, rentals and buyer interest in depth, for a chosen period (default 12 months).
// Data: the Overview endpoint (/admin/dealership/dashboard/?range=) plus order totals from /admin/dealership/analytics/.
import { useContext, useState } from 'react';
import { Box, Flex, Grid, HStack, Image, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Banknote, CarFront, Download, Eye, KeyRound, Percent, Receipt } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { useApiQuery } from '../../../../hooks/useApi';
import { ErrorState } from '../../../../components/states';
import {
  CardEmpty, chartOptions, compactNumber, DASH, DashCard, LegendDot, naira, PageHeader, PillButton, RangePicker, StatTile,
} from '../../../../components/dashboard/ui';
import { exportOrders } from '../../../../components/dashboard/exportOrders';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip);

const PAYMENT_COLORS = [DASH.blue, DASH.yellow, DASH.green, DASH.violet];

export default function AnalyticsDashboard() {
  const { api, notifyError } = useContext(GlobalStore);
  const [range, setRange] = useState('12m');
  const [exporting, setExporting] = useState(false);
  const dashboard = useApiQuery((client, signal) => client.get('/admin/dealership/dashboard/', { params: { range }, signal }), [range],
    { select: (body) => body?.data || {}, keepAs: `dealer-dashboard:${range}` });
  const totals = useApiQuery((client, signal) => client.get('/admin/dealership/analytics/', { signal }), [],
    { select: (body) => body?.data || {} });

  const data = dashboard.data;
  const loading = dashboard.loading && !data;
  const stats = data?.stats || {};
  const report = data?.sales_report || {};
  const engagement = data?.engagement || {};
  const orders = totals.data?.orders || {};
  const views = engagement.total_views || 0;
  const conversion = views ? Math.round(((stats.deals?.value || 0) / views) * 1000) / 10 : null;
  const label = (data?.range_label || '').toLowerCase();

  const header = (
    <PageHeader title="Analytics" subtitle="How your sales, rentals and buyer interest are going."
      actions={(
        <>
          <RangePicker value={range} onChange={setRange} />
          <PillButton icon={Download} isLoading={exporting} onClick={async () => { setExporting(true); await exportOrders(api, range, notifyError); setExporting(false); }}>Export</PillButton>
        </>
      )} />
  );
  if (dashboard.error && !data) return <>{header}<ErrorState error={dashboard.error} onRetry={dashboard.reload} title="We couldn't load your analytics" /></>;

  const hasReport = (report.sales || []).some(Boolean) || (report.rentals || []).some(Boolean);
  const hasEngagement = ['views', 'offers', 'chats'].some((key) => (engagement[key] || []).some(Boolean));
  const orderRows = [
    { label: 'Completed', value: orders.fulfilled || 0, color: DASH.green },
    { label: 'In progress', value: orders.pending || 0, color: DASH.amber },
    { label: 'Cancelled', value: orders.cancelled || 0, color: '#D1D5DB' },
  ];
  const orderTotal = orderRows.reduce((sum, row) => sum + row.value, 0);
  const payments = data?.payment_split || [];

  return (
    <Box>
      {header}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={{ base: 4, md: 5 }} mb={{ base: 4, md: 5 }}>
        <StatTile loading={loading} icon={Banknote} color={DASH.blue} label="Revenue" value={naira(stats.revenue?.value, { short: true })}
          change={stats.revenue?.change} footnote={data?.range_label} progress={null} />
        <StatTile loading={loading} icon={KeyRound} color={DASH.amber} label="Cars sold & rented" value={compactNumber(stats.deals?.value)}
          change={stats.deals?.change} footnote={`${stats.deals?.sales || 0} sold · ${stats.deals?.rentals || 0} rented`} progress={null} />
        <StatTile loading={loading} icon={Eye} color={DASH.violet} label="Car views" value={compactNumber(views)}
          footnote={`${compactNumber(engagement.total_offers)} offers · ${compactNumber(engagement.total_chats)} chats`} progress={null} />
        <StatTile loading={loading} icon={Percent} color={DASH.green} label="Views to deals" value={conversion === null ? '—' : `${conversion}%`}
          footnote="Deals per 100 car views" progress={null} />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }} gap={{ base: 4, md: 5 }} mb={{ base: 4, md: 5 }}>
        <DashCard title="Sales and rentals" subtitle={`What you earned, ${label || 'this period'}.`}>
          <HStack spacing={5} mb={3}>
            <LegendDot color={DASH.blue}>Sales {naira(report.sales_total, { short: true })}</LegendDot>
            <LegendDot color={DASH.bluePale}>Rentals {naira(report.rentals_total, { short: true })}</LegendDot>
          </HStack>
          <Box h={{ base: '240px', md: '320px' }}>
            {loading ? <Skeleton h="100%" borderRadius="16px" /> : hasReport ? (
              <Bar options={chartOptions({ money: true, stacked: true })} data={{
                labels: report.labels,
                datasets: [
                  { label: 'Sales', data: report.sales, backgroundColor: DASH.blue, borderRadius: 8, borderSkipped: false, maxBarThickness: 40 },
                  { label: 'Rentals', data: report.rentals, backgroundColor: DASH.bluePale, borderRadius: 8, borderSkipped: false, maxBarThickness: 40 },
                ],
              }} />
            ) : <CardEmpty icon={Receipt} title="No paid orders in this period" body="Your sales and rentals will show here." />}
          </Box>
        </DashCard>

        <DashCard title="Orders" subtitle="All your orders by status.">
          {orderTotal ? (
            <Flex direction="column" align="center" gap={5}>
              <Box position="relative" w="200px" h="200px">
                <Doughnut data={{ labels: orderRows.map((r) => r.label), datasets: [{ data: orderRows.map((r) => r.value), backgroundColor: orderRows.map((r) => r.color), borderWidth: 0, borderRadius: 6, spacing: 3 }] }}
                  options={{ cutout: '72%', plugins: { legend: { display: false }, tooltip: { backgroundColor: DASH.ink, cornerRadius: 12, padding: 10 } } }} />
                <Stack position="absolute" inset={0} align="center" justify="center" spacing={0} pointerEvents="none">
                  <Text fontSize="3xl" fontWeight="600">{orderTotal}</Text>
                  <Text fontSize="xs" color={DASH.muted}>orders</Text>
                </Stack>
              </Box>
              <Stack w="100%" spacing={3}>
                {orderRows.map((row) => (
                  <Flex key={row.label} justify="space-between" align="center">
                    <LegendDot color={row.color}>{row.label}</LegendDot>
                    <Text fontWeight="600">{row.value} <Text as="span" color={DASH.muted} fontWeight="400" fontSize="sm">({Math.round((row.value / orderTotal) * 100)}%)</Text></Text>
                  </Flex>
                ))}
              </Stack>
            </Flex>
          ) : totals.loading ? <Skeleton h="260px" borderRadius="16px" /> : <CardEmpty icon={Receipt} title="No orders yet" />}
        </DashCard>
      </Grid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }} gap={{ base: 4, md: 5 }} mb={{ base: 4, md: 5 }}>
        <DashCard title="Buyer interest" subtitle="Views of your cars, offers and new chats.">
          <HStack spacing={4} mb={3} flexWrap="wrap">
            <LegendDot color={DASH.blue}>Views</LegendDot><LegendDot color={DASH.amber}>Offers</LegendDot><LegendDot color={DASH.violet}>Chats</LegendDot>
          </HStack>
          <Box h={{ base: '240px', md: '300px' }}>
            {loading ? <Skeleton h="100%" borderRadius="16px" /> : hasEngagement ? (
              <Line options={chartOptions()} data={{
                labels: engagement.labels,
                datasets: [
                  { label: 'Views', data: engagement.views, borderColor: DASH.blue, backgroundColor: `${DASH.blue}14`, fill: true, tension: 0.45, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5 },
                  { label: 'Offers', data: engagement.offers, borderColor: DASH.amber, tension: 0.45, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 },
                  { label: 'Chats', data: engagement.chats, borderColor: DASH.violet, tension: 0.45, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 },
                ],
              }} />
            ) : <CardEmpty icon={Eye} title="No buyer activity yet" body="Views, offers and chats on your cars will show here." />}
          </Box>
        </DashCard>

        <DashCard title="How buyers pay" subtitle={`Paid orders, ${label || 'this period'}.`}>
          {payments.length ? (
            <Stack spacing={4}>
              {payments.map((row, i) => (
                <Box key={row.key}>
                  <Flex justify="space-between" fontSize="sm" mb={1.5}><Text>{row.label}</Text><Text fontWeight="600">{row.percent}%</Text></Flex>
                  <Box h="10px" bg={DASH.page} borderRadius="full"><Box h="100%" w={`${row.percent}%`} bg={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} borderRadius="full" /></Box>
                  <Text fontSize="xs" color={DASH.muted} mt={1}>{row.count} order{row.count === 1 ? '' : 's'}</Text>
                </Box>
              ))}
            </Stack>
          ) : <CardEmpty icon={Banknote} title="No payments in this period" />}
        </DashCard>
      </Grid>

      <DashCard title="Most viewed cars" subtitle="Your cars buyers looked at most.">
        {(data?.top_listings || []).length ? (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
            {data.top_listings.map((item, index) => (
              <Flex key={item.uuid} gap={3} align="center" borderWidth="1px" borderColor={DASH.line} borderRadius="18px" p={3}>
                <Box position="relative" flexShrink={0}>
                  <Box w="64px" h="64px" borderRadius="14px" overflow="hidden" bg={DASH.page}>
                    {item.image ? <Image src={item.image} alt="" w="100%" h="100%" objectFit="cover" /> : <Flex h="100%" align="center" justify="center" color="#9CA3AF"><CarFront size={24} /></Flex>}
                  </Box>
                  <Flex position="absolute" top="-6px" left="-6px" w={6} h={6} borderRadius="full" bg={DASH.ink} color="white" fontSize="xs" fontWeight="700" align="center" justify="center">{index + 1}</Flex>
                </Box>
                <Box minW={0}>
                  <Text fontWeight="600" noOfLines={1}>{item.title}</Text>
                  <Text fontSize="sm">{naira(item.price, { short: true })}</Text>
                  <HStack spacing={1} fontSize="xs" color={DASH.muted}><Eye size={12} /><Text>{compactNumber(item.views)} buyers viewed</Text></HStack>
                </Box>
              </Flex>
            ))}
          </SimpleGrid>
        ) : <CardEmpty icon={CarFront} title="No views yet" body="Once buyers look at your cars, the most popular show here." />}
      </DashCard>
    </Box>
  );
}
