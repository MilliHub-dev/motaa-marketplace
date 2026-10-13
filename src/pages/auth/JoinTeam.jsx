// /team/join/:token — a team member accepts a business's invitation: they choose a password and are signed in.
// GET /team/invite/<token>/ says who invited them; POST sets the password and answers with the login payload.
import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, AlertIcon, Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Link, SimpleGrid, Stack, Text,
} from '@chakra-ui/react';
import { GlobalStore } from '../../App';
import { LoadingState } from '../../components/states';
import { useApiQuery } from '../../hooks/useApi';
import { toApiError } from '../../api/client';
import { AuthShell, PasswordInput, isAuthPayload, roleHome, validatePassword } from './shared';

const UNEXPECTED = "We couldn't finish setting up your login. Please try again in a moment.";

function SignedInNotice() {
  const { authUser, logout } = useContext(GlobalStore);
  return (
    <AuthShell title="You're already signed in" description="This invitation is for a new team login.">
      <Alert status="info" borderRadius="md" alignItems="flex-start">
        <AlertIcon />
        <Text>
          You're signed in{authUser?.email ? <> as <strong>{authUser.email}</strong></> : ''}. Log out first, then open the invitation link again to accept it.
        </Text>
      </Alert>
      <Stack mt={6} spacing={3}>
        {/* logging out keeps this address, so the invitation opens straight away */}
        <Button size="lg" colorScheme="blue" bg="primary" onClick={logout}>Log out and continue</Button>
        <Button as={RLink} to={roleHome(authUser)} variant="ghost">Stay signed in</Button>
      </Stack>
    </AuthShell>
  );
}

function InviteForm({ token, invite }) {
  const { api, onAuthenticated, notify, notifyError } = useContext(GlobalStore);
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: invite.first_name || '', last_name: invite.last_name || '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [problem, setProblem] = useState(null); // the invitation stopped working while the form was open
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function submit(e) {
    e.preventDefault();
    if (busy.current) return;
    const next = {
      first_name: form.first_name.trim() ? '' : 'Enter your first name.',
      password: validatePassword(form.password, { email: invite.email, firstName: form.first_name, lastName: form.last_name }),
      confirm: !form.confirm ? 'Enter your password again.' : form.confirm !== form.password ? "The passwords don't match." : '',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    busy.current = true;
    setLoading(true);
    try {
      const body = await api.post(`/team/invite/${encodeURIComponent(token)}/`, {
        password: form.password, first_name: form.first_name.trim(), last_name: form.last_name.trim(),
      });
      const user = body?.data;
      if (!isAuthPayload(user)) throw new Error(UNEXPECTED);
      onAuthenticated(user);
      notify({ title: body?.message || `Welcome${user.first_name ? `, ${user.first_name}` : ''}!`, body: "You're logged in." });
      navigate(roleHome(user), { replace: true });
    } catch (err) {
      const error = toApiError(err);
      const fields = error.fieldErrors;
      if (Object.keys(fields).length) setErrors(fields);
      else if ([404, 409, 410].includes(error.status)) setProblem(error);
      else if (!error.isNetworkError && error.status < 500) notifyError(error, "Couldn't accept the invitation");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (problem) return <InviteProblem error={problem} />;

  return (
    <AuthShell
      title={`Join ${invite.business_name} on Motaa as ${invite.role_label}`}
      description="Choose a password to finish setting up your login."
    >
      {invite.can && (
        <Box borderWidth="1px" borderColor="blue.100" bg="blue.50" borderRadius="lg" p={4} mb={6}>
          <Text fontWeight="600" fontSize="sm">What {invite.role_label} can do</Text>
          <Text fontSize="sm" color="gray.700" mt={1}>{invite.can}</Text>
        </Box>
      )}

      <form onSubmit={submit} noValidate>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input type="email" name="email" autoComplete="username" value={invite.email || ''} isReadOnly bg="gray.50" />
            <FormHelperText>You will log in with this email address.</FormHelperText>
          </FormControl>

          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            <FormControl isRequired isInvalid={Boolean(errors.first_name)}>
              <FormLabel>First name</FormLabel>
              <Input name="first_name" autoComplete="given-name" maxLength={150} value={form.first_name} onChange={(e) => change('first_name', e.target.value)} />
              <FormErrorMessage>{errors.first_name}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={Boolean(errors.last_name)}>
              <FormLabel>Last name</FormLabel>
              <Input name="last_name" autoComplete="family-name" maxLength={150} value={form.last_name} onChange={(e) => change('last_name', e.target.value)} />
              <FormErrorMessage>{errors.last_name}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired isInvalid={Boolean(errors.password)}>
            <FormLabel>Password</FormLabel>
            <PasswordInput name="password" autoComplete="new-password" value={form.password} onChange={(e) => change('password', e.target.value)} placeholder="Create a password" />
            {errors.password
              ? <FormErrorMessage>{errors.password}</FormErrorMessage>
              : <FormHelperText>At least 8 characters, not only numbers.</FormHelperText>}
          </FormControl>

          <FormControl isRequired isInvalid={Boolean(errors.confirm)}>
            <FormLabel>Confirm password</FormLabel>
            <PasswordInput name="confirm" autoComplete="new-password" value={form.confirm} onChange={(e) => change('confirm', e.target.value)} placeholder="Enter it again" />
            <FormErrorMessage>{errors.confirm}</FormErrorMessage>
          </FormControl>

          <Button type="submit" size="lg" colorScheme="blue" bg="primary" isLoading={loading} loadingText="Joining">
            Join {invite.business_name}
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}

/** The link is used, invalid or expired: say what the API said and point to the login page. */
function InviteProblem({ error, onRetry }) {
  const gone = [404, 409, 410].includes(error?.status);
  return (
    <AuthShell title={error?.status === 410 ? 'This invitation has expired' : gone ? "This invitation can't be used" : "We couldn't open this invitation"}>
      <Alert status={gone ? 'warning' : 'error'} borderRadius="md" alignItems="flex-start" role="alert">
        <AlertIcon />
        <Text>{error?.message || 'Something went wrong. Please try again.'}</Text>
      </Alert>
      <Stack mt={6} spacing={3}>
        {!gone && onRetry && <Button size="lg" colorScheme="blue" bg="primary" onClick={onRetry}>Try again</Button>}
        <Text textAlign="center" color="gray.600">
          Already set your password?{' '}
          <Link as={RLink} to="/login" color="primary" fontWeight="semibold">Log in</Link>
        </Text>
      </Stack>
    </AuthShell>
  );
}

function PendingInvite({ token }) {
  const invite = useApiQuery(
    (api, signal) => api.get(`/team/invite/${encodeURIComponent(token)}/`, { signal }),
    [token],
    { select: (body) => body?.data }
  );
  if (invite.loading && invite.data === undefined) return <LoadingState label="Opening your invitation…" minH="60vh" />;
  if (invite.error || !invite.data) return <InviteProblem error={invite.error} onRetry={invite.reload} />;
  return <InviteForm token={token} invite={invite.data} />;
}

export default function JoinTeam() {
  const { token } = useParams();
  const { isAuthenticated } = useContext(GlobalStore);
  useEffect(() => { document.title = 'Join a team | Motaa'; }, []);
  // the invitation creates a new login, so nobody else can be signed in while accepting it
  if (isAuthenticated) return <SignedInNotice />;
  return <PendingInvite token={token} />;
}
