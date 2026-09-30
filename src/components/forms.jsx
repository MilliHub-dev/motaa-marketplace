// Building blocks for the dealer "add / edit listing" wizard.
// Option values mirror the backend choices in listings/models.py (Vehicle).
import {
  Box,
  VStack,
  HStack,
  Flex,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Select,
  Image,
  IconButton,
  Progress,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Badge,
  Heading,
  SimpleGrid,
  UnorderedList,
  ListItem,
  Wrap,
  WrapItem,
  VisuallyHidden,
} from "@chakra-ui/react";
import { CloseIcon, CheckIcon } from "@chakra-ui/icons";
import { AlertTriangle, Zap, Gauge, Settings, Upload, ImageOff, Undo2, Car, DoorOpen, Users } from "lucide-react";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { GlobalStore } from '../App';

// ---------------------------------------------------------------------------
// Options (values = backend choice codes)
// ---------------------------------------------------------------------------

export const LISTING_OPTIONS = {
  condition: [
    { value: 'new', label: 'Brand new' },
    { value: 'used-foreign', label: 'Foreign used (Tokunbo)' },
    { value: 'used-local', label: 'Nigerian used' },
  ],
  vehicle_type: [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'truck', label: 'Truck / Pickup' },
  ],
  fuel_system: [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'electric', label: 'Electric' },
  ],
  transmission: [
    { value: 'auto', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
  ],
  drivetrain: [
    { value: 'FWD', label: 'FWD (front-wheel drive)' },
    { value: 'AWD', label: 'AWD (all-wheel drive)' },
    { value: '4WD', label: '4WD (four-wheel drive)' },
  ],
  payment_cycle: [
    { value: 'day', label: 'Per day' },
    { value: 'week', label: 'Per week' },
    { value: 'month', label: 'Per month' },
    { value: 'year', label: 'Per year' },
  ],
  doors: ['2', '3', '4', '5'].map((v) => ({ value: v, label: v })),
  seats: ['2', '4', '5', '7', '8'].map((v) => ({ value: v, label: v })),
};

export const CAR_FEATURES = [
  'Air Conditioning', 'Keyless Entry', 'Apple CarPlay', 'Android Auto', 'Parking Camera',
  'Baby Seat', 'USB-C Charging', 'Lane Assist', 'Auto Drive', 'Sun Roof',
];

export const CAR_BRANDS = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Dodge", "Ferrari", "Fiat", "Ford",
  "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Innoson", "Jaguar", "Jeep", "Kia", "Lamborghini",
  "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "Mini", "Mitsubishi", "Nissan", "Peugeot", "Porsche", "Ram", "Renault", "Rolls-Royce",
  "Saab", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

export const MAX_LISTING_IMAGES = 12;
export const MAX_IMAGE_MB = 5;

/** Human label for a choice code (falls back to the raw value). */
export function optionLabel(field, value) {
  if (value === null || value === undefined || value === '') return '';
  const match = LISTING_OPTIONS[field]?.find((o) => String(o.value).toLowerCase() === String(value).toLowerCase());
  return match ? match.label : String(value);
}

// Map a backend value that may be a display label ("Automatic", "Foreign Used") to our code.
const LEGACY_LABELS = {
  condition: { 'foreign used': 'used-foreign', 'local used': 'used-local', new: 'new' },
  transmission: { automatic: 'auto', manual: 'manual' },
  fuel_system: { petrol: 'petrol', diesel: 'diesel', hybrid: 'hybrid', electric: 'electric' },
};
function toCode(field, ...candidates) {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === '') continue;
    const text = String(candidate).toLowerCase();
    const option = LISTING_OPTIONS[field]?.find((o) => String(o.value).toLowerCase() === text || o.label.toLowerCase() === text);
    if (option) return option.value;
    if (LEGACY_LABELS[field]?.[text]) return LEGACY_LABELS[field][text];
  }
  return '';
}

export function emptyListingForm(listingType = 'sale') {
  return {
    listing_type: listingType,
    title: '', brand: '', model: '', vin: '', price: '',
    payment_cycle: 'day',
    condition: '', vehicle_type: '', fuel_system: '', transmission: '', drivetrain: '',
    doors: '4', seats: '5', mileage: '', color: '',
    features: [], notes: '',
  };
}

/** Flatten a listing from the API into the wizard's form shape. */
export function listingToForm(listing) {
  const vehicle = listing?.vehicle || {};
  const form = emptyListingForm(listing?.listing_type === 'rental' ? 'rental' : 'sale');
  const text = (v) => (v === null || v === undefined ? '' : String(v));
  return {
    ...form,
    title: text(listing?.title || vehicle.name),
    brand: text(vehicle.brand),
    model: text(vehicle.model),
    vin: text(vehicle.vin),
    price: listing?.price !== null && listing?.price !== undefined ? String(Number(listing.price) || '') : '',
    payment_cycle: toCode('payment_cycle', listing?.payment_cycle) || 'day',
    condition: toCode('condition', vehicle.condition_code, vehicle.condition),
    vehicle_type: toCode('vehicle_type', vehicle.type),
    fuel_system: toCode('fuel_system', vehicle.fuel_system_code, vehicle.fuel_system),
    transmission: toCode('transmission', vehicle.transmission_code, vehicle.transmission),
    drivetrain: toCode('drivetrain', vehicle.drivetrain),
    doors: text(vehicle.doors || '4'),
    seats: text(vehicle.seats || '5'),
    mileage: text(vehicle.mileage).replace(/[^\d]/g, ''),
    color: text(vehicle.color === 'None' || vehicle.color === 'Not specified' ? '' : vehicle.color),
    features: Array.isArray(vehicle.features) ? vehicle.features.filter((f) => typeof f === 'string' && f.length > 1) : [],
    notes: text(listing?.notes),
  };
}

/** Existing server images → uploader items. */
export function imagesFromListing(listing) {
  const images = Array.isArray(listing?.vehicle?.images) ? listing.vehicle.images : [];
  return images.filter((img) => img?.url).map((img) => ({ key: `server-${img.uuid || img.id}`, uuid: img.uuid, url: img.url }));
}

const REQUIRED = ['title', 'brand', 'model', 'vin', 'price', 'condition', 'vehicle_type', 'fuel_system', 'transmission', 'drivetrain', 'doors', 'seats', 'mileage'];

/** Returns { field: message } for anything that must be fixed before saving. */
export function validateListingForm(form) {
  const errors = {};
  for (const field of REQUIRED) {
    if (!String(form?.[field] ?? '').trim()) errors[field] = 'This field is required.';
  }
  const price = Number(form?.price);
  if (!errors.price && (!Number.isFinite(price) || price <= 0)) errors.price = 'Enter a price greater than ₦0.';
  const mileage = Number(form?.mileage);
  if (!errors.mileage && (!Number.isFinite(mileage) || mileage < 0)) errors.mileage = 'Enter the mileage in km (0 or more).';
  if (form?.listing_type === 'rental' && !form?.payment_cycle) errors.payment_cycle = 'Choose how often renters pay.';
  if (String(form?.title || '').length > 200) errors.title = 'Keep the title under 200 characters.';
  if (String(form?.notes || '').length > 700) errors.notes = 'Keep notes under 700 characters.';
  return errors;
}

/** The request body the dealership listing endpoints expect. */
export function listingPayload(form) {
  const payload = {};
  for (const key of ['listing_type', 'title', 'brand', 'model', 'vin', 'price', 'condition', 'vehicle_type',
    'fuel_system', 'transmission', 'drivetrain', 'doors', 'seats', 'mileage', 'color', 'notes']) {
    payload[key] = typeof form[key] === 'string' ? form[key].trim() : form[key];
  }
  payload.features = Array.isArray(form.features) ? form.features : [];
  if (form.listing_type === 'rental') payload.payment_cycle = form.payment_cycle;
  return payload;
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

export function StepIndicator({ steps, currentStep }) {
  return (
    <Box w="full" maxW="600px" mx="auto" mb={4} as="nav" aria-label="Progress">
      <HStack as="ol" justify="space-between" mb={2} listStyleType="none" spacing={2}>
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <VStack as="li" key={step} spacing={2} flex={1} aria-current={active ? 'step' : undefined}>
              <Flex
                w="28px" h="28px" borderRadius="full" align="center" justify="center"
                borderWidth="2px" borderColor={index <= currentStep ? 'primary' : 'gray.300'}
                bg={done ? 'primary' : 'white'} color="white" fontSize="xs"
              >
                {done ? <CheckIcon boxSize={3} aria-hidden="true" /> : <Box w={3} h={3} borderRadius="full" bg={active ? 'primary' : 'gray.300'} />}
              </Flex>
              <Text fontSize="sm" textAlign="center" color={index <= currentStep ? 'gray.800' : 'gray.500'} fontWeight={active ? '600' : 'normal'}>
                {step}
                <VisuallyHidden>{done ? ' (completed)' : active ? ' (current step)' : ''}</VisuallyHidden>
              </Text>
            </VStack>
          );
        })}
      </HStack>
      <Progress value={steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 100} size="xs" colorScheme="blue" borderRadius="full" aria-hidden="true" />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Details form
// ---------------------------------------------------------------------------

function SelectField({ field, label, form, errors, onChange, placeholder, isRequired = true, options, helper }) {
  return (
    <FormControl isRequired={isRequired} isInvalid={Boolean(errors?.[field])}>
      <FormLabel>{label}</FormLabel>
      <Select
        name={field}
        placeholder={placeholder}
        value={form[field] ?? ''}
        onChange={(e) => onChange(field, e.target.value)}
      >
        {(options || LISTING_OPTIONS[field]).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      {helper && !errors?.[field] && <FormHelperText>{helper}</FormHelperText>}
      <FormErrorMessage>{errors?.[field]}</FormErrorMessage>
    </FormControl>
  );
}

function FeaturePicker({ value, onChange }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (feature) => onChange(
    selected.includes(feature) ? selected.filter((f) => f !== feature) : [...selected, feature]
  );
  return (
    <FormControl as="fieldset">
      <FormLabel as="legend">Features <Text as="span" color="gray.500" fontWeight="normal" fontSize="sm">(optional)</Text></FormLabel>
      <Wrap spacing={2}>
        {CAR_FEATURES.map((feature) => {
          const on = selected.includes(feature);
          return (
            <WrapItem key={feature}>
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
                onClick={() => toggle(feature)}
              >
                {feature}
              </Button>
            </WrapItem>
          );
        })}
      </Wrap>
    </FormControl>
  );
}

/** One form for both sale and rental listings. `onChange(field, value)`. */
export function ListingDetailsForm({ form, errors = {}, onChange }) {
  const isRental = form.listing_type === 'rental';
  const brands = form.brand && !CAR_BRANDS.includes(form.brand) ? [form.brand, ...CAR_BRANDS] : CAR_BRANDS;

  return (
    <VStack spacing={6} align="stretch" w="full">
      <FormControl isRequired isInvalid={Boolean(errors.title)}>
        <FormLabel>Listing title</FormLabel>
        <Input
          name="title"
          placeholder="e.g. 2019 Toyota Camry XLE"
          maxLength={200}
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
        />
        <FormErrorMessage>{errors.title}</FormErrorMessage>
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <SelectField
          field="brand" label="Make" placeholder="Select make" form={form} errors={errors} onChange={onChange}
          options={brands.map((b) => ({ value: b, label: b }))}
        />

        <FormControl isRequired isInvalid={Boolean(errors.model)}>
          <FormLabel>Model</FormLabel>
          <Input name="model" placeholder="e.g. Camry" value={form.model} onChange={(e) => onChange('model', e.target.value)} />
          <FormErrorMessage>{errors.model}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={Boolean(errors.price)}>
          <FormLabel>{isRental ? 'Rental price' : 'Price'}</FormLabel>
          <InputGroup>
            <InputLeftAddon>₦</InputLeftAddon>
            <Input
              name="price"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={isRental ? 'e.g. 45000' : 'e.g. 18500000'}
              value={form.price}
              onChange={(e) => onChange('price', e.target.value)}
            />
          </InputGroup>
          <FormErrorMessage>{errors.price}</FormErrorMessage>
        </FormControl>

        {isRental && (
          <SelectField field="payment_cycle" label="Rental period" form={form} errors={errors} onChange={onChange}
            helper="How often the rental price is charged." />
        )}

        <SelectField field="condition" label="Condition" placeholder="Choose condition" form={form} errors={errors} onChange={onChange} />

        <FormControl isRequired isInvalid={Boolean(errors.vin)}>
          <FormLabel>VIN / chassis number</FormLabel>
          <Input name="vin" placeholder="17-character VIN" value={form.vin} onChange={(e) => onChange('vin', e.target.value.toUpperCase())} />
          <FormErrorMessage>{errors.vin}</FormErrorMessage>
        </FormControl>

        <SelectField field="vehicle_type" label="Body type" placeholder="Select body type" form={form} errors={errors} onChange={onChange} />
        <SelectField field="fuel_system" label="Fuel" placeholder="Select fuel type" form={form} errors={errors} onChange={onChange} />
        <SelectField field="transmission" label="Transmission" placeholder="Select transmission" form={form} errors={errors} onChange={onChange} />
        <SelectField field="drivetrain" label="Drive train" placeholder="Select drive train" form={form} errors={errors} onChange={onChange} />
        <SelectField field="doors" label="Doors" form={form} errors={errors} onChange={onChange} />
        <SelectField field="seats" label="Seats" form={form} errors={errors} onChange={onChange} />

        <FormControl isRequired isInvalid={Boolean(errors.mileage)}>
          <FormLabel>Mileage</FormLabel>
          <InputGroup>
            <Input
              name="mileage"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 45000"
              value={form.mileage}
              onChange={(e) => onChange('mileage', e.target.value)}
            />
            <InputRightAddon>km</InputRightAddon>
          </InputGroup>
          <FormErrorMessage>{errors.mileage}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={Boolean(errors.color)}>
          <FormLabel>Colour <Text as="span" color="gray.500" fontWeight="normal" fontSize="sm">(optional)</Text></FormLabel>
          <Input name="color" placeholder="e.g. Silver" value={form.color} onChange={(e) => onChange('color', e.target.value)} />
          <FormErrorMessage>{errors.color}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>

      <FeaturePicker value={form.features} onChange={(features) => onChange('features', features)} />

      <FormControl isInvalid={Boolean(errors.notes)}>
        <FormLabel>Seller notes <Text as="span" color="gray.500" fontWeight="normal" fontSize="sm">(optional)</Text></FormLabel>
        <Textarea
          name="notes"
          placeholder="Service history, extras, anything a buyer should know…"
          value={form.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          maxLength={700}
        />
        {errors.notes
          ? <FormErrorMessage>{errors.notes}</FormErrorMessage>
          : <FormHelperText>{String(form.notes || '').length}/700 characters</FormHelperText>}
      </FormControl>
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Image uploader (controlled)
// ---------------------------------------------------------------------------

/**
 * items: [{ key, file?, previewUrl?, uuid?, url?, removed? }]
 * New files get previewUrl; server images have uuid+url. Removing a server image only
 * marks it (`removed: true`) — the page deletes it when the dealer saves the step.
 */
export function ImageUploader({ items, onChange, limit = MAX_LISTING_IMAGES, maxMb = MAX_IMAGE_MB, error }) {
  const inputId = useId();
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState('');
  const kept = items.filter((item) => !item.removed);
  const remaining = Math.max(0, limit - kept.length);

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const issues = [];
    const accepted = [];
    for (const file of files) {
      if (!file.type?.startsWith('image/')) { issues.push(`${file.name} isn't an image.`); continue; }
      if (file.size > maxMb * 1024 * 1024) { issues.push(`${file.name} is larger than ${maxMb} MB.`); continue; }
      if (accepted.length >= remaining) { issues.push(`Only ${limit} photos are allowed per listing.`); break; }
      accepted.push({ key: `new-${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`, file, previewUrl: URL.createObjectURL(file) });
    }
    setProblem(issues.join(' '));
    if (accepted.length) onChange([...items, ...accepted]);
  }

  function remove(item) {
    if (item.uuid) {
      onChange(items.map((i) => (i.key === item.key ? { ...i, removed: true } : i)));
    } else {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      onChange(items.filter((i) => i.key !== item.key));
    }
  }

  function restore(item) {
    if (kept.length >= limit) return setProblem(`Only ${limit} photos are allowed per listing.`);
    onChange(items.map((i) => (i.key === item.key ? { ...i, removed: false } : i)));
  }

  const message = problem || error;

  return (
    <VStack spacing={3} align="stretch" w="full">
      <Box>
        <Text fontWeight="600">Photos of the car</Text>
        <Text fontSize="sm" color="gray.600">
          Add up to {limit} clear photos (JPG, PNG or WebP, max {maxMb} MB each). The first photo is the cover.
        </Text>
      </Box>

      <Box
        as="label"
        htmlFor={inputId}
        display="block"
        w="full"
        py={8}
        px={4}
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="lg"
        borderColor={dragging ? 'primary' : message ? 'red.300' : 'gray.300'}
        bg={dragging ? 'blue.50' : 'gray.50'}
        cursor={remaining ? 'pointer' : 'not-allowed'}
        opacity={remaining ? 1 : 0.6}
        textAlign="center"
        _focusWithin={{ borderColor: 'primary', boxShadow: 'outline' }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (remaining) addFiles(e.dataTransfer.files); }}
      >
        <VStack spacing={1}>
          <Upload size={24} aria-hidden="true" />
          <Text color="primary" fontWeight="600">{remaining ? 'Click to choose photos' : 'Photo limit reached'}</Text>
          <Text fontSize="sm" color="gray.600">{remaining ? `or drag and drop · ${remaining} of ${limit} left` : `Remove a photo to add another.`}</Text>
        </VStack>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={!remaining}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </Box>

      {message && <Text color="red.500" fontSize="sm" role="alert">{message}</Text>}

      {items.length > 0 && (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3}>
          {items.map((item) => {
            const position = kept.indexOf(item) + 1;
            return (
              <Box key={item.key} position="relative" borderRadius="lg" overflow="hidden" borderWidth={1} opacity={item.removed ? 0.45 : 1}>
                <Image src={item.previewUrl || item.url} alt={item.removed ? 'Photo marked for removal' : `Car photo ${position}`} h="110px" w="100%" objectFit="cover" />
                {!item.removed && (
                  <Badge position="absolute" top={2} left={2} borderRadius="full" px={2} bg="whiteAlpha.900" color="gray.800">
                    {position === 1 ? 'Cover' : position}
                  </Badge>
                )}
                {item.removed ? (
                  <Button size="xs" position="absolute" bottom={2} left={2} right={2} leftIcon={<Undo2 size={12} />} onClick={() => restore(item)}>
                    Keep photo
                  </Button>
                ) : (
                  <IconButton
                    size="sm"
                    position="absolute"
                    top={2}
                    right={2}
                    borderRadius="full"
                    colorScheme="red"
                    icon={<CloseIcon boxSize={2.5} />}
                    aria-label={`Remove photo ${position}`}
                    onClick={() => remove(item)}
                  />
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      )}
      {items.some((i) => i.removed) && (
        <Text fontSize="sm" color="gray.600">Faded photos will be deleted when you continue.</Text>
      )}
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------

export function ListingReviewCard({ form, images = [] }) {
  const { commaInt } = useContext(GlobalStore);
  const cover = images.find((i) => !i.removed);
  const isRental = form.listing_type === 'rental';
  const specs = [
    { icon: Gauge, label: form.mileage !== '' ? `${commaInt(form.mileage)} km` : null },
    { icon: Settings, label: optionLabel('transmission', form.transmission) },
    { icon: Zap, label: optionLabel('fuel_system', form.fuel_system) },
    { icon: Car, label: [optionLabel('vehicle_type', form.vehicle_type), form.drivetrain].filter(Boolean).join(' · ') },
    { icon: DoorOpen, label: form.doors ? `${form.doors} doors` : null },
    { icon: Users, label: form.seats ? `${form.seats} seats` : null },
  ].filter((s) => s.label);

  return (
    <VStack spacing={6} align="stretch" maxW="640px" mx="auto" w="full">
      <Box borderWidth={1} borderRadius="lg" overflow="hidden" bg="white">
        {cover ? (
          <Image src={cover.previewUrl || cover.url} alt={`Cover photo of ${form.title || 'the car'}`} w="full" h={{ base: '220px', md: '300px' }} objectFit="cover" />
        ) : (
          <Flex h="200px" bg="gray.100" align="center" justify="center" color="gray.500" direction="column" gap={2}>
            <ImageOff aria-hidden="true" />
            <Text fontSize="sm">No photos yet</Text>
          </Flex>
        )}
        <Box p={{ base: 4, md: 6 }}>
          <Flex justify="space-between" gap={4} mb={4} wrap="wrap">
            <VStack align="start" spacing={1} minW={0}>
              <Heading as="h3" fontSize="lg">{form.title}</Heading>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme={isRental ? 'purple' : 'blue'}>{isRental ? 'Rental' : 'For sale'}</Badge>
                {form.condition && <Badge colorScheme="gray">{optionLabel('condition', form.condition)}</Badge>}
              </HStack>
              <Text fontSize="sm" color="gray.600">{[form.brand, form.model, form.color].filter(Boolean).join(' · ')}</Text>
            </VStack>
            <Text fontSize="xl" fontWeight="bold" color="primary">
              ₦{commaInt(form.price)}{isRental && <Text as="span" fontSize="sm" color="gray.600" fontWeight="normal"> {optionLabel('payment_cycle', form.payment_cycle).toLowerCase()}</Text>}
            </Text>
          </Flex>

          <Wrap spacing={4} mb={form.features?.length || form.notes ? 4 : 0}>
            {specs.map(({ icon: Icon, label }) => (
              <WrapItem key={label} alignItems="center" gap={1.5} color="gray.700" fontSize="sm">
                <Icon size={16} aria-hidden="true" /> {label}
              </WrapItem>
            ))}
          </Wrap>

          {form.features?.length > 0 && (
            <Wrap spacing={2} mb={form.notes ? 4 : 0}>
              {form.features.map((f) => <WrapItem key={f}><Badge variant="subtle" colorScheme="green" textTransform="none">{f}</Badge></WrapItem>)}
            </Wrap>
          )}
          {form.notes && <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{form.notes}</Text>}
          <Text fontSize="xs" color="gray.500" mt={4}>VIN: {form.vin}</Text>
        </Box>
      </Box>

      <Box p={4} bg="orange.50" borderRadius="md" borderLeftWidth={4} borderLeftColor="orange.400">
        <HStack align="start">
          <Box color="orange.500" pt={0.5}><AlertTriangle size={18} aria-hidden="true" /></Box>
          <Box>
            <Text fontWeight="600">Motaa reviews every listing before it goes live (usually 2–24 hours).</Text>
            <UnorderedList fontSize="sm" color="gray.600" mt={2}>
              <ListItem>To avoid duplicate listings.</ListItem>
              <ListItem>To confirm the vehicle is genuine.</ListItem>
              <ListItem>To build customer trust in your listings.</ListItem>
            </UnorderedList>
          </Box>
        </HStack>
      </Box>
    </VStack>
  );
}

/** Revoke object URLs for new images when the wizard unmounts. */
export function useRevokePreviews(items) {
  const ref = useRef(items);
  ref.current = items;
  useEffect(() => () => {
    for (const item of ref.current || []) if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }, []);
}
