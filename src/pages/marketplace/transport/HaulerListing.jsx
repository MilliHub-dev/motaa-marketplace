// /car-haulers — car carriers listed by dealers, filtered in the URL (?state=&truck_type=&cars=&q=&offset=).
import {
  Badge, Box, Button, Container, Flex, FormControl, FormLabel, Heading, HStack, Input, InputGroup, InputLeftElement, Select,
  SimpleGrid, Skeleton, Text,
} from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useSearchParams } from 'react-router-dom';
import { MapPin, Search, Truck } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { PageControls } from '../../../components';
import { AsyncState, EmptyState } from '../../../components/states';
import { TransportPhoto } from '../../../components/transport';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import {
  TRANSPORT_PAGE_SIZE, TRANSPORT_STATES, TRUCK_TYPES, capacityLabel, haulerApiQuery, servicePath, statesLine,
} from '../../../utils/transport';

function GridSkeleton() {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5} role="status" aria-label="Loading car haulers">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={i} borderWidth="1px" borderColor="gray.100" borderRadius="xl" overflow="hidden">
          <Skeleton h="180px" />
          <Box p={4}><Skeleton h="16px" w="70%" mb={3} /><Skeleton h="14px" w="50%" mb={3} /><Skeleton h="12px" w="80%" /></Box>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function HaulerCard({ service }) {
  const path = servicePath(service);
  return (
    <Box as="li" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden" bg="white" display="flex" flexDirection="column" data-testid="hauler-card">
      <TransportPhoto as={RLink} to={path} tabIndex={-1} src={service?.image} alt={service?.title || 'Car hauler'} h="180px" w="100%" />
      <Box p={4} flex={1} display="flex" flexDirection="column">
        <HStack spacing={2} mb={2} flexWrap="wrap">
          {service?.truck_type_label && <Badge textTransform="none" borderRadius="full" px={2} colorScheme="blue">{service.truck_type_label} truck</Badge>}
          {capacityLabel(service?.capacity) && <Badge textTransform="none" borderRadius="full" px={2}>{capacityLabel(service.capacity)}</Badge>}
        </HStack>
        <Heading as="h2" size="sm" noOfLines={2}><RLink to={path}>{service?.title}</RLink></Heading>
        <Text fontWeight="700" color="secondary" mt={1}>{service?.price_line}</Text>
        {statesLine(service?.states) && (
          <Flex gap={1} align="start" mt={2} fontSize="sm" color="gray.600">
            <MapPin size={14} style={{ marginTop: 3, flexShrink: 0 }} aria-hidden="true" />
            <Text>Covers {statesLine(service.states)}</Text>
          </Flex>
        )}
        <Text fontSize="sm" color="gray.600" mt={1} noOfLines={1}>{service?.business?.name}</Text>
        <Box flex={1} />
        <Button as={RLink} to={path} mt={3} size="sm" variant="outline" borderColor="primary" color="primary">
          View &amp; get a quote
        </Button>
      </Box>
    </Box>
  );
}

export default function HaulerListing() {
  const { commaInt } = useContext(GlobalStore);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [cars, setCars] = useState(params.get('cars') || '');
  const urlQ = params.get('q') || '';
  const urlCars = params.get('cars') || '';
  useEffect(() => { setSearch(urlQ); }, [urlQ]);
  useEffect(() => { setCars(urlCars); }, [urlCars]);
  useEffect(() => { document.title = 'Car haulers | Motaa'; }, []);

  const apiQs = haulerApiQuery(params);
  const query = useApiQuery(
    (api, signal, { useCache }) => api.get(`/transport/?${apiQs}`, { signal, cacheTTL: useCache ? 30000 : 0 }),
    [apiQs],
    { select: (body) => body?.data, keepAs: `haulers:${apiQs}` }
  );

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined || value === '') next.delete(key); else next.set(key, String(value));
    }
    if (!('offset' in changes)) next.delete('offset');
    setParams(next);
  }

  const filtered = ['state', 'truck_type', 'cars', 'q'].some((key) => params.get(key));
  const count = Number(query.data?.pagination?.count);

  return (
    <Box minH="100vh">
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" size="lg" className="subtitle" mb={1}>Get a car hauler</Heading>
        <Text color="gray.600" mb={5}>Move one car or many between states. Ask for a quote and pay safely in the app.</Text>

        <Box as="form" role="search" onSubmit={(e) => { e.preventDefault(); update({ q: search.trim(), cars: cars.replace(/\D/g, '') }); }}
          borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4} bg="white" mb={6}>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={3} alignItems="end">
            <FormControl gridColumn={{ lg: 'span 2' }}>
              <FormLabel htmlFor="hauler-q" fontSize="sm" mb={1}>Search</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" color="gray.500"><Search size={18} aria-hidden="true" /></InputLeftElement>
                <Input id="hauler-q" type="search" placeholder="e.g. Lagos to Abuja" value={search} onChange={(e) => setSearch(e.target.value)} />
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="hauler-state" fontSize="sm" mb={1}>State covered</FormLabel>
              <Select id="hauler-state" placeholder="Any state" value={params.get('state') || ''} onChange={(e) => update({ state: e.target.value })}>
                {TRANSPORT_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="hauler-truck" fontSize="sm" mb={1}>Truck type</FormLabel>
              <Select id="hauler-truck" placeholder="Open or enclosed" value={params.get('truck_type') || ''} onChange={(e) => update({ truck_type: e.target.value })}>
                {TRUCK_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="hauler-cars" fontSize="sm" mb={1}>Cars to move</FormLabel>
              <HStack>
                <Input id="hauler-cars" inputMode="numeric" placeholder="Any" value={cars} onChange={(e) => setCars(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onBlur={() => { if (cars !== urlCars) update({ cars }); }} />
                <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} flexShrink={0}>Search</Button>
              </HStack>
            </FormControl>
          </SimpleGrid>
          {filtered && (
            <Button mt={3} size="sm" variant="link" color="primary" onClick={() => setParams(new URLSearchParams())}>Clear filters</Button>
          )}
        </Box>

        <AsyncState
          query={query}
          skeleton={<GridSkeleton />}
          isEmpty={(data) => asList(data?.results).length === 0}
          empty={
            <EmptyState icon={Truck} title={filtered ? 'No car haulers match' : 'No car haulers yet'}
              description={filtered ? 'Try another state, truck type or number of cars.' : 'Car dealers list their car carriers here. Check back soon.'}
              action={filtered ? { label: 'Clear filters', onClick: () => setParams(new URLSearchParams()) } : undefined} />
          }
        >
          {(data) => (
            <Box opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
              <Text color="gray.600" mb={4} role="status">
                {Number.isFinite(count) ? `${commaInt(count)} car hauler${count === 1 ? '' : 's'}` : ''}
              </Text>
              <SimpleGrid as="ul" listStyleType="none" columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
                {asList(data?.results).map((service) => <HaulerCard key={service.uuid} service={service} />)}
              </SimpleGrid>
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
      </Container>
    </Box>
  );
}
