import {
    Box, Button, Container, Flex, Heading, HStack,
    ButtonGroup, SimpleGrid, Tag, TagLabel, TagCloseButton, Text,
} from "@chakra-ui/react"
import { useContext, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { RiFilterLine } from "react-icons/ri"
import { GlobalStore } from "../../../App"
import { Car } from "lucide-react"
import { ListingItemCard, PageControls } from "../../../components"
import { ListingSkeleton } from "../../../components/loaders"
import { AsyncState, EmptyState, InlineError } from "../../../components/states"
import { useApiQuery } from "../../../hooks/useApi"
import { asList } from "../../../utils"
import { CarBrandFilter, PriceFilter, TransmissionFilter, TRANSMISSIONS } from "../../../components/filters"

const PAGE_SIZE = 25;
const CONDITIONS = [
    { value: '', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
];

/** URL (?brands=&transmission=&min_price=&max_price=&condition=&page=) → /listings/buy/ query string. */
function apiQuery(params) {
    const qs = new URLSearchParams();
    for (const key of ['brands', 'transmission', 'condition']) {
        if (params.get(key)) qs.set(key, params.get(key));
    }
    const min = params.get('min_price');
    const max = params.get('max_price');
    // CarSaleFilter expects price=<min>-<max>, with 0 meaning "no bound"
    if (min || max) qs.set('price', `${Number(min) || 0}-${Number(max) || 0}`);
    const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    if (page > 1) qs.set('offset', String((page - 1) * PAGE_SIZE));
    return qs.toString();
}

/** Human labels for the applied-filter chips. */
function appliedChips(params, commaInt) {
    const chips = [];
    if (params.get('brands')) chips.push({ keys: ['brands'], label: `Brand: ${params.get('brands').split(',').join(', ')}` });
    if (params.get('transmission')) {
        const names = params.get('transmission').split(',').map((v) => TRANSMISSIONS.find((t) => t.value === v)?.label || v);
        chips.push({ keys: ['transmission'], label: `Transmission: ${names.join(', ')}` });
    }
    const min = params.get('min_price');
    const max = params.get('max_price');
    if (min || max) {
        const label = min && max ? `₦${commaInt(min)} – ₦${commaInt(max)}` : min ? `From ₦${commaInt(min)}` : `Up to ₦${commaInt(max)}`;
        chips.push({ keys: ['min_price', 'max_price'], label: `Price: ${label}` });
    }
    return chips;
}

const BuyListing = () => {
    const { commaInt } = useContext(GlobalStore);
    const [params, setParams] = useSearchParams();
    const qs = apiQuery(params);
    const condition = params.get('condition') || '';
    const listings = useApiQuery(
        (api, signal) => api.get(`/listings/buy/${qs ? `?${qs}` : ''}`, { signal }),
        [qs],
        { select: (body) => body?.data }
    );

    const banners = [
        { url: '/assets/images/workshop.png', caption: 'Get Priority Access' },
        { url: '/assets/images/mechanic-image.png', caption: 'Get Vetted Professionals' },
    ];

    /** Update URL params (null/'' removes); any filter change goes back to page 1. */
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
        if (filter === 'price') {
            updateParams({ min_price: value?.min ?? null, max_price: value?.max ?? null });
        } else {
            updateParams({ [filter]: value });
        }
    }

    function gotoOffset(offset) {
        updateParams({ page: offset > 0 ? Math.floor(offset / PAGE_SIZE) + 1 : null }, { keepPage: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const chips = appliedChips(params, commaInt);
    const pagination = listings.data?.pagination;
    const total = pagination?.results_count ?? pagination?.count;
    // CarSaleFilter.condition can't be applied by the server yet (see report); say so instead of failing
    const conditionUnsupported = condition && listings.error?.status === 400;

    return(
        <Container maxWidth={'container.xl'} py={4}>
            <Flex align="center" mb={5} flexWrap="wrap-reverse" gap={{base: 4, md: 8}} justify="space-between">
                <Box>
                    <Heading as="h1" size={'lg'} className="subtitle">Cars for Sale</Heading>
                    <ButtonGroup size='md' isAttached variant='outline' mt={3} role="group" aria-label="Condition">
                        {CONDITIONS.map((option) => {
                            const selected = condition === option.value;
                            return (
                                <Button
                                  key={option.value || 'all'}
                                  onClick={() => updateParams({ condition: option.value })}
                                  aria-pressed={selected}
                                  bgColor={selected ? 'primary' : 'transparent'}
                                  color={selected ? 'white' : 'primary'}
                                  borderWidth={2}
                                  borderColor="cornflowerblue"
                                  _hover={{ bgColor: selected ? 'primary' : 'blue.50' }}
                                  borderRadius="30px"
                                  px={{ base: '20px', sm: '30px' }}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </ButtonGroup>
                </Box>

                <BannerCarousel images={banners} />
            </Flex>

            <Flex my={2} py={2} flexWrap={'nowrap'} gap={3} overflowX={'auto'} className="hidden-scroll" alignItems="center">
                <HStack spacing={1} color="gray.600" flexShrink={0} aria-hidden="true"><RiFilterLine /><Text>Filters</Text></HStack>
                <CarBrandFilter param="brands" value={params.get('brands')} onChange={applyFilter} />
                <PriceFilter value={{ min: params.get('min_price'), max: params.get('max_price') }} onChange={applyFilter} />
                <TransmissionFilter value={params.get('transmission')} onChange={applyFilter} />
            </Flex>

            {chips.length > 0 && (
                <Flex my={2} py={2} flexWrap={'wrap'} gap={3} alignItems="center">
                    {chips.map((chip) => (
                        <Tag size="lg" key={chip.keys[0]} variant="outline" colorScheme="blue" borderColor="primary" maxW="100%">
                            <TagLabel>{chip.label}</TagLabel>
                            <TagCloseButton aria-label={`Remove ${chip.label}`} onClick={() => updateParams(Object.fromEntries(chip.keys.map((k) => [k, null])))} />
                        </Tag>
                    ))}
                    <Button size="sm" variant="link" color="primary" onClick={() => setParams(new URLSearchParams(condition ? { condition } : {}))}>
                        Clear all
                    </Button>
                </Flex>
            )}

            {conditionUnsupported ? (
                <Box my={6}>
                    <InlineError error={{ message: "Filtering by new or used isn't available yet." }} />
                    <Button mt={3} variant="outline" color="primary" onClick={() => updateParams({ condition: null })}>Show all cars</Button>
                </Box>
            ) : (
                <AsyncState
                  query={listings}
                  skeleton={<ListingSkeleton />}
                  isEmpty={(data) => asList(data?.results).length === 0}
                  empty={
                    <EmptyState
                      icon={Car}
                      title={qs ? 'No cars match these filters' : 'No cars for sale yet'}
                      description={qs ? 'Try removing a filter or widening your price range.' : 'Verified dealers add new cars every week. Check back soon.'}
                      action={qs ? { label: 'Clear filters', onClick: () => setParams(new URLSearchParams()) } : undefined}
                    />
                  }
                >
                    {(data) => (
                        <Box opacity={listings.loading ? 0.6 : 1} transition="opacity .2s" aria-busy={listings.loading}>
                            {Number.isFinite(Number(total)) && (
                                <Text color="gray.600" mb={4} role="status">
                                    {Number(total) === 1 ? '1 car' : `${commaInt(total)} cars`} for sale
                                </Text>
                            )}
                            <SimpleGrid spacing={{ base: 6, md: 8 }} columns={{base: 1, sm: 2, lg: 3, xl: 4}}>
                                {asList(data?.results).map((listing) =>
                                    <ListingItemCard listing={listing} key={listing?.uuid || listing?.id} />
                                )}
                            </SimpleGrid>
                            <PageControls
                              offset={pagination?.offset}
                              limit={pagination?.limit || PAGE_SIZE}
                              count={total}
                              isLoading={listings.loading}
                              onPage={gotoOffset}
                            />
                        </Box>
                    )}
                </AsyncState>
            )}
        </Container>
    )
}

function BannerCarousel({ images }) {
  const [currentImage, setCurrentImage] = useState(0)
  const banner = images[currentImage]

  return (
    <Box
        w="100%"
        position="relative"
        flex={{ base: 'unset', md: 3.8 / 4, lg: 3.5 / 4 }}
        backgroundImage={`url('${banner.url}')`}
        backgroundRepeat="no-repeat"
        backgroundSize="cover"
        backgroundPosition="center top"
        h={{ base: '160px', md: '210px' }}
        borderRadius="20px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
        role="img"
        aria-label={banner.caption}
    >
        <Heading as="p" color="white" size="lg" textAlign="center" textShadow="-2px 2px 10px black" px={4} aria-hidden="true">
            {banner.caption}
        </Heading>
        <HStack position="absolute" bottom={3} left="50%" transform="translateX(-50%)" spacing={1}>
            {images.map((item, index) => (
                <Box
                    as="button"
                    type="button"
                    key={item.url}
                    aria-label={`Show banner ${index + 1}: ${item.caption}`}
                    aria-current={index === currentImage ? 'true' : undefined}
                    onClick={() => setCurrentImage(index)}
                    p={2}
                >
                    <Box w={index === currentImage ? 8 : 2} h={2} borderRadius="full" bg={index === currentImage ? 'primary' : 'whiteAlpha.800'} />
                </Box>
            ))}
        </HStack>
    </Box>
  )
}


export default BuyListing
