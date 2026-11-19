import { useSearchParams } from 'react-router-dom';
import { Box, Button, Flex, HStack, Skeleton, Stack, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { ErrorState } from '../../../components/states';
import { asList } from '../../../utils';
import { CardEmpty, DASH, DashCard, PageHeader } from '../../../components/dashboard/ui';
import { WalletTxnList } from './walletUi';

const PAGE_SIZE = 20;
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'deposit,refund,transfer_in', label: 'Money in' },
  { value: 'payment,charge,transfer_out', label: 'Payments' },
  { value: 'withdraw', label: 'Withdrawals' },
];
const STATUSES = [
  { value: '', label: 'Any status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending,locked', label: 'Pending or on hold' },
  { value: 'failed,reversed', label: 'Failed or reversed' },
];

function Pills({ options, value, onChange, label }) {
  return (
    <HStack spacing={2} overflowX="auto" className="hidden-scroll" role="group" aria-label={label}>
      {options.map((f) => {
        const on = value === f.value;
        return (
          <Button key={f.label} size="sm" h="38px" px={4} borderRadius="full" flexShrink={0} fontWeight={on ? 600 : 500}
            bg={on ? DASH.ink : 'white'} color={on ? 'white' : '#4B5563'} _hover={{ bg: on ? DASH.ink : '#E9ECF1' }}
            aria-pressed={on} onClick={() => onChange(f.value)}>
            {f.label}
          </Button>
        );
      })}
    </HStack>
  );
}

function WalletTransactionsPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const status = params.get('status') || '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const qs = new URLSearchParams({ per_page: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
  if (type) qs.set('type', type);
  if (status) qs.set('status', status);

  const query = useApiQuery((api, signal) => api.get(`/wallet/transactions/?${qs}`, { signal }), [qs.toString()], {
    select: (b) => ({ results: asList(b?.data?.results), count: Number(b?.data?.pagination?.count) || 0 }),
  });
  const count = query.data?.count || 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  }

  return (
    <Box>
      <PageHeader title="Transactions" subtitle="Every deposit, payment, refund and withdrawal on your wallet." />
      <Flex gap={3} mb={{ base: 4, md: 5 }} direction={{ base: 'column', md: 'row' }} justify="space-between">
        <Pills label="Filter by type" options={FILTERS} value={type} onChange={(v) => update({ type: v, page: '' })} />
        <Pills label="Filter by status" options={STATUSES} value={status} onChange={(v) => update({ status: v, page: '' })} />
      </Flex>

      <DashCard title={query.data ? `${count.toLocaleString()} transaction${count === 1 ? '' : 's'}` : 'Transactions'}
        subtitle={pages > 1 ? `Page ${page} of ${pages}` : undefined}>
        {query.loading && !query.data ? <Stack spacing={3}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h="52px" borderRadius="14px" />)}</Stack>
          : query.error && !query.data ? <ErrorState error={query.error} onRetry={query.reload} />
            : query.data.results.length ? <Box opacity={query.loading ? 0.6 : 1} transition="opacity .2s"><WalletTxnList transactions={query.data.results} /></Box>
              : <CardEmpty icon={Receipt} title={type || status ? 'Nothing matches these filters' : 'No transactions yet'}
                body="Deposits, payments, refunds and withdrawals will show up here." />}

        {pages > 1 && (
          <Flex justify="space-between" align="center" mt={5} pt={4} borderTopWidth="1px" borderColor={DASH.line}>
            <Button size="sm" borderRadius="full" bg={DASH.page} leftIcon={<ChevronLeft size={16} />} isDisabled={page <= 1 || query.loading}
              onClick={() => update({ page: String(page - 1) })}>Previous</Button>
            <Text fontSize="sm" color={DASH.muted}>Page {page} of {pages}</Text>
            <Button size="sm" borderRadius="full" bg={DASH.page} rightIcon={<ChevronRight size={16} />} isDisabled={page >= pages || query.loading}
              onClick={() => update({ page: String(page + 1) })}>Next</Button>
          </Flex>
        )}
      </DashCard>
    </Box>
  );
}

export default WalletTransactionsPage;
