// The navigation for signed-out visitors (landing and marketing pages).
// On the landing page it starts transparent over the hero photo and turns into a floating frosted bar once you
// scroll; on other pages it is the frosted bar from the start. "Explore" opens the marketplace (cars, rentals,
// mechanics, parts, towing, haulage) with a line about each; the company pages sit beside it; "Get started" is the
// one strong action. Phones get a full menu with the marketplace as tiles.
import { useEffect, useRef, useState } from 'react';
import { Link as RLink, NavLink, useLocation } from 'react-router-dom';
import {
  Box, Button, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, Grid, HStack, IconButton, Image, Stack, Text,
} from '@chakra-ui/react';
import { ArrowRight, CarFront, ChevronDown, Cog, Headphones, KeyRound, LifeBuoy, Menu as MenuIcon, Truck, Wrench, X } from 'lucide-react';

export const EXPLORE = [
  { label: 'Buy a car', text: 'New and tokunbo cars from verified dealers', to: '/buy', icon: CarFront, color: '#0065B5' },
  { label: 'Rent a car', text: 'By the day, week or month, with a driver', to: '/rent', icon: KeyRound, color: '#7C5CFA' },
  { label: 'Find a mechanic', text: 'Book nearby mechanics and track them live', to: '/mechanics', icon: Wrench, color: '#F59E0B' },
  { label: 'Spare parts', text: 'Genuine and used parts, delivered', to: '/parts', icon: Cog, color: '#12B886' },
  { label: 'Towing', text: 'A tow truck when you break down', to: '/towing', icon: LifeBuoy, color: '#E5484D' },
  { label: 'Car haulers', text: 'Move cars safely between states', to: '/car-haulers', icon: Truck, color: '#0B1220' },
];
const COMPANY = [
  { label: 'Features', to: '/features' },
  { label: 'About', to: '/about' },
  { label: 'For businesses', to: '/business' },
];
const BAR_HEIGHT = 72;

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function ExploreItem({ item, onPick }) {
  return (
    <Flex as={RLink} to={item.to} onClick={onPick} role="menuitem" gap={3} p={3} borderRadius="16px" align="flex-start"
      transition="background .15s" _hover={{ bg: '#F4F7FB' }} _focusVisible={{ outline: '2px solid #0065B5', outlineOffset: '-2px' }}>
      <Flex w="40px" h="40px" borderRadius="12px" bg={`${item.color}14`} color={item.color} align="center" justify="center" flexShrink={0}>
        <item.icon size={20} strokeWidth={1.9} />
      </Flex>
      <Box minW={0}>
        <Text fontWeight="700" color="#0B1220" fontSize="sm">{item.label}</Text>
        <Text fontSize="xs" color="gray.500" lineHeight={1.4}>{item.text}</Text>
      </Box>
    </Flex>
  );
}

/** The "Explore" dropdown: opens on hover or click, closes on leaving, Esc or picking. */
function ExploreMenu({ light }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const enter = () => { clearTimeout(closeTimer.current); setOpen(true); };
  const leave = () => { closeTimer.current = setTimeout(() => setOpen(false), 160); };
  const active = EXPLORE.some((item) => pathname.startsWith(item.to));

  return (
    <Box position="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <Button variant="unstyled" display="inline-flex" alignItems="center" gap={1} h="40px" px={3.5} borderRadius="full" fontWeight="600" fontSize="15px"
        color={light ? 'white' : '#0B1220'} bg={open || active ? (light ? 'whiteAlpha.200' : '#F1F4F8') : 'transparent'}
        _hover={{ bg: light ? 'whiteAlpha.200' : '#F1F4F8' }} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Explore
        <Box as={ChevronDown} size={16} transition="transform .2s" transform={open ? 'rotate(180deg)' : undefined} />
      </Button>
      {open && (
        <Box position="absolute" top="calc(100% + 10px)" left="50%" transform="translateX(-50%)" w="620px" bg="white" borderRadius="22px" p={3}
          boxShadow="0 24px 60px rgba(11,18,32,0.18)" border="1px solid rgba(11,18,32,0.06)" role="menu" aria-label="Explore Motaa"
          sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: 'motaaNavIn .16s ease-out' },
            '@keyframes motaaNavIn': { from: { opacity: 0, transform: 'translate(-50%, -6px)' }, to: { opacity: 1, transform: 'translate(-50%, 0)' } } }}>
          {/* invisible bridge so the pointer can travel from the button to the panel */}
          <Box position="absolute" top="-12px" left={0} right={0} h="12px" />
          <Grid templateColumns="1fr 1fr" gap={1}>
            {EXPLORE.map((item) => <ExploreItem key={item.to} item={item} onPick={() => setOpen(false)} />)}
          </Grid>
          <Flex mt={2} p={3} borderRadius="16px" bg="#0B1220" color="white" align="center" justify="space-between" gap={3}>
            <Box>
              <Text fontWeight="700" fontSize="sm">Sell on Motaa</Text>
              <Text fontSize="xs" color="whiteAlpha.700">Dealers, mechanics, parts sellers and towing companies</Text>
            </Box>
            <Button as={RLink} to="/business" size="sm" borderRadius="full" bg="white" color="#0B1220" rightIcon={<ArrowRight size={14} />} onClick={() => setOpen(false)}>
              For businesses
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
}

function TopLink({ to, children, light }) {
  return (
    <Box as={NavLink} to={to} display="inline-flex" alignItems="center" h="40px" px={3.5} borderRadius="full" fontWeight="600" fontSize="15px"
      color={light ? 'white' : '#0B1220'} transition="background .15s" _hover={{ bg: light ? 'whiteAlpha.200' : '#F1F4F8' }}
      _activeLink={{ bg: light ? 'whiteAlpha.200' : '#F1F4F8' }}>
      {children}
    </Box>
  );
}

function MobileMenu({ isOpen, onClose }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="full">
      <DrawerOverlay />
      <DrawerContent bg="white">
        <DrawerBody p={0} display="flex" flexDirection="column">
          <Flex align="center" justify="space-between" px={4} h={`${BAR_HEIGHT}px`} borderBottom="1px solid" borderColor="gray.100" flexShrink={0}>
            <Box as={RLink} to="/" onClick={onClose} w="84px" aria-label="Motaa home"><Image src="/assets/images/motaa-logo-3.png" alt="" w="100%" /></Box>
            <IconButton aria-label="Close menu" icon={<X size={22} />} variant="ghost" isRound onClick={onClose} />
          </Flex>
          <Box flex={1} overflowY="auto" px={4} py={5}>
            <Text fontSize="xs" fontWeight="700" color="gray.500" letterSpacing="0.1em" textTransform="uppercase" mb={3}>Explore Motaa</Text>
            <Grid templateColumns="1fr 1fr" gap={2.5}>
              {EXPLORE.map((item) => (
                <Box key={item.to} as={RLink} to={item.to} onClick={onClose} p={3.5} borderRadius="18px" bg="#F6F8FB" _active={{ bg: '#EDF2F8' }}>
                  <Flex w="38px" h="38px" borderRadius="12px" bg="white" color={item.color} align="center" justify="center" mb={2.5} boxShadow="0 2px 6px rgba(11,18,32,0.06)">
                    <item.icon size={19} />
                  </Flex>
                  <Text fontWeight="700" fontSize="sm" color="#0B1220">{item.label}</Text>
                  <Text fontSize="xs" color="gray.500" lineHeight={1.35} noOfLines={2}>{item.text}</Text>
                </Box>
              ))}
            </Grid>
            <Text fontSize="xs" fontWeight="700" color="gray.500" letterSpacing="0.1em" textTransform="uppercase" mt={7} mb={1}>Company</Text>
            <Stack spacing={0}>
              {[{ label: 'Home', to: '/' }, ...COMPANY, { label: 'Contact support', to: '/support', icon: Headphones }].map((item) => (
                <Flex key={item.to} as={RLink} to={item.to} onClick={onClose} align="center" justify="space-between" py={3.5} borderBottom="1px solid" borderColor="gray.100"
                  fontWeight="600" color="#0B1220">
                  {item.label}
                  <ArrowRight size={16} color="#98A2B3" />
                </Flex>
              ))}
            </Stack>
          </Box>
          <Stack spacing={2.5} p={4} pb="calc(16px + env(safe-area-inset-bottom))" borderTop="1px solid" borderColor="gray.100" flexShrink={0}>
            <Button as={RLink} to="/signup" onClick={onClose} h="50px" borderRadius="full" bg="#FDD153" color="#0B1220" _hover={{ bg: '#F7C531' }} fontWeight="700"
              rightIcon={<ArrowRight size={18} />}>Get started</Button>
            <Button as={RLink} to="/login" onClick={onClose} h="50px" borderRadius="full" variant="outline" borderColor="gray.300" color="#0B1220">Log in</Button>
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default function VisitorNav() {
  const { pathname } = useLocation();
  const overHero = pathname === '/';
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const floating = !overHero || scrolled;
  const light = !floating; // white text over the hero photo

  return (
    <>
      <Box as="header" position="fixed" top={0} left={0} right={0} zIndex={1200} px={{ base: 3, md: 5 }} pt={floating ? { base: 2, md: 3 } : 0}
        transition="padding .25s ease">
        <Flex align="center" gap={3} h={floating ? '60px' : `${BAR_HEIGHT}px`} maxW="1320px" mx="auto" px={{ base: 3, md: floating ? 4 : 2 }}
          borderRadius={floating ? 'full' : 0} transition="all .25s ease"
          bg={floating ? 'rgba(255,255,255,0.86)' : 'transparent'} backdropFilter={floating ? 'saturate(180%) blur(14px)' : 'none'}
          boxShadow={floating ? '0 10px 30px rgba(11,18,32,0.10), 0 0 0 1px rgba(11,18,32,0.05)' : 'none'}>
          <Box as={RLink} to="/" w={{ base: '76px', md: '88px' }} flexShrink={0} aria-label="Motaa home">
            <Image src={light ? '/assets/images/motaa-logo-2.png' : '/assets/images/motaa-logo-3.png'} alt="" w="100%" loading="eager" />
          </Box>
          <HStack as="nav" aria-label="Main" spacing={1} display={{ base: 'none', lg: 'flex' }} flex={1} justify="center">
            <ExploreMenu light={light} />
            {COMPANY.map((item) => <TopLink key={item.to} to={item.to} light={light}>{item.label}</TopLink>)}
          </HStack>
          <Box flex={{ base: 1, lg: 'none' }} />
          <HStack spacing={2}>
            <Button as={RLink} to="/login" variant="ghost" h="42px" px={4} borderRadius="full" fontWeight="600" display={{ base: 'none', sm: 'inline-flex' }}
              color={light ? 'white' : '#0B1220'} border="1px solid" borderColor={light ? 'whiteAlpha.500' : 'transparent'}
              bg={light ? 'blackAlpha.400' : 'transparent'} backdropFilter={light ? 'blur(6px)' : undefined}
              _hover={{ bg: light ? 'whiteAlpha.200' : '#F1F4F8' }}>Log in</Button>
            <Button as={RLink} to="/signup" h="42px" px={5} borderRadius="full" fontWeight="700" bg="#FDD153" color="#0B1220" _hover={{ bg: '#F7C531', transform: 'translateY(-1px)' }}
              boxShadow="0 6px 16px rgba(253,209,83,0.35)" rightIcon={<ArrowRight size={16} />} display={{ base: 'none', sm: 'inline-flex' }}>
              Get started
            </Button>
            <IconButton display={{ base: 'inline-flex', lg: 'none' }} aria-label="Open menu" icon={<MenuIcon size={22} />} isRound
              bg={light ? 'whiteAlpha.200' : '#F1F4F8'} color={light ? 'white' : '#0B1220'} _hover={{ bg: light ? 'whiteAlpha.300' : '#E7ECF2' }}
              onClick={() => setMenuOpen(true)} />
          </HStack>
        </Flex>
      </Box>
      {/* the bar floats over the page: keep content clear of it, except on the landing page where the hero runs under it */}
      {!overHero && <Box h={{ base: '76px', md: '84px' }} aria-hidden="true" />}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
