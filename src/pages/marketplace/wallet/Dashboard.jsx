// /wallet/home: the dark balance card with quick actions, money in and out this month, cash flow over six
// months, where the money went, the payout account and PIN, and recent transactions. Data: GET /wallet/
// (with `summary`) and /wallet/transactions/.
import { useContext } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Box, Button, Flex, Grid, HStack, Progress, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { ArrowDownLeft, ArrowUpRight, Hourglass, KeyRound, Landmark, Plus, Receipt, Send, TrendingUp } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { ErrorState } from '../../../components/states';
import { asList } from '../../../utils';
import { CardEmpty, chartOptions, DASH, DashCard, LegendDot, naira, PageHeader, PillButton, StatTile } from '../../../components/dashboard/ui';
import { BalanceCard, WalletTxnList } from './walletUi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const SPEND_COLORS = [DASH.blue, DASH.violet, DASH.amber, DASH.green, '#9CA3AF'];

function change(now, before) {
  const a = Number(now) || 0;
  const b = Number(before) || 0;
  if (!b) return null;
  return Math.round(((a - b) / b) * 100);
}

function WalletHomePage() {
  const { authUser } = useContext(GlobalStore);
  const wallet = useApiQuery((api, signal) => api.get('/wallet/', { signal }), [], { select: (b) => b?.data });
  const recent = useApiQuery((api, signal) => api.get('/wallet/transactions/?per_page=8', { signal }), [], {
    select: (b) => asList(b?.data?.results),
  });
  const w = wallet.data;
  const loading = wallet.loading && !w;
  const summary = w?.summary;
  const month = summary?.this_month || {};
  const hasFlow = [...(summary?.money_in || []), ...(summary?.money_out || [])].some((v) => Number(v) > 0);
  const spending = asList(summary?.spending);
  const spent = spending.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const account = w?.default_bank_account;
  const pinSet = w?.pin ? Boolean(w.pin.has_pin) : undefined;

  const header = (
    <PageHeader
      title="Wallet"
      subtitle={`${authUser?.first_name ? `Hi ${authUser.first_name}, here's` : "Here's"} your money on Motaa.`}
      actions={(
        <>
          <PillButton icon={Send} as={RLink} to="/wallet/send">Send money</PillButton>
          <PillButton dark icon={Plus} as={RLink} to="/wallet/deposit">Add money</PillButton>
        </>
      )}
    />
  );
  if (wallet.error && !w) return <>{header}<ErrorState error={wallet.error} onRetry={wallet.reload} title="We couldn't load your wallet" /></>;

  return (
    <Box>
      {header}
      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1.25fr) minmax(0, 1fr)' }} gap={{ base: 4, md: 5 }} mb={{ base: 4, md: 5 }}>
        <BalanceCard wallet={w} loading={loading} />
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={{ base: 4, md: 5 }}>
          <StatTile loading={loading} icon={ArrowDownLeft} color={DASH.green} label="Money in" value={naira(month.in, { short: true })}
            progress={null} footnote="This month" change={change(month.in, month.previous_in)} />
          <StatTile loading={loading} icon={ArrowUpRight} color={DASH.blue} label="Money out" value={naira(month.out, { short: true })}
            progress={null} footnote="This month" change={change(month.out, month.previous_out)} />
          <StatTile loading={loading} icon={Hourglass} color={DASH.amber} label="On hold" value={naira(w?.held_amount, { short: true })}
            progress={null} footnote={`${summary?.pending_count || 0} pending or in escrow`} />
          <DashCard p={{ base: 4, md: 5 }}>
            <HStack spacing={3} mb={3}>
              <Flex w={12} h={12} borderRadius="full" bg={DASH.blueWash} color={DASH.blue} align="center" justify="center"><Landmark size={22} /></Flex>
              <Box minW={0}>
                <Text fontSize="sm" color={DASH.muted}>Payout account</Text>
                {loading ? <Skeleton h="20px" w="120px" mt={1} /> : <Text fontWeight="600" noOfLines={1}>{account ? account.bank_name : 'Not added yet'}</Text>}
              </Box>
            </HStack>
            {account ? (
              <Text fontSize="sm" color={DASH.muted} noOfLines={1}>{account.account_name} · {account.masked_number}</Text>
            ) : <Text fontSize="sm" color={DASH.muted}>Add a bank account to withdraw.</Text>}
            <Button as={RLink} to="/wallet/settings" size="sm" variant="link" color={DASH.blue} mt={3}>{account ? 'Manage accounts' : 'Add bank account'}</Button>
          </DashCard>
        </SimpleGrid>
      </Grid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }} gap={{ base: 4, md: 5 }} alignItems="start">
        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          <DashCard title="Cash flow" subtitle="Completed money in and out, last 6 months."
            action={<HStack spacing={4} display={{ base: 'none', sm: 'flex' }}><LegendDot color={DASH.green}>In</LegendDot><LegendDot color={DASH.blue}>Out</LegendDot></HStack>}>
            <Box h={{ base: '220px', md: '280px' }}>
              {loading ? <Skeleton h="100%" borderRadius="16px" /> : hasFlow ? (
                <Bar options={chartOptions({ money: true })} data={{
                  labels: summary.labels,
                  datasets: [
                    { label: 'Money in', data: summary.money_in.map(Number), backgroundColor: DASH.green, borderRadius: 8, borderSkipped: false, maxBarThickness: 26 },
                    { label: 'Money out', data: summary.money_out.map(Number), backgroundColor: DASH.blue, borderRadius: 8, borderSkipped: false, maxBarThickness: 26 },
                  ],
                }} />
              ) : <CardEmpty icon={TrendingUp} title="No money movement yet" body="Deposits, payments and withdrawals will be charted here." action={{ label: 'Add money', to: '/wallet/deposit' }} />}
            </Box>
          </DashCard>

          <DashCard title="Recent transactions" menu={[{ label: 'All transactions', to: '/wallet/transactions' }]}>
            {recent.loading && !recent.data ? <Stack spacing={3}>{[0, 1, 2].map((i) => <Skeleton key={i} h="52px" borderRadius="14px" />)}</Stack>
              : recent.error && !recent.data ? <ErrorState error={recent.error} onRetry={recent.reload} minH="140px" py={4} />
                : asList(recent.data).length ? <WalletTxnList transactions={recent.data} />
                  : <CardEmpty icon={Receipt} title="No transactions yet" body="Deposits, payments and withdrawals will show up here." action={{ label: 'Make a deposit', to: '/wallet/deposit' }} />}
          </DashCard>
        </Stack>

        <Stack spacing={{ base: 4, md: 5 }} minW={0}>
          <DashCard title="Where it went" subtitle="Money out this month.">
            {loading ? <Skeleton h="140px" borderRadius="16px" /> : spending.length ? (
              <Stack spacing={4}>
                <Text fontSize="3xl" fontWeight="600">{naira(spent)}</Text>
                <Flex h="12px" borderRadius="full" overflow="hidden" bg={DASH.page} gap="3px">
                  {spending.map((row, i) => <Box key={row.type} w={`${(Number(row.amount) / spent) * 100}%`} bg={SPEND_COLORS[i % SPEND_COLORS.length]} />)}
                </Flex>
                <Stack spacing={3}>
                  {spending.map((row, i) => (
                    <Flex key={row.type} justify="space-between" align="center">
                      <LegendDot color={SPEND_COLORS[i % SPEND_COLORS.length]}>{row.label}</LegendDot>
                      <Text fontWeight="600">{naira(row.amount)}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            ) : <CardEmpty icon={ArrowUpRight} title="Nothing spent this month" />}
          </DashCard>

          <DashCard dark>
            <HStack spacing={3} mb={3}>
              <Flex w={12} h={12} borderRadius="full" bg="whiteAlpha.200" align="center" justify="center"><KeyRound size={20} /></Flex>
              <Box>
                <Text fontWeight="600">Wallet PIN</Text>
                <Text fontSize="sm" color="whiteAlpha.700">{pinSet === false ? 'Set a PIN to pay and withdraw.' : 'Every payment and withdrawal needs your PIN.'}</Text>
              </Box>
            </HStack>
            <Progress value={pinSet === false ? 30 : 100} size="xs" borderRadius="full" bg="whiteAlpha.200" sx={{ '& > div': { background: pinSet === false ? DASH.amber : DASH.green } }} aria-hidden="true" />
            <Button as={RLink} to="/wallet/settings" mt={4} size="sm" borderRadius="full" bg="white" color={DASH.ink} _hover={{ bg: 'whiteAlpha.900' }}>
              {pinSet === false ? 'Set my PIN' : 'PIN settings'}
            </Button>
          </DashCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default WalletHomePage;
