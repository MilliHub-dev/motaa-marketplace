import { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../../../App";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Flex, Text, Avatar, Badge, Button, SimpleGrid, VStack, Heading, IconButton, Input,
  Collapse, FormControl, FormLabel, FormErrorMessage, useColorModeValue, useDisclosure,
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon, MapPinIcon, StarIcon, VerifiedIcon, MessageCircleIcon } from 'lucide-react'
import { LocationBreadcrumb, ReviewCard, RatingCard } from '../../../components';
import { ChatPopup } from "../../../components/chat";
import { MapComponent, CustomPlacesAutocomplete } from "../../../components/maps";
import { CashMoneyIcon, TopRatedBadgeIcon } from "../../../components/icons";
import { AsyncState } from "../../../components/states";
import { MechanicListSkeleton } from "../../../components/loaders";
import { useApiQuery } from "../../../hooks/useApi";
import { asList } from "../../../utils";


const ServiceAccordion = ({ service }) => {
  const { isOpen, onToggle } = useDisclosure();
  const { commaInt } = useContext(GlobalStore);

  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      p={4}
      mb={4}
      boxShadow="sm"
      bg="white"
      _hover={{ boxShadow: "md" }}
    >
      <Flex justify="space-between" align="center">
        <Box>
          <Text as="h3" fontSize="lg" fontWeight="bold">
            {service?.service}
          </Text>
          <Flex mt={1} gap={3} alignItems="center" flexWrap="wrap">
            <Text color="green.600" display="flex" alignItems="center" gap={1}>
              <CashMoneyIcon aria-hidden="true" />
              {Number(service?.charge) > 0 ? `From ₦${commaInt(service.charge)}` : 'Price on request'}
            </Text>
            {service?.charge_rate && <Badge colorScheme="blue">{service.charge_rate} rate</Badge>}
          </Flex>
        </Box>
        <IconButton
          aria-label={`${isOpen ? 'Hide' : 'Show'} details for ${service?.service || 'service'}`}
          aria-expanded={isOpen}
          icon={isOpen ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
          onClick={onToggle}
          variant="ghost"
        />
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Box mt={4} color="gray.600" fontSize="sm">
          {service?.description || 'No extra details for this service.'}
        </Box>
      </Collapse>
    </Box>
  );
};


export const MechanicDetailPage = () => {
  const { mechId } = useParams();
  const { mapsLoaded } = useContext(GlobalStore);
  const [showPopup, setPopupState] = useState(false);
  const [place, setPlace] = useState(null);
  const [street, setStreet] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const navigate = useNavigate();

  const query = useApiQuery(
    (api, signal) => api.get(`/mechanics/${mechId}/`, { signal }),
    [mechId],
    { select: (body) => body?.data }
  );

  // start from the device location (reverse-geocoded) when the user allows it
  const [device, setDevice] = useState(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setDevice({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => {},
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);
  useEffect(() => {
    if (!device || place || !mapsLoaded || !window.google?.maps?.Geocoder) return;
    new window.google.maps.Geocoder().geocode({ location: device }, (results, status) => {
      const formatted = status === 'OK' ? results?.[0]?.formatted_address : null;
      setPlace((current) => current || { ...device, formatted_address: formatted || 'Current location' });
    });
  }, [device, mapsLoaded, place]);

  const errors = {
    place: !place?.lat ? 'Choose your area so the mechanic can find you' : '',
    street: !street.trim() ? 'Enter your street address' : '',
  };

  function gotoBookingPage(e) {
    e.preventDefault();
    setSubmitted(true);
    if (errors.place || errors.street) return;
    const address = [street.trim(), place.formatted_address].filter(Boolean).join(', ');
    const qs = new URLSearchParams({ lat: String(place.lat), lng: String(place.lng), address });
    navigate(`/mechanics/book/${mechId}?${qs.toString()}`);
  }

  return (
    <AsyncState query={query} skeleton={<MechanicListSkeleton />} errorTitle={query.error?.isNotFound ? "We couldn't find this mechanic" : undefined}>
      {(mechanic) => {
        const name = mechanic?.business_name || mechanic?.user?.name || 'Mechanic';
        const reviews = asList(mechanic?.reviews);
        const services = asList(mechanic?.services);
        const rating = Number(mechanic?.rating);
        const distance = parseFloat(String(mechanic?.distance ?? ''));

        return (
          <Box minH="100vh" pb={8}>
            <Container maxW="7xl">
              <Box py={4}>
                <LocationBreadcrumb label={name} />
              </Box>

              <Flex gap={6} direction={{ base: 'column', md: 'row' }} alignItems="flex-start">
                <Box flex={1} minW={0} w="100%">
                  <Box bg={bgColor} py={6} px={{ base: 0, md: 6 }} rounded="lg" mb={4}>
                    <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
                      <Avatar size="xl" name={name} src={mechanic?.logo || undefined} />
                      <Box flex={1} minW={0}>
                        <Flex align="center" gap={2} flexWrap="wrap">
                          <Heading as="h1" size="lg">{name}</Heading>
                          {mechanic?.verified_business && (
                            <Box as="span" title="Verified business" display="inline-flex">
                              <VerifiedIcon fill="cornflowerblue" color="white" aria-label="Verified business" />
                            </Box>
                          )}
                        </Flex>
                        {mechanic?.headline && <Text color="gray.700" mt={1}>{mechanic.headline}</Text>}

                        <Flex flexWrap="wrap" align="center" gap={3} mt={3}>
                          {mechanic?.level && (
                            <Badge colorScheme="blue" display="inline-flex" gap={1.5} p={"5px"} rounded="lg" alignItems="center">
                              <TopRatedBadgeIcon viewBox="0 0 27 28" w="20px" h="20px" aria-hidden="true" />
                              {mechanic.level}
                            </Badge>
                          )}
                          <Flex align="center" gap={1}>
                            {Number.isFinite(rating) && rating > 0 ? (
                              <>
                                <Text fontWeight="bold">{rating.toFixed(1)}</Text>
                                <StarIcon size={18} color="orange" fill="orange" aria-hidden="true" />
                              </>
                            ) : null}
                            <Text color="gray.500">({reviews.length} review{reviews.length === 1 ? '' : 's'})</Text>
                          </Flex>
                          <Badge colorScheme={mechanic?.available ? 'green' : 'gray'}>{mechanic?.available ? 'Available' : 'Not available'}</Badge>
                        </Flex>

                        {(mechanic?.location || Number.isFinite(distance)) && (
                          <Flex align="center" gap={2} mt={2} color="gray.600" flexWrap="wrap">
                            <MapPinIcon size="18px" aria-hidden="true" />
                            {mechanic?.location && <Text>{mechanic.location}</Text>}
                            {Number.isFinite(distance) && <Text color="gray.700">• {distance.toFixed(1)} km away</Text>}
                          </Flex>
                        )}

                        <Button mt={4} leftIcon={<MessageCircleIcon size={18} />} variant="outline" colorScheme="blue" onClick={() => setPopupState(true)} isDisabled={!mechanic?.uuid}>
                          Message
                        </Button>
                      </Box>
                    </Flex>
                  </Box>

                  <Box bg={bgColor} border="1px solid lavender" p={{ base: 4, md: 6 }} rounded="lg" mb={4}>
                    <Heading as="h2" size="md" mb={4}>About {mechanic?.business_type === 'individual' ? 'me' : 'us'}</Heading>
                    <Text color="gray.600" whiteSpace="pre-line">{mechanic?.about || "No description available."}</Text>
                  </Box>

                  <Box bg={bgColor} py={6} px={{ base: 0, md: 6 }} rounded="lg" mb={4}>
                    <Heading as="h2" size="md" mb={4}>Services</Heading>
                    {services.length ? (
                      <SimpleGrid spacing={3} alignItems="flex-start" columns={{ base: 1, lg: 2 }}>
                        {services.map((service) => (
                          <ServiceAccordion key={service?.uuid || service?.service} service={service} />
                        ))}
                      </SimpleGrid>
                    ) : <Text color="gray.600">This mechanic hasn't listed any services yet.</Text>}
                  </Box>

                  <Box bg={bgColor} py={6} px={{ base: 0, md: 6 }} rounded="lg">
                    <RatingCard avg_rating={mechanic?.rating} ratings={reviews.map((review) => review?.ratings)} reviewCount={reviews.length} />
                    <VStack spacing={6} align="stretch">
                      {reviews.map((review, idx) => <ReviewCard key={review?.uuid || idx} review={review} />)}
                    </VStack>
                  </Box>
                </Box>

                <Box w={{ base: 'full', md: '360px', lg: '400px' }} flexShrink={0} position={{ md: 'sticky' }} top={{ md: 4 }}>
                  <Box as="form" onSubmit={gotoBookingPage} noValidate border="1px solid" borderColor="gray.300" p={4} rounded="2xl" bg={bgColor}>
                    <Heading as="h2" size="md" mb={3}>Book {name}</Heading>
                    <MapComponent style={{ height: "240px" }} location={place} label="Your location" />

                    <VStack pt={4} w="100%" spacing={3} align="stretch">
                      <FormControl isInvalid={submitted && Boolean(errors.place)}>
                        <FormLabel htmlFor="mech-book-area" mb={1}>Your area</FormLabel>
                        <Box borderWidth="1px" rounded="md" borderColor={submitted && errors.place ? 'red.500' : undefined}>
                          <CustomPlacesAutocomplete
                            id="mech-book-area"
                            value={place?.formatted_address || ''}
                            placeholder="Search your area"
                            aria-label="Your area"
                            onPlaceChange={(chosen) => setPlace(chosen)}
                          />
                        </Box>
                        <FormErrorMessage>{errors.place}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={submitted && Boolean(errors.street)}>
                        <FormLabel htmlFor="mech-book-street" mb={1}>Street address</FormLabel>
                        <Input id="mech-book-street" name="address" autoComplete="street-address" value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. No. 6 Sule Drive" />
                        <FormErrorMessage>{errors.street}</FormErrorMessage>
                      </FormControl>

                      <Button type="submit" colorScheme="blue" bg="primary" size="lg" w="full" isDisabled={!mechanic?.available}>
                        {mechanic?.available ? 'Book Now' : 'Not taking bookings'}
                      </Button>
                    </VStack>
                  </Box>
                </Box>
              </Flex>
            </Container>

            {mechanic?.uuid && (
              <ChatPopup isOpen={showPopup} onClose={() => setPopupState(false)} recipient_type="mechanic" recipient_id={mechanic.uuid} />
            )}
          </Box>
        );
      }}
    </AsyncState>
  )
}

export default MechanicDetailPage;
