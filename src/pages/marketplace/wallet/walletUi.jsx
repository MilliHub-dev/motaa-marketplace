// Shared pieces for the wallet screens, in the dashboard look (grey page, white rounded cards, one dark card):
// the dark balance card, the form + side panel split used by Deposit / Withdraw / Send, and the grouped
// transaction list.
import { useContext, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Box, Divider, Flex, Grid, HStack, Skeleton, Stack, Text, Tooltip } from '@chakra-ui/react';
import { ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, Eye, EyeOff, Lock, ReceiptText, Send, ShieldCheck } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { DASH, DashCard, StatusPill } from '../../../components/dashboard/ui';

const HIDE_KEY = 'motaa-wallet-hide-balance';
function readHidden() {
  try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; }
}

/** Card props for a form or result block inside the split layout. */
export const FORM_CARD = { bg: 'white', borderRadius: DASH.radius, p: { base: 5, md: 8 }, w: '100%' };

const ACTIONS = [
  { label: 'Deposit', icon: ArrowDownToLine, to: '/wallet/deposit' },
  { label: 'Withdraw', icon: ArrowUpFromLine, to: '/wallet/withdraw' },
  { label: 'Send', icon: Send, to: '/wallet/send' },
  { label: 'History', icon: ReceiptText, to: '/wallet/transactions' },
];

/** The dark balance card: available balance (can be hidden), money on hold and quick actions. */
export function BalanceCard({ wallet, loading, actions = true }) {
  const { commaInt } = useContext(GlobalStore);
  const [hidden, setHidden] = useState(readHidden);
  const held = Number(wallet?.held_amount) || 0;
  const toggle = () => {
    setHidden((value) => {
      try { localStorage.setItem(HIDE_KEY, value ? '0' : '1'); } catch { /* private mode */ }
      return !value;
    });
  };
  const mask = (value) => (hidden ? '••••••' : `₦${commaInt(value)}`);

  return (
    <Box bg={DASH.ink} color="white" borderRadius={DASH.radius} p={{ base: 5, md: 6 }} position="relative" overflow="hidden" minW={0}>
      {/* soft blue glow, like a card */}
      <Box position="absolute" w="260px" h="260px" borderRadius="full" bg={DASH.blue} opacity={0.45} filter="blur(60px)" top="-120px" right="-80px" pointerEvents="none" />
      <Flex position="relative" direction="column" h="100%">
        <Flex justify="space-between" align="center">
          <HStack spacing={2} color="whiteAlpha.800" fontSize="sm"><ShieldCheck size={16} /><Text>Available balance</Text></HStack>
          <Tooltip label={hidden ? 'Show balance' : 'Hide balance'}>
            <Box as="button" type="button" onClick={toggle} aria-label={hidden ? 'Show balance' : 'Hide balance'} aria-pressed={hidden}
              w={9} h={9} borderRadius="full" bg="whiteAlpha.200" display="flex" alignItems="center" justifyContent="center" _hover={{ bg: 'whiteAlpha.300' }}>
              {hidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </Box>
          </Tooltip>
        </Flex>
        {loading ? <Skeleton h="52px" w="220px" my={3} borderRadius="12px" startColor="whiteAlpha.200" endColor="whiteAlpha.400" /> : (
          <Text fontSize={{ base: '4xl', md: '5xl' }} fontWeight="600" letterSpacing="-0.02em" lineHeight={1.1} my={3} noOfLines={1}>{mask(wallet?.balance)}</Text>
        )}
        <HStack spacing={2} fontSize="sm" color="whiteAlpha.700" flexWrap="wrap">
          {held > 0 ? (
            <><Lock size={14} /><Text>{mask(held)} on hold · {mask(wallet?.ledger_balance)} in total</Text></>
          ) : <Text>Nothing on hold</Text>}
        </HStack>
        {actions && (
          <Grid templateColumns="repeat(4, 1fr)" gap={{ base: 2, md: 3 }} mt="auto" pt={6}>
            {ACTIONS.map((action) => (
              <Stack key={action.to} as={RLink} to={action.to} align="center" spacing={2} py={3} borderRadius="16px" bg="whiteAlpha.100"
                _hover={{ bg: 'whiteAlpha.200' }} transition="background .15s">
                <Flex w={10} h={10} borderRadius="full" bg="white" color={DASH.ink} align="center" justify="center"><action.icon size={18} /></Flex>
                <Text fontSize="sm" fontWeight="500">{action.label}</Text>
              </Stack>
            ))}
          </Grid>
        )}
      </Flex>
    </Box>
  );
}

/** A form (or result) on the left and the balance card plus tips on the right; stacks on phones with the form first. */
export function WalletSplit({ wallet, tips = [], children }) {
  return (
    <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 340px' }} gap={{ base: 4, md: 5 }} alignItems="start">
      <Box minW={0}>{children}</Box>
      <Stack spacing={{ base: 4, md: 5 }} position={{ lg: 'sticky' }} top={{ lg: '96px' }}>
        <BalanceCard wallet={wallet} actions={false} />
        {tips.length > 0 && (
          <DashCard p={{ base: 4, md: 5 }}>
            <Text fontWeight="600" mb={3}>Good to know</Text>
            <Stack spacing={3}>
              {tips.map((tip) => (
                <HStack key={tip.text} align="flex-start" spacing={3}>
                  <Flex w={8} h={8} borderRadius="full" bg={DASH.blueWash} color={DASH.blue} align="center" justify="center" flexShrink={0}><tip.icon size={15} /></Flex>
                  <Text fontSize="sm" color={DASH.muted}>{tip.text}</Text>
                </HStack>
              ))}
            </Stack>
          </DashCard>
        )}
      </Stack>
    </Grid>
  );
}

const STATUS_TONES = { completed: 'green', pending: 'amber', locked: 'violet', failed: 'red', reversed: 'grey' };

function dayLabel(date, naturalDate) {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return naturalDate(date);
}

/** One transaction row in the dashboard style. */
export function WalletTxnRow({ transaction }) {
  const { commaInt, naturalTime } = useContext(GlobalStore);
  const credit = transaction?.direction === 'credit';
  const date = transaction?.date_created ? new Date(transaction.date_created) : null;
  const valid = date && !Number.isNaN(date.getTime());
  const fee = Number(transaction?.fee) || 0;
  const total = Number(transaction?.amount || 0) + (credit ? 0 : fee);
  return (
    <Flex gap={3} py={3} align="center">
      <Flex flexShrink={0} w={12} h={12} borderRadius="full" align="center" justify="center"
        bg={credit ? '#E7F7F0' : DASH.page} color={credit ? '#047857' : DASH.ink} aria-hidden="true">
        {credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </Flex>
      <Box flex={1} minW={0}>
        <Text fontWeight="600" noOfLines={1}>{transaction?.narration || transaction?.type_label || 'Transaction'}</Text>
        <Text fontSize="sm" color={DASH.muted} noOfLines={1}>
          {transaction?.type_label}{valid ? ` · ${naturalTime(date)}` : ''}{!credit && fee > 0 ? ` · ₦${commaInt(fee)} fee` : ''}
        </Text>
      </Box>
      <Stack spacing={1} align="flex-end" flexShrink={0}>
        <Text fontWeight="700" color={credit ? '#047857' : DASH.ink} whiteSpace="nowrap">{credit ? '+' : '−'}₦{commaInt(total)}</Text>
        <StatusPill tone={STATUS_TONES[transaction?.status] || 'grey'}>{transaction?.status_label || transaction?.status || 'Unknown'}</StatusPill>
      </Stack>
    </Flex>
  );
}

/** Transactions grouped under "Today", "Yesterday" or the date. */
export function WalletTxnList({ transactions }) {
  const { naturalDate } = useContext(GlobalStore);
  const groups = [];
  transactions.forEach((transaction) => {
    const date = transaction?.date_created ? new Date(transaction.date_created) : null;
    const label = date && !Number.isNaN(date.getTime()) ? dayLabel(date, naturalDate) : 'Earlier';
    if (!groups.length || groups[groups.length - 1].label !== label) groups.push({ label, items: [] });
    groups[groups.length - 1].items.push(transaction);
  });
  return (
    <Stack spacing={4}>
      {groups.map((group) => (
        <Box key={group.label}>
          <Text fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" color="#9CA3AF" mb={1}>{group.label}</Text>
          <Stack spacing={0} divider={<Divider borderColor={DASH.line} />}>
            {group.items.map((transaction) => <WalletTxnRow key={transaction?.uuid || transaction?.id} transaction={transaction} />)}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
