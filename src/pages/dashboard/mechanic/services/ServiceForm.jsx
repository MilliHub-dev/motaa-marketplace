// Shared create / edit form for a mechanic's service offering.
import { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Stack,
  Switch,
} from '@chakra-ui/react';
import { Link as RLink } from 'react-router-dom';
import { asList } from '../../../../utils';

export const EMPTY_SERVICE = { title: '', charge: '', charge_rate: 'flat', is_active: true };

export function validateService(values) {
  const errors = {};
  const title = String(values.title || '').trim();
  if (!title) errors.title = 'Choose or type the service you offer.';
  else if (title.length > 120) errors.title = 'Keep the service title under 120 characters.';
  const charge = Number(String(values.charge ?? '').replace(/,/g, ''));
  if (values.charge === '' || !Number.isFinite(charge) || charge <= 0) errors.charge = 'Enter a charge greater than ₦0.';
  if (!['flat', 'hourly'].includes(values.charge_rate)) errors.charge_rate = 'Choose a charge rate.';
  return errors;
}

/**
 * props: initialValues, catalogue (list of {title}), submitLabel, onSubmit(payload) → resolves body or undefined,
 *        serverErrors ({field: msg}), isSubmitting
 */
export function ServiceForm({ initialValues = EMPTY_SERVICE, catalogue = [], submitLabel, onSubmit, serverErrors, isSubmitting }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length) setErrors((current) => ({ ...current, ...serverErrors }));
  }, [serverErrors]);

  function update(field, value) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched) setErrors(validateService(next));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    const found = validateService(values);
    setErrors(found);
    if (Object.keys(found).length || isSubmitting) return;
    onSubmit({
      title: values.title.trim(),
      charge: Number(String(values.charge).replace(/,/g, '')),
      charge_rate: values.charge_rate,
      is_active: !!values.is_active,
    });
  }

  const options = asList(catalogue).map((s) => s?.title).filter(Boolean);

  return (
    <Stack as="form" spacing={5} maxW="640px" onSubmit={handleSubmit} noValidate>
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel>Service</FormLabel>
        <Input
          list="mechanic-service-options"
          value={values.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="e.g. Oil change, Brake repair"
          autoComplete="off"
          maxLength={120}
          bg="white"
        />
        <datalist id="mechanic-service-options">
          {options.map((title) => <option key={title} value={title} />)}
        </datalist>
        {errors.title
          ? <FormErrorMessage>{errors.title}</FormErrorMessage>
          : <FormHelperText>Pick a common service or type your own.</FormHelperText>}
      </FormControl>

      <FormControl isRequired isInvalid={!!errors.charge}>
        <FormLabel>Charge</FormLabel>
        <InputGroup>
          <InputLeftAddon>₦</InputLeftAddon>
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            value={values.charge}
            onChange={(e) => update('charge', e.target.value)}
            placeholder="15000"
            bg="white"
          />
        </InputGroup>
        <FormErrorMessage>{errors.charge}</FormErrorMessage>
      </FormControl>

      <FormControl isRequired isInvalid={!!errors.charge_rate}>
        <FormLabel>Charge rate</FormLabel>
        <Select value={values.charge_rate} onChange={(e) => update('charge_rate', e.target.value)} bg="white">
          <option value="flat">Flat rate (per job)</option>
          <option value="hourly">Hourly rate</option>
        </Select>
        <FormErrorMessage>{errors.charge_rate}</FormErrorMessage>
      </FormControl>

      <FormControl display="flex" alignItems="center" gap={3}>
        <Switch id="service-active" isChecked={!!values.is_active} onChange={(e) => update('is_active', e.target.checked)} />
        <FormLabel htmlFor="service-active" mb={0}>
          Visible to customers
        </FormLabel>
      </FormControl>

      <HStack spacing={3} pt={2}>
        <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={isSubmitting} loadingText="Saving">
          {submitLabel}
        </Button>
        <Button as={RLink} to="/services" variant="ghost">Cancel</Button>
      </HStack>
    </Stack>
  );
}

export default ServiceForm;
