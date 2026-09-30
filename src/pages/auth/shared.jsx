// Shared pieces for the auth pages (login, signup, business onboarding, password reset).
import { useState } from 'react';
import {
  Box,
  Heading,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from '@chakra-ui/react';
import { Link as RLink } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

// ------------------------------------------------------------------ onboarding session
// A business account exists (and has a token) before its profile is complete. The token is
// kept in sessionStorage — not the app's login storage — until onboarding finishes, so the
// app never treats a half-created dealer/mechanic as logged in.
const ONBOARDING_KEY = 'motaa-onboarding';

export function saveOnboarding(user) {
  try { sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify(user)); } catch { /* private mode */ }
}

export function readOnboarding() {
  try {
    const user = JSON.parse(sessionStorage.getItem(ONBOARDING_KEY) || 'null');
    return user?.token && ['dealer', 'mechanic'].includes(user?.user_type) ? user : null;
  } catch {
    return null;
  }
}

export function clearOnboarding() {
  try { sessionStorage.removeItem(ONBOARDING_KEY); } catch { /* ignore */ }
}

export const authHeader = (token) => ({ headers: { Authorization: `Token ${token}` } });

// ------------------------------------------------------------------ navigation
export function roleHome(user) {
  return ['dealer', 'mechanic'].includes(user?.user_type) ? '/dashboard' : '/home';
}

/** Only same-site paths are allowed as ?next= targets (no open redirects, no auth loops). */
export function safeNext(next) {
  if (!next || typeof next !== 'string') return null;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  if (/^\/(login|signup|reset-password)(\/|\?|$)/.test(next)) return null;
  return next;
}

/** A login/register body is usable only if it's an object with a token (not an HTML error page). */
export function isAuthPayload(body) {
  return Boolean(body && typeof body === 'object' && typeof body.token === 'string' && body.token);
}

// ------------------------------------------------------------------ validation (mirrors the API)
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ' .-]*$/;
const COMMON_PASSWORDS = ['password', 'password1', 'password123', '12345678', '123456789', 'qwerty123', 'iloveyou', 'abcd1234', 'motaa123', 'admin123', 'welcome1'];

export function validateEmail(value) {
  const email = (value || '').trim();
  if (!email) return 'Enter your email address.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address, e.g. ada@example.com.';
  return '';
}

export function validateName(value, label) {
  const name = (value || '').trim();
  if (!name) return `Enter your ${label}.`;
  if (name.length > 150) return `Your ${label} is too long.`;
  if (!NAME_RE.test(name)) return `Your ${label} can only contain letters, spaces, hyphens and apostrophes.`;
  return '';
}

/** Same rules as Django's AUTH_PASSWORD_VALIDATORS (length, numeric, similarity, common). */
export function validatePassword(password, { email = '', firstName = '', lastName = '' } = {}) {
  if (!password) return 'Choose a password.';
  if (password.length < 8) return 'Use at least 8 characters.';
  if (/^\d+$/.test(password)) return "Your password can't be only numbers.";
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.includes(lower)) return 'That password is too common. Choose something harder to guess.';
  const personal = [email.split('@')[0], firstName, lastName].map((s) => (s || '').toLowerCase()).filter((s) => s.length >= 3);
  if (personal.some((s) => lower.includes(s) || s.includes(lower))) return 'Your password is too similar to your name or email.';
  return '';
}

/** '0803 123 4567' / '8031234567' / '+234 803 123 4567' → '+2348031234567' */
export function normalizeNgPhone(value) {
  let digits = String(value || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits ? `+234${digits}` : '';
}

export function validateNgPhone(value, { required = true } = {}) {
  if (!String(value || '').trim()) return required ? 'Enter your phone number.' : '';
  if (!/^\+234[789][01]\d{8}$/.test(normalizeNgPhone(value))) return 'Enter a valid Nigerian mobile number, e.g. 0803 123 4567.';
  return '';
}

// ------------------------------------------------------------------ UI
export function AuthShell({ title, description, children, maxW = '480px' }) {
  return (
    <Box w="100%" maxW={maxW} mx="auto" px={4} pt={{ base: 6, md: 10 }} pb={12}>
      <RLink to="/" aria-label="Motaa home">
        <Image src="/assets/images/motaa-logo-3.png" alt="Motaa" mb={4} mx="auto" width="100px" />
      </RLink>
      <Heading as="h1" textAlign="center" fontSize={{ base: '2xl', md: '3xl' }} mb={2}>{title}</Heading>
      {description && <Text textAlign="center" color="gray.600" mb={6}>{description}</Text>}
      {children}
    </Box>
  );
}

export function PasswordInput({ autoComplete = 'current-password', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup>
      <Input type={visible ? 'text' : 'password'} autoComplete={autoComplete} pr="3rem" {...props} />
      <InputRightElement>
        <IconButton
          size="sm"
          variant="ghost"
          aria-label={visible ? 'Hide password' : 'Show password'}
          icon={visible ? <EyeOff size={18} /> : <Eye size={18} />}
          onClick={() => setVisible((v) => !v)}
        />
      </InputRightElement>
    </InputGroup>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
