// Payout accounts: the bank accounts a user withdraws to (verified with the bank via Paystack).
import { useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Landmark, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { BankAccountFields } from '../../../components/wallet';
import { asList } from '../../../utils';

const EMPTY_ACCOUNT = { bank_code: '', bank_name: '', account_number: '', account_name: '' };

function WalletSettingsPage() {
  const accounts = useApiQuery((api, signal) => api.get('/wallet/bank-accounts/', { signal }), [], { select: (b) => asList(b?.data) });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_ACCOUNT);
  const [submitted, setSubmitted] = useState(false);
  const [removing, setRemoving] = useState(null);
  const cancelRef = useRef();
  const banks = useApiQuery((api, signal) => api.get('/wallet/banks/', { signal }), [], { enabled: adding, select: (b) => asList(b?.data) });

  const save = useApiMutation((api, payload) => api.post('/wallet/bank-accounts/', payload), {
    successMessage: 'Bank account saved',
    errorTitle: "Couldn't save this account",
    onSuccess: () => { setAdding(false); setDraft(EMPTY_ACCOUNT); setSubmitted(false); accounts.reload(); },
  });
  const makeDefault = useApiMutation((api, uuid) => api.post(`/wallet/bank-accounts/${uuid}/`, { is_default: true }), {
    successMessage: 'Default payout account updated',
    errorTitle: "Couldn't update the default account",
    onSuccess: () => accounts.reload(),
  });
  const remove = useApiMutation((api, uuid) => api.delete(`/wallet/bank-accounts/${uuid}/`), {
    successMessage: 'Bank account removed',
    errorTitle: "Couldn't remove this account",
    onSuccess: () => { setRemoving(null); accounts.reload(); },
    onError: () => setRemoving(null),
  });

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!draft.account_name) return;
    save.mutate({ bank_code: draft.bank_code, bank_name: draft.bank_name, account_number: draft.account_number, is_default: !accounts.data?.length });
  }

  return (
    <Box maxW="640px">
      <Heading as="h1" size="lg" mb={1}>Payout accounts</Heading>
      <Text color="gray.600" mb={6}>Withdrawals are sent to these bank accounts. We check every account name with your bank.</Text>

      <Box borderWidth={1} borderRadius="lg" px={{ base: 3, md: 5 }} bg="white">
        <AsyncState
          query={accounts}
          loadingLabel="Loading your accounts…"
          isEmpty={(items) => items.length === 0}
          empty={<EmptyState icon={Landmark} title="No bank accounts yet" description="Add the account you want withdrawals paid into." minH="180px" />}
        >
          {(items) => (
            <VStack align="stretch" spacing={0} divider={<Divider />}>
              {items.map((account) => (
                <Flex key={account.uuid} py={4} gap={3} align="center">
                  <Icon as={Landmark} color="primary" boxSize={5} aria-hidden="true" flexShrink={0} />
                  <Box flex={1} minW={0}>
                    <HStack spacing={2}>
                      <Text className="bold" noOfLines={1}>{account.account_name}</Text>
                      {account.is_default && <Badge colorScheme="blue" textTransform="none">Default</Badge>}
                    </HStack>
                    <Text fontSize="sm" color="gray.600">{account.bank_name} · {account.masked_number}</Text>
                  </Box>
                  {!account.is_default && (
                    <Button size="sm" variant="ghost" color="primary" onClick={() => makeDefault.mutate(account.uuid)} isLoading={makeDefault.loading}>
                      Make default
                    </Button>
                  )}
                  <IconButton size="sm" variant="ghost" icon={<Trash2 size={16} />} aria-label={`Remove ${account.bank_name} account ending ${account.account_number?.slice(-4)}`}
                    onClick={() => setRemoving(account)} />
                </Flex>
              ))}
            </VStack>
          )}
        </AsyncState>
      </Box>

      {adding ? (
        <Box as="form" onSubmit={submit} noValidate borderWidth={1} borderRadius="lg" p={{ base: 4, md: 5 }} mt={6} bg="white">
          <Heading as="h2" size="sm" mb={4}>Add a bank account</Heading>
          <BankAccountFields banks={banks.data || []} banksLoading={banks.loading} banksError={banks.error}
            value={draft} onChange={(partial) => setDraft((d) => ({ ...d, ...partial }))} submitted={submitted} />
          <HStack mt={5} spacing={3}>
            <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} isDisabled={!draft.account_name}>Save account</Button>
            <Button variant="ghost" onClick={() => { setAdding(false); setDraft(EMPTY_ACCOUNT); setSubmitted(false); }}>Cancel</Button>
          </HStack>
        </Box>
      ) : (
        <Button mt={6} leftIcon={<Plus size={18} />} variant="outline" color="primary" borderColor="primary" onClick={() => setAdding(true)}>
          Add bank account
        </Button>
      )}

      <AlertDialog isOpen={Boolean(removing)} leastDestructiveRef={cancelRef} onClose={() => setRemoving(null)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>Remove this account?</AlertDialogHeader>
            <AlertDialogBody>
              {removing?.account_name} · {removing?.bank_name} {removing?.masked_number} will no longer be available for withdrawals. You can add it again later.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={() => setRemoving(null)} isDisabled={remove.loading}>Keep it</Button>
              <Button colorScheme="red" onClick={() => remove.mutate(removing.uuid)} isLoading={remove.loading}>Remove</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default WalletSettingsPage;
