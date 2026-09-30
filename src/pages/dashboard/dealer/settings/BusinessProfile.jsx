import {
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { CloudUpload } from 'lucide-react';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { useApiQuery, useApiMutation } from '../../../../hooks/useApi';
import { AsyncState } from '../../../../components/states';
import { DealershipContext } from '../Layout';

const SERVICES = ['Car Sale', 'Car Leasing', 'Drivers', 'Car Trade-in'];
const MAX_LOGO_MB = 2;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

const text = (v) => (v === null || v === undefined ? '' : String(v));

function toForm(data) {
  return {
    business_name: text(data?.business_name),
    headline: text(data?.headline),
    about: text(data?.about),
    contact_email: text(data?.contact_email),
    contact_phone: text(data?.contact_phone),
    services: Array.from(new Set((Array.isArray(data?.services) ? data.services : [])
      .map((s) => (s === 'Sell-Your-Car' ? 'Car Trade-in' : s))
      .filter((s) => SERVICES.includes(s)))),
  };
}

function validate(form) {
  const errors = {};
  if (!form.business_name.trim()) errors.business_name = 'Enter your business name.';
  if (form.headline.length > 200) errors.headline = 'Keep the headline under 200 characters.';
  if (form.about.length > 1000) errors.about = 'Keep this under 1,000 characters.';
  if (form.contact_email.trim() && !EMAIL_RE.test(form.contact_email.trim())) errors.contact_email = 'Enter a valid email address.';
  if (form.contact_phone.trim() && !PHONE_RE.test(form.contact_phone.trim())) errors.contact_phone = 'Enter a valid phone number, e.g. +234 801 234 5678.';
  if (!form.services.length) errors.services = 'Choose at least one service you offer.';
  return errors;
}

export const BusinessProfile = () => {
  const settings = useApiQuery(
    (api, signal) => api.get('/admin/dealership/settings/', { signal }),
    [],
    { select: (body) => body?.data || {} }
  );

  return (
    <AsyncState query={settings} loadingLabel="Loading your business profile…">
      {(data) => <ProfileForm data={data} onSaved={(next) => settings.setData(next)} />}
    </AsyncState>
  );
};

function ProfileForm({ data, onSaved }) {
  const { reloadDealership } = useContext(DealershipContext);
  const logoInputId = useId();
  const logoInput = useRef();
  const [form, setForm] = useState(() => toForm(data));
  const [errors, setErrors] = useState({});
  const [logo, setLogo] = useState(null); // { file, preview }

  useEffect(() => () => { if (logo?.preview) URL.revokeObjectURL(logo.preview); }, [logo]);

  const save = useApiMutation(
    (api, payload) => api.post('/admin/dealership/settings/', payload),
    {
      successMessage: 'Your business profile has been updated.',
      errorTitle: "Couldn't save your settings",
      onSuccess: (body) => {
        if (body?.data) {
          onSaved(body.data);
          setForm(toForm(body.data));
        }
        setLogo(null);
        reloadDealership?.();
      },
      onError: (error) => setErrors(error.fieldErrors || {}),
    }
  );

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function pickLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setErrors((prev) => ({ ...prev, logo: 'Choose an image file (JPG, PNG or WebP).' }));
    if (file.size > MAX_LOGO_MB * 1024 * 1024) return setErrors((prev) => ({ ...prev, logo: `Choose an image smaller than ${MAX_LOGO_MB} MB.` }));
    setErrors((prev) => ({ ...prev, logo: undefined }));
    setLogo({ file, preview: URL.createObjectURL(file) });
  }

  function toggleService(service) {
    change('services', form.services.includes(service)
      ? form.services.filter((s) => s !== service)
      : [...form.services, service]);
  }

  function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus?.();
      return;
    }
    const payload = new FormData();
    for (const key of ['business_name', 'headline', 'about', 'contact_email', 'contact_phone']) {
      payload.append(key, form[key].trim());
    }
    payload.append('services', JSON.stringify(form.services));
    if (logo?.file) payload.append('new-logo', logo.file, logo.file.name);
    save.mutate(payload);
  }

  const logoSrc = logo?.preview || data?.logo || undefined;
  const location = typeof data?.location === 'string' ? data.location : '';

  return (
    <VStack as="form" noValidate onSubmit={submit} spacing={6} align="stretch" py={6} maxW="720px" w="100%">
      <Box bg="white" borderWidth={1} borderColor="gray.200" borderRadius="xl" p={6}>
        <VStack spacing={3}>
          <Avatar size="xl" src={logoSrc} name={form.business_name || 'Dealership'} bg="primary" color="white" />
          <FormControl isInvalid={Boolean(errors.logo)} textAlign="center">
            <Button
              as="label"
              htmlFor={logoInputId}
              variant="link"
              color="primary"
              fontSize="sm"
              leftIcon={<CloudUpload size={16} />}
              cursor="pointer"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logoInput.current?.click(); } }}
            >
              {logoSrc ? 'Change logo' : 'Upload logo'}
            </Button>
            <input
              id={logoInputId}
              ref={logoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pickLogo}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
            />
            {errors.logo
              ? <FormErrorMessage justifyContent="center">{errors.logo}</FormErrorMessage>
              : <FormHelperText>{logo ? 'New logo will be saved when you save changes.' : `Square image, max ${MAX_LOGO_MB} MB.`}</FormHelperText>}
          </FormControl>
          <VStack spacing={0} textAlign="center">
            <Heading as="h2" fontSize="md">{form.business_name || 'Your business'}</Heading>
            {location && <Text fontSize="sm" color="gray.600">{location}</Text>}
          </VStack>
        </VStack>
      </Box>

      <FormControl isRequired isInvalid={Boolean(errors.business_name)}>
        <FormLabel>Business name</FormLabel>
        <Input name="business_name" value={form.business_name} maxLength={300} onChange={(e) => change('business_name', e.target.value)} />
        <FormErrorMessage>{errors.business_name}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={Boolean(errors.headline)}>
        <FormLabel>Headline</FormLabel>
        <Input name="headline" value={form.headline} maxLength={200} placeholder="e.g. Trusted Tokunbo cars in Lekki" onChange={(e) => change('headline', e.target.value)} />
        <FormErrorMessage>{errors.headline}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={Boolean(errors.about)}>
        <FormLabel>About</FormLabel>
        <Textarea name="about" value={form.about} maxLength={1000} rows={5} onChange={(e) => change('about', e.target.value)} />
        {errors.about ? <FormErrorMessage>{errors.about}</FormErrorMessage> : <FormHelperText>{form.about.length}/1000 characters</FormHelperText>}
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <FormControl isReadOnly>
          <FormLabel>CAC number</FormLabel>
          <Input value={text(data?.cac_number) || 'Not provided'} bg="gray.50" />
          <FormHelperText>Set during verification. Contact support to change it.</FormHelperText>
        </FormControl>
        <FormControl isReadOnly>
          <FormLabel>TIN</FormLabel>
          <Input value={text(data?.tin_number) || 'Not provided'} bg="gray.50" />
          <FormHelperText>Set during verification. Contact support to change it.</FormHelperText>
        </FormControl>
      </SimpleGrid>

      <FormControl as="fieldset" isRequired isInvalid={Boolean(errors.services)}>
        <FormLabel as="legend">Services you offer</FormLabel>
        <Wrap spacing={2}>
          {SERVICES.map((service) => {
            const on = form.services.includes(service);
            return (
              <WrapItem key={service}>
                <Button
                  size="sm"
                  borderRadius="full"
                  variant={on ? 'solid' : 'outline'}
                  bg={on ? 'primary' : 'white'}
                  color={on ? 'white' : 'gray.700'}
                  borderColor={on ? 'primary' : 'gray.300'}
                  _hover={{ bg: on ? 'secondary' : 'gray.50' }}
                  aria-pressed={on}
                  leftIcon={on ? <CheckIcon boxSize={3} /> : undefined}
                  onClick={() => toggleService(service)}
                >
                  {service}
                </Button>
              </WrapItem>
            );
          })}
        </Wrap>
        <FormErrorMessage>{errors.services}</FormErrorMessage>
      </FormControl>

      <Divider />
      <Heading as="h2" size="sm">Customer contact details</Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <FormControl isInvalid={Boolean(errors.contact_email)}>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="contact_email" autoComplete="email" value={form.contact_email} onChange={(e) => change('contact_email', e.target.value)} />
          <FormErrorMessage>{errors.contact_email}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={Boolean(errors.contact_phone)}>
          <FormLabel>Customer care phone</FormLabel>
          <Input type="tel" name="contact_phone" autoComplete="tel" placeholder="+234 801 234 5678" value={form.contact_phone} onChange={(e) => change('contact_phone', e.target.value)} />
          <FormErrorMessage>{errors.contact_phone}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>

      <Flex justify="flex-end">
        <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} loadingText="Saving…" w={{ base: 'full', sm: 'auto' }}>
          Save changes
        </Button>
      </Flex>
    </VStack>
  );
}

export default BusinessProfile;
