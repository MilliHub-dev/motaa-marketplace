import { useContext, useRef, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { ErrorState, LoadingState } from '../../../components/states';
import { BankAccountFields, withdrawalFee } from '../../../components/wallet';
import { asList } from '../../../utils';

const NEW_ACCOUNT = 'new';

function Row({ label, value, bold }) {
  return (
    <Flex justify="space-between" gap={4} fontWeight={bold ? 700 : 500}>
      <Text color={bold ? undefined : 'gray.600'}>{label}</Text><Text textAlign="right">{value}</Text>
    </Flex>
  );
}

function WalletWithdrawalPage() {
  const { commaInt } = useContext(GlobalStore);
  const wallet = useApiQuery((api, signal) => api.get('/wallet/', { signal }), [], { select: (b) => b?.data });
  const accounts = useApiQuery((api, signal) => api.get('/wallet/bank-accounts/', { signal }), [], { select: (b) => asList(b?.data) });
  const [step, setStep] = useState(0); // 0 amount, 1 account
  const [amount, setAmount] = useState('');
  const [choice, setChoice] = useState('');
  const [bank, setBank] = useState({ bank_code: '', bank_name: '', account_number: '', account_name: '' });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const confirm = useDisclosure();
  const cancelRef = useRef();
  const banks = useApiQuery((api, signal) => api.get('/wallet/banks/', { signal }), [], {
    enabled: step === 1 && (choice === NEW_ACCOUNT || accounts.data?.length === 0), select: (b) => asList(b?.data),
  });

  const limits = wallet.data?.limits;
  const available = Number(wallet.data?.balance) || 0;
  const min = Number(limits?.min_withdrawal) || 1000;
  const value = Number(amount) || 0;
  const fee = withdrawalFee(value, limits?.withdrawal_fee_tiers);
  const amountError = !value ? 'Enter an amount'
    : value < min ? `The minimum withdrawal is ₦${commaInt(min)}`
      : value + fee > available ? `You can withdraw up to ₦${commaInt(Math.max(0, available - withdrawalFee(available, limits?.withdrawal_fee_tiers)))} (including the fee)`
        : '';

  const saved = accounts.data || [];
  const selectedChoice = choice || (saved.find((a) => a.is_default) || saved[0])?.uuid || NEW_ACCOUNT;
  const savedAccount = saved.find((a) => a.uuid === selectedChoice);
  const destination = savedAccount
    ? { name: savedAccount.account_name, bank: savedAccount.bank_name, number: savedAccount.masked_number }
    : { name: bank.account_name, bank: bank.bank_name, number: bank.account_number ? `******${bank.account_number.slice(-4)}` : '' };
  const accountError = selectedChoice === NEW_ACCOUNT && !bank.account_name ? 'Choose your bank and enter an account number we can verify' : '';

  const withdraw = useApiMutation((api, payload) => api.post('/wallet/withdraw/', payload), {
    errorTitle: "Couldn't start the withdrawal",
    onSuccess: (body) => { confirm.onClose(); setResult(body?.data?.transaction || {}); setResultMessage(body?.message); wallet.reload(); },
    onError: () => confirm.onClose(),
  });
  const [resultMessage, setResultMessage] = useState('');
  const refresh = useApiMutation((api, uuid) => api.get(`/wallet/transactions/${uuid}/`), {
    errorTitle: "Couldn't check the status",
    onSuccess: (body) => body?.data && setResult(body.data),
  });

  function next(e) {
    e.preventDefault();
    setSubmitted(true);
    if (step === 0) {
      if (amountError) return;
      setSubmitted(false);
      setStep(1);
      return;
    }
    if (accountError) return;
    confirm.onOpen();
  }

  function submit() {
    const payload = savedAccount
      ? { amount: value.toFixed(2), bank_account_id: savedAccount.uuid }
      : { amount: value.toFixed(2), bank_code: bank.bank_code, bank_name: bank.bank_name, account_number: bank.account_number, save_account: true };
    withdraw.mutate(payload);
  }

  if (wallet.loading && !wallet.data) return <LoadingState label="Loading your wallet…" />;
  if (wallet.error && !wallet.data) return <ErrorState error={wallet.error} onRetry={wallet.reload} />;

  if (result) {
    const status = result.status;
    const view = status === 'completed' ? { icon: CheckCircle2, color: 'green.500', title: 'Withdrawal sent' }
      : status === 'pending' ? { icon: Clock, color: 'yellow.500', title: 'Withdrawal processing' }
        : { icon: XCircle, color: 'red.500', title: 'Withdrawal failed' };
    return (
      <Flex direction="column" align="center" textAlign="center" gap={4} py={12} px={4} borderWidth={1} borderRadius="20px" maxW="480px" mx="auto" bg="white">
        <Icon as={view.icon} boxSize={14} color={view.color} aria-hidden="true" />
        <Heading as="h1" size="md">{view.title}</Heading>
        <Text color="gray.700">
          {status === 'completed' ? `₦${commaInt(result.amount)} is on its way to ${destination.bank} ${destination.number}.`
            : status === 'pending' ? (resultMessage || 'Your bank transfer is processing. We’ll notify you when it lands.')
              : 'The transfer could not be completed. Your wallet was not charged.'}
        </Text>
        {result.reference && <Text fontSize="sm" color="gray.600">Reference: <Text as="span" fontFamily="mono" wordBreak="break-all">{result.reference}</Text></Text>}
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
          {status === 'pending' && result.uuid && (
            <Button onClick={() => refresh.mutate(result.uuid)} isLoading={refresh.loading} variant="outline" color="primary" borderColor="primary">Check status</Button>
          )}
          <Button as={RLink} to="/wallet/transactions" bg="primary" color="white" _hover={{ bg: 'secondary' }}>View transactions</Button>
        </Stack>
      </Flex>
    );
  }

  return (
    <Box as="form" onSubmit={next} noValidate borderWidth={1} borderRadius="20px" p={{ base: 5, md: 8 }} maxW="520px" mx="auto" bg="white">
      <Heading as="h1" size="lg" mb={1}>Withdraw</Heading>
      <Text color="gray.600" mb={6}>Available: ₦{commaInt(available)} · Step {step + 1} of 2</Text>

      {step === 0 ? (
        <FormControl isRequired isInvalid={submitted && Boolean(amountError)}>
          <FormLabel htmlFor="withdraw-amount">How much are you withdrawing?</FormLabel>
          <InputGroup size="lg">
            <InputLeftAddon>₦</InputLeftAddon>
            <Input id="withdraw-amount" inputMode="numeric" autoComplete="off" placeholder="0" fontSize="2xl" fontWeight="600"
              value={amount ? commaInt(amount) : ''} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 9))} />
          </InputGroup>
          <FormHelperText>
            {value >= min ? `Transfer fee ₦${commaInt(fee)} · ₦${commaInt(value + fee)} will leave your wallet` : `Minimum ₦${commaInt(min)}`}
          </FormHelperText>
          <FormErrorMessage>{amountError}</FormErrorMessage>
        </FormControl>
      ) : (
        <VStack align="stretch" spacing={5}>
          <Text>Withdrawing <b>₦{commaInt(value)}</b> <Button variant="link" size="sm" color="primary" onClick={() => setStep(0)}>Change</Button></Text>
          {accounts.loading && !accounts.data ? <LoadingState minH="80px" label="Loading your accounts…" /> : (
            <FormControl as="fieldset" isInvalid={submitted && Boolean(accountError)}>
              <FormLabel as="legend">Send to</FormLabel>
              {saved.length > 0 && (
                <RadioGroup value={selectedChoice} onChange={setChoice} mb={3}>
                  <Stack spacing={3}>
                    {saved.map((account) => (
                      <Radio key={account.uuid} value={account.uuid}>
                        <Text className="bold">{account.account_name}</Text>
                        <Text fontSize="sm" color="gray.600">{account.bank_name} · {account.masked_number}</Text>
                      </Radio>
                    ))}
                    <Radio value={NEW_ACCOUNT}>A different account</Radio>
                  </Stack>
                </RadioGroup>
              )}
              {selectedChoice === NEW_ACCOUNT && (
                <BankAccountFields banks={banks.data || []} banksLoading={banks.loading} banksError={banks.error}
                  value={bank} onChange={(partial) => setBank((b) => ({ ...b, ...partial }))} submitted={submitted} />
              )}
              <FormErrorMessage>{accountError}</FormErrorMessage>
            </FormControl>
          )}
        </VStack>
      )}

      <Button type="submit" mt={8} w="full" size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }}>
        {step === 0 ? 'Continue' : 'Review withdrawal'}
      </Button>

      <AlertDialog isOpen={confirm.isOpen} leastDestructiveRef={cancelRef} onClose={confirm.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>Confirm withdrawal</AlertDialogHeader>
            <AlertDialogBody>
              <VStack align="stretch" spacing={2}>
                <Row label="To" value={destination.name} />
                <Row label="Bank" value={`${destination.bank} ${destination.number}`} />
                <Divider />
                <Row label="Amount" value={`₦${commaInt(value)}`} />
                <Row label="Transfer fee" value={`₦${commaInt(fee)}`} />
                <Row bold label="Total from wallet" value={`₦${commaInt(value + fee)}`} />
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={confirm.onClose} isDisabled={withdraw.loading}>Cancel</Button>
              <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={submit} isLoading={withdraw.loading} loadingText="Sending">
                Withdraw ₦{commaInt(value)}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default WalletWithdrawalPage;
