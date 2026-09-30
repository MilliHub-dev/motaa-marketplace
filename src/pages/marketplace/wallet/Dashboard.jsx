import { useContext } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Box, Button, Flex, Heading, HStack, Icon, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { ArrowDownToLine, ArrowUpFromLine, Landmark, Lock, Receipt } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState, ErrorState } from '../../../components/states';
import { TransactionList } from '../../../components/wallet';
import { asList } from '../../../utils';

function WalletHomePage() {
  const { commaInt } = useContext(GlobalStore);
  const wallet = useApiQuery((api, signal) => api.get('/wallet/', { signal }), [], { select: (b) => b?.data });
  const recent = useApiQuery((api, signal) => api.get('/wallet/transactions/?per_page=5', { signal }), [], {
    select: (b) => asList(b?.data?.results),
  });
  const w = wallet.data;
  const held = Number(w?.held_amount) || 0;
  const account = w?.default_bank_account;

  return (
    <Box>
      <Heading as="h1" size="lg" mb={6}>Wallet</Heading>
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} mb={8}>
        <Box borderWidth={1} borderRadius="15px" p={{ base: 4, md: 6 }} bg="white">
          <Text color="gray.600">Available balance</Text>
          {wallet.error && !w ? (
            <ErrorState error={wallet.error} onRetry={wallet.reload} minH="140px" py={4} />
          ) : (
            <>
              <Skeleton isLoaded={Boolean(w)} my={2} maxW="260px">
                <Heading as="p" size="2xl" fontWeight="600">₦{commaInt(w?.balance)}</Heading>
              </Skeleton>
              {held > 0 && (
                <HStack spacing={2} color="gray.600" fontSize="sm" mb={2}>
                  <Icon as={Lock} aria-hidden="true" />
                  <Text>₦{commaInt(held)} held in escrow or pending withdrawal · ₦{commaInt(w?.ledger_balance)} total</Text>
                </HStack>
              )}
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={4}>
                <Button as={RLink} to="/wallet/deposit" leftIcon={<ArrowDownToLine size={18} />} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Deposit</Button>
                <Button as={RLink} to="/wallet/withdraw" leftIcon={<ArrowUpFromLine size={18} />} variant="outline" color="primary" borderColor="primary">Withdraw</Button>
              </Stack>
            </>
          )}
        </Box>

        <Box borderWidth={1} borderRadius="15px" p={{ base: 4, md: 6 }} bg="white">
          <HStack spacing={2} mb={2}><Icon as={Landmark} color="primary" aria-hidden="true" /><Text color="gray.600">Payout account</Text></HStack>
          {!w ? (wallet.error ? <Text color="gray.600">Couldn’t load your payout account.</Text> : <Skeleton h="48px" />) : account ? (
            <>
              <Text className="bold" fontSize="lg">{account.account_name}</Text>
              <Text color="gray.600">{account.bank_name} · {account.masked_number}</Text>
              <Button as={RLink} to="/wallet/settings" variant="link" color="primary" mt={3}>Manage payout accounts</Button>
            </>
          ) : (
            <>
              <Text color="gray.700">Add a bank account to withdraw your earnings and refunds.</Text>
              <Button as={RLink} to="/wallet/settings" size="sm" mt={3} variant="outline" color="primary" borderColor="primary">Add bank account</Button>
            </>
          )}
        </Box>
      </SimpleGrid>

      <Flex justify="space-between" align="center" mb={2}>
        <Heading as="h2" size="md">Recent transactions</Heading>
        {recent.data?.length > 0 && <Button as={RLink} to="/wallet/transactions" variant="link" color="primary">View all</Button>}
      </Flex>
      <Box borderWidth={1} borderRadius="lg" px={{ base: 3, md: 5 }} bg="white">
        <AsyncState
          query={recent}
          loadingLabel="Loading transactions…"
          isEmpty={(items) => items.length === 0}
          empty={<EmptyState icon={Receipt} title="No transactions yet" description="Deposits, payments and withdrawals will show up here." action={{ label: 'Make a deposit', to: '/wallet/deposit' }} />}
        >
          {(items) => <TransactionList transactions={items} />}
        </AsyncState>
      </Box>
    </Box>
  );
}

export default WalletHomePage;
