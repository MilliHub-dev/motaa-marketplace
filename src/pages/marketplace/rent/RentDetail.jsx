import { useContext, useEffect, useState } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { GlobalStore } from "../../../App";
import {
  LocationBreadcrumb, DatePicker, ReviewCard, RatingCard, ListingItemCard, ImageCarousel, cycleSuffix,
  formatMileage, toDateInputValue,
} from "../../../components";
import { ListingDetailSkeleton } from "../../../components/loaders";
import { AsyncState } from "../../../components/states";
import { CustomPlacesAutocomplete } from "../../../components/maps";
import { ChatPopup } from "../../../components/chat";
import { useApiQuery } from "../../../hooks/useApi";
import { asList } from "../../../utils";
import {
  Star, Zap, Key, Camera, Music, Smartphone, Sun, BatteryCharging, Shield, CheckCircle, Check,
} from 'lucide-react'
import {
  Box, Container, Grid, Heading, Text, Button, HStack, VStack, Stack, Avatar, Badge, Flex, Icon,
  SimpleGrid, Switch, FormControl, FormLabel, FormErrorMessage, Tag,
} from '@chakra-ui/react'
import { profilePicture } from '../../../utils';


const FeatureIcons = {
  'keyless entry': Key,
  'parking camera': Camera,
  'car play': Music,
  'android auto': Smartphone,
  'sun roof': Sun,
  'usb-c charging': BatteryCharging,
  'lane assist': Shield,
  'wireless charging': Zap,
}

function FeatureCard({ feature }) {
  const icon = FeatureIcons[String(feature).toLowerCase()] || Check;
  return (
    <HStack spacing={3}>
      <Flex w={10} h={10} flexShrink={0} bg="lavender" borderRadius="full" align="center" justify="center">
        <Icon as={icon} boxSize={5} aria-hidden="true" />
      </Flex>
      <Text fontSize="md">{feature}</Text>
    </HStack>
  );
}


export default function RentalDetails() {
  const { listingId } = useParams();
  const { commaInt } = useContext(GlobalStore);
  const [chatOpen, setChatOpen] = useState(false);
  const detail = useApiQuery(
    (api, signal) => api.get(`/listings/rentals/${listingId}/`, { signal }),
    [listingId],
    { select: (body) => body?.data, keepAs: `rent-detail:${listingId}` }
  );

  return (
    <AsyncState query={detail} skeleton={<ListingDetailSkeleton />} errorTitle={detail.error?.isNotFound ? 'This car is no longer listed' : undefined}>
      {(data) => {
        const listing = data?.listing || {};
        const vehicle = listing?.vehicle || {};
        const dealer = vehicle?.dealer;
        const reviews = asList(dealer?.reviews);
        const recommended = asList(data?.recommended);
        const features = asList(vehicle?.features);
        const title = listing?.title || vehicle?.name || 'Car for rent';
        const trips = Number(vehicle?.trips);
        const hostRating = Number(dealer?.rating);

        return (
          <Box minH="100vh">
            <Container maxW="container.xl" pt={5} pb={16}>
              <LocationBreadcrumb label={title} />

              <Grid
                templateColumns={{ base: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(0, 1fr)' }}
                templateAreas={{ base: `"listing" "form" "details"`, md: `"listing form" "details form"` }}
                mt={6}
                columnGap={8}
                rowGap={6}
              >
                <Box gridArea="listing" minW={0}>
                  <ImageCarousel images={vehicle?.images} alt={title} />
                  <Flex justify="space-between" align="flex-start" gap={4} mt={4} flexWrap="wrap">
                    <Box minW={0}>
                      <Heading as="h1" size="lg">{title}</Heading>
                      <HStack spacing={2} mt={1} color="gray.600" flexWrap="wrap">
                        {vehicle?.condition && <Text>{vehicle.condition}</Text>}
                        {Number.isFinite(trips) && <Text>· {trips === 0 ? 'No trips yet' : `${trips} trip${trips === 1 ? '' : 's'}`}</Text>}
                        {listing?.verified && (
                          <Badge colorScheme="blue" display="inline-flex" alignItems="center" gap={1}>
                            <CheckCircle size={12} aria-hidden="true" /> Verified listing
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                    <Heading as="p" size="lg">
                      ₦{commaInt(listing?.price)}
                      <Text fontSize="sm" color="gray.600" fontWeight="normal" as="span">{cycleSuffix(listing?.payment_cycle)}</Text>
                    </Heading>
                  </Flex>
                </Box>

                <BookingForm listing={listing} gridArea="form" />

                <Box gridArea="details" minW={0}>
                  <Box mb={8}>
                    <Heading as="h2" size="md" fontWeight={'500'} mb={4}>Description</Heading>
                    <Text color={listing?.notes ? 'gray.700' : 'gray.500'} whiteSpace="pre-line" borderRadius="10px" px={3} py={3} border="1px solid" borderColor="gray.300">
                      {listing?.notes || 'The host has not added a description.'}
                    </Text>
                  </Box>

                  <Box mb={8}>
                    <Heading as="h2" size="md" fontWeight={'500'} mb={4}>Details</Heading>
                    <Flex gap={2} flexWrap="wrap">
                      {[
                        vehicle?.transmission,
                        vehicle?.fuel_system,
                        vehicle?.seats && `${vehicle.seats} seats`,
                        vehicle?.doors && `${vehicle.doors} doors`,
                        vehicle?.color,
                        formatMileage(vehicle?.mileage, commaInt),
                      ].filter(Boolean).map((item) => <Tag key={item} size="lg">{item}</Tag>)}
                    </Flex>
                  </Box>

                  {features.length > 0 && (
                    <Box mb={8}>
                      <Heading as="h2" size="md" mb={4} fontWeight={'500'}>Features & Accessories</Heading>
                      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
                        {features.map((feature) => <FeatureCard key={feature} feature={feature} />)}
                      </SimpleGrid>
                    </Box>
                  )}

                  {dealer && (
                    <Box mb={8}>
                      <Heading as="h2" size="md" mb={4} fontWeight={'500'}>Host</Heading>
                      <Flex gap={4} align="center" flexWrap="wrap">
                        <Avatar size="lg" src={profilePicture(dealer)} name={dealer?.business_name} />
                        <Box flex={1} minW="160px">
                          <Heading as="p" size="sm">{dealer?.business_name || 'Host'}</Heading>
                          <HStack spacing={1} mt={1}>
                            {Number.isFinite(hostRating) && hostRating > 0 ? (
                              <>
                                <Icon as={Star} color="orange.400" fill="currentColor" aria-hidden="true" />
                                <Text>{hostRating.toFixed(1)}</Text>
                                <Text color="gray.500">({reviews.length} review{reviews.length === 1 ? '' : 's'})</Text>
                              </>
                            ) : <Text color="gray.500">No reviews yet</Text>}
                          </HStack>
                        </Box>
                        <HStack>
                          <Button size="sm" variant="outline" colorScheme="blue" onClick={() => setChatOpen(true)} isDisabled={!dealer?.uuid}>Message host</Button>
                          {dealer?.uuid && <Button size="sm" variant="ghost" as={Link} to={`/dealership/${dealer.uuid}`}>View profile</Button>}
                        </HStack>
                      </Flex>
                      {dealer?.headline && <Text fontSize="sm" mt={3} color="gray.700">{dealer.headline}</Text>}
                      {dealer?.uuid && (
                        <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} recipient_type="dealer" recipient_id={dealer.uuid}
                          recipient_name={dealer.business_name}
                          listing={listing?.uuid ? { ...listing, listing_type: listing.listing_type || 'rental' } : undefined} />
                      )}
                    </Box>
                  )}

                  <RatingCard
                    avg_rating={dealer?.rating}
                    ratings={reviews.map((review) => review?.ratings)}
                    reviewCount={reviews.length}
                  />

                  <VStack align="stretch" mb={4} spacing={6}>
                    {reviews.slice(0, 5).map((review, index) => (
                      <ReviewCard key={review?.uuid || index} review={review} />
                    ))}
                  </VStack>

                  {reviews.length > 5 && dealer?.uuid && (
                    <Button as={Link} to={`/dealership/${dealer.uuid}`} variant="outline" color="primary" colorScheme="blue">
                      See all {reviews.length} reviews
                    </Button>
                  )}
                </Box>
              </Grid>

              {recommended.length > 0 && (
                <Stack mt={10}>
                  <Heading as="h2" textAlign="center" size="md" my={3}>Recommended Cars for You</Heading>
                  <SimpleGrid spacing={{ base: 6, md: 8 }} columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
                    {recommended.map((item) => <ListingItemCard listing={item} key={item?.uuid || item?.id} />)}
                  </SimpleGrid>
                </Stack>
              )}
            </Container>
          </Box>
        );
      }}
    </AsyncState>
  )
}


const BookingForm = ({ listing, ...props }) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [from, setFrom] = useState(params.get('from') || '');
  const [until, setUntil] = useState(params.get('until') || '');
  const [place, setPlace] = useState(() => (
    params.get('where') ? { formatted_address: params.get('where'), lat: params.get('lat'), lng: params.get('lng') } : null
  ));
  const [driver, setDriver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const offersDrivers = Boolean(listing?.vehicle?.dealer?.offers_drivers);

  useEffect(() => { setDriver(false); }, [listing?.uuid]);

  const today = toDateInputValue(new Date());
  const errors = {
    from: !from ? 'Choose a pick-up date' : from < today ? 'Pick-up date can’t be in the past' : '',
    until: !until ? 'Choose a return date' : from && until <= from ? 'Return date must be after the pick-up date' : '',
    where: !place?.formatted_address ? 'Choose a pickup location' : '',
  };
  const valid = !errors.from && !errors.until && !errors.where;

  function book(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid || !listing?.uuid) return;
    const qs = new URLSearchParams({ listingId: listing.uuid, from, until, location: place.formatted_address });
    if (place.lat && place.lng) { qs.set('lat', place.lat); qs.set('lng', place.lng); }
    if (offersDrivers && driver) qs.set('driver', '1');
    navigate(`/checkout/?${qs.toString()}`);
  }

  return(
    <Box {...props}>
      <Box as="form" onSubmit={book} noValidate borderWidth="1px" borderRadius="lg" p={{ base: 4, md: 6 }} bg="white" boxShadow="sm" position={{ md: 'sticky' }} top={{ md: 4 }}>
        <Heading as="h2" size="md" mb={4}>Book this car</Heading>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={submitted && Boolean(errors.from)}>
            <FormLabel htmlFor="book-from">From</FormLabel>
            <DatePicker id="book-from" label="Pick-up date" value={from} onChange={setFrom} w="100%" isInvalid={submitted && Boolean(errors.from)} />
            <FormErrorMessage>{errors.from}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={submitted && Boolean(errors.until)}>
            <FormLabel htmlFor="book-until">Until</FormLabel>
            <DatePicker id="book-until" label="Return date" value={until} min={from || undefined} onChange={setUntil} w="100%" isInvalid={submitted && Boolean(errors.until)} />
            <FormErrorMessage>{errors.until}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={submitted && Boolean(errors.where)}>
            <FormLabel htmlFor="book-where">Pickup location</FormLabel>
            <Box borderWidth="1px" borderRadius="md" borderColor={submitted && errors.where ? 'red.500' : undefined}>
              <CustomPlacesAutocomplete
                id="book-where"
                value={place?.formatted_address || ''}
                placeholder="Search an address"
                aria-label="Pickup location"
                onPlaceChange={(chosen) => setPlace(chosen)}
                // a typed address is enough when there are no suggestions to pick from
                inputProps={{ onInput: (e) => setPlace(e.target.value.trim() ? { formatted_address: e.target.value } : null) }}
              />
            </Box>
            <FormErrorMessage>{errors.where}</FormErrorMessage>
          </FormControl>

          {offersDrivers && (
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="book-driver" mb={0}>Add a driver</FormLabel>
              <Switch id="book-driver" colorScheme="blue" isChecked={driver} onChange={(e) => setDriver(e.target.checked)} />
            </FormControl>
          )}

          <Button type="submit" colorScheme="blue" bg="primary" size="lg" borderRadius="10px" isDisabled={!listing?.uuid}>
            Book Rental
          </Button>
          <Text fontSize="xs" color="gray.500" textAlign="center">You won't be charged yet. Fees and tax are shown at checkout.</Text>
        </VStack>
      </Box>
    </Box>
  )
}
