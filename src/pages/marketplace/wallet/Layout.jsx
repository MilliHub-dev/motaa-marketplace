import { useContext, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Avatar, Box, Button, Container, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { ArrowDownToLine, ArrowUpFromLine, Landmark, LayoutDashboard, List, PiggyBank } from 'lucide-react';
import { GlobalStore } from '../../../App';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', link: 'home' },
  { icon: ArrowDownToLine, label: 'Deposit', link: 'deposit' },
  { icon: ArrowUpFromLine, label: 'Withdraw', link: 'withdraw' },
  { icon: List, label: 'Transactions', link: 'transactions' },
  { icon: Landmark, label: 'Payout accounts', link: 'settings' },
  { icon: PiggyBank, label: 'Savings', link: 'savings', badge: 'Soon' },
];

const NavItem = ({ item, compact }) => (
  <Button
    as={NavLink}
    to={item.link}
    leftIcon={<item.icon size={18} aria-hidden="true" />}
    variant="ghost"
    justifyContent="start"
    flexShrink={0}
    size={compact ? 'sm' : 'md'}
    color="gray.700"
    _activeLink={{ bg: 'primary', color: 'white' }}
  >
    {item.label}
    {item.badge && <Text as="span" ml={2} fontSize="xs" color="inherit" opacity={0.7}>{item.badge}</Text>}
  </Button>
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

  return (
    <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 4, lg: 8 }} align="start">
        {/* Desktop sidebar: sits below the navbar and scrolls with the page */}
        <Box as="nav" aria-label="Wallet" display={{ base: 'none', lg: 'block' }} w="240px" flexShrink={0}
          position="sticky" top="90px" borderWidth={1} borderRadius="lg" p={4} bg="white">
          <HStack spacing={3} mb={5}>
            <Avatar size="sm" name={name} />
            <Box minW={0}>
              <Text className="bold" noOfLines={1}>{name}</Text>
              <Text fontSize="sm" color="gray.500" noOfLines={1}>{authUser?.email}</Text>
            </Box>
          </HStack>
          <VStack align="stretch" spacing={1}>
            {NAV_ITEMS.map((item) => <NavItem key={item.link} item={item} />)}
          </VStack>
        </Box>

        {/* Phones/tablets: a scrollable tab row instead of a hidden drawer */}
        <Box as="nav" ref={tabsRef} aria-label="Wallet" display={{ base: 'block', lg: 'none' }} w="100%" overflowX="auto" className="hidden-scroll"
          borderBottomWidth={1} pb={2}>
          <HStack spacing={1} minW="max-content">
            {NAV_ITEMS.map((item) => <NavItem key={item.link} item={item} compact />)}
          </HStack>
        </Box>

        <Box flex={1} minW={0} w="100%">
          <Outlet />
        </Box>
      </Flex>
    </Container>
  );
}

export default WalletLayout;
