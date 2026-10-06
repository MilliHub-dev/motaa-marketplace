// /parts-store/settings — open/close the shop and say how orders reach customers (PUT /parts/seller/store/).
import { useEffect, useState } from 'react';
import {
  Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, HStack, IconButton, Input, InputGroup,
  InputLeftAddon, Radio, RadioGroup, Select, Stack, Switch, Text, Textarea,
} from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useApiMutation } from '../../../hooks/useApi';
import { NIGERIAN_STATES } from '../../../data/nigeria';
import { storePayload, storeToForm, validateStoreForm } from '../../../utils/parts';
import { usePartsShop } from './shop';

const MAX_ZONES = 40;

function Card({ title, children }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 6 }} bg="white">
      <Heading as="h2" size="sm" mb={4}>{title}</Heading>
      {children}
    </Box>
  );
}

function Toggle({ id, label, hint, isChecked, onChange }) {
  return (
    <FormControl display="flex" alignItems="start" justifyContent="space-between" gap={4}>
      <Box>
        <FormLabel htmlFor={id} mb={0}>{label}</FormLabel>
        {hint && <Text fontSize="sm" color="gray.600">{hint}</Text>}
      </Box>
      <Switch id={id} isChecked={isChecked} onChange={(e) => onChange(e.target.checked)} mt={1} />
    </FormControl>
  );
}

const amountInput = (value) => value.replace(/[^\d.,]/g, '');

export default function PartsShopSettings() {
  const { shop, setShop } = usePartsShop();
  const [form, setForm] = useState(() => storeToForm(shop?.store));
  const [errors, setErrors] = useState({});

  useEffect(() => { document.title = 'Shop settings | Motaa parts shop'; }, []);

  const save = useApiMutation(
    (api, body) => api.put('/parts/seller/store/', body),
    {
      successMessage: 'Your shop settings were saved.',
      errorTitle: "Couldn't save your shop settings",
      onSuccess: (body) => {
        if (body?.data) {
          setShop(body.data);
          setForm(storeToForm(body.data.store));
        }
      },
      onError: (error) => setErrors(error.fieldErrors || {}),
    }
  );

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '', ...(name === 'offers_pickup' || name === 'delivers' ? { delivers: '' } : {}) }));
  }
  function setZones(zones) {
    setForm((f) => ({ ...f, zones }));
    setErrors((e) => ({ ...e, zones: '' }));
  }

  function submit(e) {
    e.preventDefault();
    if (save.loading) return;
    const found = validateStoreForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(storePayload(form));
  }

  const usedStates = form.zones.map((zone) => zone.state).filter(Boolean);

  return (
    <Box as="form" noValidate onSubmit={submit} w="100%" maxW="760px">
      <Box py={6} borderBottom="2px solid lavender" mb={5}>
        <Heading as="h1" size="md">Shop settings</Heading>
        <Text color="gray.600" fontSize="sm">Open or close your parts shop and choose how orders reach your customers.</Text>
      </Box>

      <Stack spacing={5}>
        <Card title="Your shop">
          <Toggle id="shop-active" label={form.active ? 'Your shop is open' : 'Your shop is closed'} isChecked={form.active} onChange={(value) => setField('active', value)}
            hint={form.active ? 'Customers can see and buy your parts.' : "Customers can't see your shop or its parts. Orders already placed still need to be completed."} />
        </Card>

        <Card title="Delivery">
          <Stack spacing={5}>
            <Toggle id="shop-delivers" label="I deliver orders" isChecked={form.delivers} onChange={(value) => setField('delivers', value)}
              hint="You arrange delivery yourself (your rider, a courier or a transport company) and charge your own fee." />
            {errors.delivers && <Text color="red.500" fontSize="sm" role="alert">{errors.delivers}</Text>}

            {form.delivers && (
              <>
                <FormControl as="fieldset">
                  <FormLabel as="legend">Where do you deliver?</FormLabel>
                  <RadioGroup value={form.delivers_nationwide ? 'all' : 'listed'} onChange={(value) => setField('delivers_nationwide', value === 'all')}>
                    <Stack spacing={2}>
                      <Radio value="all">Anywhere in Nigeria</Radio>
                      <Radio value="listed">Only to the states I list below</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {form.delivers_nationwide && (
                  <FormControl isRequired isInvalid={Boolean(errors.delivery_fee)} maxW="320px">
                    <FormLabel htmlFor="shop-fee">Delivery fee</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>₦</InputLeftAddon>
                      <Input id="shop-fee" inputMode="decimal" value={form.delivery_fee} onChange={(e) => setField('delivery_fee', amountInput(e.target.value))} />
                    </InputGroup>
                    {errors.delivery_fee
                      ? <FormErrorMessage>{errors.delivery_fee}</FormErrorMessage>
                      : <FormHelperText>Charged once per order, for every state without its own fee below. Enter 0 for free delivery.</FormHelperText>}
                  </FormControl>
                )}

                <Box role="group" aria-labelledby="zones-title">
                  <Text id="zones-title" fontWeight="500">{form.delivers_nationwide ? 'Different fee for some states (optional)' : 'States you deliver to'}</Text>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    {form.delivers_nationwide ? 'For example, a lower fee in your own state.' : 'Customers in other states can only order for pickup, if you offer it.'}
                  </Text>
                  <Stack spacing={3}>
                    {form.zones.map((zone, index) => (
                      <HStack key={index} align="end" spacing={2}>
                        <FormControl flex={1.4} minW={0}>
                          <FormLabel htmlFor={`zone-state-${index}`} fontSize="sm" mb={1}>State</FormLabel>
                          <Select id={`zone-state-${index}`} placeholder="Choose a state" value={zone.state}
                            onChange={(e) => setZones(form.zones.map((item, i) => (i === index ? { ...item, state: e.target.value } : item)))}>
                            {/* a state saved earlier that is not in our list stays selectable */}
                            {zone.state && !NIGERIAN_STATES.includes(zone.state) && <option value={zone.state}>{zone.state}</option>}
                            {NIGERIAN_STATES.map((state) => (
                              <option key={state} value={state} disabled={state !== zone.state && usedStates.includes(state)}>{state}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl flex={1} minW={0}>
                          <FormLabel htmlFor={`zone-fee-${index}`} fontSize="sm" mb={1}>Fee (₦)</FormLabel>
                          <Input id={`zone-fee-${index}`} inputMode="decimal" value={zone.fee}
                            onChange={(e) => setZones(form.zones.map((item, i) => (i === index ? { ...item, fee: amountInput(e.target.value) } : item)))} />
                        </FormControl>
                        <IconButton variant="ghost" colorScheme="red" icon={<Trash2 size={16} />} aria-label={`Remove ${zone.state || 'this state'}`}
                          onClick={() => setZones(form.zones.filter((_, i) => i !== index))} />
                      </HStack>
                    ))}
                    {form.zones.length < MAX_ZONES && (
                      <Button alignSelf="start" size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => setZones([...form.zones, { state: '', fee: '' }])}>
                        Add a state
                      </Button>
                    )}
                    {errors.zones && <Text color="red.500" fontSize="sm" role="alert">{errors.zones}</Text>}
                  </Stack>
                </Box>

                <FormControl isInvalid={Boolean(errors.delivery_days)} maxW="420px">
                  <FormLabel htmlFor="shop-days">How long delivery takes (optional)</FormLabel>
                  <Input id="shop-days" maxLength={60} placeholder="e.g. 1-3 working days" value={form.delivery_days} onChange={(e) => setField('delivery_days', e.target.value)} />
                  {errors.delivery_days ? <FormErrorMessage>{errors.delivery_days}</FormErrorMessage> : <FormHelperText>Shown to customers on your parts and at checkout.</FormHelperText>}
                </FormControl>
              </>
            )}
          </Stack>
        </Card>

        <Card title="Pickup">
          <Stack spacing={4}>
            <Toggle id="shop-pickup" label="Customers can collect orders from me" isChecked={form.offers_pickup} onChange={(value) => setField('offers_pickup', value)}
              hint="Pickup is free for the customer. You mark the order ready, then collected." />
            {form.offers_pickup && (
              <FormControl isRequired isInvalid={Boolean(errors.pickup_address)}>
                <FormLabel htmlFor="shop-pickup-address">Pickup address</FormLabel>
                <Textarea id="shop-pickup-address" rows={2} maxLength={300} placeholder="e.g. Shop 14, Ladipo Market, Mushin, Lagos"
                  value={form.pickup_address} onChange={(e) => setField('pickup_address', e.target.value)} />
                <FormErrorMessage>{errors.pickup_address}</FormErrorMessage>
              </FormControl>
            )}
          </Stack>
        </Card>

        <Flex justify="flex-end">
          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} loadingText="Saving…" w={{ base: 'full', sm: 'auto' }}>
            Save changes
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
