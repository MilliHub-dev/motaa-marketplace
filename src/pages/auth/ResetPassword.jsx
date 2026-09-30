// Target of the link in the password-reset email: /reset-password/:uid/:token
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Stack,
} from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { Link as RLink, useParams } from 'react-router-dom';
import { GlobalStore } from '../../App';
import { toApiError } from '../../api/client';
import { AuthShell, PasswordInput, validatePassword } from './shared';

export default function ResetPassword() {
  const { api } = useContext(GlobalStore);
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [linkError, setLinkError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    const next = {
      new_password1: validatePassword(password),
      new_password2: confirm === password ? '' : "The two passwords don't match.",
    };
    setErrors(next);
    if (next.new_password1 || next.new_password2) return;

    setLoading(true);
    try {
      await api.post('/accounts/password-reset/confirm/', {
        uid, token, new_password1: password, new_password2: confirm,
      });
      setDone(true);
    } catch (err) {
      const error = toApiError(err);
      const fields = error.fieldErrors;
      if (fields.token || fields.uid) setLinkError(fields.token || fields.uid);
      else if (fields.new_password1 || fields.new_password2) setErrors(fields);
      else if (!error.isNetworkError && error.status < 500) setLinkError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Password updated" description="You can now log in with your new password.">
        <Button as={RLink} to="/login" replace w="100%" size="lg" colorScheme="blue" bg="primary">Log in</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" description="Pick a password you don't use on other sites.">
      {linkError && (
        <Alert status="error" borderRadius="md" mb={5} alignItems="flex-start">
          <AlertIcon />
          <Box>
            <AlertDescription display="block">{linkError}</AlertDescription>
            <Button as={RLink} to="/login?forgot=1" size="sm" variant="link" color="red.700" mt={2}>
              Request a new link
            </Button>
          </Box>
        </Alert>
      )}
      <form onSubmit={submit} noValidate>
        <Stack spacing={4}>
          <FormControl isInvalid={Boolean(errors.new_password1)} isRequired>
            <FormLabel>New password</FormLabel>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, new_password1: '' })); }}
            />
            {errors.new_password1
              ? <FormErrorMessage>{errors.new_password1}</FormErrorMessage>
              : <FormHelperText>At least 8 characters, not only numbers.</FormHelperText>}
          </FormControl>
          <FormControl isInvalid={Boolean(errors.new_password2)} isRequired>
            <FormLabel>Confirm new password</FormLabel>
            <PasswordInput
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErrors((x) => ({ ...x, new_password2: '' })); }}
            />
            <FormErrorMessage>{errors.new_password2}</FormErrorMessage>
          </FormControl>
          <Button type="submit" size="lg" colorScheme="blue" bg="primary" isLoading={loading} loadingText="Saving">
            Save new password
          </Button>
          <Button as={RLink} to="/login" variant="ghost">Back to log in</Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
