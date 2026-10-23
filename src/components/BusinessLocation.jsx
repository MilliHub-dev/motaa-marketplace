// "Business location" on every business settings page (mechanic, dealer, parts dealer): the exact map pin
// customers' distances and the mechanic service charge are measured from.
//   GET  /accounts/business-location/ → {address, city, state, lat, lng, has_pin}
//   POST /accounts/business-location/ {address, city?, state?, lat, lng, place_id?}
import { useState } from 'react';
import {
  Alert, AlertDescription, AlertIcon, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading,
  HStack, Skeleton, Text,
} from '@chakra-ui/react';
import { LocateFixed, MapPin } from 'lucide-react';
import { reversePlace } from '../api/geocode';
import { useApiMutation, useApiQuery } from '../hooks/useApi';
import {
  PRECISE_POSITION, accuracyNote, geolocationMessage, hasPin, locationErrors, locationPayload, locationToForm, placeToLocation,
} from '../utils/location';
import { CustomPlacesAutocomplete, MapComponent } from './maps';
import { ErrorState } from './states';

/**
 * "Use my current location": reads a fresh, precise device position, looks up its address text, and calls
 * `onLocated(place, point)` with the EXACT GPS point (the address is only a label). Shows its own messages.
 */
export function CurrentLocationButton({ onLocated, label = 'Use my current location', ...props }) {
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState('');

  function locate() {
    setMessage('');
    setWarning('');
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setMessage("This browser can't share your location. Search your address instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        const found = await reversePlace(point).catch(() => null);
        setLocating(false);
        setWarning(accuracyNote(position.coords.accuracy));
        onLocated({ ...(found || {}), formatted_address: found?.formatted_address || 'My current location', ...point }, point, position.coords.accuracy);
      },
      (error) => {
        setLocating(false);
        setMessage(geolocationMessage(error));
      },
      PRECISE_POSITION,
    );
  }

  return (
    <Box {...props}>
      <Button type="button" size="sm" variant="outline" borderColor="primary" color="primary" leftIcon={<LocateFixed size={16} />}
        onClick={locate} isLoading={locating} loadingText="Finding you…">
        {label}
      </Button>
      {message && <Text fontSize="sm" color="red.600" mt={2} role="alert">{message}</Text>}
      {warning && <Text fontSize="sm" color="orange.700" mt={2} role="status">{warning}</Text>}
    </Box>
  );
}

function LocationForm({ saved, onSaved }) {
  const [form, setForm] = useState(() => locationToForm(saved));
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [refusal, setRefusal] = useState('');
  const [changed, setChanged] = useState(false);
  const pinned = hasPin(form);
  const errors = locationErrors(form);
  const addressError = (submitted && errors.address) || serverErrors.address || '';
  const pinError = (submitted && errors.lat) || serverErrors.lat || '';

  const update = (next) => {
    setForm((current) => ({ ...current, ...next }));
    setChanged(true);
    setServerErrors({});
    setRefusal('');
  };

  const save = useApiMutation((api, body) => api.post('/accounts/business-location/', body), {
    notifyOnError: false,
    successMessage: (body) => body?.message || 'Business location saved.',
    onSuccess: (body) => { setChanged(false); setSubmitted(false); onSaved(body?.data); },
    onError: (error) => {
      const fields = error.fieldErrors || {};
      setServerErrors({ address: fields.address || '', lat: fields.lat || fields.lng || '' });
      if (!fields.address && !fields.lat && !fields.lng) setRefusal(error.message);
    },
  });

  function submit() {
    setSubmitted(true);
    if (errors.address || errors.lat || save.loading) return;
    save.mutate(locationPayload(form));
  }

  const area = [form.city, form.state].filter(Boolean).join(', ');

  return (
    <Box>
      {!saved?.has_pin && !pinned && (
        <Alert status="warning" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertDescription>Customers can't see how far you are until you set your location.</AlertDescription>
        </Alert>
      )}

      <FormControl isRequired isInvalid={Boolean(addressError)} mb={3}>
        <FormLabel htmlFor="business-location-search">Business address</FormLabel>
        <Box borderWidth="1px" borderRadius="md" borderColor={addressError ? 'red.500' : 'gray.200'}>
          <CustomPlacesAutocomplete
            id="business-location-search"
            aria-label="Search your business address"
            placeholder="Search your street, area or a landmark"
            value={form.address}
            onPlaceChange={(place) => update(placeToLocation(place))}
            // a typed address only changes the text; the pin stays where it is
            inputProps={{ onInput: (e) => update({ address: e.target.value }) }}
          />
        </Box>
        {addressError ? <FormErrorMessage>{addressError}</FormErrorMessage>
          : area ? <FormHelperText>{area}</FormHelperText> : null}
      </FormControl>

      <CurrentLocationButton
        label="Use my current location (stand at your workshop)"
        onLocated={(place, point) => update(placeToLocation(place, point))}
        mb={4}
      />

      <FormControl isInvalid={Boolean(pinError)}>
        <Box h={{ base: '220px', md: '260px' }} borderRadius="lg" overflow="hidden" borderWidth="1px" borderColor={pinError ? 'red.400' : 'gray.200'}>
          <MapComponent
            location={pinned ? { lat: form.lat, lng: form.lng } : null}
            zoom={pinned ? 16 : 11}
            label={pinned ? 'Map of your business location. Drag the pin or click the map to move it.' : 'Map: click where your business is to drop a pin'}
            onPinMove={(point) => update({ lat: point.lat, lng: point.lng, place_id: '' })}
            style={{ height: '100%' }}
            w="100%"
            h="100%"
          />
        </Box>
        {pinError ? <FormErrorMessage>{pinError}</FormErrorMessage> : (
          <FormHelperText>
            {pinned ? 'Drag the pin, or click the map, to put it exactly on your workshop.' : 'No pin yet: search your address, use your current location, or click the map.'}
          </FormHelperText>
        )}
      </FormControl>

      {refusal && <Alert status="error" borderRadius="md" mt={4}><AlertIcon /><AlertDescription>{refusal}</AlertDescription></Alert>}

      <Flex justify="flex-end" mt={4}>
        <Button type="button" onClick={submit} bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={save.loading} loadingText="Saving…"
          isDisabled={!changed && Boolean(saved?.has_pin)} w={{ base: 'full', sm: 'auto' }}>
          Save location
        </Button>
      </Flex>
    </Box>
  );
}

/** The "Business location" card. */
export default function BusinessLocation(props) {
  const query = useApiQuery((api, signal) => api.get('/accounts/business-location/', { signal }), [], { select: (body) => body?.data || {} });
  const saved = query.data;
  return (
    <Box as="section" aria-labelledby="business-location-heading" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 6 }} {...props}>
      <HStack spacing={2} mb={1}>
        <MapPin size={18} aria-hidden="true" />
        <Heading as="h2" size="md" id="business-location-heading">Business location</Heading>
      </HStack>
      <Text color="gray.600" fontSize="sm" mb={4}>
        Your exact pin on the map. Customers see how far you are from it{saved?.has_pin ? '' : ' once it is set'}, and travel charges are worked out from it.
      </Text>
      {!saved && query.loading ? (
        <Box aria-busy="true"><Skeleton h="40px" mb={3} /><Skeleton h="220px" borderRadius="lg" /></Box>
      ) : !saved && query.error ? (
        <ErrorState error={query.error} onRetry={query.reload} />
      ) : (
        <LocationForm
          key={`${saved?.lat ?? ''},${saved?.lng ?? ''},${saved?.address ?? ''}`}
          saved={saved}
          onSaved={(data) => { if (data) query.setData(data); query.reload(); }}
        />
      )}
    </Box>
  );
}
