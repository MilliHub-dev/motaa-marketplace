// /parts-store/orders — the seller's parts orders (?status=new|to-send|sent|returns|done&page=).
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { Receipt } from 'lucide-react';
import { PageControls } from '../../../components';
import { OrderListSkeleton, PartsOrderRow } from '../../../components/parts';
import { AsyncState, EmptyState } from '../../../components/states';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { usePartsShop } from './shop';

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
      <Box py={6} borderBottom="2px solid lavender">
        <Heading as="h1" size="md">Parts orders</Heading>
        <Text color="gray.600" fontSize="sm">{tab.hint}</Text>
      </Box>

      <HStack role="group" aria-label="Which orders to show" spacing={2} my={4} overflowX="auto" className="hidden-scroll">
        {TABS.map((item) => {
          const selected = item.value === tab.value;
          const count = item.stat ? Number(shop?.stats?.[item.stat]) || 0 : 0;
          return (
            <Button key={item.value} size="sm" flexShrink={0} aria-pressed={selected} onClick={() => go({ status: item.value, page: null })}
              variant={selected ? 'solid' : 'outline'} bg={selected ? 'primary' : 'white'} color={selected ? 'white' : 'gray.700'} _hover={{ bg: selected ? 'primary' : 'gray.50' }}>
              {item.label}
              {count > 0 && <Badge ml={2} borderRadius="full" px={2} colorScheme={selected ? 'yellow' : 'blue'}>{count}</Badge>}
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
    </Box>
  );
}
