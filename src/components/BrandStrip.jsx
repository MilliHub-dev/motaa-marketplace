// Sponsored brands (managed in the admin): car brands on the Buy page, spare-part brands on the Parts page.
// A dark "partner showroom": one brand at a time in the spotlight (big logo, name, tagline, its own colour, a link to
// its page) and the brands' logos as tiles beside it. The spotlight moves on every few seconds; pointing at or
// focusing a tile brings that brand forward and pauses it. Visitors who prefer reduced motion get no rotation.
// With no brands it renders `fallback`.
import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Grid, HStack, Image, Skeleton, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiQuery } from '../hooks/useApi';
import { asList } from '../utils';
import { brandColor, shade, tint } from '../utils/brands';

const ROTATE_MS = 5000;
const SLOT = { w: '100%', flex: { base: 'unset', md: 3.8 / 4, lg: 3.5 / 4 }, h: { base: '178px', md: '210px' }, borderRadius: { base: '20px', md: '24px' } };
const fill = keyframes`from { transform: scaleX(0); } to { transform: scaleX(1); }`;
const rise = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; }`;

/** The brand's logo, or its initial in the brand colour when there is none or it fails to load. */
export function BrandLogo({ brand, color, alt, ...props }) {
  const [failed, setFailed] = useState(false);
  if (!brand.logo || failed) {
    return <Text fontSize="3xl" fontWeight="800" color={color} lineHeight={1} aria-hidden={alt === '' || undefined}>{brand.name.slice(0, 1)}</Text>;
  }
  return <Image src={brand.logo} alt={alt ?? `${brand.name} logo`} objectFit="contain" onError={() => setFailed(true)} {...props} />;
}

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** A logo-only tile. The active one is lifted, outlined in the brand's colour and shows the rotation timer. */
function LogoTile({ brand, active, running, onActivate, compact }) {
  const color = brandColor(brand);
  return (
    <Box as={Link} to={`/brands/${brand.slug}`} aria-label={`${brand.name}, sponsored brand`} onMouseEnter={onActivate} onFocus={onActivate}
      position="relative" display="flex" alignItems="center" justifyContent="center" flexShrink={0} overflow="hidden"
      w={compact ? '84px' : '100%'} h={compact ? '46px' : '100%'} minH={0} px={compact ? 2.5 : 4} py={compact ? 1.5 : 3}
      bg="white" borderRadius={compact ? '12px' : '16px'} opacity={active ? 1 : 0.9}
      boxShadow={active ? `0 0 0 2px ${color}, 0 10px 24px rgba(0,0,0,0.35)` : '0 2px 8px rgba(0,0,0,0.18)'}
      transform={active && !compact ? 'translateY(-2px)' : undefined} transition="all .25s ease"
      _hover={{ opacity: 1 }} _focusVisible={{ outline: '3px solid #FDD153', outlineOffset: '2px' }}>
      <BrandLogo brand={brand} color={color} alt="" maxH={compact ? '26px' : '44px'} maxW="100%" loading="lazy" />
      {active && running && (
        <Box position="absolute" left={0} right={0} bottom={0} h="3px" bg={tint(color, 0.75)} aria-hidden="true">
          <Box h="100%" bg={color} transformOrigin="left" sx={{ animation: `${fill} ${ROTATE_MS}ms linear forwards` }} />
        </Box>
      )}
    </Box>
  );
}

/** kind: 'cars' (the Buy page) or 'parts' (spare-part brands on the Parts page). */
export default function BrandStrip({ fallback = null, kind = 'cars', ...props }) {
  const parts = kind === 'parts';
  const query = useApiQuery(
    (api, signal) => api.get(parts ? '/listings/brands/?kind=parts' : '/listings/brands/', { signal, cacheTTL: 60000 }),
    [kind],
    { select: (body) => asList(body?.data), keepAs: parts ? 'sponsored-part-brands' : 'sponsored-brands' }
  );
  const brands = asList(query.data).filter((brand) => brand?.slug && brand?.name);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still] = useState(prefersReducedMotion);
  const timer = useRef(null);
  const count = brands.length;
  const running = count > 1 && !paused && !still;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => setActive((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(timer.current);
  }, [running, active, count]);
  useEffect(() => { if (active >= count && count) setActive(0); }, [active, count]);

  if (!count) {
    if (query.loading && !query.error) return <Skeleton {...SLOT} {...props} />;
    return fallback;
  }

  const brand = brands[Math.min(active, count - 1)];
  const color = brandColor(brand);
  const label = parts ? 'Official parts partners' : 'Official partners';

  return (
    <Box as="section" aria-label={parts ? 'Sponsored spare-part brands' : 'Sponsored car brands'} {...SLOT} position="relative" overflow="hidden"
      color="white" bg="#0B1220" onMouseLeave={() => setPaused(false)} onMouseEnter={() => setPaused(true)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} {...props}>
      {/* the spotlight brand's colour washes in from the left; a fine dot texture keeps it from looking flat */}
      <Box position="absolute" inset={0} transition="background .6s ease" aria-hidden="true"
        bg={`radial-gradient(120% 140% at 0% 0%, ${shade(color, 0.15)}E6 0%, ${shade(color, 0.55)}B3 38%, #0B1220 72%)`} />
      <Box position="absolute" inset={0} opacity={0.5} aria-hidden="true"
        bgImage="radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)" bgSize="18px 18px" />

      <Flex position="relative" h="100%" direction={{ base: 'column', md: 'row' }} gap={{ base: 3, md: 5 }} p={{ base: 3.5, md: 5 }}>
        {/* spotlight */}
        <Flex as={Link} to={`/brands/${brand.slug}`} key={brand.slug} flex={{ md: '1 1 52%' }} minW={0} align="center" gap={{ base: 3, md: 4 }}
          role="group" aria-label={`${brand.name}: ${brand.tagline || 'see the brand'}`} sx={{ animation: still ? undefined : `${rise} .45s ease` }}>
          <Flex flexShrink={0} w={{ base: '72px', md: '112px' }} h={{ base: '72px', md: '112px' }} bg="white" borderRadius={{ base: '16px', md: '22px' }}
            align="center" justify="center" p={{ base: 2.5, md: 4 }} boxShadow={`0 14px 34px ${shade(color, 0.3)}88`}
            transition="transform .25s" _groupHover={{ transform: 'rotate(-2deg) scale(1.03)' }}>
            <BrandLogo brand={brand} color={color} alt="" maxH="100%" maxW="100%" />
          </Flex>
          <Box minW={0}>
            <HStack spacing={1.5} fontSize="10px" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="#FDD153">
              <Sparkles size={12} aria-hidden="true" /><Text>{label}</Text>
            </HStack>
            <Text fontSize={{ base: 'xl', md: '3xl' }} fontWeight="800" lineHeight={1.1} letterSpacing="-0.02em" mt={1} noOfLines={1}>{brand.name}</Text>
            {brand.tagline && (
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="whiteAlpha.800" mt={1} noOfLines={{ base: 1, md: 2 }} maxW="420px">{brand.tagline}</Text>
            )}
            <HStack display={{ base: 'none', md: 'inline-flex' }} spacing={2} mt={3} px={3.5} py={1.5} borderRadius="full" bg="white" color={shade(color, 0.3)}
              fontSize="sm" fontWeight="700" transition="gap .2s" _groupHover={{ gap: 3 }}>
              <Text>Explore {brand.name}</Text><ArrowRight size={15} />
            </HStack>
          </Box>
          <Box display={{ base: 'block', md: 'none' }} ml="auto" color="whiteAlpha.800" flexShrink={0}><ArrowRight size={18} /></Box>
        </Flex>

        {/* logo tiles: a 2-row grid on wider screens, a scrolling row of chips on phones */}
        <Grid display={{ base: 'none', md: 'grid' }} flex="1 1 48%" minW={0} gridAutoFlow="column" gridTemplateRows="repeat(2, minmax(0, 1fr))"
          gridAutoColumns="minmax(118px, 1fr)" gap={3} overflowX="auto" className="hidden-scroll" py={0.5} px={0.5}>
          {brands.map((item, i) => (
            <LogoTile key={item.slug} brand={item} active={i === active} running={running} onActivate={() => setActive(i)} />
          ))}
        </Grid>
        <HStack display={{ base: 'flex', md: 'none' }} spacing={2} overflowX="auto" className="hidden-scroll" py={0.5} px={0.5}>
          {brands.map((item, i) => (
            <LogoTile key={item.slug} brand={item} active={i === active} running={running} onActivate={() => setActive(i)} compact />
          ))}
        </HStack>
      </Flex>
    </Box>
  );
}
