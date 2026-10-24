// /wallet/send — send money from your Motaa wallet to another Motaa user's wallet, by email.
// Details → review → wallet PIN → done.
import { useContext, useRef, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, Box, Button, Divider, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading,
  Icon, Input, InputGroup, InputLeftAddon, Stack, Text, VStack,
} from '@chakra-ui/react';
import { CheckCircle2, Send } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { ErrorState, LoadingState } from '../../../components/states';
import { useWalletPin } from '../../../components/walletPin';
import { MIN_TRANSFER, cleanAmount, cleanEmail, transferErrors, transferServerErrors } from '../../../utils/walletTransfer';

function Row({ label, value, bold }) {
  return (
    <Flex justify="space-between" gap={4} fontWeight={bold ? 700 : 500}>
      <Text color={bold ? undefined : 'gray.600'}>{label}</Text>
      <Text textAlign="right" wordBreak="break-all">{value}</Text>
    </Flex>
  );
}

function WalletSendPage() {
  const { commaInt, authUser } = useContext(GlobalStore);
  const wallet = useApiQuery((api, signal) => api.get('/wallet/', { signal }), [], { select: (b) => b?.data });
  const { withPin } = useWalletPin();
  const [step, setStep] = useState(0); // 0 details, 1 review
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({ recipient: '', amount: '', other: '' });
  const [result, setResult] = useState(null); // { message, transaction }
  const emailRef = useRef(null);

  const available = Number(wallet.data?.balance);
  const value = Number(amount) || 0;
  const email = cleanEmail(recipient);
  const errors = transferErrors({ recipient, amount: value, available: wallet.data ? available : undefined, myEmail: authUser?.email }, commaInt);
  const recipientError = (submitted && errors.recipient) || serverErrors.recipient;
  const amountError = (submitted && errors.amount) || serverErrors.amount;

  const send = useApiMutation((api) => withPin((pin) => api.post('/wallet/transfer/', { recipient: email, amount: value.toFixed(2), pin }), {
    title: 'Send money',
    rows: [
      { label: 'To', value: email },
      { label: 'Amount', value: `₦${commaInt(value)}`, bold: true },
    ],
    submitLabel: `Send ₦${commaInt(value)}`,
  }), {
    notifyOnError: false, // shown on the form instead
    onSuccess: (body) => {
      setResult({ message: body?.message || `Sent ₦${commaInt(value)} to ${email}.`, transaction: body?.data });
      wallet.reload();
    },
    onError: (error) => {
      const next = transferServerErrors(error);
      setServerErrors(next);
      if (next.recipient || next.amount) setStep(0); // fix it on the form
    },
  });

  function review(e) {
    e.preventDefault();
    setSubmitted(true);
    if (errors.recipient || errors.amount) return;
    setServerErrors({ recipient: '', amount: '', other: '' });
    setRecipient(email);
    setStep(1);
  }

  function sendAgain() {
    setResult(null);
    setStep(0);
    setRecipient('');
    setAmount('');
    setSubmitted(false);
    setServerErrors({ recipient: '', amount: '', other: '' });
    setTimeout(() => emailRef.current?.focus(), 0);
  }

  if (wallet.loading && !wallet.data) return <LoadingState label="Loading your wallet…" />;
  if (wallet.error && !wallet.data) return <ErrorState error={wallet.error} onRetry={wallet.reload} />;

  if (result) {
    return (
      <Flex direction="column" align="center" textAlign="center" gap={4} py={12} px={4} borderWidth={1} borderRadius="20px" maxW="480px" mx="auto" bg="white" role="status">
        <Icon as={CheckCircle2} boxSize={14} color="green.500" aria-hidden="true" />
        <Heading as="h1" size="md">Money sent</Heading>
        <Text color="gray.700">{result.message}</Text>
        {result.transaction?.reference && (
          <Text fontSize="sm" color="gray.600">Reference: <Text as="span" fontFamily="mono" wordBreak="break-all">{result.transaction.reference}</Text></Text>
        )}
        <Text fontSize="sm" color="gray.600">Available now: ₦{commaInt(wallet.data?.balance)}</Text>
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} w={{ base: 'full', sm: 'auto' }}>
          <Button onClick={sendAgain} variant="outline" color="primary" borderColor="primary">Send again</Button>
          <Button as={RLink} to="/wallet/transactions" bg="primary" color="white" _hover={{ bg: 'secondary' }}>View transactions</Button>
        </Stack>
      </Flex>
    );
  }

  return (
    <Box as="form" onSubmit={step === 0 ? review : (e) => { e.preventDefault(); send.mutate(); }} noValidate
      borderWidth={1} borderRadius="20px" p={{ base: 5, md: 8 }} maxW="520px" mx="auto" bg="white">
      <Heading as="h1" size="lg" mb={1}>Send money</Heading>
      <Text color="gray.600" mb={6}>Available: ₦{commaInt(wallet.data?.balance)} · Step {step + 1} of 2</Text>

      {step === 0 ? (
        <VStack align="stretch" spacing={5}>
          <FormControl isRequired isInvalid={Boolean(recipientError)}>
            <FormLabel htmlFor="send-recipient">Recipient's email</FormLabel>
            <Input ref={emailRef} id="send-recipient" type="email" inputMode="email" autoComplete="off" autoCapitalize="off" spellCheck={false}
              placeholder="name@example.com" value={recipient}
              onChange={(e) => { setRecipient(e.target.value); setServerErrors((s) => ({ ...s, recipient: '', other: '' })); }} />
            {recipientError ? <FormErrorMessage>{recipientError}</FormErrorMessage>
              : <FormHelperText>The email they use for their Motaa account.</FormHelperText>}
          </FormControl>

          <FormControl isRequired isInvalid={Boolean(amountError)}>
            <FormLabel htmlFor="send-amount">How much?</FormLabel>
            <InputGroup size="lg">
              <InputLeftAddon>₦</InputLeftAddon>
              <Input id="send-amount" inputMode="numeric" autoComplete="off" placeholder="0" fontSize="2xl" fontWeight="600"
                value={amount ? commaInt(amount) : ''}
                onChange={(e) => { setAmount(cleanAmount(e.target.value)); setServerErrors((s) => ({ ...s, amount: '', other: '' })); }} />
            </InputGroup>
            {amountError ? <FormErrorMessage>{amountError}</FormErrorMessage>
              : <FormHelperText>Minimum ₦{commaInt(MIN_TRANSFER)}. It arrives in their wallet straight away.</FormHelperText>}
          </FormControl>
        </VStack>
      ) : (
        <Box borderWidth={1} borderRadius="lg" p={4} bg="gray.50">
          <Text fontSize="lg" fontWeight="600" mb={3} wordBreak="break-word">Send ₦{commaInt(value)} to {email}?</Text>
          <VStack align="stretch" spacing={2}>
            <Row label="To" value={email} />
            <Row label="Amount" value={`₦${commaInt(value)}`} />
            <Divider />
            <Row label="Left in your wallet" value={`₦${commaInt(Math.max(0, available - value))}`} bold />
          </VStack>
          <Text fontSize="sm" color="gray.600" mt={3}>Transfers can't be reversed. Check the email before you send.</Text>
        </Box>
      )}

      {serverErrors.other && (
        <Alert status="error" borderRadius="md" mt={5}><AlertIcon /><AlertDescription>{serverErrors.other}</AlertDescription></Alert>
      )}

      <Stack direction={{ base: 'column-reverse', sm: 'row' }} spacing={3} mt={8}>
        {step === 1 && (
          <Button variant="ghost" size="lg" onClick={() => setStep(0)} isDisabled={send.loading}>Back</Button>
        )}
        <Button type="submit" flex={1} size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={step === 1 ? <Send size={18} /> : undefined}
          isLoading={send.loading} loadingText="Sending">
          {step === 0 ? 'Review' : `Send ₦${commaInt(value)}`}
        </Button>
      </Stack>
    </Box>
  );
}

export default WalletSendPage;
