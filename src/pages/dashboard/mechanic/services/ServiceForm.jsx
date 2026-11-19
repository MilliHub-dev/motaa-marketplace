// Shared create / edit form for a mechanic's service offering.
import { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Wrap,
  WrapItem,
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
import { Clock, Eye, Tag, Wrench } from 'lucide-react';
import { DASH, DashCard, IconBubble, StatusPill } from '../../../../components/dashboard/ui';
import { Checklist, ChoiceCards, FormActions, FormSection, FormWithAside } from '../../../../components/dashboard/FormLayout';

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
  const charge = Number(String(values.charge ?? '').replace(/,/g, ''));
  const rateLabel = values.charge_rate === 'hourly' ? 'per hour' : 'per job';

  return (
    <Box as="form" onSubmit={handleSubmit} noValidate>
      <FormWithAside aside={(
        <>
          <DashCard p={{ base: 4, md: 5 }}>
            <Text fontSize="xs" color={DASH.muted} textTransform="uppercase" letterSpacing="0.08em" mb={3}>How customers see it</Text>
            <HStack spacing={3}>
              <IconBubble icon={Wrench} color={values.is_active ? DASH.blue : '#9CA3AF'} size={12} />
              <Box minW={0}>
                <Text fontWeight="600" fontSize="lg" noOfLines={2} color={values.title ? DASH.ink : '#9CA3AF'}>{values.title || 'Your service'}</Text>
                <Text fontSize="sm" color={DASH.muted}>{values.is_active ? 'Visible on your profile' : 'Hidden from customers'}</Text>
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="600" mt={4}>{charge > 0 ? `₦${charge.toLocaleString('en-NG')}` : '₦—'}</Text>
            <StatusPill tone="blue">{values.charge_rate === 'hourly' ? 'Hourly rate' : 'Flat rate'}</StatusPill>
          </DashCard>
          <Checklist title="Ready?" items={[
            { label: 'Service name', done: Boolean(values.title?.trim()) },
            { label: 'Price', done: charge > 0 },
            { label: 'Visible to customers', done: Boolean(values.is_active) },
          ]} />
        </>
      )}>
        <FormSection number={1} title="The service" description="Pick a common one or type your own.">
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel>Service</FormLabel>
            <Input list="mechanic-service-options" value={values.title} onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Oil change, Brake repair" autoComplete="off" maxLength={120} />
            <datalist id="mechanic-service-options">{options.map((title) => <option key={title} value={title} />)}</datalist>
            {errors.title ? <FormErrorMessage>{errors.title}</FormErrorMessage> : <FormHelperText>Customers search for these words.</FormHelperText>}
          </FormControl>
          {options.length > 0 && (
            <Wrap spacing={2} mt={4} aria-label="Common services">
              {options.slice(0, 10).map((title) => {
                const on = values.title === title;
                return (
                  <WrapItem key={title}>
                    <Button size="sm" borderRadius="full" onClick={() => update('title', title)} aria-pressed={on}
                      bg={on ? DASH.ink : DASH.page} color={on ? 'white' : DASH.ink} _hover={{ bg: on ? DASH.ink : '#E7EAF0' }} fontWeight="500">
                      {title}
                    </Button>
                  </WrapItem>
                );
              })}
            </Wrap>
          )}
        </FormSection>

        <FormSection number={2} title="Price" description="What customers pay for this service.">
          <Stack spacing={6}>
            <FormControl isRequired isInvalid={!!errors.charge_rate}>
              <FormLabel as="legend">How you charge</FormLabel>
              <ChoiceCards label="Charge rate" value={values.charge_rate} onChange={(value) => update('charge_rate', value)} options={[
                { value: 'flat', label: 'Flat rate', description: 'One price for the job.', icon: Tag },
                { value: 'hourly', label: 'Hourly', description: 'Charged for each hour worked.', icon: Clock },
              ]} />
              <FormErrorMessage>{errors.charge_rate}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.charge}>
              <FormLabel>Charge ({rateLabel})</FormLabel>
              <InputGroup maxW="360px">
                <InputLeftAddon>₦</InputLeftAddon>
                <Input type="number" inputMode="decimal" min={1} step="any" value={values.charge} onChange={(e) => update('charge', e.target.value)} placeholder="15000" />
              </InputGroup>
              {errors.charge ? <FormErrorMessage>{errors.charge}</FormErrorMessage>
                : charge > 0 ? <FormHelperText>₦{charge.toLocaleString('en-NG')} {rateLabel}. Motaa's commission comes off when you're paid.</FormHelperText> : null}
            </FormControl>
          </Stack>
        </FormSection>

        <FormSection icon={Eye} title="Visibility">
          <FormControl display="flex" alignItems="center" justifyContent="space-between" gap={3}>
            <Box>
              <FormLabel htmlFor="service-active" mb={0}>{values.is_active ? 'Visible to customers' : 'Hidden from customers'}</FormLabel>
              <Text fontSize="sm" color={DASH.muted}>Hide a service for a while without deleting it.</Text>
            </Box>
            <Switch id="service-active" size="lg" isChecked={!!values.is_active} onChange={(e) => update('is_active', e.target.checked)} />
          </FormControl>
        </FormSection>

        <FormActions>
          <Button as={RLink} to="/services" h="52px" px={6} borderRadius="full" variant="outline" borderColor="#D6DBE3">Cancel</Button>
          <Button type="submit" h="52px" px={8} borderRadius="full" bg={DASH.ink} color="white" _hover={{ bg: '#1F2937' }} isLoading={isSubmitting} loadingText="Saving">
            {submitLabel}
          </Button>
        </FormActions>
      </FormWithAside>
    </Box>
  );
}

export default ServiceForm;
