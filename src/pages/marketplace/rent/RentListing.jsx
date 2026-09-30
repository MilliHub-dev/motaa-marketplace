import {
    Box, Button, Container, Flex, FormControl, FormErrorMessage, FormLabel,
    Heading, HStack, SimpleGrid, Tag, TagCloseButton, TagLabel, Text,
} from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { RiFilterLine } from "react-icons/ri"
import { Car } from "lucide-react"
import { GlobalStore } from "../../../App"
import { ListingItemCard, DatePicker, PageControls } from "../../../components"
import { ListingSkeleton } from "../../../components/loaders"
import { AsyncState, EmptyState } from "../../../components/states"
import { CustomPlacesAutocomplete } from "../../../components/maps"
import { useApiQuery } from "../../../hooks/useApi"
import { asList } from "../../../utils"
import { CarBrandFilter, PriceFilter, TransmissionFilter, TRANSMISSIONS } from "../../../components/filters"

const PAGE_SIZE = 25;
// trip details the rentals API doesn't filter on; they're carried to the listing and checkout
const TRIP_KEYS = ['where', 'lat', 'lng', 'from', 'until'];

/** URL → /listings/rentals/ query (CarRentalFilter: make, transmission, price_min/price_max). */
function apiQuery(params) {
    const qs = new URLSearchParams();
    if (params.get('make')) qs.set('make', params.get('make'));
    if (params.get('transmission')) qs.set('transmission', params.get('transmission'));
    if (params.get('min_price')) qs.set('price_min', params.get('min_price'));
    if (params.get('max_price')) qs.set('price_max', params.get('max_price'));
    const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    if (page > 1) qs.set('offset', String((page - 1) * PAGE_SIZE));
    return qs.toString();
}

export const RentListing = () => {
    const { commaInt, naturalDate } = useContext(GlobalStore);
    const [params, setParams] = useSearchParams();
    const qs = apiQuery(params);
    const listings = useApiQuery(
        (api, signal, { useCache }) => api.get(`/listings/rentals/?summary=1${qs ? `&${qs}` : ''}`, { signal, cacheTTL: useCache ? 30000 : 0 }),
        [qs],
        { select: (body) => body?.data }
    );

    // trip form draft; committed to the URL by "Search"
    const [trip, setTrip] = useState(() => Object.fromEntries(TRIP_KEYS.map((k) => [k, params.get(k) || ''])));
    const [submitted, setSubmitted] = useState(false);
    const tripKey = TRIP_KEYS.map((k) => params.get(k) || '').join('|');
    useEffect(() => {
        setTrip(Object.fromEntries(TRIP_KEYS.map((k) => [k, params.get(k) || ''])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripKey]);

    const datesInvalid = Boolean(trip.from && trip.until && trip.until <= trip.from);

    function updateParams(changes, { keepPage = false } = {}) {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
        }
        if (!keepPage) next.delete('page');
        setParams(next);
    }

    function applyFilter({ filter, value }) {
        if (filter === 'price') updateParams({ min_price: value?.min ?? null, max_price: value?.max ?? null });
        else updateParams({ [filter]: value });
    }

    function onSearch(e) {
        e.preventDefault();
        setSubmitted(true);
        if (datesInvalid) return;
        updateParams(trip, { keepPage: true });
    }

    const tripSearch = (() => {
        const carry = new URLSearchParams();
        for (const key of TRIP_KEYS) if (params.get(key)) carry.set(key, params.get(key));
        const text = carry.toString();
        return text ? `?${text}` : '';
    })();

    const chips = [];
    if (params.get('make')) chips.push({ keys: ['make'], label: `Brand: ${params.get('make').split(',').join(', ')}` });
    if (params.get('transmission')) chips.push({ keys: ['transmission'], label: `Transmission: ${params.get('transmission').split(',').map((v) => TRANSMISSIONS.find((t) => t.value === v)?.label || v).join(', ')}` });
    if (params.get('min_price') || params.get('max_price')) {
        const min = params.get('min_price'); const max = params.get('max_price');
        chips.push({ keys: ['min_price', 'max_price'], label: `Price: ${min && max ? `₦${commaInt(min)} – ₦${commaInt(max)}` : min ? `From ₦${commaInt(min)}` : `Up to ₦${commaInt(max)}`}` });
    }

    const pagination = listings.data?.pagination;
    const total = pagination?.count ?? pagination?.results_count;
    const fromDate = params.get('from');
    const untilDate = params.get('until');
    const dateLabel = (value) => {
        const [y, m, d] = String(value).split('-').map(Number);
        const date = new Date(y, (m || 1) - 1, d || 1);
        return Number.isNaN(date.getTime()) ? value : naturalDate(date);
    };

    return(
        <Container maxWidth={'container.xl'} py={4}>
            <Heading as="h1" size="lg" className="subtitle" mb={4}>Cars for Rent</Heading>

            <Box
                as="form"
                onSubmit={onSearch}
                noValidate
                w="100%"
                mx="auto"
                maxWidth="900px"
                border="2px solid lavender"
                py={3}
                px={3}
                borderRadius="10px"
                aria-label="Plan your trip"
            >
                <Flex flexWrap="wrap" alignItems={{ base: 'stretch', md: 'flex-end' }} gap={3}>
                    <FormControl flex={{ base: "1 1 100%", md: "2 1 0" }}>
                        <FormLabel htmlFor="rent-where" mb={1} fontWeight="600" fontSize="sm">Pickup location</FormLabel>
                        <Box borderWidth="1px" borderRadius="md">
                            <CustomPlacesAutocomplete
                              id="rent-where"
                              value={trip.where}
                              placeholder="City, airport, hotel?"
                              aria-label="Pickup location"
                              onPlaceChange={(place) => setTrip((t) => ({ ...t, where: place.formatted_address, lat: place.lat, lng: place.lng }))}
                            />
                        </Box>
                    </FormControl>

                    <FormControl flex={{ base: "1 1 140px", md: "1 1 0" }}>
                        <FormLabel htmlFor="rent-from" mb={1} fontWeight="600" fontSize="sm">From</FormLabel>
                        <DatePicker id="rent-from" w="100%" label="Pick-up date" value={trip.from} onChange={(from) => setTrip((t) => ({ ...t, from }))} />
                    </FormControl>

                    <FormControl flex={{ base: "1 1 140px", md: "1 1 0" }} isInvalid={submitted && datesInvalid}>
                        <FormLabel htmlFor="rent-until" mb={1} fontWeight="600" fontSize="sm">Until</FormLabel>
                        <DatePicker id="rent-until" w="100%" label="Return date" value={trip.until} min={trip.from || undefined} isInvalid={submitted && datesInvalid} onChange={(until) => setTrip((t) => ({ ...t, until }))} />
                        <FormErrorMessage>Return date must be after the pick-up date</FormErrorMessage>
                    </FormControl>

                    <Button type="submit" colorScheme="blue" bg="primary" w={{ base: "100%", md: "auto" }}>
                        Search
                    </Button>
                </Flex>
            </Box>

            <Flex my={3} py={2} flexWrap={'nowrap'} gap={3} overflowX={'auto'} className="hidden-scroll" alignItems="center">
                <HStack spacing={1} color="gray.600" flexShrink={0} aria-hidden="true"><RiFilterLine /><Text>Filters</Text></HStack>
                <CarBrandFilter param="make" value={params.get('make')} onChange={applyFilter} />
                <PriceFilter value={{ min: params.get('min_price'), max: params.get('max_price') }} onChange={applyFilter} />
                <TransmissionFilter value={params.get('transmission')} onChange={applyFilter} />
            </Flex>

            {chips.length > 0 && (
                <Flex my={2} flexWrap={'wrap'} gap={3} alignItems="center">
                    {chips.map((chip) => (
                        <Tag size="lg" key={chip.keys[0]} variant="outline" colorScheme="blue" borderColor="primary" maxW="100%">
                            <TagLabel>{chip.label}</TagLabel>
                            <TagCloseButton aria-label={`Remove ${chip.label}`} onClick={() => updateParams(Object.fromEntries(chip.keys.map((k) => [k, null])))} />
                        </Tag>
                    ))}
                </Flex>
            )}

            <AsyncState
              query={listings}
              skeleton={<ListingSkeleton />}
              isEmpty={(data) => asList(data?.results).length === 0}
              empty={
                <EmptyState
                  icon={Car}
                  title={chips.length ? 'No rentals match these filters' : 'No cars available for rent yet'}
                  description={chips.length ? 'Try removing a filter or widening your price range.' : 'Check back soon — new rentals are added regularly.'}
                  action={chips.length ? { label: 'Clear filters', onClick: () => updateParams({ make: null, transmission: null, min_price: null, max_price: null }) } : undefined}
                />
              }
            >
                {(data) => (
                    <Box opacity={listings.loading ? 0.6 : 1} transition="opacity .2s" aria-busy={listings.loading}>
                        <Heading as="h2" fontWeight="400" mb={1} size={'md'} color="primary" role="status">
                            {Number(total) === 1 ? '1 car is' : `${commaInt(total ?? asList(data?.results).length)} cars are`} available to rent
                        </Heading>
                        {(fromDate || params.get('where')) && (
                            <Text color="gray.600" fontSize="sm" mb={4}>
                                {fromDate && untilDate ? `${dateLabel(fromDate)} – ${dateLabel(untilDate)}` : fromDate ? `From ${dateLabel(fromDate)}` : ''}
                                {fromDate && params.get('where') ? ' · ' : ''}
                                {params.get('where') ? `Pickup: ${params.get('where')}` : ''}
                                {'. '}We'll add these trip details to your booking.
                            </Text>
                        )}
                        <SimpleGrid mt={4} spacing={{ base: 6, md: 8 }} columns={{base: 1, sm: 2, lg: 3, xl: 4}}>
                            {asList(data?.results).map((listing) =>
                                <ListingItemCard listing={listing} key={listing?.uuid || listing?.id} linkSearch={tripSearch} />
                            )}
                        </SimpleGrid>
                        <PageControls
                          offset={pagination?.offset}
                          limit={pagination?.limit || PAGE_SIZE}
                          count={total}
                          isLoading={listings.loading}
                          onPage={(offset) => { updateParams({ page: offset > 0 ? Math.floor(offset / PAGE_SIZE) + 1 : null }, { keepPage: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        />
                    </Box>
                )}
            </AsyncState>
        </Container>
    )
}


export default RentListing;
