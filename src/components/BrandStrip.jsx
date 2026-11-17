// The sponsored brands strip on the Buy page. Motaa staff add brands in the admin (Sponsored brands);
// each card shows the brand's name above its logo and opens the brand's page. The cards glide past
// continuously, pause while the visitor points at or focuses them, and sit still (scrollable) for
// visitors who prefer reduced motion. With no brands it renders `fallback`.
import { Box, Flex, Image, Skeleton, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Link } from 'react-router-dom';
import { useApiQuery } from '../hooks/useApi';
import { asList } from '../utils';

const glide = keyframes`from { transform: translateX(0); } to { transform: translateX(-50%); }`;
const SECONDS_PER_BRAND = 4;

function BrandCard({ brand, hidden }) {
  return (
    <Box
      as={Link}
      to={`/brands/${brand.slug}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      flexShrink={0}
      w={{ base: '132px', md: '160px' }}
      h={{ base: '108px', md: '138px' }}
      bg="white"
      borderRadius="16px"
      boxShadow="0 4px 14px rgba(0, 101, 181, 0.12)"
      px={3}
      py={3}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      transition="transform .2s, box-shadow .2s"
      _hover={{ transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(0, 101, 181, 0.22)' }}
      _focusVisible={{ outline: '3px solid', outlineColor: 'primary', outlineOffset: '2px' }}
    >
      <Text className="bold" fontSize={{ base: 'sm', md: 'md' }} color="gray.800" noOfLines={1} textAlign="center">
        {brand.name}
      </Text>
      <Flex flex={1} w="100%" align="center" justify="center" mt={2} minH={0}>
        {brand.logo ? (
          <Image src={brand.logo} alt={hidden ? '' : `${brand.name} logo`} maxH={{ base: '48px', md: '64px' }} maxW="100%" objectFit="contain" loading="lazy" />
        ) : (
          <Text fontSize="2xl" className="bold" color="primary" aria-hidden="true">{brand.name.slice(0, 1)}</Text>
        )}
      </Flex>
    </Box>
  );
}

export default function BrandStrip({ fallback = null, ...props }) {
  const query = useApiQuery(
    (api, signal) => api.get('/listings/brands/', { signal, cacheTTL: 60000 }),
    [],
    { select: (body) => asList(body?.data), keepAs: 'sponsored-brands' }
  );
  const brands = asList(query.data).filter((brand) => brand?.slug && brand?.name);
  if (!brands.length) {
    // a placeholder of the same size while loading, so the old banner doesn't flash first
    if (query.loading && !query.error) {
      return <Skeleton w="100%" flex={{ base: 'unset', md: 3.8 / 4, lg: 3.5 / 4 }} h={{ base: '160px', md: '210px' }} borderRadius="20px" {...props} />;
    }
    return fallback;
  }

  // two copies side by side make the glide seamless: it moves one copy's width, then starts again
  const loop = brands.length > 1;
  const duration = `${Math.max(brands.length * SECONDS_PER_BRAND, 12)}s`;

  return (
    <Box
      as="section"
      aria-label="Sponsored car brands"
      w="100%"
      flex={{ base: 'unset', md: 3.8 / 4, lg: 3.5 / 4 }}
      h={{ base: '160px', md: '210px' }}
      borderRadius="20px"
      bgGradient="linear(to-r, #E8F1FC, #F5F9FF)"
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      {...props}
    >
      <Text position="absolute" top={2} left={4} fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
        Sponsored brands
      </Text>
      <Box
        overflowX="auto"
        className="hidden-scroll"
        mt={4}
        sx={{
          '@media (prefers-reduced-motion: no-preference)': loop ? { overflowX: 'hidden' } : {},
        }}
      >
        <Flex
          w="max-content"
          py={3}
          sx={loop ? {
            '@media (prefers-reduced-motion: no-preference)': {
              animation: `${glide} ${duration} linear infinite`,
              '&:hover, &:focus-within': { animationPlayState: 'paused' },
            },
          } : undefined}
        >
          {/* each copy carries its own spacing, so moving by half the row lands exactly on the second copy */}
          <Flex gap={4} pl={4}>
            {brands.map((brand) => <BrandCard key={brand.slug} brand={brand} />)}
          </Flex>
          {loop && (
            <Flex gap={4} pl={4} pr={0} sx={{ '@media (prefers-reduced-motion: reduce)': { display: 'none' } }}>
              {brands.map((brand) => <BrandCard key={`${brand.slug}-copy`} brand={brand} hidden />)}
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
