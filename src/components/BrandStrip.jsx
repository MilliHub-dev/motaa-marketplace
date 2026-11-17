// The sponsored brands strip on the Buy page. Motaa staff add brands in the admin (Sponsored brands);
// each card shows the brand's name above its logo, carries the brand's colour, and opens the brand's
// page. The cards glide past continuously (fading in and out at the edges), pause while the visitor
// points at or focuses them, and sit still (scrollable) for visitors who prefer reduced motion.
// With no brands it renders `fallback`.
import { useState } from 'react';
import { Box, Flex, HStack, Image, Skeleton, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiQuery } from '../hooks/useApi';
import { asList } from '../utils';
import { brandColor, tint } from '../utils/brands';

const glide = keyframes`from { transform: translateX(0); } to { transform: translateX(-50%); }`;
const SECONDS_PER_BRAND = 4.5;
const SLOT = { w: '100%', flex: { base: 'unset', md: 3.8 / 4, lg: 3.5 / 4 }, h: { base: '170px', md: '210px' }, borderRadius: '20px' };

/** The brand's logo, or its initial in the brand colour when there is none or it fails to load. */
export function BrandLogo({ brand, color, alt, ...props }) {
  const [failed, setFailed] = useState(false);
  if (!brand.logo || failed) {
    return <Text fontSize="3xl" fontWeight="800" color={color} lineHeight={1} aria-hidden={alt === '' || undefined}>{brand.name.slice(0, 1)}</Text>;
  }
  return <Image src={brand.logo} alt={alt ?? `${brand.name} logo`} objectFit="contain" onError={() => setFailed(true)} {...props} />;
}

function BrandCard({ brand, hidden }) {
  const color = brandColor(brand);
  return (
    <Box
      as={Link}
      to={`/brands/${brand.slug}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      aria-label={hidden ? undefined : `${brand.name}, sponsored brand`}
      role="group"
      position="relative"
      flexShrink={0}
      w={{ base: '138px', md: '172px' }}
      h={{ base: '106px', md: '132px' }}
      bg="white"
      borderRadius="16px"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="0 2px 10px rgba(16, 24, 40, 0.06)"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      transition="transform .2s, box-shadow .2s, border-color .2s"
      _hover={{ transform: 'translateY(-3px)', boxShadow: `0 12px 24px ${tint(color, 0.55)}`, borderColor: tint(color, 0.45) }}
      _focusVisible={{ outline: '3px solid', outlineColor: color, outlineOffset: '2px' }}
    >
      <Box h="4px" bg={color} flexShrink={0} />
      <HStack spacing={1.5} px={3} pt={2.5} justify="center">
        <Text fontWeight="700" fontSize={{ base: 'sm', md: 'md' }} color="gray.800" noOfLines={1}>{brand.name}</Text>
      </HStack>
      <Flex flex={1} align="center" justify="center" px={4} pb={3} pt={1} minH={0}>
        <BrandLogo brand={brand} color={color} alt={hidden ? '' : undefined} maxH={{ base: '40px', md: '56px' }} maxW="100%" loading="lazy" />
      </Flex>
      {/* "view" hint on hover, in the brand colour */}
      <Flex position="absolute" insetX={0} bottom={0} h="26px" align="center" justify="center" gap={1}
        bg={tint(color, 0.9)} color={color} fontSize="xs" fontWeight="700"
        transform="translateY(100%)" transition="transform .2s" _groupHover={{ transform: 'translateY(0)' }} _groupFocusVisible={{ transform: 'translateY(0)' }}
        aria-hidden="true">
        View brand <ArrowRight size={12} />
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
    if (query.loading && !query.error) return <Skeleton {...SLOT} {...props} />;
    return fallback;
  }

  // two copies side by side make the glide seamless: it moves one copy's width, then starts again
  const loop = brands.length > 1;
  const duration = `${Math.max(brands.length * SECONDS_PER_BRAND, 14)}s`;
  const fade = 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)';

  return (
    <Box
      as="section"
      aria-label="Sponsored car brands"
      {...SLOT}
      position="relative"
      overflow="hidden"
      bg="linear-gradient(180deg, #F7FAFE 0%, #EEF4FC 100%)"
      border="1px solid"
      borderColor="#E3ECF7"
      display="flex"
      flexDirection="column"
      {...props}
    >
      <Flex align="center" justify="space-between" px={{ base: 4, md: 5 }} pt={{ base: 3, md: 4 }} gap={3}>
        <HStack spacing={2}>
          <Flex w={6} h={6} borderRadius="full" bg="tertiary" color="secondary" align="center" justify="center" aria-hidden="true">
            <Sparkles size={13} />
          </Flex>
          <Text fontWeight="700" fontSize="sm" color="secondary">Sponsored brands</Text>
        </HStack>
        <Text fontSize="xs" color="gray.500" display={{ base: 'none', sm: 'block' }}>Official partners on Motaa</Text>
      </Flex>

      <Box
        flex={1}
        display="flex"
        alignItems="center"
        overflowX="auto"
        className="hidden-scroll"
        sx={{
          maskImage: fade,
          WebkitMaskImage: fade,
          '@media (prefers-reduced-motion: no-preference)': loop ? { overflowX: 'hidden' } : {},
        }}
      >
        <Flex
          w="max-content"
          py={2}
          sx={loop ? {
            '@media (prefers-reduced-motion: no-preference)': {
              animation: `${glide} ${duration} linear infinite`,
              '&:hover, &:focus-within': { animationPlayState: 'paused' },
            },
          } : undefined}
        >
          {/* each copy carries its own spacing, so moving by half the row lands exactly on the second copy */}
          <Flex gap={{ base: 3, md: 4 }} pl={{ base: 3, md: 4 }}>
            {brands.map((brand) => <BrandCard key={brand.slug} brand={brand} />)}
          </Flex>
          {loop && (
            <Flex gap={{ base: 3, md: 4 }} pl={{ base: 3, md: 4 }} sx={{ '@media (prefers-reduced-motion: reduce)': { display: 'none' } }}>
              {brands.map((brand) => <BrandCard key={`${brand.slug}-copy`} brand={brand} hidden />)}
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
