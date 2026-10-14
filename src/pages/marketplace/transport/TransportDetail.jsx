// /towing/:serviceId and /car-haulers/:serviceId — one towing van or car hauler: photos, price, the
// business, and the request form ("Request a tow" / "Request a quote"). The request opens the chat.
import { useContext, useEffect, useId, useState } from 'react';
import { Link as RLink, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, Avatar, Badge, Box, Button, Container, Divider, Flex, Heading, HStack, Icon, SimpleGrid,
  Skeleton, Stack, Text, useDisclosure,
} from '@chakra-ui/react';
import { ShieldCheck, Star } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { reversePlace } from '../../../api/geocode';
import { ImageCarousel } from '../../../components';
import { ChatPopup } from '../../../components/chat';
import { MapComponent } from '../../../components/maps';
import { BackButton } from '../../../components/nav';
import { ErrorState } from '../../../components/states';
import { AvailableBadge, ContactButtons, TripFields, mapTripErrors } from '../../../components/transport';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList, profilePicture } from '../../../utils';
import { TRANSPORT_PATHS, capacityLabel, emptyRequestForm, requestPayload, requestProblems, servicePath } from '../../../utils/transport';

function DetailSkeleton() {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} role="status" aria-label="Loading">
      <Skeleton h={{ base: '260px', md: '400px' }} borderRadius="10px" />
      <Stack spacing={4}><Skeleton h="28px" w="80%" /><Skeleton h="32px" w="40%" /><Skeleton h="16px" w="60%" /><Skeleton h="160px" /></Stack>
    </SimpleGrid>
  );
}

function Fact({ label, children, ...props }) {
  if (children === null || children === undefined || children === '' || children === false) return null;
  return (
    <Box {...props}>
      <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">{label}</Text>
      <Text fontWeight="600">{children}</Text>
    </Box>
  );
}

/** The request form: pickup prefilled from the device location, then POST and open the chat. */
function RequestForm({ service }) {
  const id = useId();
  const navigate = useNavigate();
  const kind = service.kind;
  const [form, setForm] = useState(emptyRequestForm);
  const [errors, setErrors] = useState({});
  const [refusal, setRefusal] = useState('');

  // start the pickup at where the customer is (they can change it)
  useEffect(() => {
    if (!('geolocation' in navigator)) return undefined;
    const controller = new AbortController();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const device = { lat: position.coords.latitude, lng: position.coords.longitude };
        reversePlace(device, { signal: controller.signal }).catch(() => null).then((found) => {
          if (controller.signal.aborted) return;
          setForm((current) => (current.pickup ? current : { ...current, pickup: { ...device, formatted_address: found?.formatted_address || 'My current location' } }));
        });
      },
      () => {},
      { timeout: 10000, maximumAge: 300000 }
    );
    return () => controller.abort();
  }, []);

  const send = useApiMutation(
    (api, body) => api.post(`/transport/${encodeURIComponent(service.uuid)}/request/`, body),
    {
      notifyOnError: false, // the server's reason is shown on the form
      successMessage: (body) => body?.message || 'Request sent.',
      onSuccess: (body) => navigate(body?.data?.room ? `/chat/${body.data.room}` : '/chat'),
      onError: (error) => {
        setRefusal(error.message);
        setErrors(mapTripErrors(error.fieldErrors));
      },
    }
  );

  function submit(e) {
    e.preventDefault();
    if (send.loading) return;
    const found = requestProblems(form, kind);
    setErrors(found);
    setRefusal('');
    if (Object.keys(found).length) return;
    send.mutate(requestPayload(form, kind));
  }

  return (
    <Box as="form" onSubmit={submit} noValidate>
      <TripFields idPrefix={id} kind={kind} value={form} onChange={(next) => { setForm(next); setErrors({}); }} errors={errors} isDisabled={send.loading} />
      {refusal && <Alert status="error" borderRadius="md" mt={4}><AlertIcon /><AlertDescription>{refusal}</AlertDescription></Alert>}
      <Button type="submit" mt={4} w="100%" size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={send.loading} loadingText="Sending">
        {kind === 'hauler' ? 'Request a quote' : 'Request a tow'}
      </Button>
      <HStack spacing={2} color="gray.600" fontSize="sm" align="start" mt={3}>
        <Icon as={ShieldCheck} boxSize={4} mt={0.5} aria-hidden="true" />
        <Text>The business replies with an invoice in your chat. Pay in the app and Motaa holds the money until the job is done.</Text>
      </HStack>
    </Box>
  );
}

export default function TransportDetail({ kind }) {
  const { serviceId } = useParams();
  const { authUser } = useContext(GlobalStore);
  const location = useLocation();
  const chat = useDisclosure();
  const loginPath = `/login?next=${encodeURIComponent(location.pathname)}`;

  const query = useApiQuery(
    (api, signal) => api.get(`/transport/${encodeURIComponent(serviceId)}/`, { signal }),
    [serviceId, authUser?.token],
    { select: (body) => body?.data, keepAs: `transport:${serviceId}` }
  );
  const service = query.data?.service;
  const listPath = TRANSPORT_PATHS[kind] || TRANSPORT_PATHS.towing;

  useEffect(() => {
    document.title = service?.title ? `${service.title} | Motaa` : (kind === 'hauler' ? 'Car hauler | Motaa' : 'Towing van | Motaa');
  }, [service?.title, kind]);

  if (query.loading && !query.data) return <Container maxW="container.xl" py={6}><DetailSkeleton /></Container>;
  if (query.error && !query.data) {
    return (
      <Container maxW="container.md" py={10}>
        <ErrorState error={query.error} onRetry={query.reload} title={query.error.isNotFound ? 'This is no longer available' : undefined} />
        <Flex justify="center"><Button as={RLink} to={listPath} variant="link" color="primary">{kind === 'hauler' ? 'See other car haulers' : 'Find another towing van'}</Button></Flex>
      </Container>
    );
  }
  if (!service) return null;
  // a towing link opened under /car-haulers (or the other way round): go to the right page
  if (service.kind && service.kind !== kind) return <Navigate to={servicePath(service)} replace />;

  const towing = service.kind === 'towing';
  const business = service.business || {};
  const photos = asList(service.photos).map((photo) => ({ url: photo.url }));
  const hasBase = service.base_lat != null && service.base_lng != null;
  const rating = Number(business.rating);
  const isCustomer = authUser?.user_type === 'customer';

  let requestBox;
  if (!authUser) {
    requestBox = (
      <Stack spacing={3}>
        <Button as={RLink} to={loginPath} size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }}>
          Log in to {towing ? 'request a tow' : 'request a quote'}
        </Button>
        <Text fontSize="sm" color="gray.600">New to Motaa? <Text as={RLink} to="/signup" color="primary" fontWeight="600">Create an account</Text></Text>
      </Stack>
    );
  } else if (query.data?.can_request) {
    requestBox = <RequestForm service={service} />;
  } else {
    requestBox = (
      <Text color="gray.700" role="status">
        {!isCustomer ? 'Only customer accounts can request this. Log in with a personal account.'
          : towing && !service.available_now ? "This towing van isn't available right now. Try another one nearby."
          : "You can't request this one."}
      </Text>
    );
  }

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
      <BackButton to={listPath} />

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 10 }} alignItems="start">
        <Stack spacing={6} minW={0}>
          <ImageCarousel images={photos} alt={service.title} />

          <Box>
            <HStack spacing={2} flexWrap="wrap" mb={2}>
              <Badge textTransform="none" borderRadius="full" px={2} colorScheme="blue">{service.kind_label}</Badge>
              {towing && <AvailableBadge available={service.available_now} />}
            </HStack>
            <Heading as="h1" size="lg">{service.title}</Heading>
            <Text fontSize="2xl" fontWeight="700" color="secondary" mt={2}>{service.price_line}</Text>
          </Box>

          <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={4}>
            {!towing && <Fact label="Truck">{service.truck_type_label}</Fact>}
            {!towing && <Fact label="Capacity">{capacityLabel(service.capacity)}</Fact>}
            {!towing && service.fuel_included !== null && <Fact label="Fuel">{service.fuel_included ? 'Included' : 'Not included'}</Fact>}
            <Fact label="Based in" gridColumn={towing ? '1 / -1' : undefined}>{[service.base_address, service.base_state].filter(Boolean).join(', ') || null}</Fact>
          </SimpleGrid>
          {!towing && asList(service.states).length > 0 && (
            <Box>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb={1}>States covered</Text>
              <Text>{asList(service.states).join(', ')}</Text>
            </Box>
          )}

          <Box>
            <Heading as="h2" size="md" mb={2}>About</Heading>
            {service.description
              ? <Text whiteSpace="pre-wrap" color="gray.700">{service.description}</Text>
              : <Text color="gray.600">The business has not added a description.</Text>}
          </Box>

          {hasBase && (
            <Box>
              <Heading as="h2" size="md" mb={2}>Where it's based</Heading>
              <MapComponent style={{ height: '260px' }} location={{ lat: service.base_lat, lng: service.base_lng }} label={`Map of where ${service.title} is based`} />
            </Box>
          )}
        </Stack>

        <Stack spacing={5} minW={0} position={{ lg: 'sticky' }} top={{ lg: 4 }}>
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4}>
            <Flex gap={3} align="center">
              <Avatar size="md" src={profilePicture(business)} name={business.name} />
              <Box flex={1} minW={0}>
                <Text fontWeight="600" noOfLines={1}>{business.name}</Text>
                <HStack spacing={1} fontSize="sm" color="gray.600">
                  {Number.isFinite(rating) && rating > 0
                    ? <><Icon as={Star} boxSize={3.5} color="tertiary" aria-hidden="true" /><Text>Rating {rating.toFixed(1)}</Text></>
                    : <Text>{business.kind === 'dealer' ? 'Car dealer' : 'Mechanic'} on Motaa</Text>}
                </HStack>
              </Box>
            </Flex>
            <ContactButtons business={business} loginPath={loginPath} onMessage={chat.onOpen} size="md" mt={4} sx={{ '& > *': { flex: 1 } }} />
          </Box>

          <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 5 }}>
            <Heading as="h2" size="md" mb={1}>{towing ? 'Request a tow' : 'Request a quote'}</Heading>
            <Text fontSize="sm" color="gray.600" mb={4}>
              {towing ? 'Tell them where you are. They reply with the price in your chat.' : 'Tell them what to move and where. They reply with a quote in your chat.'}
            </Text>
            <Divider mb={4} />
            {requestBox}
          </Box>
        </Stack>
      </SimpleGrid>

      {isCustomer && business.chat_recipient && (
        <ChatPopup isOpen={chat.isOpen} onClose={chat.onClose} recipient={business.chat_recipient} recipient_name={business.name}
          service={service} placeholder={towing ? `Hi, I need a tow. Is "${service.title}" available?` : `Hi, I'd like a quote for "${service.title}".`} />
      )}
    </Container>
  );
}
