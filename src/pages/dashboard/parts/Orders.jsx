// /parts-store/orders — the seller's parts orders (?status=new|to-send|sent|returns|done&page=).
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Box, Button, Heading, HStack, Stack, Text , SimpleGrid } from '@chakra-ui/react';
import { Receipt } from 'lucide-react';
import { PageControls } from '../../../components';
import { OrderListSkeleton, PartsOrderRow } from '../../../components/parts';
import { AsyncState, EmptyState } from '../../../components/states';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { usePartsShop } from './shop';
import { Clock, Package, RotateCcw, Truck } from 'lucide-react';
import { DASH, DashCard, IconBubble, PageHeader } from '../../../components/dashboard/ui';

const PAGE_SIZE = 25;
const TABS = [
  { value: 'new', label: 'New', stat: 'new_orders', empty: 'No new orders', hint: 'Orders that customers have paid for and are waiting for you to accept.' },
  { value: 'to-send', label: 'To send', stat: 'to_send', empty: 'Nothing to send', hint: 'Orders you have accepted and still need to send.' },
  { value: 'sent', label: 'Sent', stat: 'on_the_way', empty: 'Nothing on the way', hint: 'Orders you have sent or delivered that the customer has not confirmed yet.' },
  { value: 'returns', label: 'Returns', stat: 'returns', empty: 'No returns', hint: 'Orders a customer has asked to return.' },
  { value: 'done', label: 'Done', empty: 'No finished orders yet', hint: 'Completed, cancelled and refunded orders.' },
];

export default function PartsShopOrders() {
  const { shop } = usePartsShop();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((item) => item.value === params.get('status')) || TABS[0];
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  useEffect(() => { document.title = 'Parts orders | Motaa'; }, []);

  const qs = new URLSearchParams({ status: tab.value, per_page: String(PAGE_SIZE) });
  if (page > 1) qs.set('offset', String((page - 1) * PAGE_SIZE));
  const query = useApiQuery(
    (api, signal) => api.get(`/parts/seller/orders/?${qs.toString()}`, { signal }),
    [tab.value, page],
    { select: (body) => body?.data }
  );

  function go(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key); else next.set(key, String(value));
    }
    setParams(next);
  }

  return (
    <Box w="100%">
      <PageHeader title="Orders" subtitle="Parts customers have bought from your shop." />

      <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={{ base: 3, md: 5 }} mb={{ base: 4, md: 5 }}>
        {[['New', shop?.stats?.new_orders, DASH.amber, Clock], ['To send', shop?.stats?.to_send, DASH.blue, Package],
          ['On the way', shop?.stats?.on_the_way, DASH.violet, Truck], ['Returns', shop?.stats?.returns, '#DC2626', RotateCcw]].map(([label, value, color, Icon]) => (
          <DashCard key={label} p={{ base: 4, md: 5 }}>
            <HStack spacing={3}><IconBubble icon={Icon} color={color} size={10} />
              <Box><Text fontSize="sm" color={DASH.muted}>{label}</Text><Text fontSize="2xl" fontWeight="600" lineHeight={1.2}>{Number(value) || 0}</Text></Box>
            </HStack>
          </DashCard>
        ))}
      </SimpleGrid>

      <DashCard>
      <Text color={DASH.muted} fontSize="sm" mb={3}>{tab.hint}</Text>
      <HStack role="group" aria-label="Which orders to show" spacing={2} mb={5} overflowX="auto" className="hidden-scroll" pb={1}>
        {TABS.map((item) => {
          const selected = item.value === tab.value;
          const count = item.stat ? Number(shop?.stats?.[item.stat]) || 0 : 0;
          return (
            <Button key={item.value} flexShrink={0} aria-pressed={selected} onClick={() => go({ status: item.value, page: null })}
              h="40px" px={4} borderRadius="full" fontWeight="500" bg={selected ? DASH.ink : DASH.page} color={selected ? 'white' : DASH.ink} _hover={{ bg: selected ? DASH.ink : '#E7EAF0' }}>
              {item.label}
              {count > 0 && <Box as="span" ml={2} minW="22px" px={1.5} borderRadius="full" fontSize="xs" bg={selected ? 'whiteAlpha.300' : 'white'}>{count}</Box>}
            </Button>
          );
        })}
      </HStack>

      <AsyncState
        query={query}
        skeleton={<OrderListSkeleton />}
        isEmpty={(data) => asList(data?.results).length === 0}
        empty={<EmptyState icon={Receipt} title={tab.empty} description={tab.hint} />}
      >
        {(data) => (
          <Box opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
            <Stack as="ul" listStyleType="none" spacing={3}>
              {asList(data?.results).map((order) => <PartsOrderRow key={order.uuid} order={order} to={`/parts-store/orders/${order.uuid}`} seller />)}
            </Stack>
            <PageControls
              offset={data?.pagination?.offset}
              limit={data?.pagination?.limit || PAGE_SIZE}
              count={data?.pagination?.count}
              isLoading={query.loading}
              onPage={(offset) => { go({ page: offset > 0 ? Math.floor(offset / PAGE_SIZE) + 1 : null }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </Box>
        )}
      </AsyncState>
      </DashCard>
    </Box>
  );
}
