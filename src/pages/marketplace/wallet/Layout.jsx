// The wallet's frame in the dashboard look: grey page, a white rounded menu card on the left (a pill tab row on
// phones and tablets), and rounder fields and buttons for every wallet form.
import { useContext, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Avatar, Box, Container, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import { ArrowDownToLine, ArrowUpFromLine, LayoutDashboard, List, PiggyBank, Send, Settings } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { DASH } from '../../../components/dashboard/ui';
import { FIELD_SX } from '../../../components/dashboard/FormLayout';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', link: 'home' },
  { icon: ArrowDownToLine, label: 'Deposit', link: 'deposit' },
  { icon: ArrowUpFromLine, label: 'Withdraw', link: 'withdraw' },
  { icon: Send, label: 'Send money', link: 'send' },
  { icon: List, label: 'Transactions', link: 'transactions' },
  { icon: Settings, label: 'Settings', link: 'settings' },
  { icon: PiggyBank, label: 'Savings', link: 'savings', badge: 'Soon' },
];

const PAGE_SX = {
  ...FIELD_SX,
  '.chakra-input__group[data-size=lg] .chakra-input, .chakra-input--lg': { height: '56px' },
  '.chakra-input__group .chakra-input__left-addon': { height: 'auto', alignSelf: 'stretch' },
  'form .chakra-button, section .chakra-button': { borderRadius: '999px' },
  'h1.chakra-heading': { letterSpacing: '-0.02em', fontWeight: 600 },
};

const NavItem = ({ item, compact }) => (
  <Flex as={NavLink} to={item.link} align="center" gap={3} px={compact ? 4 : 4} h={compact ? '40px' : '46px'} borderRadius="full" flexShrink={0}
    color="#4B5563" fontWeight={500} whiteSpace="nowrap" bg={compact ? 'white' : 'transparent'} transition="background .15s"
    _hover={{ bg: compact ? 'white' : DASH.page, color: DASH.ink }}
    _activeLink={{ bg: DASH.ink, color: 'white', fontWeight: 600 }}>
    <item.icon size={compact ? 16 : 19} strokeWidth={1.8} aria-hidden="true" />
    <Text as="span" flex={compact ? undefined : 1}>{item.label}</Text>
    {item.badge && <Text as="span" fontSize="xs" px={2} py={0.5} borderRadius="full" bg={DASH.blueWash} color={DASH.blue} fontWeight="700">{item.badge}</Text>}
  </Flex>
);

function WalletLayout() {
  const { authUser } = useContext(GlobalStore);
  const { pathname } = useLocation();
  const tabsRef = useRef(null);
  // keep the active tab visible in the scrollable phone tab row
  useEffect(() => {
    const row = tabsRef.current;
    const active = row?.querySelector('a.active');
    if (!row || !active) return;
    const a = active.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    row.scrollLeft += a.left - r.left - (r.width - a.width) / 2;
  }, [pathname]);
  const name = `${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || 'My wallet';
  // businesses open the wallet inside their dashboard frame, which already has a sidebar: show the pill row only
  const embedded = ['dealer', 'mechanic', 'parts_dealer'].includes(authUser?.user_type);

  if (embedded) {
    return (
      <Box color={DASH.ink}>
        <Box as="nav" ref={tabsRef} aria-label="Wallet" w="100%" overflowX="auto" className="hidden-scroll" mb={{ base: 4, md: 6 }}>
          <HStack spacing={2} minW="max-content" pb={1}>
            {NAV_ITEMS.map((item) => <NavItem key={item.link} item={item} compact />)}
          </HStack>
        </Box>
        <Box sx={PAGE_SX}><Outlet /></Box>
      </Box>
    );
  }

  return (
    <Box bg={DASH.page} minH="calc(100vh - 80px)" color={DASH.ink}>
      <Container maxW="1400px" px={{ base: 3, md: 6 }} py={{ base: 4, md: 8 }}>
        <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 4, lg: 6 }} align="start">
          <Box as="nav" aria-label="Wallet" display={{ base: 'none', lg: 'block' }} w="250px" flexShrink={0}
            position="sticky" top="96px" borderRadius={DASH.radius} p={4} bg="white">
            <HStack spacing={3} mb={5} p={2} borderRadius="16px" bg={DASH.page}>
              <Avatar size="sm" name={name} bg={DASH.blue} color="white" />
              <Box minW={0}>
                <Text fontWeight="600" noOfLines={1}>{name}</Text>
                <Text fontSize="xs" color={DASH.muted} noOfLines={1}>{authUser?.email}</Text>
              </Box>
            </HStack>
            <Text px={4} mb={2} fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" color="#9CA3AF">Wallet</Text>
            <Stack spacing={1}>
              {NAV_ITEMS.map((item) => <NavItem key={item.link} item={item} />)}
            </Stack>
          </Box>

          {/* Phones/tablets: a scrollable pill row instead of a hidden drawer */}
          <Box as="nav" ref={tabsRef} aria-label="Wallet" display={{ base: 'block', lg: 'none' }} w="100%" overflowX="auto" className="hidden-scroll">
            <HStack spacing={2} minW="max-content" pb={1}>
              {NAV_ITEMS.map((item) => <NavItem key={item.link} item={item} compact />)}
            </HStack>
          </Box>

          <Box flex={1} minW={0} w="100%" sx={PAGE_SX}>
            <Outlet />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

export default WalletLayout;
