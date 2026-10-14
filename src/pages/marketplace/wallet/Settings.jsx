// Wallet settings: the wallet PIN (set / change / forgot) and the payout accounts a user withdraws to
// (verified with the bank via Paystack).
import { useContext, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
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
import { KeyRound, Landmark, Plus, Trash2 } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { BankAccountFields } from '../../../components/wallet';
import { NewPinFields, PinField, PinResetForm } from '../../../components/walletPin';
import { asList } from '../../../utils';
import { PIN_LENGTH, lockedUntilText, newPinErrors, pinErrorStep } from '../../../utils/walletPin';

const primaryButton = { bg: 'primary', color: 'white', _hover: { bg: 'secondary' } };

/** First PIN: new + confirm. */
function SetPinForm({ onDone, onCancel }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const save = useApiMutation((api, value, confirmValue) => api.post('/wallet/pin/', { pin: value, confirm_pin: confirmValue }), {
    notifyOnError: false,
    successMessage: (body) => body?.message || 'Your wallet PIN is set.',
    onSuccess: () => onDone(),
    onError: (e) => { setError(e.message); setConfirm(''); },
  });
  const ready = !newPinErrors(pin, confirm).pin && !newPinErrors(pin, confirm).confirm && confirm.length === PIN_LENGTH;

  function submit(e, value = pin, confirmValue = confirm) {
    e?.preventDefault();
    if (save.loading) return;
    setError('');
    save.mutate(value, confirmValue);
  }

  return (
    <VStack as="form" onSubmit={submit} noValidate align="stretch" spacing={4}>
      <NewPinFields autoFocus pin={pin} confirm={confirm} onPinChange={setPin} onConfirmChange={setConfirm}
        onComplete={(value, confirmValue) => submit(null, value, confirmValue)} isDisabled={save.loading} />
      {error && <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>}
      <HStack spacing={3}>
        <Button type="submit" {...primaryButton} isLoading={save.loading} loadingText="Saving" isDisabled={!ready}>Set PIN</Button>
        <Button variant="ghost" onClick={onCancel} isDisabled={save.loading}>Cancel</Button>
      </HStack>
    </VStack>
  );
}

/** Current PIN, then new + confirm. A wrong current PIN counts towards the lock. */
function ChangePinForm({ onDone, onCancel, onForgot }) {
  const [current, setCurrent] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentError, setCurrentError] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const currentRef = useRef(null);
  const save = useApiMutation((api) => api.post('/wallet/pin/change/', { current_pin: current, new_pin: pin, confirm_pin: confirm }), {
    notifyOnError: false,
    successMessage: (body) => body?.message || 'Your wallet PIN was changed.',
    onSuccess: () => onDone(),
    onError: (e) => {
      const step = pinErrorStep(e);
      if (step?.step === 'locked') { setLocked(true); setError(step.message); return; }
      if (step) { setCurrent(''); setCurrentError(step.message); currentRef.current?.focus(); return; }
      const fields = e.fieldErrors;
      setError(fields.new_pin || fields.confirm_pin || e.message);
    },
  });
  const errors = newPinErrors(pin, confirm);
  const ready = current.length === PIN_LENGTH && !errors.pin && !errors.confirm && confirm.length === PIN_LENGTH;

  function submit(e) {
    e?.preventDefault();
    if (!ready || save.loading) return;
    setError('');
    setCurrentError('');
    save.mutate();
  }

  if (locked) {
    return (
      <VStack align="stretch" spacing={4}>
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>
        <HStack spacing={3}>
          <Button {...primaryButton} onClick={onForgot}>Reset PIN</Button>
          <Button variant="ghost" onClick={onDone}>Close</Button>
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack as="form" onSubmit={submit} noValidate align="stretch" spacing={4}>
      <PinField ref={currentRef} autoFocus label="Current PIN" value={current} error={currentError} isDisabled={save.loading}
        onChange={(value) => { setCurrent(value); setCurrentError(''); }} />
      <Button variant="link" size="sm" color="primary" alignSelf="start" onClick={onForgot}>Forgot PIN?</Button>
      <Divider />
      <NewPinFields pin={pin} confirm={confirm} onPinChange={setPin} onConfirmChange={setConfirm} isDisabled={save.loading} />
      {error && <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>}
      <HStack spacing={3}>
        <Button type="submit" {...primaryButton} isLoading={save.loading} loadingText="Saving" isDisabled={!ready}>Change PIN</Button>
        <Button variant="ghost" onClick={onCancel} isDisabled={save.loading}>Cancel</Button>
      </HStack>
    </VStack>
  );
}

function WalletPinSettings() {
  const { notify, naturalDate } = useContext(GlobalStore);
  const status = useApiQuery((api, signal) => api.get('/wallet/pin/', { signal }), [], { select: (b) => b?.data || {} });
  const [panel, setPanel] = useState(null); // 'set' | 'change' | 'reset'
  const info = status.data;
  const done = () => { setPanel(null); status.reload(); };
  const changedAt = info?.changed_at ? new Date(info.changed_at) : null;

  return (
    <Box as="section" aria-labelledby="wallet-pin-heading" borderWidth={1} borderRadius="lg" p={{ base: 4, md: 5 }} bg="white" mb={10}>
      <HStack spacing={3} mb={1}>
        <KeyRound size={20} aria-hidden="true" />
        <Heading as="h2" size="md" id="wallet-pin-heading">Wallet PIN</Heading>
        {info && (
          <Badge colorScheme={info.locked ? 'red' : info.has_pin ? 'green' : 'gray'} textTransform="none">
            {info.locked ? 'Locked' : info.has_pin ? 'On' : 'Not set'}
          </Badge>
        )}
      </HStack>
      <Text color="gray.600" mb={4}>Your 4-digit PIN approves every payment, transfer and withdrawal from your wallet. Card payments don't need it.</Text>

      <AsyncState query={status} loadingLabel="Loading your PIN settings…">
        {(data) => (
          <VStack align="stretch" spacing={4}>
            {data.locked && panel !== 'reset' && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Your PIN is locked after too many wrong tries{lockedUntilText(data.locked_until) ? ` ${lockedUntilText(data.locked_until)}` : ''}. Reset it to use your wallet now.
                </AlertDescription>
              </Alert>
            )}
            {!panel && data.has_pin && changedAt && !Number.isNaN(changedAt.getTime()) && (
              <Text fontSize="sm" color="gray.600">Last changed {naturalDate(changedAt)}</Text>
            )}

            {!panel && (
              <HStack spacing={3} flexWrap="wrap">
                {!data.has_pin && <Button {...primaryButton} onClick={() => setPanel('set')}>Set PIN</Button>}
                {data.has_pin && !data.locked && <Button {...primaryButton} onClick={() => setPanel('change')}>Change PIN</Button>}
                {data.has_pin && (
                  <Button variant={data.locked ? 'solid' : 'outline'} {...(data.locked ? primaryButton : { color: 'primary', borderColor: 'primary' })}
                    onClick={() => setPanel('reset')}>
                    {data.locked ? 'Reset PIN' : 'Forgot PIN?'}
                  </Button>
                )}
              </HStack>
            )}

            {panel === 'set' && <SetPinForm onDone={done} onCancel={() => setPanel(null)} />}
            {panel === 'change' && <ChangePinForm onDone={done} onCancel={() => setPanel(null)} onForgot={() => setPanel('reset')} />}
            {panel === 'reset' && (
              <Box>
                <Heading as="h3" size="sm" mb={3}>Reset your PIN</Heading>
                <PinResetForm
                  onDone={(_, body) => { notify({ title: 'Success', body: body?.message || 'Your wallet PIN was reset.' }); done(); }}
                  onNoPin={() => { setPanel('set'); }}
                  onCancel={() => setPanel(null)}
                />
              </Box>
            )}
          </VStack>
        )}
      </AsyncState>
    </Box>
  );
}

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
      <Heading as="h1" size="lg" mb={6}>Wallet settings</Heading>
      <WalletPinSettings />

      <Heading as="h2" size="md" mb={1}>Payout accounts</Heading>
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
