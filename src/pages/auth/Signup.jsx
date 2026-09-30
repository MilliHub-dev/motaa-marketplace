// Sign up: 1) account (type, email + password or Google) → 2) your details → 3) verify email
// (skippable). Business accounts then continue to /signup/business to create their profile.
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { GlobalStore } from '../../App';
import { toApiError } from '../../api/client';
import { OTPField } from '../../components';
import { GoogleSignInCancelled, GOOGLE_SIGN_IN_AVAILABLE, signInWithGoogle } from '../../firebase';
import {
  AuthShell,
  GoogleIcon,
  PasswordInput,
  authHeader,
  isAuthPayload,
  normalizeNgPhone,
  saveOnboarding,
  validateEmail,
  validateName,
  validateNgPhone,
  validatePassword,
} from './shared';

const BUSINESS_TYPES = [
  { value: 'dealer', label: 'Car dealer' },
  { value: 'mechanic', label: 'Mechanic' },
];

export function SignupView() {
  const [params] = useSearchParams();
  // ?type=business → dealer/mechanic signup; anything else (customer, personal, none) → personal
  const accountType = params.get('type') === 'business' ? 'business' : 'customer';
  const preset = BUSINESS_TYPES.some((t) => t.value === params.get('as')) ? params.get('as') : '';
  // a new key resets the whole flow when switching between personal and business
  return <SignupFlow key={accountType} accountType={accountType} presetBusinessType={preset} />;
}

function SignupFlow({ accountType, presetBusinessType }) {
  const { api, notify, notifyError, onAuthenticated } = useContext(GlobalStore);
  const navigate = useNavigate();
  const isBusiness = accountType === 'business';

  const [step, setStep] = useState('account'); // account | details | verify
  const [businessType, setBusinessType] = useState(presetBusinessType);
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone_number: '', agree: false });
  const [google, setGoogle] = useState(null); // { idToken, email } after Google sign-in
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(null); // 'email' | 'google' | 'create' | null
  const [createdUser, setCreatedUser] = useState(null);

  const userType = isBusiness ? businessType : 'customer';

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  }

  function checkBusinessType() {
    if (isBusiness && !businessType) {
      setErrors((e) => ({ ...e, user_type: "Choose whether you're a car dealer or a mechanic." }));
      return false;
    }
    return true;
  }

  /** true when the email is free; otherwise shows why on the email field. */
  async function emailIsAvailable(email) {
    try {
      await api.get('/accounts/register/', { params: { email } });
      return true;
    } catch (err) {
      const error = toApiError(err);
      if (error.isNetworkError || error.status >= 500) return false; // toast already shown
      setErrors((e) => ({ ...e, email: error.fieldErrors.email || error.message }));
      return false;
    }
  }

  async function submitAccount(e) {
    e.preventDefault();
    if (pending) return;
    const nextErrors = {
      user_type: isBusiness && !businessType ? "Choose whether you're a car dealer or a mechanic." : '',
      email: validateEmail(form.email),
      password: validatePassword(form.password, { email: form.email }),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setPending('email');
    const ok = await emailIsAvailable(form.email.trim());
    setPending(null);
    if (ok) {
      setGoogle(null);
      setStep('details');
    }
  }

  async function continueWithGoogle() {
    if (pending || !checkBusinessType()) return;
    setPending('google');
    try {
      const result = await signInWithGoogle();
      if (await emailIsAvailable(result.email)) {
        setGoogle({ idToken: result.idToken, email: result.email });
        setForm((f) => ({
          ...f,
          email: result.email,
          password: '',
          first_name: f.first_name || result.firstName,
          last_name: f.last_name || result.lastName,
        }));
        setStep('details');
      }
    } catch (err) {
      if (!(err instanceof GoogleSignInCancelled)) notifyError(err, "Couldn't sign up with Google");
    } finally {
      setPending(null);
    }
  }

  async function createAccount(e) {
    e.preventDefault();
    if (pending) return;
    const nextErrors = {
      first_name: validateName(form.first_name, 'first name'),
      last_name: validateName(form.last_name, 'last name'),
      phone_number: isBusiness ? '' : validateNgPhone(form.phone_number),
      agree: form.agree ? '' : 'You need to accept the Terms of Service and Privacy Policy to continue.',
    };
    if (!google) {
      nextErrors.password = validatePassword(form.password, {
        email: form.email, firstName: form.first_name, lastName: form.last_name,
      });
    }
    setErrors(nextErrors);
    if (nextErrors.password) { setStep('account'); return; }
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload = {
      action: 'create-account',
      user_type: userType,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      ...(isBusiness ? {} : { phone_number: normalizeNgPhone(form.phone_number) }),
      ...(google
        ? { provider: 'google', id_token: google.idToken }
        : { provider: 'motaa', email: form.email.trim(), password: form.password }),
    };

    setPending('create');
    try {
      const body = await api.post('/accounts/register/', payload);
      const user = body?.data;
      if (!isAuthPayload(user)) throw new Error("We couldn't finish creating your account. Please try again.");
      setCreatedUser(user);
      if (user.verified_email) finish(user); // Google has already verified the address
      else setStep('verify');
    } catch (err) {
      const error = toApiError(err);
      const fields = error.fieldErrors;
      if (Object.keys(fields).length) {
        setErrors(fields);
        if (fields.id_token) {
          setGoogle(null);
          setStep('account');
          notifyError(error, 'Google sign-in expired');
        } else if (fields.email || fields.password || fields.user_type) {
          setStep('account');
        }
      } else if (!error.isNetworkError && !(error.status >= 500)) {
        notifyError(error, "Couldn't create your account");
      }
    } finally {
      setPending(null);
    }
  }

  function finish(user) {
    if (isBusiness) {
      saveOnboarding(user);
      notify({ title: 'Account created', body: 'Now tell customers about your business.' });
      navigate('/signup/business', { replace: true });
    } else {
      onAuthenticated(user);
      notify({ title: `Welcome to Motaa, ${user.first_name}!`, body: 'Your account is ready.' });
      navigate('/home', { replace: true });
    }
  }

  const totalSteps = isBusiness ? 4 : 3; // business accounts finish with their business profile
  const stepLabel = `Step ${{ account: 1, details: 2, verify: 3 }[step]} of ${totalSteps}`;

  if (step === 'verify' && createdUser) {
    return (
      <AuthShell title="Confirm your email" description={`${stepLabel} · Almost done`}>
        <VerifyEmailStep user={createdUser} onDone={finish} />
      </AuthShell>
    );
  }

  if (step === 'details') {
    return (
      <AuthShell
        title="Tell us about you"
        description={`${stepLabel} · ${google ? `Signing up with Google as ${google.email}` : form.email}`}
      >
        <form onSubmit={createAccount} noValidate>
          <Stack spacing={4}>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isInvalid={Boolean(errors.first_name)} isRequired>
                <FormLabel>First name</FormLabel>
                <Input autoComplete="given-name" value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} placeholder="Ada" />
                <FormErrorMessage>{errors.first_name}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.last_name)} isRequired>
                <FormLabel>Last name</FormLabel>
                <Input autoComplete="family-name" value={form.last_name} onChange={(e) => setField('last_name', e.target.value)} placeholder="Okafor" />
                <FormErrorMessage>{errors.last_name}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            {!isBusiness && (
              <FormControl isInvalid={Boolean(errors.phone_number)} isRequired>
                <FormLabel>Phone number</FormLabel>
                <InputGroup>
                  <InputLeftAddon>+234</InputLeftAddon>
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={form.phone_number}
                    onChange={(e) => setField('phone_number', e.target.value)}
                    placeholder="803 123 4567"
                  />
                </InputGroup>
                {errors.phone_number
                  ? <FormErrorMessage>{errors.phone_number}</FormErrorMessage>
                  : <FormHelperText>Dealers and mechanics use this to reach you about bookings and orders.</FormHelperText>}
              </FormControl>
            )}

            <FormControl isInvalid={Boolean(errors.agree)}>
              <Checkbox isChecked={form.agree} onChange={(e) => setField('agree', e.target.checked)} alignItems="flex-start">
                <Text fontSize="sm" lineHeight="short">
                  I agree to Motaa's{' '}
                  <Link as={RLink} to="/terms-of-service" target="_blank" rel="noopener" color="primary" textDecoration="underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link as={RLink} to="/privacy-policy" target="_blank" rel="noopener" color="primary" textDecoration="underline">Privacy Policy</Link>.
                </Text>
              </Checkbox>
              <FormErrorMessage>{errors.agree}</FormErrorMessage>
            </FormControl>

            {(errors.email || errors.non_field_errors) && (
              <Alert status="error" borderRadius="md"><AlertIcon />{errors.email || errors.non_field_errors}</Alert>
            )}

            <HStack spacing={3} pt={2}>
              <Button variant="outline" size="lg" onClick={() => setStep('account')} isDisabled={Boolean(pending)}>
                Back
              </Button>
              <Button
                type="submit"
                flex={1}
                size="lg"
                colorScheme="blue"
                bg="primary"
                isLoading={pending === 'create'}
                loadingText="Creating account"
              >
                Create account
              </Button>
            </HStack>
          </Stack>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={isBusiness ? 'Create a business account' : 'Create your account'}
      description={isBusiness
        ? 'List your cars or offer your repair services to drivers across Nigeria.'
        : 'Buy, rent and service cars across Nigeria.'}
    >
      <form onSubmit={submitAccount} noValidate>
        <Stack spacing={4}>
          {isBusiness && (
            <FormControl isInvalid={Boolean(errors.user_type)} isRequired>
              <FormLabel id="business-type-label">What kind of business are you?</FormLabel>
              <ButtonGroup role="group" aria-labelledby="business-type-label" w="100%" isAttached>
                {BUSINESS_TYPES.map((type) => {
                  const selected = businessType === type.value;
                  return (
                    <Button
                      key={type.value}
                      flex={1}
                      aria-pressed={selected}
                      variant={selected ? 'solid' : 'outline'}
                      colorScheme="blue"
                      bg={selected ? 'primary' : undefined}
                      onClick={() => { setBusinessType(type.value); setErrors((e) => ({ ...e, user_type: '' })); }}
                    >
                      {type.label}
                    </Button>
                  );
                })}
              </ButtonGroup>
              <FormErrorMessage>{errors.user_type}</FormErrorMessage>
            </FormControl>
          )}

          <FormControl isInvalid={Boolean(errors.email)} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => { setField('email', e.target.value); setGoogle(null); }}
              placeholder="you@example.com"
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.password)} isRequired>
            <FormLabel>Password</FormLabel>
            <PasswordInput
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="Create a password"
            />
            {errors.password
              ? <FormErrorMessage>{errors.password}</FormErrorMessage>
              : <FormHelperText>At least 8 characters, not only numbers.</FormHelperText>}
          </FormControl>

          <Button
            type="submit"
            size="lg"
            colorScheme="blue"
            bg="primary"
            isLoading={pending === 'email'}
            loadingText="Checking"
            isDisabled={Boolean(pending)}
          >
            Continue
          </Button>
        </Stack>
      </form>

      {/* Google sign-in is for personal accounts only; businesses use email + password */}
      {GOOGLE_SIGN_IN_AVAILABLE && !isBusiness && (
        <>
          <HStack my={6}>
            <Divider />
            <Text fontSize="sm" color="gray.500" px={2}>OR</Text>
            <Divider />
          </HStack>
          <Button
            w="100%"
            size="lg"
            variant="outline"
            leftIcon={<GoogleIcon />}
            onClick={continueWithGoogle}
            isLoading={pending === 'google'}
            loadingText="Waiting for Google"
            isDisabled={Boolean(pending)}
          >
            Sign up with Google
          </Button>
        </>
      )}

      <Text textAlign="center" mt={8} color="gray.600">
        Already have an account?{' '}
        <Link as={RLink} to="/login" color="primary" fontWeight="semibold">Log in</Link>
      </Text>
      <Button
        as={RLink}
        to={isBusiness ? '/signup' : '/signup?type=business'}
        variant="outline"
        colorScheme="blue"
        w="100%"
        mt={4}
      >
        {isBusiness ? 'Create a personal account instead' : 'Create a business account instead'}
      </Button>
    </AuthShell>
  );
}

function VerifyEmailStep({ user, onDone }) {
  const { api, notify } = useContext(GlobalStore);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sendState, setSendState] = useState('sending'); // sending | sent | failed
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const requested = useRef(false);

  async function requestCode() {
    setSendState('sending');
    setError('');
    try {
      const body = await api.post('/accounts/verify-email/', { action: 'request-code' }, authHeader(user.token));
      if (body?.data?.verified) return onDone({ ...user, verified_email: true });
      setSendState('sent');
      setCooldown(body?.data?.resend_in || 60);
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.status === 429) {
        setSendState('sent');
        setCooldown(apiError.data?.resend_in || 60);
      } else {
        setSendState('failed');
        setError(apiError.message);
      }
    }
  }

  useEffect(() => {
    if (requested.current) return; // StrictMode runs effects twice in dev
    requested.current = true;
    requestCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(e) {
    e?.preventDefault();
    if (verifying) return;
    if (code.length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/accounts/verify-email/', { action: 'confirm-code', code }, authHeader(user.token));
      notify({ title: 'Email confirmed', body: 'Thanks for confirming your email.' });
      onDone({ ...user, verified_email: true });
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.fieldErrors.code || apiError.message);
      setCode('');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <form onSubmit={verify} noValidate>
      <Stack spacing={4} align="center" textAlign="center">
        <Box color="primary" aria-hidden="true"><MailCheck size={40} /></Box>
        <Text>
          {sendState === 'sending' && <>Sending a 6-digit code to <b>{user.email}</b>…</>}
          {sendState === 'sent' && <>We sent a 6-digit code to <b>{user.email}</b>. It expires in 10 minutes.</>}
          {sendState === 'failed' && <>We couldn't send a code to <b>{user.email}</b> just now.</>}
        </Text>

        <FormControl isInvalid={Boolean(error)}>
          <FormLabel textAlign="center" mx="auto" mb={0}>Verification code</FormLabel>
          <OTPField value={code} onChange={(value) => { setCode(value); setError(''); }} />
          <FormErrorMessage justifyContent="center">{error}</FormErrorMessage>
        </FormControl>

        <Button
          type="submit"
          w="100%"
          size="lg"
          colorScheme="blue"
          bg="primary"
          isLoading={verifying}
          loadingText="Checking"
          isDisabled={code.length !== 6}
        >
          Verify email
        </Button>

        <Text fontSize="sm" color="gray.600">
          Didn't get it? Check your spam folder or{' '}
          <Button
            variant="link"
            size="sm"
            color="primary"
            onClick={requestCode}
            isDisabled={cooldown > 0 || sendState === 'sending'}
          >
            {cooldown > 0 ? `resend in ${cooldown}s` : 'send a new code'}
          </Button>
        </Text>

        <Button variant="ghost" onClick={() => onDone(user)} isDisabled={verifying}>
          Skip for now
        </Button>
        <Text fontSize="xs" color="gray.500">
          You can use Motaa right away. We'll use your email for receipts and account alerts.
        </Text>
      </Stack>
    </form>
  );
}

export default SignupView;
