import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useContext, useRef, useState } from 'react';
import { Link as RLink, useNavigate, useSearchParams } from 'react-router-dom';
import { GlobalStore } from '../../App';
import { toApiError } from '../../api/client';
import { GoogleSignInCancelled, GOOGLE_SIGN_IN_AVAILABLE, signInWithGoogle } from '../../firebase';
import {
  AuthShell,
  GoogleIcon,
  PasswordInput,
  isAuthPayload,
  roleHome,
  safeNext,
  saveOnboarding,
  validateEmail,
} from './shared';

const UNEXPECTED = "We couldn't log you in right now. Please try again in a moment.";

export const LoginView = () => {
  const { api, onAuthenticated, notify, notifyError } = useContext(GlobalStore);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(null); // 'password' | 'google' | null
  const [forgotOpen, setForgotOpen] = useState(params.get('forgot') === '1');
  const busy = useRef(false);

  function finishLogin(body) {
    if (!isAuthPayload(body)) throw new Error(UNEXPECTED);
    if (['dealer', 'mechanic'].includes(body.user_type) && body.profile_complete === false) {
      // account exists but the business profile was never finished
      saveOnboarding(body);
      notify({ title: 'Almost there', body: 'Finish setting up your business profile to continue.', color: 'blue' });
      navigate('/signup/business', { replace: true });
      return;
    }
    onAuthenticated(body);
    notify({ title: `Welcome back${body.first_name ? `, ${body.first_name}` : ''}!`, body: "You're logged in." });
    navigate(next || roleHome(body), { replace: true });
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (busy.current) return;
    const nextErrors = {
      email: validateEmail(email),
      password: password ? '' : 'Enter your password.',
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    busy.current = true;
    setPending('password');
    try {
      const body = await api.post('/accounts/login/', { provider: 'motaa', email: email.trim(), password });
      finishLogin(body);
    } catch (err) {
      const error = toApiError(err);
      setPassword('');
      if (error.status === 401 || error.status === 403) {
        setErrors({ password: error.message });
      } else if (Object.keys(error.fieldErrors).length) {
        setErrors(error.fieldErrors);
      } else if (!error.isNetworkError && error.status < 500) {
        notifyError(error, "Couldn't log you in");
      }
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  async function handleGoogle() {
    if (busy.current) return;
    busy.current = true;
    setPending('google');
    try {
      const { idToken } = await signInWithGoogle();
      const body = await api.post('/accounts/login/', { provider: 'google', id_token: idToken });
      finishLogin(body);
    } catch (err) {
      if (err instanceof GoogleSignInCancelled) return;
      const error = toApiError(err);
      if (error.isNetworkError || error.status >= 500) return; // the API client already showed a toast
      if (error.status === 404) {
        notify({ title: 'No account yet', body: error.message, color: 'blue', duration: 6000 });
        navigate('/signup');
        return;
      }
      notifyError(error, "Couldn't log you in with Google");
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description={next ? 'Log in to continue.' : 'Log in to your Motaa account.'}
    >
      <form onSubmit={handleLogin} noValidate>
        <Stack spacing={4}>
          <FormControl isInvalid={Boolean(errors.email)} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: '' })); }}
              placeholder="you@example.com"
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.password)} isRequired>
            <Flex justify="space-between" align="baseline">
              <FormLabel>Password</FormLabel>
              <Button variant="link" size="sm" color="primary" fontWeight="medium" onClick={() => setForgotOpen(true)}>
                Forgot password?
              </Button>
            </Flex>
            <PasswordInput
              name="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: '' })); }}
              placeholder="Your password"
            />
            <FormErrorMessage>{errors.password}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            w="100%"
            colorScheme="blue"
            bg="primary"
            size="lg"
            isLoading={pending === 'password'}
            loadingText="Logging in"
            isDisabled={Boolean(pending)}
          >
            Log in
          </Button>
        </Stack>
      </form>

      {GOOGLE_SIGN_IN_AVAILABLE && (
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
            onClick={handleGoogle}
            isLoading={pending === 'google'}
            loadingText="Waiting for Google"
            isDisabled={Boolean(pending)}
          >
            Continue with Google
          </Button>
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            For personal accounts. Business accounts log in with email and password.
          </Text>
        </>
      )}

      <Text textAlign="center" mt={8} color="gray.600">
        Don't have an account?{' '}
        <Link as={RLink} to="/signup" color="primary" fontWeight="semibold">Sign up</Link>
      </Text>
      <Text textAlign="center" mt={2} color="gray.600" fontSize="sm">
        Selling cars or offering repairs?{' '}
        <Link as={RLink} to="/signup?type=business" color="primary" fontWeight="semibold">Create a business account</Link>
      </Text>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />
    </AuthShell>
  );
};

function ForgotPasswordModal({ isOpen, onClose, initialEmail }) {
  const { api } = useContext(GlobalStore);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  function reset() {
    setEmail(initialEmail || '');
    setError('');
    setSentMessage('');
  }

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;
    setLoading(true);
    try {
      const body = await api.post('/accounts/password-reset/', { email: email.trim() });
      setSentMessage(body?.message || "If that email has a Motaa account, we've sent it a link to reset your password.");
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.fieldErrors.email || apiError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} onOpenComplete={reset} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={submit} noValidate>
          <ModalHeader>Reset your password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {sentMessage ? (
              <Alert status="success" borderRadius="md" alignItems="flex-start">
                <AlertIcon />
                <Box>
                  <Text>{sentMessage}</Text>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    The link expires in 3 days. Check your spam folder if it doesn't arrive in a few minutes.
                  </Text>
                </Box>
              </Alert>
            ) : (
              <>
                <Text color="gray.600" mb={4}>
                  Enter the email you use for Motaa and we'll send you a link to choose a new password.
                </Text>
                <FormControl isInvalid={Boolean(error)} isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                  />
                  <FormErrorMessage>{error}</FormErrorMessage>
                </FormControl>
                <Text fontSize="sm" color="gray.500" mt={3}>
                  Signed up with Google? Use "Continue with Google" instead — there's no password to reset.
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter gap={3}>
            {sentMessage ? (
              <Button colorScheme="blue" bg="primary" onClick={onClose}>Back to log in</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" colorScheme="blue" bg="primary" isLoading={loading} loadingText="Sending">
                  Send reset link
                </Button>
              </>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default LoginView;
