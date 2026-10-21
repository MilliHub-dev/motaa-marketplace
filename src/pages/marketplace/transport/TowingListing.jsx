// /towing — "Find a towing van near you": nearest first from the device location or a searched place
// (?lat=&lng=&near=), available vans only unless ?all=1, with a map (expandable) of the vans listed.
import {
  Alert, AlertIcon, Box, Button, Container, Flex, FormControl, FormLabel, Heading, HStack, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalHeader, ModalOverlay, Skeleton, Stack, Switch, Text, useDisclosure,
} from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Maximize2, Truck } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { PageControls } from '../../../components';
import { ChatPopup } from '../../../components/chat';
import { CustomPlacesAutocomplete, DEFAULT_MAP_CENTER, MapComponent } from '../../../components/maps';
import { AsyncState, EmptyState } from '../../../components/states';
import { AvailableBadge, ContactButtons, PhoneAfterBookingHint, TransportPhoto } from '../../../components/transport';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { TRANSPORT_PAGE_SIZE, distanceLabel, servicePath, towingApiQuery } from '../../../utils/transport';

export function TransportListSkeleton() {
  return (
    <Stack spacing={4} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <Flex key={i} gap={4} p={4} borderWidth="1px" borderColor="gray.100" borderRadius="xl">
          <Skeleton w={{ base: '96px', md: '140px' }} h={{ base: '80px', md: '100px' }} borderRadius="lg" />
          <Box flex={1}>
            <Skeleton h="16px" w="60%" mb={3} />
            <Skeleton h="14px" w="40%" mb={3} />
            <Skeleton h="12px" w="70%" />
          </Box>
        </Flex>
      ))}
    </Stack>
  );
}

/** Where to search from: a picked place (in the URL), else the device location. */
export function useSearchPoint(params) {
  const urlLat = parseFloat(params.get('lat'));
  const urlLng = parseFloat(params.get('lng'));
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState('locating');
  const picked = Number.isFinite(urlLat) && Number.isFinite(urlLng) ? { lat: urlLat, lng: urlLng } : null;

  useEffect(() => {
    if (!('geolocation' in navigator)) { setGeoStatus('unsupported'); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus('ok');
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const point = picked || deviceLocation;
  const name = params.get('near') || (picked ? 'Selected location' : deviceLocation ? 'your location' : 'Nigeria');
  return { picked, deviceLocation, geoStatus, point, name, ready: Boolean(picked) || geoStatus !== 'locating' };
}

function TowingCard({ service, onMessage, loginPath }) {
  const distance = distanceLabel(service?.distance_km, service?.drive_minutes);
  const path = servicePath(service);
  const business = service?.business || {};
  return (
    <Box as="li" p={4} borderWidth="1px" borderColor="gray.200" borderRadius="xl" bg="white" data-testid="towing-card">
      <Flex gap={4} align="start">
        <TransportPhoto as={RLink} to={path} src={service?.image} alt={service?.title || 'Towing van'}
          w={{ base: '96px', md: '140px' }} h={{ base: '80px', md: '100px' }} borderRadius="lg" tabIndex={-1} />
        <Box flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap" mb={1}>
            <AvailableBadge available={service?.available_now} />
            {distance && <Text fontSize="sm" color="gray.700" fontWeight="600">{distance}</Text>}
          </HStack>
          <Heading as="h2" size="sm" noOfLines={2}>
            <RLink to={path}>{service?.title}</RLink>
          </Heading>
          <Text fontSize="sm" color="gray.600" noOfLines={1}>{[business.name, service?.base_address].filter(Boolean).join(' · ')}</Text>
          <Text fontWeight="700" color="secondary" mt={1}>{service?.price_line}</Text>
        </Box>
      </Flex>
      <PhoneAfterBookingHint business={business} mt={3} />
      <Flex gap={2} mt={3} flexWrap="wrap" justify="flex-end">
        <ContactButtons business={business} loginPath={loginPath} onMessage={() => onMessage(service)} />
        <Button as={RLink} to={path} size="sm" bg="primary" color="white" _hover={{ bg: 'secondary' }}>View &amp; request</Button>
      </Flex>
    </Box>
  );
}

export default function TowingListing() {
  const { commaInt } = useContext(GlobalStore);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { picked, deviceLocation, geoStatus, point, name, ready } = useSearchPoint(params);
  const availableOnly = params.get('all') !== '1';
  const [chatWith, setChatWith] = useState(null);
  const bigMap = useDisclosure();
  const loginPath = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;

  useEffect(() => { document.title = 'Towing vans near you | Motaa'; }, []);

  const apiQs = towingApiQuery(params, point);
  const query = useApiQuery(
    (api, signal, { useCache }) => api.get(`/transport/?${apiQs}`, { signal, cacheTTL: useCache ? 30000 : 0 }),
    [apiQs],
    { enabled: ready, select: (body) => body?.data, keepAs: `towing:${apiQs}` }
  );

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined || value === '') next.delete(key); else next.set(key, String(value));
    }
    if (!('offset' in changes)) next.delete('offset');
    setParams(next);
  }

  const results = asList(query.data?.results);
  const count = Number(query.data?.pagination?.count);
  const nearKm = query.data?.near_km;

  // the vans listed, as pins on the map (those whose base has a position)
  const pins = results.filter((item) => item?.base_lat != null && item?.base_lng != null).map((item) => ({
    id: item.uuid, lat: item.base_lat, lng: item.base_lng, title: item.title,
    subtitle: [item.business?.name, distanceLabel(item.distance_km, item.drive_minutes)].filter(Boolean).join(' • '),
    href: servicePath(item), linkLabel: 'View & request', onOpen: () => navigate(servicePath(item)),
  }));
  const pinsNote = !results.length ? null
    : pins.length === 0 ? "These towing vans can't be shown on the map yet. Their distance is in the list."
    : pins.length < results.length ? `${pins.length} of the ${results.length} towing vans listed are on the map.`
    : 'Tap a red pin to see which towing van it is.';
  const mapCenter = point || DEFAULT_MAP_CENTER;

  const heading = !query.data
    ? (point ? `Looking for towing vans near ${name}…` : 'Looking for towing vans…')
    : `${commaInt(Number.isFinite(count) ? count : results.length)} ${availableOnly ? 'available ' : ''}towing van${(Number.isFinite(count) ? count : results.length) === 1 ? '' : 's'}${point && nearKm ? ` within ${nearKm} km of ${name}` : point ? ` near ${name}` : ' on Motaa'}`;

  return (
    <Box minH="100vh">
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" size="lg" className="subtitle" mb={1}>Find a towing van near you</Heading>
        <Text color="gray.600" mb={4}>Stuck? See tow trucks close to you, call them, or send a request and pay safely in the app.</Text>

        <FormControl display="flex" alignItems="center" gap={3} mb={2} w="auto">
          <Switch id="towing-available" size="lg" isChecked={availableOnly} onChange={(e) => update({ all: e.target.checked ? null : '1' })} />
          <FormLabel htmlFor="towing-available" mb={0} fontWeight="600">Available now only</FormLabel>
        </FormControl>

        {!picked && (geoStatus === 'denied' || geoStatus === 'unsupported') && (
          <Alert status="info" rounded="md" my={3}>
            <AlertIcon />
            We couldn't get your location. Search your area next to the map to see the closest towing vans.
          </Alert>
        )}

        <Text fontSize="xl" className="subtitle" color="primary" fontWeight="medium" my={4} role="status">{heading}</Text>

        <Flex gap={6} alignItems="flex-start" direction={{ base: 'column-reverse', md: 'row' }}>
          <Box w="100%" flex={1} minW={0}>
            <AsyncState
              query={ready ? query : { ...query, loading: true }}
              skeleton={<TransportListSkeleton />}
              isEmpty={(data) => asList(data?.results).length === 0}
              empty={
                <EmptyState
                  icon={Truck}
                  title={availableOnly ? 'No towing vans available near here right now' : 'No towing vans near this location yet'}
                  description={availableOnly ? 'Show the ones that are busy too, or search another area.' : 'Try another area on the map.'}
                  action={availableOnly ? { label: 'Show all towing vans', onClick: () => update({ all: '1' }) } : undefined}
                />
              }
            >
              {(data) => (
                <Box opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
                  <Stack as="ul" listStyleType="none" spacing={3}>
                    {asList(data?.results).map((service) => (
                      <TowingCard key={service.uuid} service={service} loginPath={loginPath} onMessage={setChatWith} />
                    ))}
                  </Stack>
                  <PageControls
                    offset={data?.pagination?.offset}
                    limit={data?.pagination?.limit || TRANSPORT_PAGE_SIZE}
                    count={data?.pagination?.count}
                    isLoading={query.loading}
                    onPage={(offset) => { update({ offset: offset || null }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                </Box>
              )}
            </AsyncState>
          </Box>

          <Box w="100%" maxW={{ md: '300px', lg: '400px' }} bg="white" borderRadius="20px" borderWidth={1} borderColor="gray.200" p={4} position={{ md: 'sticky' }} top={{ md: 4 }}>
            <Box position="relative">
              <MapComponent style={{ height: '320px' }} location={mapCenter} pins={pins} fitPins onMapClick={bigMap.onOpen} label={`Map around ${name}`} />
              <Button position="absolute" top={2} left={2} size="sm" bg="white" color="gray.800" boxShadow="md" _hover={{ bg: 'gray.50' }}
                leftIcon={<Maximize2 size={14} aria-hidden="true" />} onClick={bigMap.onOpen}>
                Expand map
              </Button>
            </Box>
            {pinsNote && <Text fontSize="xs" color="gray.600" mt={2}>{pinsNote}</Text>}
            <Box mt={4}>
              <Text as="label" htmlFor="towing-location" fontWeight="600" fontSize="sm">Search near</Text>
              <Box borderWidth="1px" rounded="lg" mt={1}>
                <CustomPlacesAutocomplete id="towing-location" value={params.get('near') || ''} placeholder="Search an area or address"
                  aria-label="Search near this location" onPlaceChange={(place) => update({ lat: place.lat, lng: place.lng, near: place.formatted_address })} />
              </Box>
              {picked && (
                <Button mt={2} size="sm" variant="link" color="primary" onClick={() => update({ lat: null, lng: null, near: null })}>
                  {deviceLocation ? 'Use my current location' : 'Clear location'}
                </Button>
              )}
            </Box>
          </Box>
        </Flex>
      </Container>

      <Modal isOpen={bigMap.isOpen} onClose={bigMap.onClose} size={{ base: 'full', md: '6xl' }} isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent overflow="hidden" h={{ base: '100dvh', md: '85vh' }} my={{ base: 0, md: 4 }}>
          <ModalHeader pr={12} pb={2}>
            <Heading as="h2" size="md">Towing vans near {name}</Heading>
            {pinsNote && <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1}>{pinsNote}</Text>}
          </ModalHeader>
          <ModalCloseButton aria-label="Close map" />
          <ModalBody p={0} display="flex">
            {bigMap.isOpen && (
              <MapComponent flex={1} minH="320px" borderRadius={0} location={mapCenter} pins={pins} fitPins pageScroll={false}
                label={`Large map of towing vans near ${name}`} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {chatWith && (
        <ChatPopup isOpen onClose={() => setChatWith(null)} recipient={chatWith.business?.chat_recipient} recipient_name={chatWith.business?.name}
          service={chatWith} placeholder={`Hi, I need a tow. Is "${chatWith.title}" available now?`} />
      )}
    </Box>
  );
}
