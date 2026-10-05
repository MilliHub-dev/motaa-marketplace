// The marketing slider in the home page hero. Motaa staff add "featured cars" in the
// admin; each is a slide (a cut-out photo of the car on the blue circle) that opens the
// car's page. With no featured cars it renders `fallback` (the original hero picture).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Flex, IconButton, Image, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiQuery } from '../hooks/useApi';
import { asList } from '../utils';

const SLIDE_MS = 6000;

/** The three concentric blue circles behind the car. */
function BlueCircle() {
  const ring = { position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%, -50%)', borderRadius: '50%', sx: { aspectRatio: '1' } };
  return (
    <Box aria-hidden="true">
      <Box {...ring} w="66%" bg="#B9D4F3" />
      <Box {...ring} w="60%" bg="#5C9AE0" />
      <Box {...ring} w="54%" bg="#0460CC" />
    </Box>
  );
}

export default function FeaturedSlider({ fallback = null }) {
  const query = useApiQuery((api, signal) => api.get('/listings/featured/', { signal, cacheTTL: 60000 }), [], { select: (body) => asList(body?.data) });
  const cars = asList(query.data).filter((car) => car?.slug && car?.image);
  const count = cars.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const go = useCallback((next) => setIndex(() => ((next % count) + count) % count), [count]);

  // keep the index valid if the list changes
  useEffect(() => { if (index >= count && count > 0) setIndex(0); }, [index, count]);

  // advance on a timer, unless the visitor is interacting or prefers reduced motion
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  // while loading, and when nothing is featured (or the request failed), show the original picture
  if (!count) return fallback;

  const current = cars[Math.min(index, count - 1)];

  return (
    <Box
      as="section"
      aria-roledescription="carousel"
      aria-label="Featured cars"
      position="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        setPaused(false);
        if (start === null) return;
        const moved = e.changedTouches[0].clientX - start;
        if (Math.abs(moved) > 40) go(index + (moved < 0 ? 1 : -1));
      }}
    >
      <Box position="relative" w="100%" sx={{ aspectRatio: '4 / 3' }}>
        <BlueCircle />
        {cars.map((car, i) => {
          const active = i === index;
          return (
            <Box
              key={car.slug}
              as={Link}
              to={`/featured/${car.slug}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${car.name}, ${i + 1} of ${count}. View details`}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={active ? 1 : 0}
              pointerEvents={active ? 'auto' : 'none'}
              transform={active ? 'translateX(0)' : 'translateX(24px)'}
              transition="opacity 0.5s ease, transform 0.5s ease"
              sx={{ '@media (prefers-reduced-motion: reduce)': { transition: 'none', transform: 'none' } }}
              _focusVisible={{ outline: '3px solid', outlineColor: 'primary', outlineOffset: '4px', borderRadius: 'lg' }}
            >
              <Image
                src={car.image}
                alt={car.name}
                loading={i === 0 ? 'eager' : 'lazy'}
                maxW="96%"
                maxH="78%"
                objectFit="contain"
                filter="drop-shadow(0 18px 14px rgba(0,0,0,0.22))"
                mt="6%"
              />
            </Box>
          );
        })}

        {count > 1 && (
          <>
            <IconButton
              aria-label="Previous car" icon={<ChevronLeft size={22} />} onClick={() => go(index - 1)}
              position="absolute" left={0} top="46%" transform="translateY(-50%)" rounded="full" size="sm" bg="whiteAlpha.900" boxShadow="md" _hover={{ bg: 'white' }}
            />
            <IconButton
              aria-label="Next car" icon={<ChevronRight size={22} />} onClick={() => go(index + 1)}
              position="absolute" right={0} top="46%" transform="translateY(-50%)" rounded="full" size="sm" bg="whiteAlpha.900" boxShadow="md" _hover={{ bg: 'white' }}
            />
          </>
        )}
      </Box>

      <Box textAlign="center" mt={1} aria-live="polite" minH="52px">
        <Text as={Link} to={`/featured/${current.slug}`} className="bold" fontSize="lg" _hover={{ color: 'primary' }}>{current.name}</Text>
        {current.tagline && <Text fontSize="sm" color="gray.600" noOfLines={1}>{current.tagline}</Text>}
      </Box>

      {count > 1 && (
        <Flex justify="center" gap={2} mt={2} role="tablist" aria-label="Choose a featured car">
          {cars.map((car, i) => (
            <Box
              key={car.slug}
              as="button"
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${car.name}`}
              onClick={() => go(i)}
              // a comfortable tap target around a small dot
              p="9px"
              m="-5px"
            >
              <Box w={i === index ? '22px' : '8px'} h="8px" rounded="full" bg={i === index ? 'primary' : 'gray.300'} transition="width 0.25s ease" />
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
}
