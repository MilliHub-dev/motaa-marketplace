import {
    Box, Heading, Button, Container, Flex, Input, InputGroup, InputLeftElement, Text, Avatar, Badge,
    Alert, AlertIcon, VStack, HStack, Tag, Divider, useColorModeValue,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SearchIcon, StarIcon } from '@chakra-ui/icons';
import { RiFilterLine } from 'react-icons/ri'
import { GrLocation } from 'react-icons/gr';
import { Wrench } from "lucide-react";
import { GlobalStore } from "../../../App";
import { MechanicListSkeleton } from "../../../components/loaders";
import { MapComponent, CustomPlacesAutocomplete, DEFAULT_MAP_CENTER } from "../../../components/maps";
import { TopRatedBadgeIcon } from "../../../components/icons";
import { ServiceFilter } from "../../../components/filters";
import { PageControls } from "../../../components";
import { AsyncState, EmptyState } from "../../../components/states";
import { useApiQuery } from "../../../hooks/useApi";
import { asList } from "../../../utils";

const PAGE_SIZE = 25;

/** "3.3 km away" from the API's "3.27km", or null. */
function distanceLabel(distance) {
    const km = parseFloat(String(distance ?? ''));
    if (!Number.isFinite(km)) return null;
    return km < 1 ? 'Less than 1 km away' : `${km.toFixed(1)} km away`;
}

export const MechanicListPage = () => {
    const { commaInt } = useContext(GlobalStore);
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    // where to search from: a picked place (in the URL), else the device location.
    // With neither, list every mechanic rather than guessing a city (the map just centres on Abuja).
    const urlLat = parseFloat(params.get('lat'));
    const urlLng = parseFloat(params.get('lng'));
    const [deviceLocation, setDeviceLocation] = useState(null);
    const [geoStatus, setGeoStatus] = useState('locating');
    const picked = Number.isFinite(urlLat) && Number.isFinite(urlLng) ? { lat: urlLat, lng: urlLng } : null;
    const searchPoint = picked || deviceLocation;
    const location = searchPoint || DEFAULT_MAP_CENTER;
    const locationName = params.get('near') || (picked ? 'Selected location' : deviceLocation ? 'Your current location' : 'Nigeria');

    useEffect(() => {
        if (!("geolocation" in navigator)) { setGeoStatus('unsupported'); return; }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setDeviceLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setGeoStatus('ok');
            },
            () => setGeoStatus('denied'),
            { timeout: 10000, maximumAge: 300000 }
        );
    }, []);

    const qs = new URLSearchParams(searchPoint ? { lat: searchPoint.lat.toFixed(5), lng: searchPoint.lng.toFixed(5) } : {});
    if (params.get('services')) qs.set('services', params.get('services'));
    if (params.get('offset')) qs.set('offset', params.get('offset'));
    const apiQs = qs.toString();
    // wait briefly for the device location so we don't load Abuja first and then jump
    const ready = Boolean(picked) || geoStatus !== 'locating';

    const mechanics = useApiQuery(
        (api, signal, { useCache }) => api.get(`/mechanics/?${apiQs}`, { signal, cacheTTL: useCache ? 30000 : 0 }),
        [apiQs],
        { enabled: ready, select: (body) => body?.data, keepAs: `mechanics:${apiQs}` }
    );

    function update(changes) {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === '') next.delete(key); else next.set(key, String(value));
        }
        if (!('offset' in changes)) next.delete('offset');
        setParams(next);
    }

    function performSearch(e) {
        e.preventDefault();
        const text = query.trim();
        if (text) navigate(`/search/mechanics/?find=${encodeURIComponent(text)}`);
    }

    const count = Number(mechanics.data?.pagination?.count);
    const shown = asList(mechanics.data?.results).length;

    return (
        <Box minH="100vh">
            <Container maxW="container.xl" py={8}>
                <Heading as="h1" size="lg" className="subtitle" mb={4}>Find a mechanic</Heading>

                <Flex as="form" role="search" onSubmit={performSearch} gap={3} mb={4}>
                    <InputGroup size="lg" flex={1}>
                        <InputLeftElement pointerEvents="none"><SearchIcon aria-hidden="true" /></InputLeftElement>
                        <Input type="search" value={query} aria-label="Search mechanics by name or service" placeholder="e.g. Engine service" bg={bgColor} onChange={e => setQuery(e.target.value)} />
                    </InputGroup>
                    <Button type="submit" isDisabled={!query.trim()} size="lg" bg="primary" color="white" colorScheme="blue">
                        Search
                    </Button>
                </Flex>

                <Flex my={2} py={2} gap={3} alignItems="center" flexWrap="wrap">
                    <HStack spacing={1} color="gray.600" aria-hidden="true"><RiFilterLine /><Text>Filters</Text></HStack>
                    <ServiceFilter value={params.get('services')} onChange={({ value }) => update({ services: value })} />
                </Flex>

                {!picked && (geoStatus === 'denied' || geoStatus === 'unsupported') && (
                    <Alert status="info" rounded="md" my={3}>
                        <AlertIcon />
                        We couldn't get your location, so we're showing all mechanics. Search your area in the map panel to see who's closest.
                    </Alert>
                )}

                <Text fontSize="xl" className="subtitle" color="primary" fontWeight="medium" my={4} role="status">
                    {!mechanics.data
                        ? (searchPoint ? `Looking for mechanics near ${locationName}…` : 'Looking for mechanics…')
                        : !searchPoint
                        ? `${Number.isFinite(count) ? count : shown} mechanic${(Number.isFinite(count) ? count : shown) === 1 ? '' : 's'} on Motaa`
                        : Number.isFinite(count)
                        ? `${count} mechanic${count === 1 ? '' : 's'} within 30 km of ${locationName}`
                        : `${shown} mechanic${shown === 1 ? '' : 's'} near ${locationName}`}
                </Text>

                <Flex gap={6} alignItems="flex-start" direction={{ base: 'column-reverse', md: 'row' }}>
                    <Box w="100%" flex={1} minW={0}>
                        <AsyncState
                          query={ready ? mechanics : { ...mechanics, loading: true }}
                          skeleton={<MechanicListSkeleton />}
                          isEmpty={(data) => asList(data?.results).length === 0}
                          empty={
                            <EmptyState
                              icon={Wrench}
                              title={params.get('services') ? 'No mechanics offer these services nearby' : 'No mechanics near this location yet'}
                              description="Try another area on the map, or search mechanics by name or service."
                              action={params.get('services') ? { label: 'Clear services', onClick: () => update({ services: null }) } : { label: 'Search all mechanics', to: '/search/mechanics/' }}
                            />
                          }
                        >
                            {(data) => (
                                <VStack w="100%" spacing={0} align="stretch" opacity={mechanics.loading ? 0.6 : 1} aria-busy={mechanics.loading}>
                                    {asList(data?.results).map((mechanic) => {
                                        const name = mechanic?.business_name || mechanic?.user?.name || 'Mechanic';
                                        const distance = distanceLabel(mechanic?.distance);
                                        const services = asList(mechanic?.services);
                                        const rating = Number(mechanic?.rating);
                                        return (
                                            <Box key={mechanic?.uuid || mechanic?.id} w="full" bg={bgColor} py={6} px={{ base: 0, md: 4 }} borderBottomWidth={2} borderColor={borderColor}>
                                                <Flex direction={{ base: 'column', sm: 'row' }} gap={4}>
                                                    <Avatar size="lg" name={name} src={mechanic?.logo || undefined} />
                                                    <Box flex={1} minW={0}>
                                                        <Flex justify="space-between" align="flex-start" gap={2} flexWrap="wrap">
                                                            <Box minW={0}>
                                                                <Heading as="h2" size="md" fontWeight="600" mb={1}>
                                                                    <Link to={`/mechanics/${mechanic?.uuid}`}>{name}</Link>
                                                                </Heading>
                                                                {mechanic?.headline && <Text color="gray.800" fontSize="sm">{mechanic.headline}</Text>}
                                                            </Box>
                                                            {mechanic?.level && (
                                                                <Badge colorScheme="blue" fontSize="xs" p={'5px'} display="flex" alignItems="center" gap={1} rounded="lg">
                                                                    <TopRatedBadgeIcon viewBox="0 0 27 28" w="20px" h="20px" aria-hidden="true" /> {mechanic.level}
                                                                </Badge>
                                                            )}
                                                        </Flex>

                                                        {(mechanic?.location || distance) && (
                                                            <Flex align="center" gap={1} mt={2} color="gray.600" flexWrap="wrap">
                                                                <GrLocation aria-hidden="true" />
                                                                {mechanic?.location && <Text>{mechanic.location}</Text>}
                                                                {distance && <Text color="gray.700">{mechanic?.location ? '• ' : ''}{distance}</Text>}
                                                            </Flex>
                                                        )}

                                                        {services.length > 0 && (
                                                            <HStack spacing={2} mt={4} flexWrap="wrap" rowGap={2}>
                                                                {services.slice(0, 3).map((service) => (
                                                                    <Tag key={service?.uuid || service?.service} size="md" borderRadius="30px" px={3}>{service?.service}</Tag>
                                                                ))}
                                                                {services.length > 3 && <Tag size="md" borderRadius="30px" px={3}>+{services.length - 3} more</Tag>}
                                                            </HStack>
                                                        )}

                                                        <Divider my={4} />

                                                        <Flex justify="flex-start" columnGap={5} rowGap={2} flexWrap="wrap" align="center">
                                                            {Number(mechanic?.price_start) > 0 && (
                                                                <Flex align="center" gap={1}>
                                                                    <Text color="gray.600">Services from</Text>
                                                                    <Text fontSize="lg" fontWeight="bold">₦{commaInt(mechanic.price_start)}</Text>
                                                                </Flex>
                                                            )}
                                                            <Flex align="center" gap={1} color="gray.600">
                                                                {Number.isFinite(rating) && rating > 0
                                                                    ? <><Text>Rating {rating.toFixed(1)}</Text><StarIcon color="tertiary" aria-hidden="true" /></>
                                                                    : <Text>No ratings yet</Text>}
                                                            </Flex>
                                                            <Button as={Link} to={`/mechanics/${mechanic?.uuid}`} size="sm" ml={{ sm: 'auto' }} variant="outline" colorScheme="blue">
                                                                View &amp; book
                                                            </Button>
                                                        </Flex>
                                                    </Box>
                                                </Flex>
                                            </Box>
                                        );
                                    })}
                                    <PageControls
                                      offset={data?.pagination?.offset}
                                      limit={data?.pagination?.limit || PAGE_SIZE}
                                      count={data?.pagination?.count}
                                      isLoading={mechanics.loading}
                                      onPage={(offset) => { update({ offset: offset || null }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    />
                                </VStack>
                            )}
                        </AsyncState>
                    </Box>

                    <Box w="100%" maxW={{ md: "300px", lg: "400px" }} bg={bgColor} borderRadius="20px" borderWidth={1} borderColor={borderColor} p={4} position={{ md: 'sticky' }} top={{ md: 4 }}>
                        <MapComponent style={{ height: "320px" }} location={location} label={`Map around ${locationName}`} />
                        <Box mt={4}>
                            <Text as="label" htmlFor="mech-location" fontWeight="600" fontSize="sm">Search near</Text>
                            <Box borderWidth="1px" rounded="lg" mt={1}>
                                <CustomPlacesAutocomplete
                                  id="mech-location"
                                  value={params.get('near') || ''}
                                  placeholder="Search an area or address"
                                  aria-label="Search near this location"
                                  onPlaceChange={(place) => update({ lat: place.lat, lng: place.lng, near: place.formatted_address })}
                                />
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
        </Box>
    );
};

export default MechanicListPage;
