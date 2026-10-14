// /transport/add and /transport/:serviceId — add or edit a towing van (mechanics) or car hauler (dealers).
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, Box, Button, Checkbox, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel,
  Heading, HStack, Input, Radio, RadioGroup, Select, SimpleGrid, Stack, Switch, Text, Textarea,
} from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import { ImageUploader, useRevokePreviews } from '../../../components/forms';
import { CustomPlacesAutocomplete, DEFAULT_MAP_CENTER, MapComponent } from '../../../components/maps';
import { BackButton } from '../../../components/nav';
import { ErrorState, LoadingState } from '../../../components/states';
import { NairaField } from '../../../components/transport';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import {
  MAX_TRANSPORT_PHOTOS, TRANSPORT_STATES, emptyServiceForm, matchState, serviceFormData, serviceToForm, validateServiceForm,
} from '../../../utils/transport';
import { useTransportWords } from './MyTransport';

function Card({ title, hint, children, id }) {
  return (
    <Box id={id} borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 6 }} bg="white">
      <Heading as="h2" size="sm">{title}</Heading>
      {hint && <Text fontSize="sm" color="gray.600" mt={1}>{hint}</Text>}
      <Box mt={4}>{children}</Box>
    </Box>
  );
}

/** The states a car hauler covers: a checkbox per state, with "all" and "none". */
function StatesPicker({ states, value, onChange, error }) {
  const chosen = new Set(value);
  return (
    <FormControl as="fieldset" isRequired isInvalid={Boolean(error)} data-testid="transport-states">
      <FormLabel as="legend">States it covers</FormLabel>
      <HStack spacing={3} mb={3}>
        <Button size="xs" variant="outline" onClick={() => onChange([...states])}>Select all</Button>
        <Button size="xs" variant="ghost" onClick={() => onChange([])} isDisabled={!value.length}>Clear</Button>
        <Text fontSize="sm" color="gray.600">{value.length} chosen</Text>
      </HStack>
      <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacingX={4} spacingY={2}>
        {states.map((state) => (
          <Checkbox key={state} isChecked={chosen.has(state)}
            onChange={(e) => onChange(e.target.checked ? states.filter((s) => chosen.has(s) || s === state) : value.filter((s) => s !== state))}>
            {state}
          </Checkbox>
        ))}
      </SimpleGrid>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
}

function ServiceEditor({ service, options }) {
  const navigate = useNavigate();
  const { notify } = useContext(GlobalStore);
  const kind = service?.kind || options?.kind || 'towing';
  const towing = kind === 'towing';
  const words = useTransportWords(kind);
  const editing = Boolean(service);
  const states = asList(options?.states).length ? asList(options.states) : TRANSPORT_STATES;
  const units = asList(options?.units).length ? asList(options.units) : [{ value: 'day', label: 'per day' }, { value: 'km', label: 'per km' }, { value: 'hour', label: 'per hour' }];
  const truckTypes = asList(options?.truck_types).length ? asList(options.truck_types) : [{ value: 'open', label: 'Open' }, { value: 'enclosed', label: 'Enclosed' }];
  const [form, setForm] = useState(() => (service ? serviceToForm(service) : emptyServiceForm(kind)));
  const [images, setImages] = useState(() => asList(service?.photos).map((photo) => ({ key: photo.uuid, uuid: photo.uuid, url: photo.url })));
  const [errors, setErrors] = useState({});
  const [refusal, setRefusal] = useState('');
  useRevokePreviews(images);
  const photoCount = images.filter((item) => !item.removed).length;

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  }

  const save = useApiMutation(
    (api, body) => (editing ? api.patch(`/transport/mine/${service.uuid}/`, body) : api.post('/transport/mine/', body)),
    {
      notifyOnError: false, // shown on the form
      onSuccess: (body) => {
        notify({ title: editing ? 'Saved' : `${towing ? 'Towing van' : 'Car hauler'} added`, body: body?.message });
        navigate('/transport');
      },
      onError: (error) => {
        setRefusal(error.message);
        const fields = { ...(error.fieldErrors || {}) };
        if (fields.base_lat || fields.base_lng) fields.base_address = fields.base_lat || fields.base_lng;
        setErrors(fields);
        focusFirst(fields);
      },
    }
  );

  function focusFirst(found) {
    const first = Object.keys(found).find((key) => found[key]);
    if (first) document.getElementById(`transport-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function submit(e) {
    e.preventDefault();
    if (save.loading) return;
    const found = validateServiceForm(form, kind, photoCount);
    setErrors(found);
    setRefusal('');
    if (Object.keys(found).length) return focusFirst(found);
    save.mutate(serviceFormData(form, kind, images));
  }

  const hasPoint = form.base_lat !== null && form.base_lat !== '' && form.base_lng !== null && form.base_lng !== '';

  return (
    <Box as="form" noValidate onSubmit={submit} w="100%" maxW="860px" py={6}>
      <BackButton to="/transport" />
      <Heading as="h1" size="lg">{editing ? `Edit ${words.one}` : words.add}</Heading>
      <Text color="gray.600" mt={1} mb={5}>
        {editing ? 'Changes show to customers as soon as you save.' : towing
          ? 'Customers nearby see your tow truck, its price and how far away it is.'
          : 'Customers see your car carrier, its price, how many cars it takes and the states it covers.'}
      </Text>

      {!editing && options?.verified === false && (
        <Alert status="info" borderRadius="md" mb={5}><AlertIcon /><AlertDescription>You can add it now. Customers will see it once your business is verified.</AlertDescription></Alert>
      )}

      <Stack spacing={5}>
        <Card title="About it">
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={Boolean(errors.title)}>
              <FormLabel htmlFor="transport-title">Name</FormLabel>
              <Input id="transport-title" maxLength={150} placeholder={towing ? 'e.g. 24/7 Tow Truck – Ikeja' : 'e.g. 6-car carrier – Lagos to Abuja'}
                value={form.title} onChange={(e) => setField('title', e.target.value)} />
              <FormErrorMessage>{errors.title}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={Boolean(errors.description)}>
              <FormLabel htmlFor="transport-description">Description (optional)</FormLabel>
              <Textarea id="transport-description" rows={4} maxLength={3000}
                placeholder={towing ? 'e.g. Flatbed tow truck, we come to you any time, day or night.' : 'e.g. Covered trailer, insured, door-to-door delivery.'}
                value={form.description} onChange={(e) => setField('description', e.target.value)} />
              {errors.description ? <FormErrorMessage>{errors.description}</FormErrorMessage> : <FormHelperText>{form.description.length}/3000 characters</FormHelperText>}
            </FormControl>
          </Stack>
        </Card>

        <Card title="Price" hint={towing ? 'A call-out fee, a price per km, or both. You send the exact price for each job as an invoice in the chat.' : 'The starting price customers see. You send the exact price for each job as an invoice in the chat.'}>
          {towing ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} id="transport-callout_fee">
              <NairaField id="transport-callout" label="Call-out fee" value={form.callout_fee} onChange={(v) => { setField('callout_fee', v); setErrors((e) => ({ ...e, per_km_fee: '' })); }}
                error={errors.callout_fee} helper="What you charge to come out." />
              <NairaField id="transport-perkm" label="Price per km" value={form.per_km_fee} onChange={(v) => { setField('per_km_fee', v); setErrors((e) => ({ ...e, callout_fee: '' })); }}
                error={errors.per_km_fee} helper="For each km you tow the car." />
            </SimpleGrid>
          ) : (
            <Stack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} id="transport-price">
                <NairaField id="transport-price-input" label="Starting price" isRequired value={form.price} onChange={(v) => setField('price', v)} error={errors.price} />
                <FormControl isRequired isInvalid={Boolean(errors.price_unit)}>
                  <FormLabel htmlFor="transport-unit" mb={1}>Charged</FormLabel>
                  <Select id="transport-unit" value={form.price_unit} onChange={(e) => setField('price_unit', e.target.value)}>
                    {units.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                  </Select>
                  <FormErrorMessage>{errors.price_unit}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
              <FormControl as="fieldset">
                <FormLabel as="legend">Fuel</FormLabel>
                <RadioGroup value={form.fuel_included ? 'included' : 'excluded'} onChange={(value) => setField('fuel_included', value === 'included')}>
                  <Stack direction={{ base: 'column', sm: 'row' }} spacing={{ base: 2, sm: 6 }}>
                    <Radio value="excluded">Fuel is extra</Radio>
                    <Radio value="included">Fuel is included in the price</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            </Stack>
          )}
        </Card>

        {!towing && (
          <Card title="The truck">
            <Stack spacing={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired isInvalid={Boolean(errors.truck_type)}>
                  <FormLabel htmlFor="transport-truck_type">Truck type</FormLabel>
                  <Select id="transport-truck_type" value={form.truck_type} onChange={(e) => setField('truck_type', e.target.value)}>
                    {truckTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </Select>
                  <FormErrorMessage>{errors.truck_type}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={Boolean(errors.capacity)}>
                  <FormLabel htmlFor="transport-capacity">Cars it carries</FormLabel>
                  <Input id="transport-capacity" inputMode="numeric" value={form.capacity} onChange={(e) => setField('capacity', e.target.value.replace(/\D/g, '').slice(0, 2))} />
                  {errors.capacity ? <FormErrorMessage>{errors.capacity}</FormErrorMessage> : <FormHelperText>From 1 to 20.</FormHelperText>}
                </FormControl>
              </SimpleGrid>
              <Box id="transport-states">
                <StatesPicker states={states} value={form.states} onChange={(value) => setField('states', value)} error={errors.states} />
              </Box>
            </Stack>
          </Card>
        )}

        <Card title="Where it's based" hint={towing ? 'Customers see how far your tow truck is from them, so put where it usually waits.' : 'Where the truck usually starts from.'} id="transport-base_address">
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={Boolean(errors.base_address)}>
              <FormLabel htmlFor="transport-address">Address</FormLabel>
              <Box borderWidth="1px" borderColor={errors.base_address ? 'red.400' : 'gray.200'} rounded="md"
                onInput={(e) => {
                  if (e.target?.id !== 'transport-address') return;
                  // typed without picking a suggestion: keep the text, drop the old map position
                  setForm((f) => ({ ...f, base_address: e.target.value, base_lat: null, base_lng: null }));
                  setErrors((er) => ({ ...er, base_address: '' }));
                }}>
                <CustomPlacesAutocomplete id="transport-address" value={form.base_address} placeholder="Search the address" aria-label="Address"
                  onPlaceChange={(place) => {
                    setForm((f) => ({
                      ...f, base_address: place.formatted_address, base_lat: place.lat, base_lng: place.lng,
                      base_state: matchState(place.state, states) || f.base_state,
                    }));
                    setErrors((er) => ({ ...er, base_address: '' }));
                  }} />
              </Box>
              {errors.base_address ? <FormErrorMessage>{errors.base_address}</FormErrorMessage>
                : <FormHelperText>{hasPoint ? 'Pinned on the map below.' : 'Pick a suggestion to put it on the map.'}</FormHelperText>}
            </FormControl>
            <FormControl isInvalid={Boolean(errors.base_state)} maxW={{ md: '50%' }}>
              <FormLabel htmlFor="transport-state">State</FormLabel>
              <Select id="transport-state" placeholder="Choose a state" value={form.base_state} onChange={(e) => setField('base_state', e.target.value)}>
                {states.map((state) => <option key={state} value={state}>{state}</option>)}
              </Select>
              <FormErrorMessage>{errors.base_state}</FormErrorMessage>
            </FormControl>
            <MapComponent style={{ height: '240px' }} location={hasPoint ? { lat: form.base_lat, lng: form.base_lng } : DEFAULT_MAP_CENTER}
              zoom={hasPoint ? 14 : 6} label="Map of where it's based" />
          </Stack>
        </Card>

        <Box id="transport-photos" borderWidth="1px" borderColor={errors.photos ? 'red.300' : 'gray.200'} borderRadius="xl" p={{ base: 4, md: 6 }} bg="white">
          <ImageUploader items={images} onChange={(next) => { setImages(next); setErrors((e) => ({ ...e, photos: '' })); }}
            limit={MAX_TRANSPORT_PHOTOS} error={errors.photos} title={towing ? 'Photos of the tow truck' : 'Photos of the truck'} subject="Truck" owner="truck" />
        </Box>

        <Card title="Shown to customers">
          <Stack spacing={4}>
            <FormControl display="flex" alignItems="center" gap={3}>
              <Switch id="transport-active" isChecked={form.active} onChange={(e) => setField('active', e.target.checked)} />
              <FormLabel htmlFor="transport-active" mb={0}>{form.active ? 'Customers can find and request it' : 'Hidden from customers'}</FormLabel>
            </FormControl>
            {towing && (
              <FormControl display="flex" alignItems="center" gap={3}>
                <Switch id="transport-available" colorScheme="green" isChecked={form.available_now} onChange={(e) => setField('available_now', e.target.checked)} />
                <FormLabel htmlFor="transport-available" mb={0}>{form.available_now ? 'Available now' : 'Not available now'}</FormLabel>
              </FormControl>
            )}
          </Stack>
        </Card>

        {refusal && <Alert status="error" borderRadius="md" role="alert"><AlertIcon /><AlertDescription>{refusal}</AlertDescription></Alert>}

        <Flex gap={3} justify="flex-end" direction={{ base: 'column-reverse', sm: 'row' }}>
          <Button as={RLink} to="/transport" variant="ghost">Cancel</Button>
          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} loadingText={editing ? 'Saving' : 'Adding'}>
            {editing ? 'Save changes' : words.add}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}

export default function TransportForm() {
  const { serviceId } = useParams();
  const editing = Boolean(serviceId);
  const { authUser } = useContext(GlobalStore);
  const words = useTransportWords(authUser?.user_type === 'dealer' ? 'hauler' : 'towing');

  useEffect(() => { document.title = `${editing ? `Edit ${words.one}` : words.add} | Motaa`; }, [editing, words]);

  const options = useApiQuery(
    (api, signal) => api.get('/transport/mine/', { signal }),
    [],
    { select: (body) => body?.data, keepAs: 'transport-mine' }
  );
  const serviceQuery = useApiQuery(
    (api, signal) => api.get(`/transport/mine/${serviceId}/`, { signal }),
    [serviceId],
    { enabled: editing, select: (body) => body?.data }
  );

  if ((options.loading && !options.data) || (editing && serviceQuery.loading && !serviceQuery.data)) return <LoadingState label="Loading…" minH="50vh" />;
  if (options.error && !options.data) return <ErrorState error={options.error} onRetry={options.reload} minH="50vh" />;
  if (editing && serviceQuery.error && !serviceQuery.data) {
    return (
      <Box py={8}>
        <ErrorState error={serviceQuery.error} onRetry={serviceQuery.reload} title={serviceQuery.error.isNotFound ? "We couldn't find this one" : undefined} />
        <Flex justify="center"><Button as={RLink} to="/transport" variant="link" color="primary">Back to your {words.plural.toLowerCase()}</Button></Flex>
      </Box>
    );
  }
  return <ServiceEditor key={serviceId || 'new'} service={editing ? serviceQuery.data : null} options={options.data} />;
}
