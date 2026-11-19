// /parts-store: the seller's parts shop at a glance (numbers from GET /parts/seller/store/). Parts dealers see it
// as their Overview; car dealers and mechanics reach it from "Parts shop" in their own dashboard.
import { useContext, useEffect } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Box, Button, Flex, Grid, HStack, Image, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { AlertTriangle, ArrowRight, Banknote, Boxes, Clock, Package, PackageCheck, Plus, RotateCcw, ShieldCheck, Store, Truck } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { OrderListSkeleton, PartsOrderRow } from '../../../components/parts';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { CardEmpty, chartOptions, compactNumber, DASH, DashCard, naira, PageHeader, PillButton, StatTile } from '../../../components/dashboard/ui';
import { percent, usePartsShop } from './shop';

function Notice({ icon: Icon, tone, title, body, action }) {
  const [bg, color] = tone === 'warning' ? ['#FFF6DB', '#B45309'] : ['#EAF3FC', DASH.blue];
  return (
    <Flex bg={bg} borderRadius="18px" p={4} gap={3} align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
      <Flex w={10} h={10} borderRadius="full" bg="white" color={color} align="center" justify="center" flexShrink={0}><Icon size={18} /></Flex>
      <Box flex={1}><Text fontWeight="600" color={DASH.ink}>{title}</Text><Text fontSize="sm" color={DASH.muted}>{body}</Text></Box>
      {action}
    </Flex>
  );
}

function AttentionRow({ icon: Icon, color, label, hint, value, to }) {
  return (
    <Flex as={RLink} to={to} align="center" gap={3} p={3} borderRadius="16px" bg={DASH.page} _hover={{ bg: '#E9ECF1' }}>
      <Flex w={10} h={10} borderRadius="full" bg="white" color={color} align="center" justify="center" flexShrink={0}><Icon size={18} /></Flex>
      <Box flex={1} minW={0}><Text fontWeight="600">{label}</Text><Text fontSize="xs" color={DASH.muted}>{hint}</Text></Box>
      <Text fontSize="xl" fontWeight="600" color={Number(value) > 0 ? DASH.ink : '#9CA3AF'}>{compactNumber(value)}</Text>
      <ArrowRight size={16} color="#9CA3AF" />
    </Flex>
  );
}

export default function PartsShopOverview() {
  const { authUser } = useContext(GlobalStore);
  const { shop } = usePartsShop();
  const stats = shop?.stats || {};
  const store = shop?.store;
  const loading = shop === undefined;
  const series = stats.series || { labels: [], earned: [], orders: [] };
  const hasSeries = (series.earned || []).some(Boolean);

  useEffect(() => { document.title = 'Parts shop | Motaa'; }, []);

  const newOrders = useApiQuery((api, signal) => api.get('/parts/seller/orders/?status=new&per_page=5', { signal }), [],
    { select: (body) => asList(body?.data?.results) });

  return (
    <Box w="100%">
      <PageHeader
        title={authUser?.user_type === 'parts_dealer' ? 'Overview' : 'Parts shop'}
        subtitle={store?.name ? `${store.name} · how your shop is doing.` : 'How your parts shop is doing.'}
        actions={(
          <>
            <PillButton icon={Store} as={RLink} to="/parts-store/settings">Shop settings</PillButton>
            <PillButton dark icon={Plus} as={RLink} to="/parts-store/parts/add">Add a part</PillButton>
          </>
        )}
      />

      <Stack spacing={3} mb={{ base: 4, md: 5 }}>
        {shop && !shop.verified && (
          <Notice icon={ShieldCheck} tone="warning" title="Customers can't see your parts yet"
            body={shop.verification_status === 'pending'
              ? 'Your business verification is in progress. Your parts go on sale as soon as it is confirmed.'
              : 'Your parts go on sale once your business is verified. You can add parts in the meantime.'} />
        )}
        {store && !store.active && (
          <Notice icon={Store} tone="info" title="Your shop is closed" body="Customers can't see or buy your parts while it is closed."
            action={<Button as={RLink} to="/parts-store/settings" size="sm" borderRadius="full" bg="white">Open shop</Button>} />
        )}
      </Stack>

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={{ base: 4, md: 5 }} mb={{ base: 4, md: 5 }}>
        <StatTile loading={loading} icon={Banknote} color={DASH.blue} label="Earned" value={naira(stats.earned, { short: true })} progress={null}
          footnote={`From ${compactNumber(stats.completed)} completed order${Number(stats.completed) === 1 ? '' : 's'}`} />
        <StatTile loading={loading} icon={ShieldCheck} color={DASH.amber} label="On hold" value={naira(stats.on_hold, { short: true })} progress={null}
          footnote="Released when orders complete" />
        <StatTile loading={loading} icon={Boxes} color={DASH.violet} label="Live parts" value={compactNumber(stats.live_parts)}
          progress={stats.parts ? Math.round((Number(stats.live_parts) / Number(stats.parts)) * 100) : null} progressLabel="Of all your parts"
          footnote={`${compactNumber(stats.out_of_stock)} out of stock`} />
        <StatTile loading={loading} icon={Package} color={DASH.green} label="New orders" value={compactNumber(stats.new_orders)} progress={null}
          footnote="Waiting for you to accept" />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(320px, 1fr)' }} gap={{ base: 4, md: 5 }} alignItems="start">
        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          <DashCard title="Earnings" subtitle="Completed orders, last 6 months." menu={[{ label: 'All orders', to: '/parts-store/orders' }]}>
            <Box h={{ base: '220px', md: '280px' }}>
              {loading ? <Skeleton h="100%" borderRadius="16px" /> : hasSeries ? (
                <Bar options={chartOptions({ money: true })} data={{
                  labels: series.labels,
                  datasets: [{ label: 'Earned', data: series.earned, backgroundColor: DASH.blue, hoverBackgroundColor: DASH.blueSoft, borderRadius: 10, borderSkipped: false, maxBarThickness: 44 }],
                }} />
              ) : <CardEmpty icon={Banknote} title="No completed orders yet" body="Money from completed orders will show here month by month." />}
            </Box>
            <Text fontSize="sm" color={DASH.muted} mt={4}>
              Motaa keeps {percent(shop?.commission_percent)}% of the parts price (never the delivery fee). You are paid when the customer confirms
              they have the order, or automatically {shop?.release_days} days after you mark it delivered.
            </Text>
          </DashCard>

          <DashCard title="New orders" subtitle="Waiting for you to accept." menu={[{ label: 'View all orders', to: '/parts-store/orders' }]}>
            {newOrders.loading && newOrders.data === undefined ? <OrderListSkeleton /> : newOrders.error && newOrders.data === undefined ? (
              <Text fontSize="sm" color="red.600" role="alert">{newOrders.error.message} <Button variant="link" size="sm" onClick={() => newOrders.reload()}>Try again</Button></Text>
            ) : asList(newOrders.data).length === 0 ? (
              <CardEmpty icon={PackageCheck} title="No new orders right now" body="New orders show up here and in your notifications." />
            ) : (
              <Stack as="ul" listStyleType="none" spacing={3}>
                {newOrders.data.map((order) => <PartsOrderRow key={order.uuid} order={order} to={`/parts-store/orders/${order.uuid}`} seller />)}
              </Stack>
            )}
          </DashCard>
        </Stack>

        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          <DashCard title="Needs your attention">
            <Stack spacing={2}>
              <AttentionRow icon={Clock} color={DASH.amber} label="New orders" hint="Accept or decline" value={stats.new_orders} to="/parts-store/orders?status=new" />
              <AttentionRow icon={Package} color={DASH.blue} label="To send" hint="Accepted, not sent yet" value={stats.to_send} to="/parts-store/orders?status=to-send" />
              <AttentionRow icon={Truck} color={DASH.violet} label="On the way" hint="Sent or delivered" value={stats.on_the_way} to="/parts-store/orders?status=sent" />
              <AttentionRow icon={RotateCcw} color="#DC2626" label="Returns" hint="Need your answer" value={stats.returns} to="/parts-store/orders?status=returns" />
            </Stack>
          </DashCard>

          <DashCard dark title="Best sellers" subtitle="Your parts customers buy most." menu={[{ label: 'All parts', to: '/parts-store/parts' }]}>
            {asList(stats.top_parts).length ? (
              <Stack spacing={3}>
                {stats.top_parts.map((part) => (
                  <Flex key={part.uuid} as={RLink} to={`/parts-store/parts/${part.uuid}`} align="center" gap={3} _hover={{ opacity: 0.85 }}>
                    <Box w="52px" h="52px" borderRadius="14px" overflow="hidden" bg="whiteAlpha.200" flexShrink={0}>
                      {part.image ? <Image src={part.image} alt="" w="100%" h="100%" objectFit="cover" /> : <Flex h="100%" align="center" justify="center"><Boxes size={20} /></Flex>}
                    </Box>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="600" noOfLines={1}>{part.name}</Text>
                      <Text fontSize="sm" color="whiteAlpha.700">{naira(part.price, { short: true })} · {part.stock} in stock</Text>
                    </Box>
                    <Text fontWeight="700">{part.sold} sold</Text>
                  </Flex>
                ))}
              </Stack>
            ) : <Text color="whiteAlpha.700" fontSize="sm">Your best-selling parts will show here once customers start buying.</Text>}
          </DashCard>

          <DashCard title="Stock">
            <SimpleGrid columns={3} spacing={3} textAlign="center">
              {[['All parts', stats.parts, '/parts-store/parts'], ['Live', stats.live_parts, '/parts-store/parts?status=live'], ['Out of stock', stats.out_of_stock, '/parts-store/parts?status=out']].map(([label, value, to]) => (
                <Box key={label} as={RLink} to={to} p={3} borderRadius="16px" bg={DASH.page} _hover={{ bg: '#E9ECF1' }}>
                  <Text fontSize="xl" fontWeight="600" color={label === 'Out of stock' && Number(value) > 0 ? '#B45309' : DASH.ink}>{compactNumber(value)}</Text>
                  <Text fontSize="xs" color={DASH.muted}>{label}</Text>
                </Box>
              ))}
            </SimpleGrid>
            {Number(stats.out_of_stock) > 0 && (
              <HStack mt={3} fontSize="sm" color="#B45309"><AlertTriangle size={14} /><Text>Restock or hide parts that are out of stock.</Text></HStack>
            )}
          </DashCard>
        </Stack>
      </Grid>
    </Box>
  );
}
