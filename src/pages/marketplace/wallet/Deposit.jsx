import { useContext, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  Spinner,
  Stack,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { ErrorState, LoadingState } from '../../../components/states';
import { newReference, usePaystack } from '../../../components/wallet';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];
const MAX_DEPOSIT = 10000000;

function WalletDepositPage() {
  const { api, commaInt } = useContext(GlobalStore);
  const pay = usePaystack();
  const wallet = useApiQuery((a, signal) => a.get('/wallet/', { signal }), [], { select: (b) => b?.data });
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const [opening, setOpening] = useState(false);
  // idle | verifying | success | failed
  const [result, setResult] = useState({ state: 'idle' });

  const minDeposit = Number(wallet.data?.limits?.min_deposit) || 500;
  const value = Number(amount) || 0;
  const error = !value ? 'Enter an amount' : value < minDeposit ? `The minimum deposit is ₦${commaInt(minDeposit)}` : value > MAX_DEPOSIT ? `The maximum deposit is ₦${commaInt(MAX_DEPOSIT)}` : '';

  async function verify(reference) {
    setResult({ state: 'verifying', reference });
    try {
      const body = await api.post('/wallet/deposit/', { reference });
      setResult({ state: 'success', reference, amount: body?.data?.transaction?.amount, balance: body?.data?.wallet?.balance, message: body?.message });
      wallet.reload();
    } catch (err) {
      setResult({ state: 'failed', reference, message: err?.message });
    }
  }

  async function deposit(e) {
    e.preventDefault();
    setTouched(true);
    if (error || !wallet.data) return;
    setOpening(true);
    const reference = newReference('mtdep');
    const response = await pay({ amount: value, reference, metadata: { purpose: 'wallet-deposit', wallet_id: wallet.data.uuid } });
    setOpening(false);
    if (response) verify(response.reference || reference);
  }

  if (wallet.loading && !wallet.data) return <LoadingState label="Loading your wallet…" />;
  if (wallet.error && !wallet.data) return <ErrorState error={wallet.error} onRetry={wallet.reload} />;

  if (result.state !== 'idle') {
    return (
      <Flex direction="column" align="center" textAlign="center" gap={4} py={12} px={4} borderWidth={1} borderRadius="20px" maxW="480px" mx="auto" bg="white">
        {result.state === 'verifying' && (<>
          <Spinner size="xl" color="primary" thickness="4px" />
          <Heading as="h1" size="md">Confirming your payment…</Heading>
          <Text color="gray.600">This usually takes a few seconds. Please don’t close this page.</Text>
        </>)}
        {result.state === 'success' && (<>
          <Icon as={CheckCircle2} boxSize={14} color="green.500" aria-hidden="true" />
          <Heading as="h1" size="md">₦{commaInt(result.amount)} added to your wallet</Heading>
          <Text color="gray.600">New balance: ₦{commaInt(result.balance)}</Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
            <Button as={RLink} to="/wallet/home" bg="primary" color="white" _hover={{ bg: 'secondary' }}>Back to wallet</Button>
            <Button variant="ghost" onClick={() => { setResult({ state: 'idle' }); setAmount(''); setTouched(false); }}>Deposit again</Button>
          </Stack>
        </>)}
        {result.state === 'failed' && (<>
          <Icon as={XCircle} boxSize={14} color="red.500" aria-hidden="true" />
          <Heading as="h1" size="md">We couldn’t confirm this deposit</Heading>
          <Text color="gray.700">{result.message || 'Something went wrong while confirming your payment.'}</Text>
          <Text fontSize="sm" color="gray.600">Reference: <Text as="span" fontFamily="mono" wordBreak="break-all">{result.reference}</Text></Text>
          <Text fontSize="sm" color="gray.600">If you were charged, your wallet is credited automatically once Paystack confirms. You can also check again.</Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
            <Button onClick={() => verify(result.reference)} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Check again</Button>
            <Button variant="ghost" onClick={() => setResult({ state: 'idle' })}>Start over</Button>
          </Stack>
        </>)}
      </Flex>
    );
  }

  return (
    <Box as="form" onSubmit={deposit} noValidate borderWidth={1} borderRadius="20px" p={{ base: 5, md: 8 }} maxW="480px" mx="auto" bg="white">
      <Heading as="h1" size="lg" mb={1}>Deposit</Heading>
      <Text color="gray.600" mb={6}>Current balance: ₦{commaInt(wallet.data?.balance)}</Text>

      <FormControl isRequired isInvalid={touched && Boolean(error)}>
        <FormLabel htmlFor="deposit-amount">Amount</FormLabel>
        <InputGroup size="lg">
          <InputLeftAddon>₦</InputLeftAddon>
          <Input id="deposit-amount" inputMode="numeric" autoComplete="off" placeholder="0"
            value={amount ? commaInt(amount) : ''}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 9))}
            onBlur={() => setTouched(true)} fontSize="2xl" fontWeight="600" />
        </InputGroup>
        <FormHelperText>Minimum ₦{commaInt(minDeposit)}</FormHelperText>
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>

      <Wrap spacing={2} mt={4} role="group" aria-label="Quick amounts">
        {QUICK_AMOUNTS.map((quick) => (
          <WrapItem key={quick}>
            <Button size="sm" borderRadius="full" variant={value === quick ? 'solid' : 'outline'} aria-pressed={value === quick}
              bg={value === quick ? 'primary' : undefined} color={value === quick ? 'white' : 'gray.700'}
              onClick={() => { setAmount(String(quick)); setTouched(true); }}>
              ₦{commaInt(quick)}
            </Button>
          </WrapItem>
        ))}
      </Wrap>

      <Button type="submit" mt={8} w="full" size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }}
        isLoading={opening} loadingText="Opening Paystack">
        {value ? `Deposit ₦${commaInt(value)}` : 'Deposit'}
      </Button>
      <HStack mt={4} spacing={2} color="gray.600" fontSize="sm" align="start">
        <Icon as={ShieldCheck} mt={0.5} aria-hidden="true" />
        <Text>Pay by card, bank transfer or USSD. Payments are processed securely by Paystack; Motaa never stores your card details.</Text>
      </HStack>
    </Box>
  );
}

export default WalletDepositPage;
