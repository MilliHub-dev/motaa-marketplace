// /settings for parts dealers — the business profile customers see on the shop
// (PUT /accounts/update-profile/). Verification details are set by Motaa and can't be edited here.
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  Avatar, Badge, Box, Button, Divider, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Input, SimpleGrid,
  Text, Textarea, VStack,
} from '@chakra-ui/react';
import { CloudUpload } from 'lucide-react';
import { useApiMutation } from '../../../hooks/useApi';
import { storePlace } from '../../../utils/parts';
import { PartsShopContext } from './shop';

const MAX_LOGO_MB = 2;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

function validate(form) {
  const errors = {};
  if (!form.business_name.trim()) errors.business_name = 'Enter your business name.';
  if (form.headline.length > 200) errors.headline = 'Keep the headline under 200 characters.';
  if (form.contact_email.trim() && !EMAIL_RE.test(form.contact_email.trim())) errors.contact_email = 'Enter a valid email address.';
  if (form.contact_phone.trim() && !PHONE_RE.test(form.contact_phone.trim())) errors.contact_phone = 'Enter a valid phone number, e.g. +234 801 234 5678.';
  return errors;
}

export default function PartsDealerBusinessProfile() {
  const { shop, reload } = useContext(PartsShopContext) || {};
  const store = shop?.store;
  const logoInputId = useId();
  const logoInput = useRef();
  const business = shop?.business || {};
  const [form, setForm] = useState(() => ({
    business_name: business.business_name || store?.name || '',
    headline: business.headline || store?.headline || '',
    about: business.about || store?.about || '',
    contact_email: business.contact_email || '',
    contact_phone: business.contact_phone || '',
  }));
  const [errors, setErrors] = useState({});
  const [logo, setLogo] = useState(null); // { file, preview }

  useEffect(() => { document.title = 'Business profile | Motaa'; }, []);
  useEffect(() => () => { if (logo?.preview) URL.revokeObjectURL(logo.preview); }, [logo]);

  const save = useApiMutation(
    (api, payload) => api.put('/accounts/update-profile/', payload),
    {
      successMessage: 'Your business profile has been updated.',
      errorTitle: "Couldn't save your profile",
      onSuccess: (body) => {
        const saved = body?.data || {};
        setForm((f) => ({ ...f, contact_email: saved.contact_email ?? f.contact_email, contact_phone: saved.contact_phone ?? f.contact_phone }));
        setLogo(null);
        reload?.();
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

  function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus?.();
      return;
    }
    const payload = new FormData();
    for (const key of ['business_name', 'headline', 'about', 'contact_email', 'contact_phone']) payload.append(key, form[key].trim());
    if (logo?.file) payload.append('logo', logo.file, logo.file.name);
    save.mutate(payload);
  }

  const logoSrc = logo?.preview || business.logo || store?.logo || undefined;
  const place = (typeof business.location === 'string' && business.location) || storePlace(store);

  return (
    <VStack as="form" noValidate onSubmit={submit} spacing={6} align="stretch" py={6} maxW="720px" w="100%">
      <Box>
        <Heading as="h1" size="md">Business profile</Heading>
        <Text color="gray.600" fontSize="sm">What customers see on your parts shop.</Text>
      </Box>

      <Box bg="white" borderWidth={1} borderColor="gray.200" borderRadius="xl" p={6}>
        <VStack spacing={3}>
          <Avatar size="xl" src={logoSrc} name={form.business_name || 'Parts dealer'} bg="primary" color="white" />
          <FormControl isInvalid={Boolean(errors.logo)} textAlign="center">
            <Button as="label" htmlFor={logoInputId} variant="link" color="primary" fontSize="sm" leftIcon={<CloudUpload size={16} />} cursor="pointer" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logoInput.current?.click(); } }}>
              {logoSrc ? 'Change logo' : 'Upload logo'}
            </Button>
            <input id={logoInputId} ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickLogo}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }} />
            {errors.logo
              ? <FormErrorMessage justifyContent="center">{errors.logo}</FormErrorMessage>
              : <FormHelperText>{logo ? 'New logo will be saved when you save changes.' : `Square image, max ${MAX_LOGO_MB} MB.`}</FormHelperText>}
          </FormControl>
          <VStack spacing={1} textAlign="center">
            <Heading as="h2" fontSize="md">{form.business_name || 'Your business'}</Heading>
            {place && <Text fontSize="sm" color="gray.600">{place}</Text>}
            {shop && <Badge colorScheme={shop.verified ? 'green' : 'yellow'} textTransform="none" borderRadius="full" px={2}>{shop.verified ? 'Verified business' : 'Not verified yet'}</Badge>}
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
        <Input name="headline" value={form.headline} maxLength={200} placeholder="e.g. Genuine Toyota and Lexus parts" onChange={(e) => change('headline', e.target.value)} />
        <FormErrorMessage>{errors.headline}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={Boolean(errors.about)}>
        <FormLabel>About</FormLabel>
        <Textarea name="about" value={form.about} maxLength={2000} rows={5} onChange={(e) => change('about', e.target.value)} />
        {errors.about ? <FormErrorMessage>{errors.about}</FormErrorMessage> : <FormHelperText>{form.about.length}/2000 characters</FormHelperText>}
      </FormControl>

      <Divider />
      <Heading as="h2" size="sm">Customer contact details</Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <FormControl isInvalid={Boolean(errors.contact_email)}>
          <FormLabel>Contact email</FormLabel>
          <Input type="email" name="contact_email" autoComplete="email" value={form.contact_email} onChange={(e) => change('contact_email', e.target.value)} />
          <FormErrorMessage>{errors.contact_email}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={Boolean(errors.contact_phone)}>
          <FormLabel>Contact phone</FormLabel>
          <Input type="tel" name="contact_phone" autoComplete="tel" placeholder="+234 801 234 5678" value={form.contact_phone} onChange={(e) => change('contact_phone', e.target.value)} />
          <FormErrorMessage>{errors.contact_phone}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>

      <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
        <Button as={RLink} to="/parts-store/settings" variant="link" color="primary">Delivery and pickup settings</Button>
        <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} loadingText="Saving…" w={{ base: 'full', sm: 'auto' }}>
          Save changes
        </Button>
      </Flex>
    </VStack>
  );
}
