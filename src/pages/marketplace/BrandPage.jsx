// A sponsored brand's page (/brands/:slug), in the brand's colour: a hero with the logo and actions,
// key facts, the brand's story and highlights, its featured models, the cars on Motaa of the makes it
// covers (for sale and for rent), then the other sponsored brands.
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Box, Button, Container, Flex, Heading, HStack, Image, LinkBox, LinkOverlay, SimpleGrid, Skeleton, Stack, Text,
} from '@chakra-ui/react';
import { ArrowRight, Car, Check, ExternalLink, Package, Sparkles } from 'lucide-react';
import { ListingItemCard, LocationBreadcrumb } from '../../components';
import { PartCard } from '../../components/parts';
import { BrandLogo } from '../../components/BrandStrip';
import { EmptyState, ErrorState } from '../../components/states';
import { useApiQuery } from '../../hooks/useApi';
import { asList } from '../../utils';
import { brandColor, shade, tint } from '../../utils/brands';

function ListingSection({ title, items }) {
  if (!items.length) return null;
  return (
    <Box mt={8}>
      <Heading as="h3" size="md" mb={4}>{title} <Text as="span" color="gray.500" fontWeight="500">({items.length})</Text></Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={{ base: 6, md: 8 }}>
        {items.map((listing) => <ListingItemCard key={listing?.uuid || listing?.id} listing={listing} />)}
      </SimpleGrid>
    </Box>
  );
}

function ModelCard({ car, color }) {
  return (
    <LinkBox as="article" role="group" bg="white" borderWidth="1px" borderColor="gray.100" borderRadius="20px" overflow="hidden"
      boxShadow="0 2px 10px rgba(16,24,40,0.05)" transition="all .2s" _hover={{ boxShadow: `0 14px 30px ${tint(color, 0.6)}`, transform: 'translateY(-3px)' }}>
      <Box bg={`linear-gradient(180deg, ${tint(color, 0.92)} 0%, #ffffff 100%)`} sx={{ aspectRatio: '16 / 10' }} p={3}>
        {car.image && <Image src={car.image} alt="" w="100%" h="100%" objectFit="contain" loading="lazy" transition="transform .3s" _groupHover={{ transform: 'scale(1.04)' }} />}
      </Box>
      <Flex p={4} align="center" justify="space-between" gap={3}>
        <Box minW={0}>
          <LinkOverlay as={Link} to={`/featured/${car.slug}`}>
            <Heading as="h3" size="sm" noOfLines={1}>{car.name}</Heading>
          </LinkOverlay>
          {car.tagline && <Text fontSize="sm" color="gray.600" mt={1} noOfLines={2}>{car.tagline}</Text>}
        </Box>
        <Flex w={8} h={8} borderRadius="full" bg={tint(color, 0.88)} color={shade(color, 0.2)} align="center" justify="center" flexShrink={0} aria-hidden="true">
          <ArrowRight size={16} />
        </Flex>
      </Flex>
    </LinkBox>
  );
}

function OtherBrands({ current, kind }) {
  const parts = kind === 'parts';
  const query = useApiQuery((api, signal) => api.get(parts ? '/listings/brands/?kind=parts' : '/listings/brands/', { signal, cacheTTL: 60000 }), [kind],
    { select: (body) => asList(body?.data), keepAs: parts ? 'sponsored-part-brands' : 'sponsored-brands' });
  const others = asList(query.data).filter((brand) => brand?.slug && brand.slug !== current);
  if (!others.length) return null;
  return (
    <Box mt={16}>
      <Heading as="h2" size="md" mb={4}>More sponsored brands</Heading>
      <Flex gap={4} overflowX="auto" className="hidden-scroll" pb={2}>
        {others.map((brand) => {
          const color = brandColor(brand);
          return (
            <Box key={brand.slug} as={Link} to={`/brands/${brand.slug}`} flexShrink={0} w="170px" bg="white" borderWidth="1px" borderColor="gray.100"
              borderRadius="16px" overflow="hidden" transition="all .2s" _hover={{ transform: 'translateY(-2px)', boxShadow: `0 10px 22px ${tint(color, 0.6)}` }}>
              <Box h="4px" bg={color} />
              <Text fontWeight="700" textAlign="center" pt={2}>{brand.name}</Text>
              <Flex h="70px" align="center" justify="center" px={4} pb={3}>
                <BrandLogo brand={brand} color={color} alt="" maxH="48px" maxW="100%" loading="lazy" />
              </Flex>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}

export default function BrandPage() {
  const { slug } = useParams();
  const query = useApiQuery((api, signal) => api.get(`/listings/brands/${slug}/`, { signal }), [slug], { select: (body) => body?.data });
  const brand = query.data?.brand;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  useEffect(() => {
    if (brand?.name) document.title = brand.kind === 'parts' ? `${brand.name} parts in Nigeria | Motaa` : `${brand.name} cars in Nigeria | Motaa`;
  }, [brand?.name, brand?.kind]);

  if (query.error && !brand) {
    return (
      <Container maxW="container.md" py={16}>
        <ErrorState error={query.error} onRetry={query.reload} title={query.error.isNotFound ? "This brand isn't on Motaa any more" : undefined} />
        <Flex justify="center"><Button as={Link} to="/buy" variant="link" color="primary">Browse all cars</Button></Flex>
      </Container>
    );
  }

  if (!brand) {
    return (
      <Container maxW="container.xl" py={6}>
        <Skeleton h="20px" w="200px" mb={5} />
        <Skeleton h={{ base: '320px', md: '280px' }} borderRadius="28px" />
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={6}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h="80px" borderRadius="16px" />)}</SimpleGrid>
        <Stack mt={8} spacing={3}><Skeleton h="18px" /><Skeleton h="18px" /><Skeleton h="18px" w="80%" /></Stack>
      </Container>
    );
  }

  const color = brandColor(brand);
  const sale = asList(query.data?.sale);
  const rentals = asList(query.data?.rentals);
  const models = asList(query.data?.models).filter((car) => car?.slug);
  const facts = asList(brand.facts);
  const highlights = asList(brand.highlights);
  const paragraphs = asList(brand.paragraphs).length ? asList(brand.paragraphs) : [brand.about].filter(Boolean);
  const isParts = brand.kind === 'parts';
  const parts = asList(query.data?.parts);
  const available = isParts ? parts.length : sale.length + rentals.length;

  return (
    <Box minH="100vh" pb={16}>
      <Container maxW="container.xl" pt={6}>
        <LocationBreadcrumb label={brand.name} />

        {/* hero: dark on the left (where the text is), the brand's own colour on the right */}
        <Box mt={5} position="relative" overflow="hidden" borderRadius={{ base: '24px', md: '28px' }} color="white"
          bg={`linear-gradient(110deg, ${shade(color, 0.72)} 0%, ${shade(color, 0.45)} 55%, ${color} 100%)`}
          px={{ base: 6, md: 12 }} pt={{ base: 8, md: 12 }} pb={{ base: facts.length ? 16 : 8, md: facts.length ? 20 : 12 }}>
          <Box aria-hidden="true" position="absolute" inset={0} pointerEvents="none"
            bgImage="radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)" bgSize="22px 22px"
            sx={{ maskImage: 'linear-gradient(to right, black, transparent 70%)' }} />
          <Box aria-hidden="true" position="absolute" right="-120px" top="-120px" w="420px" h="420px" borderRadius="full"
            bg={`radial-gradient(circle, ${tint(color, 0.35)}55 0%, transparent 70%)`} />

          <Flex position="relative" gap={{ base: 6, md: 10 }} align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
            <Flex bg="white" borderRadius="22px" boxShadow="0 20px 40px rgba(0,0,0,0.25)" w={{ base: '150px', md: '220px' }} h={{ base: '110px', md: '150px' }}
              align="center" justify="center" p={{ base: 4, md: 6 }} flexShrink={0}>
              <BrandLogo brand={brand} color={color} maxH="100%" maxW="100%" />
            </Flex>
            <Box minW={0}>
              <HStack spacing={2} bg="rgba(255,255,255,0.14)" border="1px solid rgba(255,255,255,0.22)" display="inline-flex"
                px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="600" letterSpacing="wide" textTransform="uppercase">
                <Box as={Sparkles} size={13} color="tertiary" aria-hidden="true" />
                <Text>Sponsored brand</Text>
              </HStack>
              <Heading as="h1" fontSize={{ base: '4xl', md: '5xl' }} fontWeight="800" mt={3} lineHeight={1.05} letterSpacing="-0.02em">{brand.name}</Heading>
              {brand.tagline && <Text fontSize={{ base: 'md', md: 'lg' }} opacity={0.92} mt={3} maxW="640px" lineHeight={1.5}>{brand.tagline}</Text>}
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={6}>
                <Button as="a" href="#available" size="lg" h="52px" borderRadius="14px" bg="white" color={shade(color, 0.35)} fontWeight="700"
                  rightIcon={<ArrowRight size={18} />} _hover={{ bg: tint(color, 0.9), transform: 'translateY(-1px)' }}>
                  {isParts
                    ? (available ? `See ${available} part${available === 1 ? '' : 's'}` : 'Parts on Motaa')
                    : (available ? `See ${available} car${available === 1 ? '' : 's'}` : 'Cars on Motaa')}
                </Button>
                {brand.website && (
                  <Button as="a" href={brand.website} target="_blank" rel="noopener noreferrer" size="lg" h="52px" borderRadius="14px"
                    variant="outline" color="white" borderColor="rgba(255,255,255,0.5)" _hover={{ bg: 'rgba(255,255,255,0.12)' }}
                    rightIcon={<ExternalLink size={16} />}>
                    Official website
                  </Button>
                )}
              </Stack>
            </Box>
          </Flex>
        </Box>

        {/* key facts, overlapping the hero */}
        {facts.length > 0 && (
          <SimpleGrid as="dl" columns={{ base: 2, lg: Math.min(facts.length, 4) }} spacing={{ base: 3, md: 4 }}
            mt={{ base: -10, md: -12 }} px={{ base: 3, md: 8 }} position="relative">
            {facts.map((fact) => (
              <Box key={fact.label} bg="white" borderRadius="18px" p={{ base: 4, md: 5 }} boxShadow="0 10px 30px rgba(16,24,40,0.10)"
                borderTop="3px solid" borderTopColor={color}>
                <Text as="dt" fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">{fact.label}</Text>
                <Text as="dd" fontWeight="700" color="gray.800" mt={1} lineHeight={1.35}>{fact.value}</Text>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {/* story and highlights */}
        <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={{ base: 8, lg: 12 }} mt={{ base: 10, md: 14 }} alignItems="start">
          <Box gridColumn={{ lg: 'span 3' }}>
            <Text fontSize="sm" fontWeight="700" color={shade(color, 0.15)} textTransform="uppercase" letterSpacing="wider">About</Text>
            <Heading as="h2" size="lg" mt={1} mb={5}>Get to know {brand.name}</Heading>
            <Stack spacing={4} color="gray.700" fontSize={{ base: 'md', md: 'lg' }} lineHeight={1.75}>
              {paragraphs.map((paragraph, i) => <Text key={i}>{paragraph}</Text>)}
            </Stack>
          </Box>
          {highlights.length > 0 && (
            <Box gridColumn={{ lg: 'span 2' }} bg={tint(color, 0.94)} border="1px solid" borderColor={tint(color, 0.82)} borderRadius="24px" p={{ base: 6, md: 7 }}>
              <Heading as="h2" size="md" mb={5}>Why {brand.name}</Heading>
              <Stack as="ul" listStyleType="none" spacing={4}>
                {highlights.map((line) => (
                  <HStack as="li" key={line} align="flex-start" spacing={3}>
                    <Flex w={6} h={6} borderRadius="full" bg={color} color="white" align="center" justify="center" flexShrink={0} mt="1px" aria-hidden="true">
                      <Check size={14} strokeWidth={3} />
                    </Flex>
                    <Text color="gray.800" fontWeight="500">{line}</Text>
                  </HStack>
                ))}
              </Stack>
            </Box>
          )}
        </SimpleGrid>

        {models.length > 0 && (
          <Box mt={16}>
            <Flex align="baseline" justify="space-between" mb={5} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="700" color={shade(color, 0.15)} textTransform="uppercase" letterSpacing="wider">Line-up</Text>
                <Heading as="h2" size="lg" mt={1}>{brand.name} models</Heading>
              </Box>
            </Flex>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={6}>
              {models.map((car) => <ModelCard key={car.slug} car={car} color={color} />)}
            </SimpleGrid>
          </Box>
        )}

        <Box id="available" mt={16} scrollMarginTop="90px">
          <Text fontSize="sm" fontWeight="700" color={shade(color, 0.15)} textTransform="uppercase" letterSpacing="wider">On Motaa now</Text>
          <Heading as="h2" size="lg" mt={1}>{isParts ? `${brand.name} parts` : `${brand.name} cars for sale and rent`}</Heading>
          {isParts ? (available === 0 ? (
            <EmptyState
              icon={Package}
              title="None listed right now"
              description={`No seller has ${brand.name} parts listed at the moment. Check back soon.`}
              action={{ label: 'Browse all parts', to: '/parts' }}
              borderWidth="1px" borderRadius="24px" mt={5} bg={tint(color, 0.97)}
            />
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 3, md: 5 }} mt={6}>
              {parts.map((part) => <PartCard key={part.uuid} part={part} />)}
            </SimpleGrid>
          )) : available === 0 ? (
            <EmptyState
              icon={Car}
              title="None listed right now"
              description={`No dealer has a ${brand.name} car listed at the moment. Check back soon.`}
              action={{ label: 'Browse all cars', to: '/buy' }}
              borderWidth="1px" borderRadius="24px" mt={5} bg={tint(color, 0.97)}
            />
          ) : (
            <>
              <ListingSection title="For sale" items={sale} />
              <ListingSection title="For rent" items={rentals} />
            </>
          )}
        </Box>

        <OtherBrands current={brand.slug} kind={brand.kind} />
      </Container>
    </Box>
  );
}
