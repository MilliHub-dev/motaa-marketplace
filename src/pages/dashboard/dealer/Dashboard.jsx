// The dealer's Overview: how sales, rentals and buyer interest are going over a chosen period, what is waiting
// for the dealer, and their latest orders. Data: GET /admin/dealership/dashboard/?range= (listings/dealer_dashboard.py).
import { useContext, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Avatar, Box, Button, Flex, Grid, HStack, Image, Link, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement, CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip as ChartTooltip,
} from 'chart.js';
import {
  ArrowRight, Banknote, Car, CarFront, Download, Eye, KeyRound, Lightbulb, MessageCircle, Plus, Receipt, ShieldCheck, Tag, Wallet,
} from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { ErrorState } from '../../../components/states';
import {
  CardEmpty, chartOptions, compactNumber, DASH, DashCard, LegendDot, naira, OrderPill, PageHeader, PillBars, PillButton, RangePicker, StatTile,
} from '../../../components/dashboard/ui';
import { OrderDetailsDrawer, ContactCustomerModal } from './orders/OrderList';
import { exportOrders } from '../../../components/dashboard/exportOrders';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, ChartTooltip);

const RANGE_KEY = 'motaa.dealer.range';

function savedRange() {
  try { return localStorage.getItem(RANGE_KEY) || '30d'; } catch { return '30d'; }
}

function GoalLink() {
  return (
    <Text fontSize="xs" color={DASH.muted}>
      <Link as={RLink} to="/settings#goals" color={DASH.blue} fontWeight="600">Set a monthly goal</Link> to track progress
    </Text>
  );
}

function MiniStat({ label, value, note, icon: Icon, color = DASH.blue }) {
  return (
    <Box borderWidth="1px" borderColor={DASH.line} borderRadius="18px" p={4}>
      <HStack spacing={2} color={DASH.muted} fontSize="sm"><Icon size={16} color={color} /><Text>{label}</Text></HStack>
      <Text fontSize="2xl" fontWeight="600" mt={2} color={DASH.ink}>{value}</Text>
      {note && <Text fontSize="xs" color={DASH.muted} mt={1}>{note}</Text>}
    </Box>
  );
}

function TopListings({ items }) {
  return (
    <DashCard dark title="Top listings" subtitle="Your cars buyers looked at most." menu={[{ label: 'Manage inventory', to: '/inventory' }]}>
      {items.length ? (
        <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={4}>
          {items.map((item) => (
            <Stack key={item.uuid} as={RLink} to={`/${item.listing_type === 'rental' ? 'rent' : 'buy'}/${item.uuid}`} align="center" spacing={2}
              textAlign="center" _hover={{ opacity: 0.85 }}>
              <Box w={{ base: '64px', md: '76px' }} h={{ base: '64px', md: '76px' }} borderRadius="full" overflow="hidden" bg="whiteAlpha.200"
                border="3px solid" borderColor="whiteAlpha.300">
                {item.image ? <Image src={item.image} alt="" w="100%" h="100%" objectFit="cover" /> :
                  <Flex h="100%" align="center" justify="center"><CarFront size={28} /></Flex>}
              </Box>
              <Text fontSize="sm" noOfLines={1} maxW="120px">{item.title}</Text>
              <Text fontWeight="700" fontSize="sm">{naira(item.price, { short: true })}</Text>
              <HStack spacing={1} fontSize="xs" color="whiteAlpha.700"><Eye size={12} /><Text>{compactNumber(item.views)} views</Text></HStack>
            </Stack>
          ))}
        </SimpleGrid>
      ) : (
        <Text color="whiteAlpha.700" fontSize="sm">Once buyers start viewing your cars, the most popular will show here.</Text>
      )}
    </DashCard>
  );
}

function ListingStatus({ status }) {
  const rows = [
    { key: 'live', label: 'Live on Motaa', color: DASH.blue },
    { key: 'review', label: 'In review', color: DASH.amber },
    { key: 'draft', label: 'Drafts', color: '#9CA3AF' },
    { key: 'sold', label: 'Sold / unavailable', color: DASH.green },
  ];
  const max = Math.max(1, ...rows.map((row) => status?.[row.key] || 0));
  return (
    <DashCard title="Listings" subtitle="Where your cars are." menu={[{ label: 'Open inventory', to: '/inventory' }, { label: 'Add a car', to: '/inventory/add' }]}>
      <Stack spacing={4}>
        {rows.map((row) => (
          <Grid key={row.key} templateColumns="minmax(110px, 1fr) 2fr 40px" alignItems="center" gap={3}>
            <Text fontSize="sm" color={DASH.ink} noOfLines={1}>{row.label}</Text>
            <Box h="26px" bg={DASH.page} borderRadius="8px" overflow="hidden">
              <Box h="100%" w={`${Math.max(4, ((status?.[row.key] || 0) / max) * 100)}%`} bg={row.color} borderRadius="8px" transition="width .4s" />
            </Box>
            <Text fontWeight="700" textAlign="right">{status?.[row.key] || 0}</Text>
          </Grid>
        ))}
      </Stack>
    </DashCard>
  );
}

function RecentOrders({ orders, onOpen }) {
  return (
    <DashCard title="Latest orders" subtitle="Newest first." menu={[{ label: 'All orders', to: '/orders' }]}>
      {orders.length ? (
        <Stack spacing={1}>
          {orders.slice(0, 5).map((order) => {
            const car = order?.order_item?.title || order?.order_item?.vehicle?.name || 'Car';
            const customer = order?.customer_info?.name || 'Customer';
            return (
              <Flex key={order.uuid} as="button" type="button" onClick={() => onOpen(order)} align="center" gap={3} p={2} mx={-2} borderRadius="14px"
                textAlign="left" _hover={{ bg: DASH.page }}>
                <Avatar size="md" name={customer} bg={DASH.blueWash} color={DASH.blue} />
                <Box flex={1} minW={0}>
                  <Text fontWeight="600" noOfLines={1}>{customer}</Text>
                  <Text fontSize="sm" color={DASH.muted} noOfLines={1}>{car} · {order.order_type === 'rental' ? 'Rental' : 'Sale'}</Text>
                </Box>
                <Stack spacing={1} align="flex-end" flexShrink={0}>
                  <Text fontWeight="700">{naira(order?.dealer_amount ?? order?.sub_total ?? order?.total_amount, { short: true })}</Text>
                  <OrderPill status={order.order_status} />
                </Stack>
              </Flex>
            );
          })}
        </Stack>
      ) : (
        <CardEmpty icon={Receipt} title="No orders yet" body="When customers buy or rent your cars, their orders appear here." action={{ label: 'Manage inventory', to: '/inventory' }} />
      )}
    </DashCard>
  );
}

export default function Dashboard() {
  const { authUser, api, notifyError } = useContext(GlobalStore);
  const [range, setRangeState] = useState(savedRange);
  const [selected, setSelected] = useState(null);
  const [contact, setContact] = useState(null);
  const [exporting, setExporting] = useState(false);

  const setRange = (value) => {
    setRangeState(value);
    try { localStorage.setItem(RANGE_KEY, value); } catch { /* private mode */ }
  };

  const query = useApiQuery((client, signal) => client.get('/admin/dealership/dashboard/', { params: { range }, signal }), [range],
    { select: (body) => body?.data || {}, keepAs: `dealer-dashboard:${range}` });
  const data = query.data;
  const loading = query.loading && !data;
  const stats = data?.stats || {};
  const rangeLabel = (data?.range_label || '').toLowerCase();

  const header = (
    <PageHeader
      title="Overview"
      subtitle={`Welcome back${authUser?.first_name ? `, ${authUser.first_name}` : ''}. Here's how your dealership is doing.`}
      actions={(
        <>
          <RangePicker value={range} onChange={setRange} />
          <PillButton icon={Download} isLoading={exporting} onClick={async () => { setExporting(true); await exportOrders(api, range, notifyError); setExporting(false); }}>
            Export
          </PillButton>
          <PillButton dark icon={Plus} as={RLink} to="/inventory/add">Add a car</PillButton>
        </>
      )}
    />
  );

  if (query.error && !data) {
    return <>{header}<ErrorState error={query.error} onRetry={query.reload} title="We couldn't load your overview" /></>;
  }

  const engagement = data?.engagement || {};
  const report = data?.sales_report || {};
  const weekly = data?.weekly || { labels: [], views: [] };
  const earnings = data?.earnings || {};
  const tip = data?.tip;
  const hasReport = (report.sales || []).some(Boolean) || (report.rentals || []).some(Boolean);
  const hasEngagement = ['views', 'offers', 'chats'].some((key) => (engagement[key] || []).some(Boolean));

  return (
    <Box>
      {header}
      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(320px, 1fr)' }} gap={{ base: 4, md: 5 }} alignItems="start">
        {/* left column */}
        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 5 }}>
            <StatTile loading={loading} icon={Banknote} color={DASH.blue} label="Revenue" value={naira(stats.revenue?.value)}
              progress={stats.revenue?.goal_progress} progressLabel="Monthly goal" noGoal={<GoalLink />} change={stats.revenue?.change}
              footnote={stats.revenue?.goal ? `${naira(stats.revenue.this_month, { short: true })} of ${naira(stats.revenue.goal, { short: true })} this month` : (data?.range_label || '')} />
            <StatTile loading={loading} icon={KeyRound} color={DASH.amber} label="Cars sold & rented" value={compactNumber(stats.deals?.value)}
              progress={stats.deals?.goal_progress} progressLabel="Monthly goal" noGoal={<GoalLink />} change={stats.deals?.change}
              footnote={`${stats.deals?.sales || 0} sold · ${stats.deals?.rentals || 0} rented`} />
            <StatTile loading={loading} icon={Car} color={DASH.violet} label="Live listings" value={compactNumber(stats.listings?.value)}
              progress={stats.listings?.progress} progressLabel="Of all your cars"
              footnote={`${stats.listings?.review || 0} in review · ${stats.listings?.draft || 0} drafts`} />
          </SimpleGrid>

          <DashCard title="Sales report" subtitle={`What you earned from sales and rentals, ${rangeLabel || 'this period'}.`}
            menu={[{ label: 'Open analytics', to: '/analytics' }, { label: 'Export orders', onClick: () => exportOrders(api, range, notifyError) }]}>
            <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 260px' }} gap={4}>
              <Box borderWidth="1px" borderColor={DASH.line} borderRadius="20px" p={{ base: 4, md: 5 }} minW={0}>
                <Text fontWeight="600" fontSize="lg" mb={4}>Sales vs rentals</Text>
                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={5}>
                  <HStack spacing={3}><Flex w={10} h={10} borderRadius="full" bg={DASH.blueWash} color={DASH.blue} align="center" justify="center"><Tag size={18} /></Flex>
                    <Box><Text fontSize="xs" color={DASH.muted}>Sales</Text><Text fontWeight="600">{naira(report.sales_total, { short: true })}</Text></Box></HStack>
                  <HStack spacing={3}><Flex w={10} h={10} borderRadius="full" bg="#FFF6DB" color={DASH.amber} align="center" justify="center"><KeyRound size={18} /></Flex>
                    <Box><Text fontSize="xs" color={DASH.muted}>Rentals</Text><Text fontWeight="600">{naira(report.rentals_total, { short: true })}</Text></Box></HStack>
                  <HStack spacing={3}><Flex w={10} h={10} borderRadius="full" bg="#E7F7F0" color={DASH.green} align="center" justify="center"><ShieldCheck size={18} /></Flex>
                    <Box minW={0}><Text fontSize="xs" color={DASH.muted}>Top payment</Text><Text fontWeight="600" noOfLines={1}>
                      {data?.payment_split?.[0] ? `${data.payment_split[0].label} · ${data.payment_split[0].percent}%` : '—'}</Text></Box></HStack>
                </SimpleGrid>
                <Box h={{ base: '220px', md: '260px' }}>
                  {loading ? <Skeleton h="100%" borderRadius="16px" /> : hasReport ? (
                    <Bar options={chartOptions({ money: true, stacked: true })} data={{
                      labels: report.labels,
                      datasets: [
                        { label: 'Sales', data: report.sales, backgroundColor: DASH.blue, borderRadius: 8, borderSkipped: false, maxBarThickness: 36 },
                        { label: 'Rentals', data: report.rentals, backgroundColor: DASH.bluePale, borderRadius: 8, borderSkipped: false, maxBarThickness: 36 },
                      ],
                    }} />
                  ) : <CardEmpty icon={Receipt} title="No paid orders in this period" body="Paid sales and rentals will show here day by day." />}
                </Box>
                <HStack spacing={4} mt={3}><LegendDot color={DASH.blue}>Sales</LegendDot><LegendDot color={DASH.bluePale}>Rentals</LegendDot></HStack>
              </Box>
              <Box borderWidth="1px" borderColor={DASH.line} borderRadius="20px" p={{ base: 4, md: 5 }}>
                <Text fontWeight="600" fontSize="lg" mb={4}>Earnings</Text>
                <Stack spacing={3}>
                  <MiniStat icon={Wallet} label="Wallet balance" value={naira(earnings.wallet_balance, { short: true })} note="Ready to withdraw" />
                  <MiniStat icon={ShieldCheck} color={DASH.amber} label="Held in escrow" value={naira(earnings.pending_payout, { short: true })}
                    note={earnings.pending_orders ? `${earnings.pending_orders} order${earnings.pending_orders === 1 ? '' : 's'} to hand over` : 'Nothing waiting'} />
                </Stack>
                <Button as={RLink} to="/wallet" mt={4} w="100%" borderRadius="full" variant="outline" rightIcon={<ArrowRight size={16} />}>Open wallet</Button>
              </Box>
            </Grid>
          </DashCard>

          <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1.15fr) minmax(0, 1fr)' }} gap={{ base: 4, md: 5 }}>
            <TopListings items={data?.top_listings || []} />
            <ListingStatus status={data?.listing_status} />
          </Grid>
        </Stack>

        {/* right column */}
        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          <DashCard title="Buyer interest" subtitle="Views of your cars, offers and new chats." menu={[{ label: 'Open analytics', to: '/analytics' }]}>
            <HStack spacing={4} mb={3} flexWrap="wrap">
              <LegendDot color={DASH.blue}>Views {compactNumber(engagement.total_views)}</LegendDot>
              <LegendDot color={DASH.amber}>Offers {compactNumber(engagement.total_offers)}</LegendDot>
              <LegendDot color={DASH.violet}>Chats {compactNumber(engagement.total_chats)}</LegendDot>
            </HStack>
            <Box h="220px">
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

          <DashCard title="This week" subtitle="Views of your cars by day.">
            {loading ? <Skeleton h="180px" borderRadius="16px" /> : (
              <PillBars labels={weekly.labels} values={weekly.views} active={weekly.today} format={(v) => compactNumber(v)} />
            )}
            {tip && (
              <Flex mt={4} pt={4} borderTopWidth="1px" borderColor={DASH.line} gap={3} align="flex-start">
                <Flex w={10} h={10} borderRadius="full" bg={tip.tone === 'success' ? '#E7F7F0' : tip.tone === 'warning' ? '#FFF6DB' : DASH.blueWash}
                  color={tip.tone === 'success' ? DASH.green : tip.tone === 'warning' ? DASH.amber : DASH.blue} align="center" justify="center" flexShrink={0}>
                  {tip.tone === 'success' ? <ShieldCheck size={18} /> : tip.tone === 'warning' ? <Lightbulb size={18} /> : <MessageCircle size={18} />}
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontWeight="600">{tip.title}</Text>
                  <Text fontSize="sm" color={DASH.muted}>{tip.body}</Text>
                  {tip.link && <Link as={RLink} to={tip.link} fontSize="sm" color={DASH.blue} fontWeight="600">Take a look →</Link>}
                </Box>
              </Flex>
            )}
            {weekly.best_day && <Text fontSize="xs" color={DASH.muted} mt={3}>Busiest day this week: {weekly.best_day}</Text>}
          </DashCard>

          <RecentOrders orders={data?.recent_orders || []} onOpen={setSelected} />
        </Stack>
      </Grid>

      <OrderDetailsDrawer order={selected} onClose={() => setSelected(null)} onContact={(order) => { setSelected(null); setContact(order); }} />
      <ContactCustomerModal order={contact} onClose={() => setContact(null)} />
    </Box>
  );
}
