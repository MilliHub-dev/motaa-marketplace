// Business onboarding (last signup step for dealers and mechanics) at /signup/business.
// The account already exists; its token lives in sessionStorage (see shared.jsx) until this
// profile is saved, then the user is logged in and sent to their dashboard.
import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
  VisuallyHidden,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Check, CloudUpload } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink, useNavigate } from 'react-router-dom';
import { GlobalStore } from '../../App';
import { toApiError } from '../../api/client';
import { EmptyState } from '../../components/states';
import { CustomPlacesAutocomplete } from '../../components/maps';
import {
  AuthShell,
  authHeader,
  clearOnboarding,
  isAuthPayload,
  normalizeNgPhone,
  readOnboarding,
  validateEmail,
  validateNgPhone,
} from './shared';

// Must match DEALER_SERVICES / MECHANIC_SERVICES in accounts/api/serializers.py
const SERVICES = {
  dealer: ['Car Sale', 'Car Leasing', 'Drivers', 'Car Trade-in'],
  mechanic: ['Oil Change', 'Engine Repair', 'Brake Service', 'Diagnostics', 'Electrical Repairs',
    'Body Work', 'Paint Job', 'Tyre Service', 'AC Repair', 'Towing'],
};
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MIN_ABOUT = 50;

export default function BusinessProfile() {
  const { api, notify, notifyError, onAuthenticated } = useContext(GlobalStore);
  const navigate = useNavigate();
  const [account] = useState(readOnboarding);
  const userType = account?.user_type;
  const isDealer = userType === 'dealer';

  const [form, setForm] = useState({
    business_name: '',
    headline: '',
    about: '',
    services: [],
    business_type: 'business',
    contact_email: account?.email || '',
    contact_phone: '',
    street_address: '',
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [place, setPlace] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const logoInput = useRef(null);

  useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview); }, [logoPreview]);

  if (!account) {
    return (
      <AuthShell title="Set up your business">
        <EmptyState
          title="Log in to continue"
          description="We couldn't find a business signup in progress on this device. Log in to finish setting up your business profile, or create a new business account."
          action={{ label: 'Log in', to: '/login' }}
        />
        <Button as={RLink} to="/signup?type=business" variant="ghost" w="100%" mt={2}>
          Create a business account
        </Button>
      </AuthShell>
    );
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  }

  function toggleService(service) {
    setForm((f) => ({
      ...f,
      services: f.services.includes(service) ? f.services.filter((s) => s !== service) : [...f.services, service],
    }));
    setErrors((e) => ({ ...e, services: '' }));
  }

  function pickLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((x) => ({ ...x, logo: 'Choose an image file (PNG or JPG).' }));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setErrors((x) => ({ ...x, logo: 'Your logo must be 2 MB or smaller.' }));
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((x) => ({ ...x, logo: '' }));
  }

  function validate() {
    const about = form.about.trim();
    return {
      logo: logo ? '' : 'Upload your business logo.',
      business_name: form.business_name.trim().length >= 2 ? '' : 'Enter your business name.',
      headline: form.headline.trim() ? '' : 'Add a short headline or motto.',
      about: about.length >= MIN_ABOUT ? '' : `Tell customers a bit more (at least ${MIN_ABOUT} characters — ${MIN_ABOUT - about.length} to go).`,
      services: form.services.length ? '' : 'Select at least one service you offer.',
      contact_email: validateEmail(form.contact_email),
      contact_phone: validateNgPhone(form.contact_phone),
      street_address: form.street_address.trim() ? '' : 'Enter your street address.',
    };
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors).find((k) => nextErrors[k]);
    if (firstInvalid) {
      document.getElementById(`bp-${firstInvalid}`)?.focus();
      return;
    }

    const payload = new FormData();
    payload.append('action', 'setup-business-profile');
    payload.append('logo', logo, logo.name);
    payload.append('business_name', form.business_name.trim());
    payload.append('headline', form.headline.trim());
    payload.append('about', form.about.trim());
    payload.append('contact_email', form.contact_email.trim());
    payload.append('contact_phone', normalizeNgPhone(form.contact_phone));
    form.services.forEach((service) => payload.append('services', service));
    if (!isDealer) payload.append('business_type', form.business_type);
    payload.append('location', JSON.stringify({ ...(place || {}), street_address: form.street_address.trim() }));

    setSaving(true);
    try {
      const body = await api.post('/accounts/register/', payload, authHeader(account.token));
      // eslint-disable-next-line no-unused-vars
      const { business, ...user } = body?.data || {};
      if (!isAuthPayload(user)) throw new Error("We couldn't finish setting up your profile. Please try again.");
      clearOnboarding();
      onAuthenticated(user);
      notify({ title: `Welcome to Motaa, ${form.business_name.trim()}!`, body: 'Your business profile is live. Verify your business from the dashboard to build trust with customers.' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const error = toApiError(err);
      const fields = error.fieldErrors;
      if (fields.location) fields.street_address = fields.location;
      if (Object.keys(fields).length) {
        setErrors(fields);
      } else if (error.status === 401) {
        clearOnboarding();
        notify({ title: 'Please log in again', body: 'Log in to finish setting up your business.', color: 'red' });
        navigate('/login', { replace: true });
      } else if (!error.isNetworkError && !(error.status >= 500)) {
        notifyError(error, "Couldn't save your business profile");
      }
    } finally {
      setSaving(false);
    }
  }

  function startOver() {
    clearOnboarding();
    navigate('/signup?type=business', { replace: true });
  }

  const aboutLength = form.about.trim().length;

  return (
    <AuthShell
      maxW="640px"
      title={isDealer ? 'Set up your dealership' : 'Set up your mechanic business'}
      description="Final step · This is what customers see on Motaa."
    >
      <form onSubmit={submit} noValidate>
        <Stack spacing={6}>
          {/* Logo + name */}
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 6 }}>
            <FormControl isInvalid={Boolean(errors.logo)} isRequired textAlign="center">
              <Flex direction="column" align="center" gap={2}>
                <Avatar size="xl" src={logoPreview || undefined} name={form.business_name || undefined} bg="gray.200" />
                <FormLabel htmlFor="bp-logo" m={0} requiredIndicator={null}>
                  <VisuallyHidden>Business logo</VisuallyHidden>
                </FormLabel>
                <Button
                  id="bp-logo"
                  variant="link"
                  color="primary"
                  leftIcon={<CloudUpload size={16} />}
                  onClick={() => logoInput.current?.click()}
                >
                  {logo ? 'Change logo' : 'Upload your logo'}
                </Button>
                <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickLogo} />
                {errors.logo
                  ? <FormErrorMessage mt={0}>{errors.logo}</FormErrorMessage>
                  : <FormHelperText mt={0}>PNG or JPG, up to 2 MB.</FormHelperText>}
              </Flex>
            </FormControl>

            <Stack spacing={4} mt={6}>
              <FormControl isInvalid={Boolean(errors.business_name)} isRequired>
                <FormLabel>Business name</FormLabel>
                <Input id="bp-business_name" autoComplete="organization" value={form.business_name}
                  onChange={(e) => setField('business_name', e.target.value)} placeholder={isDealer ? 'e.g. Lekki Autos' : 'e.g. Ade Auto Repairs'} />
                <FormErrorMessage>{errors.business_name}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.headline)} isRequired>
                <FormLabel>Headline or motto</FormLabel>
                <Input id="bp-headline" maxLength={200} value={form.headline}
                  onChange={(e) => setField('headline', e.target.value)} placeholder={isDealer ? 'e.g. Clean, verified cars at fair prices' : 'e.g. Honest repairs, done right the first time'} />
                <FormErrorMessage>{errors.headline}</FormErrorMessage>
              </FormControl>
            </Stack>
          </Box>

          <FormControl isInvalid={Boolean(errors.about)} isRequired>
            <FormLabel>About your business</FormLabel>
            <Textarea id="bp-about" minH="120px" maxLength={2000} value={form.about}
              onChange={(e) => setField('about', e.target.value)}
              placeholder="What do you offer, where are you based and what makes you different?" />
            {errors.about
              ? <FormErrorMessage>{errors.about}</FormErrorMessage>
              : <FormHelperText>{aboutLength < MIN_ABOUT ? `${aboutLength}/${MIN_ABOUT} characters minimum` : `${aboutLength} characters`}</FormHelperText>}
          </FormControl>

          <FormControl isInvalid={Boolean(errors.services)} isRequired as="fieldset">
            <FormLabel as="legend">Services you offer</FormLabel>
            <Wrap spacing={2} id="bp-services" tabIndex={-1}>
              {SERVICES[userType].map((service) => {
                const selected = form.services.includes(service);
                return (
                  <WrapItem key={service}>
                    <Button
                      size="sm"
                      borderRadius="full"
                      aria-pressed={selected}
                      variant={selected ? 'solid' : 'outline'}
                      colorScheme="blue"
                      bg={selected ? 'primary' : undefined}
                      leftIcon={selected ? <Check size={14} /> : undefined}
                      onClick={() => toggleService(service)}
                    >
                      {service}
                    </Button>
                  </WrapItem>
                );
              })}
            </Wrap>
            {errors.services
              ? <FormErrorMessage>{errors.services}</FormErrorMessage>
              : <FormHelperText>{isDealer ? 'You can change these later in Settings.' : 'Set your prices for each service from your dashboard.'}</FormHelperText>}
          </FormControl>

          {!isDealer && (
            <FormControl as="fieldset">
              <FormLabel as="legend">How do you work?</FormLabel>
              <RadioGroup value={form.business_type} onChange={(value) => setField('business_type', value)}>
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={{ base: 2, sm: 6 }}>
                  <Radio value="business">Registered business</Radio>
                  <Radio value="individual">Individual mechanic</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          )}

          <Box>
            <Text fontWeight="semibold">Contact details</Text>
            <Text fontSize="sm" color="gray.600" mb={4}>Shown to customers and on inspection slips and receipts.</Text>
            <Stack spacing={4}>
              <FormControl isInvalid={Boolean(errors.contact_email)} isRequired>
                <FormLabel>Business email</FormLabel>
                <Input id="bp-contact_email" type="email" autoComplete="email" value={form.contact_email}
                  onChange={(e) => setField('contact_email', e.target.value)} placeholder="info@yourbusiness.com" />
                <FormErrorMessage>{errors.contact_email}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.contact_phone)} isRequired>
                <FormLabel>Business phone number</FormLabel>
                <InputGroup>
                  <InputLeftAddon>+234</InputLeftAddon>
                  <Input id="bp-contact_phone" type="tel" inputMode="tel" autoComplete="tel-national" value={form.contact_phone}
                    onChange={(e) => setField('contact_phone', e.target.value)} placeholder="803 123 4567" />
                </InputGroup>
                <FormErrorMessage>{errors.contact_phone}</FormErrorMessage>
              </FormControl>
            </Stack>
          </Box>

          <Box>
            <Text fontWeight="semibold" mb={4}>Location</Text>
            <Stack spacing={4}>
              <FormControl isInvalid={Boolean(errors.street_address)} isRequired>
                <FormLabel>Street address</FormLabel>
                <Input id="bp-street_address" autoComplete="street-address" value={form.street_address}
                  onChange={(e) => setField('street_address', e.target.value)} placeholder="e.g. Suite 4, Acura Plaza, Admiralty Way" />
                <FormErrorMessage>{errors.street_address}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel>Find your business on the map</FormLabel>
                <CustomPlacesAutocomplete
                  placeholder="Search for your area or building"
                  aria-label="Search for your business location"
                  onPlaceChange={(data) => setPlace(data)}
                />
                <FormHelperText>Optional — helps nearby customers find you.</FormHelperText>
              </FormControl>
            </Stack>
          </Box>

          <Button type="submit" size="lg" colorScheme="blue" bg="primary" isLoading={saving} loadingText="Saving your profile">
            Finish setup
          </Button>
          <Text textAlign="center" fontSize="sm" color="gray.600">
            Signed up as {account.email}.{' '}
            <Button variant="link" size="sm" color="primary" onClick={startOver} isDisabled={saving}>Not you? Start over</Button>
          </Text>
        </Stack>
      </form>
    </AuthShell>
  );
}
