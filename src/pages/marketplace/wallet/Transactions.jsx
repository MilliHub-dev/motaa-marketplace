import { useSearchParams } from 'react-router-dom';
import { Box, Button, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { Receipt } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { TransactionList } from '../../../components/wallet';
import { asList } from '../../../utils';

const PAGE_SIZE = 20;
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'deposit,refund,transfer_in', label: 'Money in' },
  { value: 'payment,charge,transfer_out', label: 'Payments' },
  { value: 'withdraw', label: 'Withdrawals' },
];

function WalletTransactionsPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const qs = new URLSearchParams({ per_page: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
  if (type) qs.set('type', type);

  const query = useApiQuery((api, signal) => api.get(`/wallet/transactions/?${qs}`, { signal }), [qs.toString()], {
    select: (b) => ({ results: asList(b?.data?.results), count: Number(b?.data?.pagination?.count) || 0 }),
  });
  const pages = Math.max(1, Math.ceil((query.data?.count || 0) / PAGE_SIZE));

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  }

  return (
    <Box>
      <Heading as="h1" size="lg" mb={4}>Transactions</Heading>
      <HStack spacing={2} mb={4} overflowX="auto" className="hidden-scroll" role="group" aria-label="Filter transactions">
        {FILTERS.map((f) => (
          <Button key={f.label} size="sm" borderRadius="full" flexShrink={0}
            variant={type === f.value ? 'solid' : 'outline'} bg={type === f.value ? 'primary' : undefined}
            color={type === f.value ? 'white' : 'gray.700'} aria-pressed={type === f.value}
            onClick={() => update({ type: f.value, page: '' })}>
            {f.label}
          </Button>
        ))}
      </HStack>

      <Box borderWidth={1} borderRadius="lg" px={{ base: 3, md: 5 }} bg="white">
        <AsyncState
          query={query}
          loadingLabel="Loading transactions…"
          isEmpty={(d) => d.results.length === 0}
          empty={<EmptyState icon={Receipt} title={type ? 'Nothing here yet' : 'No transactions yet'}
            description="Deposits, payments, refunds and withdrawals will show up here." />}
        >
          {(d) => <TransactionList transactions={d.results} />}
        </AsyncState>
      </Box>

      {pages > 1 && (
        <Flex justify="space-between" align="center" mt={4}>
          <Button size="sm" variant="outline" isDisabled={page <= 1 || query.loading} onClick={() => update({ page: String(page - 1) })}>Previous</Button>
          <Text fontSize="sm" color="gray.600">Page {page} of {pages}</Text>
          <Button size="sm" variant="outline" isDisabled={page >= pages || query.loading} onClick={() => update({ page: String(page + 1) })}>Next</Button>
        </Flex>
      )}
    </Box>
  );
}

export default WalletTransactionsPage;
