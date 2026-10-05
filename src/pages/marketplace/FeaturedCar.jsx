// A featured car's page: what the car is (photos, description, specs), then the cars
// dealers currently have of that make and model, for sale and for rent.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Button, Container, Flex, Heading, IconButton, Image, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Car, ChevronLeft, ChevronRight } from 'lucide-react';
import { ListingItemCard, LocationBreadcrumb } from '../../components';
import { EmptyState, ErrorState } from '../../components/states';
import { useApiQuery } from '../../hooks/useApi';
import { asList } from '../../utils';

function Gallery({ images, name }) {
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [images.length]);
  if (!images.length) return null;
  const current = images[Math.min(index, images.length - 1)];
  const go = (next) => setIndex(((next % images.length) + images.length) % images.length);

  return (
    <Box as="section" aria-roledescription="carousel" aria-label={`Photos of ${name}`}>
      <Box position="relative" bg="gray.50" borderRadius="20px" overflow="hidden" sx={{ aspectRatio: '16 / 10' }}>
        <Image src={current.url} alt={current.caption || `${name}, photo ${index + 1} of ${images.length}`} w="100%" h="100%" objectFit={current.contain ? 'contain' : 'cover'} />
        {images.length > 1 && (
          <>
            <IconButton aria-label="Previous photo" icon={<ChevronLeft size={22} />} onClick={() => go(index - 1)}
              position="absolute" left={3} top="50%" transform="translateY(-50%)" rounded="full" bg="whiteAlpha.900" boxShadow="md" _hover={{ bg: 'white' }} />
            <IconButton aria-label="Next photo" icon={<ChevronRight size={22} />} onClick={() => go(index + 1)}
              position="absolute" right={3} top="50%" transform="translateY(-50%)" rounded="full" bg="whiteAlpha.900" boxShadow="md" _hover={{ bg: 'white' }} />
            <Text position="absolute" bottom={3} right={3} bg="blackAlpha.700" color="white" fontSize="xs" px={2} py={1} borderRadius="md" aria-hidden="true">
              {index + 1} / {images.length}
            </Text>
          </>
        )}
      </Box>
      {current.caption && <Text fontSize="sm" color="gray.600" mt={2}>{current.caption}</Text>}
      {images.length > 1 && (
        <Flex gap={2} mt={3} overflowX="auto" pb={1}>
          {images.map((image, i) => (
            <Box
              key={`${image.url}-${i}`} as="button" type="button" onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`} aria-current={i === index}
              flexShrink={0} w="84px" h="60px" borderRadius="md" overflow="hidden"
              borderWidth="2px" borderColor={i === index ? 'primary' : 'transparent'} opacity={i === index ? 1 : 0.7}
            >
              <Image src={image.url} alt="" w="100%" h="100%" objectFit="cover" loading="lazy" />
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
}

function ListingSection({ title, items }) {
  if (!items.length) return null;
  return (
    <Box mt={10}>
      <Heading as="h3" size="md" mb={4}>{title} ({items.length})</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={{ base: 6, md: 8 }}>
        {items.map((listing) => <ListingItemCard key={listing?.uuid || listing?.id} listing={listing} />)}
      </SimpleGrid>
    </Box>
  );
}

export default function FeaturedCarPage() {
  const { slug } = useParams();
  const query = useApiQuery((api, signal) => api.get(`/listings/featured/${slug}/`, { signal }), [slug], { select: (body) => body?.data });
  const car = query.data?.car;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (query.error && !car) {
    return (
      <Container maxW="container.md" py={16}>
        <ErrorState error={query.error} onRetry={query.reload} title={query.error.isNotFound ? "This car isn't featured any more" : undefined} />
        <Flex justify="center"><Button as={Link} to="/buy" variant="link" color="primary">Browse all cars</Button></Flex>
      </Container>
    );
  }

  if (!car) {
    return (
      <Container maxW="container.xl" py={6}>
        <Skeleton h="24px" w="240px" mb={6} />
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <Skeleton borderRadius="20px" sx={{ aspectRatio: '16 / 10' }} />
          <Stack spacing={4}><Skeleton h="40px" w="70%" /><Skeleton h="18px" /><Skeleton h="18px" /><Skeleton h="18px" w="80%" /></Stack>
        </SimpleGrid>
      </Container>
    );
  }

  const sale = asList(query.data?.sale);
  const rentals = asList(query.data?.rentals);
  const specs = asList(car.specs);
  // the uploaded photos; the cut-out from the slider stands in when there are none
  const photos = asList(car.images).filter((image) => image?.url);
  const images = photos.length ? photos : car.image ? [{ url: car.image, caption: '', contain: true }] : [];

  return (
    <Box minH="100vh">
      <Container maxW="container.xl" py={6}>
        <LocationBreadcrumb label={car.name} />

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 10 }} mt={5} alignItems="start">
          <Gallery images={images} name={car.name} />

          <Box>
            <Text fontSize="sm" color="primary" className="bold" textTransform="uppercase" letterSpacing="wide">{car.brand}</Text>
            <Heading as="h1" size="xl" mt={1}>{car.name}</Heading>
            {car.tagline && <Text fontSize="lg" color="gray.600" mt={2}>{car.tagline}</Text>}
            <Text mt={5} whiteSpace="pre-line" color="gray.800">{car.description}</Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={6}>
              <Button as="a" href="#available" bg="primary" color="white" _hover={{ bg: 'secondary' }} size="lg">
                {sale.length + rentals.length ? `See ${sale.length + rentals.length} available` : 'Check availability'}
              </Button>
              <Button as={Link} to="/buy" variant="outline" borderColor="primary" color="primary" size="lg">Browse all cars</Button>
            </Stack>
          </Box>
        </SimpleGrid>

        {specs.length > 0 && (
          <Box mt={12}>
            <Heading as="h2" size="lg" mb={4}>Specifications</Heading>
            <SimpleGrid as="dl" columns={{ base: 1, sm: 2, lg: 3 }} spacingX={8} spacingY={0} borderTopWidth="1px">
              {specs.map((spec) => (
                <Flex key={spec.label} justify="space-between" gap={4} py={3} borderBottomWidth="1px">
                  <Text as="dt" color="gray.600">{spec.label}</Text>
                  <Text as="dd" className="bold" textAlign="right">{spec.value}</Text>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        )}

        <Box id="available" mt={12} scrollMarginTop="90px">
          <Heading as="h2" size="lg">Available on Motaa</Heading>
          {sale.length + rentals.length === 0 ? (
            <EmptyState
              icon={Car}
              title="None available yet"
              description={`No dealer has a ${car.name} listed right now. Check back soon.`}
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
