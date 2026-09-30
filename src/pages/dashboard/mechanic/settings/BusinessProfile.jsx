import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
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
  HStack,
  Input,
  Stack,
  Tag,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { CloudUpload } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { useApiMutation, useApiQuery } from '../../../../hooks/useApi';
import { AsyncState } from '../../../../components/states';
import { asList } from '../../../../utils';
import { MechanicContext } from '../Layout';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ABOUT_MAX = 1000;

const slugify = (text) => (text || '').toLowerCase().replace(/['#@*()!"$%&.]/g, '').trim().replace(/\s+/g, '-');

function toForm(mechanic) {
  return {
    business_name: mechanic?.business_name || '',
    headline: mechanic?.headline || '',
    about: mechanic?.about || '',
    contact_email: mechanic?.contact_email || '',
    contact_phone: mechanic?.contact_phone || '',
  };
}

function validate(values) {
  const errors = {};
  if (!values.business_name.trim()) errors.business_name = 'Enter your business name.';
  if (values.headline.length > 200) errors.headline = 'Keep your headline under 200 characters.';
  if (values.about.length > ABOUT_MAX) errors.about = `Keep the description under ${ABOUT_MAX} characters.`;
  if (values.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email.trim())) errors.contact_email = 'Enter a valid email address.';
  if (values.contact_phone && !/^[+\d][\d\s()-]{6,19}$/.test(values.contact_phone.trim())) errors.contact_phone = 'Enter a valid phone number.';
  return errors;
}

function ProfileForm({ mechanic, onSaved }) {
  const { commaInt, notifyError } = useContext(GlobalStore);
  const imageRef = useRef();
  const [values, setValues] = useState(() => toForm(mechanic));
  const [logo, setLogo] = useState(null); // { file, preview }
  const [errors, setErrors] = useState({});

  useEffect(() => () => logo?.preview && URL.revokeObjectURL(logo.preview), [logo]);

  const save = useApiMutation((api, payload) => api.post('/admin/mechanics/settings/', payload), {
    successMessage: 'Business profile saved',
    errorTitle: "Couldn't save your profile",
    onSuccess: (body) => {
      setLogo(null);
      onSaved(body?.data);
    },
    onError: (error) => setErrors((current) => ({ ...current, ...error.fieldErrors })),
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return notifyError(new Error('Choose a PNG or JPG image.'), 'Unsupported file');
    if (file.size > MAX_LOGO_BYTES) return notifyError(new Error('The logo must be 5MB or smaller.'), 'Image too large');
    setLogo({ file, preview: URL.createObjectURL(file) });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.values(found).some(Boolean) || save.loading) return;
    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) => payload.append(key, value.trim()));
    if (logo?.file) payload.append('logo', logo.file, logo.file.name);
    save.mutate(payload);
  }

  const activeServices = asList(mechanic?.services);
  const logoSrc = logo?.preview || mechanic?.logo || undefined;

  return (
    <Stack as="form" spacing={6} onSubmit={handleSubmit} noValidate maxW="760px">
      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={6}>
        <VStack spacing={3}>
          <Avatar src={logoSrc} name={values.business_name || mechanic?.user?.name} size="xl" />
          <Button onClick={() => imageRef.current?.click()} variant="link" color="primary" fontSize="sm" leftIcon={<CloudUpload size={16} />}>
            {logoSrc ? 'Change logo' : 'Upload logo'}
          </Button>
          <Input type="file" hidden ref={imageRef} accept="image/png,image/jpeg,image/webp" onChange={handleImage} aria-label="Upload business logo" />
          {errors.logo && <Text color="red.500" fontSize="sm">{errors.logo}</Text>}
          <VStack spacing={0} textAlign="center">
            <Heading as="h2" fontSize="md">{values.business_name || 'Your business name'}</Heading>
            {mechanic?.location && <Text fontSize="xs" color="gray.500">{mechanic.location}</Text>}
            {(values.contact_email || values.contact_phone) && (
              <Text mt={1} fontSize="sm" color="gray.500" wordBreak="break-word">
                {[values.contact_email, values.contact_phone].filter(Boolean).join(' • ')}
              </Text>
            )}
          </VStack>
        </VStack>
      </Box>

      <FormControl isRequired isInvalid={!!errors.business_name}>
        <FormLabel>Business name</FormLabel>
        <Input name="business_name" value={values.business_name} onChange={handleChange} maxLength={300} bg="white" />
        {errors.business_name
          ? <FormErrorMessage>{errors.business_name}</FormErrorMessage>
          : values.business_name.trim() && <FormHelperText>@{slugify(values.business_name)}</FormHelperText>}
      </FormControl>

      <FormControl isInvalid={!!errors.headline}>
        <FormLabel>Headline</FormLabel>
        <Input name="headline" value={values.headline} onChange={handleChange} maxLength={200} placeholder="e.g. Certified Toyota & Lexus specialists" bg="white" />
        <FormErrorMessage>{errors.headline}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.about}>
        <FormLabel>About</FormLabel>
        <Textarea name="about" value={values.about} onChange={handleChange} maxLength={ABOUT_MAX} rows={5} bg="white" />
        {errors.about
          ? <FormErrorMessage>{errors.about}</FormErrorMessage>
          : <FormHelperText>{values.about.length}/{ABOUT_MAX} characters</FormHelperText>}
      </FormControl>

      <Box>
        <Flex justify="space-between" align="center" gap={3} mb={2} wrap="wrap">
          <Text fontWeight="medium">Services offered</Text>
          <Button as={RLink} to="/services" size="sm" variant="outline">Manage services</Button>
        </Flex>
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={3} bg="white">
          {activeServices.length ? (
            <Wrap spacing={2}>
              {activeServices.map((service) => (
                <WrapItem key={service?.uuid || service?.service}>
                  <Tag size="lg" borderRadius="full" colorScheme="blue">
                    {service?.service} · ₦{commaInt(service?.charge)}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          ) : (
            <Text fontSize="sm" color="gray.600">
              You have no active services. Add at least one so customers can book you.
            </Text>
          )}
        </Box>
      </Box>

      <Divider />

      <Box>
        <Heading as="h2" size="md" mb={1}>Contact details</Heading>
        <Text fontSize="sm" color="gray.600">Shown to customers who book you.</Text>
      </Box>

      <FormControl isInvalid={!!errors.contact_email}>
        <FormLabel>Email</FormLabel>
        <Input type="email" name="contact_email" value={values.contact_email} onChange={handleChange} autoComplete="email" bg="white" />
        <FormErrorMessage>{errors.contact_email}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.contact_phone}>
        <FormLabel>Phone number</FormLabel>
        <Input type="tel" name="contact_phone" value={values.contact_phone} onChange={handleChange} autoComplete="tel" placeholder="+234 803 000 0000" bg="white" />
        <FormErrorMessage>{errors.contact_phone}</FormErrorMessage>
      </FormControl>

      <HStack>
        <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} loadingText="Saving">
          Save changes
        </Button>
      </HStack>
    </Stack>
  );
}

export const BusinessProfile = () => {
  const { reload: reloadLayout } = useContext(MechanicContext);
  const settings = useApiQuery((api, signal) => api.get('/admin/mechanics/settings/', { signal }), [], {
    select: (body) => body?.data,
  });

  return (
    <Box py={6} w="100%">
      <Heading as="h1" size="lg" mb={1}>Business profile</Heading>
      <Text color="gray.600" mb={6}>This is how your business appears to customers on Motaa.</Text>
      <AsyncState query={settings} loadingLabel="Loading your profile…">
        {(mechanic) => (
          <ProfileForm
            key={mechanic?.uuid}
            mechanic={mechanic}
            onSaved={(updated) => {
              if (updated) settings.setData(updated);
              reloadLayout?.();
            }}
          />
        )}
      </AsyncState>
    </Box>
  );
};

export default BusinessProfile;
