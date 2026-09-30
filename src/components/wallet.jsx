// Shared payment building blocks: Paystack popup as a promise, wallet confirmation,
// a recovery notice for "charged but not recorded", and the transaction list.
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Badge,
	Box,
	Button,
	Divider,
	Flex,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	HStack,
	Icon,
	Input,
	Select,
	Spinner,
	Text,
	VStack,
} from '@chakra-ui/react';
import { ArrowDownLeft, ArrowUpRight, Lock } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { GlobalStore } from '../App';
import { PAYSTACK_PUBLIC_KEY } from '../config';

/** A unique Paystack reference, e.g. "mtord-lq2x3k-9f3a1c". */
export function newReference(prefix = 'mt') {
	const random = Math.random().toString(36).slice(2, 8);
	return `${prefix}-${Date.now().toString(36)}-${random}`;
}

/**
 * Opens the Paystack popup. `pay({ amount, reference, metadata })` resolves with
 * Paystack's response ({ reference, status, ... }) or null if the user closed it.
 * Amount is in naira; it must be the server-computed amount due.
 */
export function usePaystack() {
	const { authUser, notify } = useContext(GlobalStore);
	const initialize = usePaystackPayment({ publicKey: PAYSTACK_PUBLIC_KEY, email: authUser?.email, amount: 0, currency: 'NGN' });

	return useCallback(({ amount, reference, metadata }) => new Promise((resolve) => {
		const kobo = Math.round(Number(amount) * 100);
		if (!PAYSTACK_PUBLIC_KEY) {
			notify({ title: 'Payments unavailable', body: 'Online payments are not set up yet. Please try again later.', color: 'red' });
			return resolve(null);
		}
		if (!authUser?.email || !Number.isFinite(kobo) || kobo <= 0) {
			notify({ title: "Can't start payment", body: 'The amount due is missing. Refresh the page and try again.', color: 'red' });
			return resolve(null);
		}
		try {
			initialize({
				config: { email: authUser.email, amount: kobo, reference, metadata, currency: 'NGN' },
				onSuccess: (response) => resolve({ ...response, reference: response?.reference || reference }),
				onClose: () => resolve(null),
			});
		} catch {
			notify({ title: "Couldn't open Paystack", body: 'Check your connection and try again.', color: 'red' });
			resolve(null);
		}
	}), [initialize, authUser?.email, notify]);
}

/**
 * Confirmation before paying from the wallet.
 * Shows the amount, the available balance and what happens to the money.
 */
export const WalletPayDialog = ({ isOpen, onClose, onConfirm, isLoading, amount, balance, title = 'Pay from wallet', description }) => {
	const { commaInt } = useContext(GlobalStore);
	const cancelRef = useRef();
	const enough = Number(balance) >= Number(amount);

	return (
		<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
			<AlertDialogOverlay>
				<AlertDialogContent mx={4}>
					<AlertDialogHeader fontSize="lg">{title}</AlertDialogHeader>
					<AlertDialogBody>
						<VStack align="stretch" spacing={3}>
							<Flex justify="space-between"><Text color="gray.600">Amount</Text><Text className="bold">₦{commaInt(amount)}</Text></Flex>
							<Flex justify="space-between"><Text color="gray.600">Wallet balance</Text><Text>₦{commaInt(balance)}</Text></Flex>
							<Divider />
							{enough ? (
								<HStack align="start" spacing={2} color="gray.700">
									<Icon as={Lock} mt={1} boxSize={4} aria-hidden="true" />
									<Text fontSize="sm">{description || 'The money is held in escrow and only released once you confirm.'}</Text>
								</HStack>
							) : (
								<Text fontSize="sm" color="red.600">Your wallet balance is too low. Top up your wallet or choose another payment method.</Text>
							)}
						</VStack>
					</AlertDialogBody>
					<AlertDialogFooter gap={3}>
						<Button ref={cancelRef} onClick={onClose} variant="ghost" isDisabled={isLoading}>Cancel</Button>
						<Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={onConfirm} isLoading={isLoading} isDisabled={!enough} loadingText="Paying">
							Pay ₦{commaInt(amount)}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
};

/**
 * Persistent notice for "your card was charged but we couldn't record it".
 * Retrying is safe: the server is idempotent by payment reference.
 */
export const PaymentRecoveryNotice = ({ reference, message, onRetry, retrying }) => {
	const [copied, setCopied] = useState(false);
	if (!reference) return null;
	async function copy() {
		try {
			await navigator.clipboard.writeText(reference);
			setCopied(true);
		} catch { /* clipboard blocked — the reference is visible anyway */ }
	}
	return (
		<Alert status="warning" variant="left-accent" borderRadius="md" alignItems="start" role="alert">
			<AlertIcon />
			<Box flex={1} minW={0}>
				<AlertTitle>Your payment went through, but we couldn't finish</AlertTitle>
				<AlertDescription display="block" fontSize="sm">
					{message || "We couldn't reach Motaa to record your payment."} You won't be charged again. Keep this reference:
					<Text as="span" display="block" fontFamily="mono" my={1} wordBreak="break-all">{reference}</Text>
				</AlertDescription>
				<HStack mt={2} spacing={3} flexWrap="wrap">
					<Button size="sm" colorScheme="orange" onClick={onRetry} isLoading={retrying} loadingText="Retrying">Try again</Button>
					<Button size="sm" variant="ghost" onClick={copy}>{copied ? 'Copied' : 'Copy reference'}</Button>
				</HStack>
			</Box>
		</Alert>
	);
};

// ---- Transactions ------------------------------------------------------------

export const TRANSACTION_STATUS_COLORS = {
	completed: 'green',
	pending: 'yellow',
	locked: 'purple',
	failed: 'red',
	reversed: 'gray',
};

export const TransactionRow = ({ transaction }) => {
	const { commaInt, naturalDate, naturalTime } = useContext(GlobalStore);
	const credit = transaction?.direction === 'credit';
	const date = transaction?.date_created ? new Date(transaction.date_created) : null;
	const validDate = date && !Number.isNaN(date.getTime());
	const fee = Number(transaction?.fee) || 0;

	return (
		<Flex gap={3} py={3} align="center">
			<Flex flexShrink={0} w={10} h={10} rounded="full" align="center" justify="center"
				bg={credit ? 'green.50' : 'red.50'} color={credit ? 'green.600' : 'red.600'} aria-hidden="true">
				<Icon as={credit ? ArrowDownLeft : ArrowUpRight} boxSize={5} />
			</Flex>
			<Box flex={1} minW={0}>
				<Text className="bold" noOfLines={1}>{transaction?.narration || transaction?.type_label || 'Transaction'}</Text>
				<Text fontSize="sm" color="gray.600">
					{transaction?.type_label}{validDate ? ` · ${naturalDate(date)}, ${naturalTime(date)}` : ''}
				</Text>
			</Box>
			<VStack spacing={1} align="end" flexShrink={0}>
				<Text className="bold" color={credit ? 'green.600' : 'gray.800'} whiteSpace="nowrap">
					{credit ? '+' : '−'}₦{commaInt(Number(transaction?.amount || 0) + (credit ? 0 : fee))}
				</Text>
				<Badge colorScheme={TRANSACTION_STATUS_COLORS[transaction?.status] || 'gray'} textTransform="none" fontSize="xs">
					{transaction?.status_label || transaction?.status || 'Unknown'}
				</Badge>
			</VStack>
		</Flex>
	);
};

export const TransactionList = ({ transactions }) => (
	<VStack align="stretch" spacing={0} divider={<Divider />}>
		{transactions.map((transaction) => (
			<TransactionRow key={transaction?.uuid || transaction?.id} transaction={transaction} />
		))}
	</VStack>
);

/** Paystack NGN transfer fee tiers from GET /wallet/ limits → fee for an amount. */
export function withdrawalFee(amount, tiers = []) {
	const value = Number(amount) || 0;
	for (const tier of tiers) {
		if (tier?.up_to === null || tier?.up_to === undefined || value <= Number(tier.up_to)) return Number(tier?.fee) || 0;
	}
	return 0;
}

// ---- Bank accounts (Paystack NUBAN resolution) ----------------------------------

/**
 * Bank + account number fields that resolve the account name with the bank
 * (POST /wallet/banks/resolve/) as soon as both are filled in.
 * value: { bank_code, bank_name, account_number, account_name }
 */
export const BankAccountFields = ({ banks = [], banksLoading, banksError, value, onChange, submitted }) => {
	const { api } = useContext(GlobalStore);
	const [resolving, setResolving] = useState(false);
	const [resolveError, setResolveError] = useState('');
	const { bank_code: bankCode, account_number: accountNumber } = value;

	useEffect(() => {
		if (!bankCode || !/^\d{10}$/.test(accountNumber || '')) {
			setResolveError('');
			return undefined;
		}
		const controller = new AbortController();
		setResolving(true);
		setResolveError('');
		api.post('/wallet/banks/resolve/', { bank_code: bankCode, account_number: accountNumber }, { signal: controller.signal })
			.then((body) => onChange({ account_name: body?.data?.account_name || '' }))
			.catch((error) => {
				if (error?.kind === 'cancelled') return;
				onChange({ account_name: '' });
				setResolveError(error?.message || "We couldn't verify this account.");
			})
			.finally(() => { if (!controller.signal.aborted) setResolving(false); });
		return () => controller.abort();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [api, bankCode, accountNumber]);

	const numberError = !/^\d{10}$/.test(accountNumber || '') ? 'Enter your 10-digit account number' : '';
	return (
		<VStack align="stretch" spacing={4}>
			<FormControl isRequired isInvalid={(submitted && !bankCode) || Boolean(banksError)}>
				<FormLabel htmlFor="bank-code">Bank</FormLabel>
				<Select id="bank-code" placeholder={banksLoading ? 'Loading banks…' : 'Choose your bank'} value={bankCode || ''} isDisabled={banksLoading}
					onChange={(e) => {
						const bank = banks.find((b) => b.code === e.target.value);
						onChange({ bank_code: e.target.value, bank_name: bank?.name || '', account_name: '' });
					}}>
					{banks.map((bank) => <option key={`${bank.code}-${bank.slug || bank.name}`} value={bank.code}>{bank.name}</option>)}
				</Select>
				<FormErrorMessage>{banksError ? banksError.message : 'Choose your bank'}</FormErrorMessage>
			</FormControl>
			<FormControl isRequired isInvalid={(submitted && Boolean(numberError)) || Boolean(resolveError)}>
				<FormLabel htmlFor="account-number">Account number</FormLabel>
				<Input id="account-number" inputMode="numeric" autoComplete="off" maxLength={10} placeholder="0123456789"
					value={accountNumber || ''} onChange={(e) => onChange({ account_number: e.target.value.replace(/\D/g, '').slice(0, 10), account_name: '' })} />
				{resolving && <FormHelperText><HStack spacing={2}><Spinner size="xs" /><Text>Checking account…</Text></HStack></FormHelperText>}
				{!resolving && value.account_name && (
					<FormHelperText color="green.700" className="bold" role="status">{value.account_name}</FormHelperText>
				)}
				<FormErrorMessage>{resolveError || numberError}</FormErrorMessage>
			</FormControl>
		</VStack>
	);
};
