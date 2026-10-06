// /parts/orders — the customer's spare-parts orders (?status=open|done&page=).
import { useEffect } from 'react';
import { Link as RLink, useSearchParams } from 'react-router-dom';
import { Box, Button, ButtonGroup, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { Receipt } from 'lucide-react';
import { PageControls } from '../../../components';
import { OrderListSkeleton, PartsOrderRow } from '../../../components/parts';
import { AsyncState, EmptyState } from '../../../components/states';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';

const PAGE_SIZE = 25;
const TABS = [
  { value: 'open', label: 'In progress' },
  { value: 'done', label: 'Finished' },
  { value: 'all', label: 'All' },
];

export default function PartsOrders() {
  const [params, setParams] = useSearchParams();
  const status = TABS.some((tab) => tab.value === params.get('status')) ? params.get('status') : 'open';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  useEffect(() => { document.title = 'My parts orders | Motaa'; }, []);

  const qs = new URLSearchParams({ per_page: String(PAGE_SIZE) });
  if (status !== 'all') qs.set('status', status);
  if (page > 1) qs.set('offset', String((page - 1) * PAGE_SIZE));
  const query = useApiQuery(
    (api, signal) => api.get(`/parts/orders/?${qs.toString()}`, { signal }),
    [status, page],
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
    <Container maxW="container.lg" py={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="start" gap={3} flexWrap="wrap" mb={4}>
        <Box>
          <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }}>My parts orders</Heading>
          <Text color="gray.600" mt={1}>Track your spare-parts orders, confirm deliveries and ask for returns.</Text>
        </Box>
        <Button as={RLink} to="/parts/cart" variant="link" color="primary">Parts cart</Button>
      </Flex>

      <ButtonGroup isAttached variant="outline" size="sm" mb={5} role="group" aria-label="Which orders to show">
        {TABS.map((tab) => {
          const selected = status === tab.value;
          return (
            <Button key={tab.value} aria-pressed={selected} onClick={() => go({ status: tab.value, page: null })}
              bg={selected ? 'primary' : 'white'} color={selected ? 'white' : 'primary'} borderColor="primary" _hover={{ bg: selected ? 'primary' : 'blue.50' }}>
              {tab.label}
            </Button>
          );
        })}
      </ButtonGroup>

      <AsyncState
        query={query}
        skeleton={<OrderListSkeleton />}
        isEmpty={(data) => asList(data?.results).length === 0}
        empty={
          <EmptyState
            icon={Receipt}
            title={status === 'open' ? 'No orders in progress' : status === 'done' ? 'No finished orders yet' : 'No parts orders yet'}
            description="When you buy spare parts, your orders and their progress show up here."
            action={{ label: 'Browse spare parts', to: '/parts' }}
          />
        }
      >
        {(data) => (
          <Box opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
            <Stack as="ul" listStyleType="none" spacing={3}>
              {asList(data?.results).map((order) => <PartsOrderRow key={order.uuid} order={order} to={`/parts/orders/${order.uuid}`} />)}
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
    </Container>
  );
}
