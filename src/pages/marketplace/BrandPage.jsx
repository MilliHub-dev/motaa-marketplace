// A sponsored brand's page (/brands/:slug): the brand's story, key facts and highlights, its featured
// models, then the cars on Motaa of the makes it covers, for sale and for rent.
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Box, Button, Container, Flex, Heading, Image, LinkBox, LinkOverlay, List, ListIcon, ListItem, SimpleGrid, Skeleton, Stack, Text,
} from '@chakra-ui/react';
import { Car, CheckCircle2, ExternalLink } from 'lucide-react';
import { ListingItemCard, LocationBreadcrumb } from '../../components';
import { EmptyState, ErrorState } from '../../components/states';
import { useApiQuery } from '../../hooks/useApi';
import { asList } from '../../utils';

function ListingSection({ title, items }) {
  if (!items.length) return null;
  return (
    <Box mt={8}>
      <Heading as="h3" size="md" mb={4}>{title} ({items.length})</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={{ base: 6, md: 8 }}>
        {items.map((listing) => <ListingItemCard key={listing?.uuid || listing?.id} listing={listing} />)}
      </SimpleGrid>
    </Box>
  );
}

function ModelCard({ car }) {
  return (
    <LinkBox as="article" borderWidth="1px" borderRadius="16px" overflow="hidden" transition="box-shadow .2s" _hover={{ boxShadow: 'md' }}>
      <Box bg="gray.50" sx={{ aspectRatio: '16 / 10' }}>
        {car.image && <Image src={car.image} alt="" w="100%" h="100%" objectFit="contain" loading="lazy" />}
      </Box>
      <Box p={4}>
        <LinkOverlay as={Link} to={`/featured/${car.slug}`}>
          <Heading as="h3" size="sm">{car.name}</Heading>
        </LinkOverlay>
        {car.tagline && <Text fontSize="sm" color="gray.600" mt={1} noOfLines={2}>{car.tagline}</Text>}
      </Box>
    </LinkBox>
  );
}

export default function BrandPage() {
  const { slug } = useParams();
  const query = useApiQuery((api, signal) => api.get(`/listings/brands/${slug}/`, { signal }), [slug], { select: (body) => body?.data });
  const brand = query.data?.brand;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  useEffect(() => {
    if (brand?.name) document.title = `${brand.name} cars in Nigeria | Motaa`;
  }, [brand?.name]);

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
        <Skeleton h="24px" w="240px" mb={6} />
        <Flex gap={6} align="center"><Skeleton w="140px" h="100px" borderRadius="16px" /><Stack flex={1}><Skeleton h="40px" w="50%" /><Skeleton h="18px" w="70%" /></Stack></Flex>
        <Stack mt={8} spacing={3}><Skeleton h="18px" /><Skeleton h="18px" /><Skeleton h="18px" w="80%" /></Stack>
      </Container>
    );
  }

  const sale = asList(query.data?.sale);
  const rentals = asList(query.data?.rentals);
  const models = asList(query.data?.models).filter((car) => car?.slug);
  const facts = asList(brand.facts);
  const highlights = asList(brand.highlights);
  const paragraphs = asList(brand.paragraphs).length ? asList(brand.paragraphs) : [brand.about].filter(Boolean);
  const available = sale.length + rentals.length;

  return (
    <Box minH="100vh">
      <Container maxW="container.xl" py={6}>
        <LocationBreadcrumb label={brand.name} />

        <Flex mt={5} gap={{ base: 4, md: 8 }} align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}
          bgGradient="linear(to-r, #E8F1FC, #F5F9FF)" borderRadius="20px" p={{ base: 5, md: 8 }}>
          <Flex bg="white" borderRadius="16px" boxShadow="sm" w={{ base: '120px', md: '170px' }} h={{ base: '90px', md: '120px' }}
            align="center" justify="center" p={3} flexShrink={0}>
            {brand.logo
              ? <Image src={brand.logo} alt={`${brand.name} logo`} maxH="100%" maxW="100%" objectFit="contain" />
              : <Text fontSize="4xl" className="bold" color="primary" aria-hidden="true">{brand.name.slice(0, 1)}</Text>}
          </Flex>
          <Box>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">Sponsored brand</Text>
            <Heading as="h1" size="xl" mt={1}>{brand.name}</Heading>
            {brand.tagline && <Text fontSize="lg" color="gray.700" mt={2}>{brand.tagline}</Text>}
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={5}>
              <Button as="a" href="#available" bg="primary" color="white" _hover={{ bg: 'secondary' }}>
                {available ? `See ${available} car${available === 1 ? '' : 's'} on Motaa` : 'Cars on Motaa'}
              </Button>
              {brand.website && (
                <Button as="a" href={brand.website} target="_blank" rel="noopener noreferrer" variant="outline" borderColor="primary" color="primary"
                  rightIcon={<ExternalLink size={16} />}>
                  Official website
                </Button>
              )}
            </Stack>
          </Box>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 8, lg: 12 }} mt={10} alignItems="start">
          <Box gridColumn={{ lg: 'span 2' }}>
            <Heading as="h2" size="lg" mb={4}>About {brand.name}</Heading>
            <Stack spacing={4} color="gray.800">
              {paragraphs.map((paragraph, i) => <Text key={i}>{paragraph}</Text>)}
            </Stack>
            {highlights.length > 0 && (
              <Box mt={8}>
                <Heading as="h3" size="md" mb={3}>Why {brand.name}</Heading>
                <List spacing={2}>
                  {highlights.map((line) => (
                    <ListItem key={line} display="flex" alignItems="flex-start">
                      <ListIcon as={CheckCircle2} color="primary" mt="3px" />
                      <Text>{line}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          {facts.length > 0 && (
            <Box borderWidth="1px" borderRadius="20px" p={6}>
              <Heading as="h2" size="md" mb={2}>Key facts</Heading>
              <Box as="dl">
                {facts.map((fact) => (
                  <Box key={fact.label} py={3} borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}>
                    <Text as="dt" fontSize="sm" color="gray.600">{fact.label}</Text>
                    <Text as="dd" className="bold">{fact.value}</Text>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </SimpleGrid>

        {models.length > 0 && (
          <Box mt={12}>
            <Heading as="h2" size="lg" mb={4}>{brand.name} models</Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={6}>
              {models.map((car) => <ModelCard key={car.slug} car={car} />)}
            </SimpleGrid>
          </Box>
        )}

        <Box id="available" mt={12} scrollMarginTop="90px">
          <Heading as="h2" size="lg">{brand.name} cars on Motaa</Heading>
          {available === 0 ? (
            <EmptyState
              icon={Car}
              title="None listed right now"
              description={`No dealer has a ${brand.name} car listed at the moment. Check back soon.`}
              action={{ label: 'Browse all cars', to: '/buy' }}
              borderWidth="1px" borderRadius="20px" mt={4}
            />
          ) : (
            <>
              <ListingSection title="For sale" items={sale} />
              <ListingSection title="For rent" items={rentals} />
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
