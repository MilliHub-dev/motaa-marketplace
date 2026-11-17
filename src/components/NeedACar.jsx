// "Need a car?" on the logged-in home page: why to buy or rent on Motaa, with the Changan UNI-K
// (cut-out from its featured-car page) as the hero car. Specs match the UNI-K featured car.
import { Box, Button, Container, Flex, Heading, HStack, Image, Stack, Text } from '@chakra-ui/react';
import { ArrowRight, BadgeCheck, LockKeyhole, ScanSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

const CAR = {
  name: 'Changan UNI-K',
  tagline: 'Flagship coupe-SUV',
  image: '/assets/images/changan-uni-k.webp',
  page: '/featured/changan-uni-k',
  specs: ['2.0L turbo', '233 hp', 'All-wheel drive'],
};

const PROMISES = [
  { icon: BadgeCheck, label: 'Verified dealers' },
  { icon: LockKeyhole, label: 'Escrow payments' },
  { icon: ScanSearch, label: 'Pay after inspection' },
];

function SpecChip({ children, ...props }) {
  return (
    <Box
      position="absolute"
      bg="rgba(255,255,255,0.14)"
      border="1px solid rgba(255,255,255,0.28)"
      backdropFilter="blur(8px)"
      color="white"
      px={3}
      py={1.5}
      borderRadius="full"
      fontSize="sm"
      fontWeight="600"
      whiteSpace="nowrap"
      boxShadow="0 8px 24px rgba(0,0,0,0.18)"
      display={{ base: 'none', lg: 'block' }}
      {...props}
    >
      {children}
    </Box>
  );
}

export default function NeedACar() {
  return (
    <Box as="section" aria-labelledby="need-a-car-heading" py={{ base: 10, md: 16 }}>
      <Container maxW="7xl">
        <Box
          position="relative"
          overflow="hidden"
          borderRadius={{ base: '24px', md: '32px' }}
          bgGradient="linear(135deg, #0A74C9 0%, #0065B5 45%, #1C3D5A 100%)"
          px={{ base: 6, md: 12 }}
          pt={{ base: 8, md: 14 }}
          pb={{ base: 8, md: 14 }}
        >
          {/* light and texture */}
          <Box aria-hidden="true" position="absolute" inset={0} pointerEvents="none"
            bgImage="radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)" bgSize="22px 22px"
            sx={{ maskImage: 'linear-gradient(to right, black, transparent 60%)' }} />
          <Box aria-hidden="true" position="absolute" right={{ base: '-30%', md: '-8%' }} top={{ base: '-10%', md: '0%' }}
            w={{ base: '420px', md: '720px' }} h={{ base: '420px', md: '720px' }} borderRadius="full"
            bg="radial-gradient(circle, rgba(253,209,83,0.32) 0%, rgba(253,209,83,0.08) 40%, transparent 70%)" pointerEvents="none" />

          <Flex position="relative" direction={{ base: 'column-reverse', md: 'row' }} align="center" gap={{ base: 6, md: 10 }}>
            {/* the pitch */}
            <Box flex={{ md: '0 0 46%' }} color="white" w="100%">
              <HStack spacing={2} bg="rgba(255,255,255,0.12)" border="1px solid rgba(255,255,255,0.2)" px={3} py={1.5}
                borderRadius="full" display="inline-flex" mb={5} fontSize="sm">
                <Box w={2} h={2} borderRadius="full" bg="tertiary" />
                <Text fontWeight="600">Cars from verified dealers across Nigeria</Text>
              </HStack>

              <Heading id="need-a-car-heading" as="h2" fontSize={{ base: '4xl', sm: '5xl', md: '6xl' }} fontWeight="800" lineHeight="1" letterSpacing="-0.02em">
                Need a car?
              </Heading>
              <Text mt={4} fontSize={{ base: 'md', md: 'lg' }} opacity={0.92} lineHeight={1.6} maxW="460px">
                Buy or rent from verified dealerships, with prices up front. Your money stays in escrow until the car is yours.
              </Text>

              <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 2, lg: 5 }} mt={6} fontSize="sm">
                {PROMISES.map(({ icon: Icon, label }) => (
                  <HStack key={label} spacing={2}>
                    <Box as={Icon} size={18} color="tertiary" aria-hidden="true" />
                    <Text fontWeight="600">{label}</Text>
                  </HStack>
                ))}
              </Stack>

              <Flex gap={3} mt={8} flexWrap="wrap">
                <Button as={Link} to="/buy" size="lg" h="56px" px={8} borderRadius="14px" bg="tertiary" color="secondary" fontWeight="700"
                  rightIcon={<ArrowRight size={18} />} _hover={{ bg: '#FFDB70', transform: 'translateY(-2px)', boxShadow: 'xl' }}
                  _active={{ transform: 'none' }} transition="all .2s">
                  Buy a car
                </Button>
                <Button as={Link} to="/rent" size="lg" h="56px" px={8} borderRadius="14px" bg="transparent" color="white" fontWeight="600"
                  border="2px solid rgba(255,255,255,0.45)" _hover={{ bg: 'rgba(255,255,255,0.1)', transform: 'translateY(-2px)' }}
                  _active={{ transform: 'none' }} transition="all .2s">
                  Rent a car
                </Button>
              </Flex>
            </Box>

            {/* the car */}
            <Box flex={1} position="relative" w="100%" minH={{ lg: '340px' }} display="flex" flexDirection="column" justifyContent="center"
              alignItems={{ base: 'flex-start', lg: 'stretch' }}>
              <Box aria-hidden="true" position="absolute" left="8%" right="4%" top={{ base: '38%', lg: 'auto' }} bottom={{ lg: '14%' }} h="34px"
                borderRadius="50%" bg="rgba(8,24,48,0.6)" filter="blur(18px)" />
              <Image
                src={CAR.image}
                alt={`${CAR.name}, a grey coupe-SUV`}
                position="relative"
                w={{ base: '100%', xl: '106%' }}
                maxW="none"
                h="auto"
                loading="lazy"
                filter="drop-shadow(0 24px 30px rgba(0,0,0,0.25))"
              />
              <SpecChip top="4%" left="10%">{CAR.specs[0]}</SpecChip>
              <SpecChip top="0%" right="18%">{CAR.specs[1]}</SpecChip>
              <SpecChip bottom="4%" left="4%">{CAR.specs[2]}</SpecChip>

              <Box
                as={Link}
                to={CAR.page}
                position={{ base: 'relative', lg: 'absolute' }}
                mt={{ base: 3, lg: 0 }}
                right={{ lg: '0' }}
                bottom={{ lg: '-8px' }}
                bg="white"
                color="secondary"
                borderRadius="16px"
                px={4}
                py={3}
                boxShadow="0 16px 40px rgba(0,0,0,0.25)"
                display="flex"
                alignItems="center"
                gap={3}
                transition="transform .2s"
                _hover={{ transform: 'translateY(-2px)' }}
                _focusVisible={{ outline: '3px solid', outlineColor: 'tertiary', outlineOffset: '2px' }}
              >
                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">Featured</Text>
                  <Text fontWeight="700" fontSize={{ base: 'sm', md: 'md' }} lineHeight={1.2}>{CAR.name}</Text>
                  <Text fontSize="xs" color="gray.600">{CAR.tagline}</Text>
                </Box>
                <Flex w={9} h={9} borderRadius="full" bg="primary" color="white" align="center" justify="center" flexShrink={0} aria-hidden="true">
                  <ArrowRight size={18} />
                </Flex>
              </Box>
            </Box>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}
