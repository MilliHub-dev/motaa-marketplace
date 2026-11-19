// /parts-store/parts/add and /parts-store/parts/:partId — add or edit a spare part.
import { EvToggle } from '../../../components/EvBadge';
import { useContext, useEffect, useId, useState } from 'react';
import { Link as RLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading,
  IconButton, Input, InputGroup, InputLeftAddon, Radio, RadioGroup, Select, SimpleGrid, Stack, Switch, Text, Textarea,
} from '@chakra-ui/react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/dashboard/ui';
import { Checklist, FormActions, FormSection, FormWithAside, PreviewCard } from '../../../components/dashboard/FormLayout';
import { GlobalStore } from '../../../App';
import { CAR_BRANDS, ImageUploader, useRevokePreviews } from '../../../components/forms';
import { BackButton } from '../../../components/nav';
import { ErrorState, LoadingState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import {
  FIRST_FITMENT_YEAR, MAX_PART_PHOTOS, emptyFitment, emptyPartForm, partFormData, partToForm, validatePartForm,
} from '../../../utils/parts';
import { usePartsShop } from './shop';

const MAX_FITMENTS = 60;

function Card({ title, hint, number, icon, children }) {
  return <FormSection number={number} icon={icon} title={title} description={hint}>{children}</FormSection>;
}

/** One "this part fits" row: make, model (optional), from year, to year (optional). */
function FitmentRow({ row, index, makesListId, onChange, onRemove, canRemove }) {
  const id = useId();
  const set = (key) => (e) => onChange({ ...row, [key]: key.startsWith('year') ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value });
  return (
    <Box role="group" aria-label={`Car ${index + 1}`} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={3}>
      <Flex justify="space-between" align="center" mb={2} minH={8}>
        <Text fontSize="sm" fontWeight="600">Car {index + 1}</Text>
        {canRemove && (
          <IconButton size="sm" variant="ghost" colorScheme="red" icon={<Trash2 size={16} />} aria-label={`Remove car ${index + 1}`} onClick={onRemove} />
        )}
      </Flex>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
        <FormControl isRequired>
          <FormLabel htmlFor={`${id}-make`} fontSize="sm" mb={1}>Make</FormLabel>
          <Input id={`${id}-make`} list={makesListId} maxLength={60} placeholder="e.g. Toyota" value={row.make} onChange={set('make')} />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor={`${id}-model`} fontSize="sm" mb={1}>Model (optional)</FormLabel>
          <Input id={`${id}-model`} maxLength={60} placeholder="e.g. Corolla" value={row.model} onChange={set('model')} />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor={`${id}-from`} fontSize="sm" mb={1}>Year from</FormLabel>
          <Input id={`${id}-from`} inputMode="numeric" placeholder="e.g. 2008" value={row.year_from} onChange={set('year_from')} />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor={`${id}-to`} fontSize="sm" mb={1}>Year to (optional)</FormLabel>
          <Input id={`${id}-to`} inputMode="numeric" placeholder="e.g. 2013" value={row.year_to} onChange={set('year_to')} />
        </FormControl>
      </SimpleGrid>
    </Box>
  );
}

function PartEditor({ part, options }) {
  const navigate = useNavigate();
  const { notify } = useContext(GlobalStore);
  const { shop, reload: reloadShop } = usePartsShop();
  const makesListId = useId();
  const editing = Boolean(part);
  const [form, setForm] = useState(() => (part ? partToForm(part) : emptyPartForm()));
  const [images, setImages] = useState(() => asList(part?.images).map((image) => ({ key: image.uuid, uuid: image.uuid, url: image.url })));
  const [errors, setErrors] = useState({});
  useRevokePreviews(images);

  const categories = asList(options?.categories);
  const conditions = asList(options?.conditions);
  const photoCount = images.filter((item) => !item.removed).length;
  const coverItem = images.find((item) => !item.removed);
  const coverImage = coverItem?.previewUrl || coverItem?.url;

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  }
  function setFitments(fitments) {
    setForm((f) => ({ ...f, fitments }));
    setErrors((e) => ({ ...e, fitments: '' }));
  }

  const save = useApiMutation(
    (api, body) => (editing ? api.patch(`/parts/seller/parts/${part.uuid}/`, body) : api.post('/parts/seller/parts/', body)),
    {
      errorTitle: editing ? "Couldn't save this part" : "Couldn't add this part",
      onSuccess: (body) => {
        notify({ title: editing ? 'Saved' : 'Part added', body: body?.message });
        reloadShop();
        navigate('/parts-store/parts');
      },
      onError: (error) => {
        const fields = error.fieldErrors || {};
        setErrors(fields);
        focusFirst(fields);
      },
    }
  );

  function focusFirst(found) {
    const first = Object.keys(found).find((key) => found[key]);
    if (first) document.getElementById(`part-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function submit(e) {
    e.preventDefault();
    if (save.loading) return;
    const found = validatePartForm(form, photoCount);
    setErrors(found);
    if (Object.keys(found).length) return focusFirst(found);
    save.mutate(partFormData(form, images));
  }

  return (
    <Box as="form" noValidate onSubmit={submit} w="100%">
      <BackButton to="/parts-store/parts" />
      <PageHeader title={editing ? 'Edit part' : 'Add a part'}
        subtitle={editing ? 'Changes show to customers as soon as you save.' : 'Clear photos, the exact part number and the cars it fits help customers buy with confidence.'} />

      {!editing && shop && !shop.verified && (
        <Alert status="info" borderRadius="16px" mb={5}><AlertIcon /><AlertDescription>You can add parts now. Customers will see them once your business is verified.</AlertDescription></Alert>
      )}

      <FormWithAside aside={(
        <>
          <PreviewCard label="How customers see it" image={coverImage} title={form.name}
            price={Number(String(form.price || '').replace(/[^\d.]/g, '')) > 0 ? `₦${Number(String(form.price).replace(/[^\d.]/g, '')).toLocaleString('en-NG')}` : ''}
            facts={[conditions.find((c) => c.value === form.condition)?.label, categories.find((c) => c.slug === form.category)?.name, form.brand,
              form.is_ev && 'EV part', form.stock !== '' && form.stock !== undefined && `${form.stock} in stock`]} placeholder="Your part's name shows here" />
          <Checklist title="Ready to sell?" items={[
            { label: 'Name', done: Boolean(form.name?.trim()) },
            { label: 'Category', done: Boolean(form.category) },
            { label: 'Price', done: Number(String(form.price || '').replace(/[^\d.]/g, '')) > 0 },
            { label: 'Stock', done: String(form.stock ?? '').trim() !== '' },
            { label: 'At least one photo', done: photoCount > 0 },
            { label: 'Cars it fits', done: form.universal || asList(form.fitments).some((row) => row.make) },
          ]} />
        </>
      )}>
        <Card number={1} title="About the part" hint="What it is and who made it.">
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={Boolean(errors.name)}>
              <FormLabel htmlFor="part-name">Name</FormLabel>
              <Input id="part-name" maxLength={200} placeholder="e.g. Front brake pads for Toyota Corolla" value={form.name} onChange={(e) => setField('name', e.target.value)} />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired isInvalid={Boolean(errors.category)}>
                <FormLabel htmlFor="part-category">Category</FormLabel>
                <Select id="part-category" placeholder="Choose a category" value={form.category} onChange={(e) => setField('category', e.target.value)}>
                  {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </Select>
                <FormErrorMessage>{errors.category}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={Boolean(errors.condition)}>
                <FormLabel htmlFor="part-condition">Condition</FormLabel>
                <Select id="part-condition" value={form.condition} onChange={(e) => setField('condition', e.target.value)}>
                  {conditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}
                </Select>
                <FormErrorMessage>{errors.condition}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.brand)}>
                <FormLabel htmlFor="part-brand">Brand (optional)</FormLabel>
                <Input id="part-brand" maxLength={100} placeholder="e.g. Bosch, Denso, Toyota Genuine" value={form.brand} onChange={(e) => setField('brand', e.target.value)} />
                <FormErrorMessage>{errors.brand}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.part_number)}>
                <FormLabel htmlFor="part-part_number">Part number (optional)</FormLabel>
                <Input id="part-part_number" maxLength={100} placeholder="e.g. 04465-02220" value={form.part_number} onChange={(e) => setField('part_number', e.target.value)} />
                <FormErrorMessage>{errors.part_number}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={Boolean(errors.description)}>
              <FormLabel htmlFor="part-description">Description (optional)</FormLabel>
              <Textarea id="part-description" rows={5} maxLength={4000} placeholder="What it is, what comes in the box and anything a buyer should know."
                value={form.description} onChange={(e) => setField('description', e.target.value)} />
              {errors.description ? <FormErrorMessage>{errors.description}</FormErrorMessage> : <FormHelperText>{form.description.length}/4000 characters</FormHelperText>}
            </FormControl>
          </Stack>
        </Card>

        <Card number={2} title="Price and stock" hint="What it costs, how many you have and any warranty.">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl isRequired isInvalid={Boolean(errors.price)}>
              <FormLabel htmlFor="part-price">Price</FormLabel>
              <InputGroup>
                <InputLeftAddon>₦</InputLeftAddon>
                <Input id="part-price" inputMode="decimal" placeholder="e.g. 42500" value={form.price} onChange={(e) => setField('price', e.target.value.replace(/[^\d.,]/g, ''))} />
              </InputGroup>
              {errors.price ? <FormErrorMessage>{errors.price}</FormErrorMessage> : <FormHelperText>For one item.</FormHelperText>}
            </FormControl>
            <FormControl isRequired isInvalid={Boolean(errors.stock)}>
              <FormLabel htmlFor="part-stock">In stock</FormLabel>
              <Input id="part-stock" inputMode="numeric" value={form.stock} onChange={(e) => setField('stock', e.target.value.replace(/\D/g, '').slice(0, 7))} />
              {errors.stock ? <FormErrorMessage>{errors.stock}</FormErrorMessage> : <FormHelperText>How many you can sell now.</FormHelperText>}
            </FormControl>
            <FormControl isInvalid={Boolean(errors.warranty)}>
              <FormLabel htmlFor="part-warranty">Warranty (optional)</FormLabel>
              <Input id="part-warranty" maxLength={120} placeholder="e.g. 6 months" value={form.warranty} onChange={(e) => setField('warranty', e.target.value)} />
              <FormErrorMessage>{errors.warranty}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>
        </Card>

        <Box id="part-images">
          <Card number={3} title="Photos" hint="Show the part clearly, including any part number or label.">
          <ImageUploader
            items={images}
            onChange={(next) => { setImages(next); setErrors((e) => ({ ...e, images: '' })); }}
            limit={MAX_PART_PHOTOS}
            error={errors.images}
            title="Photos of the part"
            subject="Part"
            owner="part"
          />
          </Card>
        </Box>


        <Box id="part-fitments">
          <Card number={4} title="Cars this part fits" hint="Customers filter parts by their car, so list every car this fits.">
            <RadioGroup value={form.universal ? 'any' : 'listed'} onChange={(value) => { setField('universal', value === 'any'); setErrors((e) => ({ ...e, fitments: '' })); }}>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={{ base: 2, sm: 6 }}>
                <Radio value="listed">It fits the cars I list</Radio>
                <Radio value="any">It fits any car</Radio>
              </Stack>
            </RadioGroup>

            {!form.universal && (
              <Stack spacing={3} mt={4}>
                <datalist id={makesListId}>{CAR_BRANDS.map((brand) => <option key={brand} value={brand} />)}</datalist>
                {form.fitments.map((row, index) => (
                  <FitmentRow
                    key={index}
                    row={row}
                    index={index}
                    makesListId={makesListId}
                    canRemove={form.fitments.length > 1}
                    onChange={(next) => setFitments(form.fitments.map((item, i) => (i === index ? next : item)))}
                    onRemove={() => setFitments(form.fitments.filter((_, i) => i !== index))}
                  />
                ))}
                {form.fitments.length < MAX_FITMENTS && (
                  <Button alignSelf="start" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setFitments([...form.fitments, emptyFitment()])}>
                    Add another car
                  </Button>
                )}
                <Text fontSize="sm" color="gray.600">Leave the model empty if it fits every model of that make. Years go from {FIRST_FITMENT_YEAR}; leave "Year to" empty if it still fits new cars.</Text>
              </Stack>
            )}
            {errors.fitments && <Text color="red.500" fontSize="sm" mt={3} role="alert">{errors.fitments}</Text>}
          </Card>
        </Box>

        <Card icon={Eye} title="On sale and EV">
          <Box mb={4}>
          <EvToggle
            isChecked={form.is_ev}
            onChange={(on) => setField('is_ev', on)}
            title="This is a part for electric vehicles"
            label="EV part"
            hint="e.g. a battery pack, charger, charging cable or electric motor. Customers can filter for EV parts."
          />
          </Box>
          <FormControl display="flex" alignItems="center" gap={3}>
            <Switch id="part-active" isChecked={form.active} onChange={(e) => setField('active', e.target.checked)} />
            <FormLabel htmlFor="part-active" mb={0}>{form.active ? 'Customers can see and buy this part' : 'Hidden from customers'}</FormLabel>
          </FormControl>
        </Card>

        <FormActions>
          <Button as={RLink} to="/parts-store/parts" h="52px" px={6} borderRadius="full" variant="outline" borderColor="#D6DBE3">Cancel</Button>
          <Button type="submit" h="52px" px={8} borderRadius="full" bg="#0B1220" color="white" _hover={{ bg: '#1F2937' }} isLoading={save.loading} loadingText={editing ? 'Saving' : 'Adding part'}>
            {editing ? 'Save changes' : 'Add part'}
          </Button>
        </FormActions>
      </FormWithAside>
    </Box>
  );
}

export default function PartsShopPartForm() {
  const { partId } = useParams();
  const editing = Boolean(partId);

  useEffect(() => { document.title = `${editing ? 'Edit part' : 'Add a part'} | Motaa parts shop`; }, [editing]);

  const options = useApiQuery(
    (api, signal, { useCache }) => api.get('/parts/seller/categories/', { signal, cacheTTL: useCache ? 300000 : 0 }),
    [],
    { select: (body) => body?.data }
  );
  const partQuery = useApiQuery(
    (api, signal) => api.get(`/parts/seller/parts/${partId}/`, { signal }),
    [partId],
    { enabled: editing, select: (body) => body?.data }
  );

  if ((options.loading && !options.data) || (editing && partQuery.loading && !partQuery.data)) return <LoadingState label="Loading…" minH="50vh" />;
  if (options.error && !options.data) return <ErrorState error={options.error} onRetry={options.reload} minH="50vh" />;
  if (editing && partQuery.error && !partQuery.data) {
    return (
      <Box py={8}>
        <ErrorState error={partQuery.error} onRetry={partQuery.reload} title={partQuery.error.isNotFound ? "We couldn't find this part" : undefined} />
        <Flex justify="center"><Button as={RLink} to="/parts-store/parts" variant="link" color="primary">Back to your parts</Button></Flex>
      </Box>
    );
  }
  // a new key gives a fresh form when moving between parts
  return <PartEditor key={partId || 'new'} part={editing ? partQuery.data : null} options={options.data} />;
}
