// The dealer dashboard's frame: a top bar (logo, search, wallet, messages, notifications, profile) and a sidebar
// of grouped links, both as white rounded cards on a soft grey page. Phones get the sidebar as a drawer.
// Team members only see the links their role can use (utils/team.js; the server enforces the same rules).
import { useContext, useState } from 'react';
import { Link as RLink, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerOverlay, Flex, HStack, IconButton, Image, Input, InputGroup,
  InputLeftElement, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Stack, Text,
} from '@chakra-ui/react';
import {
  BarChart3, Bell, Car, ChevronDown, HelpCircle, LayoutGrid, LogOut, Menu as MenuIcon, Package, Receipt, Search, Settings, Truck, User, Users,
} from 'lucide-react';
import { GlobalStore } from '../../App';
import { Brand, ChatLink } from '../nav';
import { canChangeSettings, canUseWallet, isOwner, roleLine, visibleLinks } from '../../utils/team';
import { DASH } from './ui';

export const DEALER_GROUPS = [
  { title: 'Home', links: [
    { icon: LayoutGrid, label: 'Overview', path: '/dashboard' },
    { icon: Car, label: 'Inventory', path: '/inventory' },
    { icon: Receipt, label: 'Orders', path: '/orders', badge: 'pending_orders' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ] },
  { title: 'More services', links: [
    { icon: Package, label: 'Parts shop', path: '/parts-store' },
    { icon: Truck, label: 'Car haulers', path: '/transport?kind=hauler' },
    { icon: Truck, label: 'Towing vans', path: '/transport?kind=towing' },
  ] },
  { title: 'Business', links: [
    { icon: Users, label: 'Team', path: '/team', ownerOnly: true },
    { icon: Settings, label: 'Settings', path: '/settings', settings: true },
  ] },
];

/** A link is current when the path matches (and its ?kind=, for the two transport links). */
function useIsCurrent() {
  const { pathname, search } = useLocation();
  return (path) => {
    const [base, query] = path.split('?');
    const onPath = pathname === base || pathname.startsWith(`${base}/`);
    if (!onPath) return false;
    if (!query) return true;
    return new URLSearchParams(search).get('kind') === new URLSearchParams(query).get('kind');
  };
}

function SideLink({ item, count, onNavigate }) {
  const isCurrent = useIsCurrent();
  const on = isCurrent(item.path);
  const Icon = item.icon;
  return (
    <Flex as={NavLink} to={item.path} onClick={onNavigate} aria-current={on ? 'page' : undefined} align="center" gap={3} px={4} h="48px"
      borderRadius="full" bg={on ? DASH.ink : 'transparent'} color={on ? 'white' : '#4B5563'} fontWeight={on ? 600 : 500}
      transition="background .15s" _hover={{ bg: on ? DASH.ink : DASH.page, color: on ? 'white' : DASH.ink }}>
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      <Text flex={1} noOfLines={1}>{item.label}</Text>
      {count > 0 && (
        <Flex minW="26px" h="22px" px={2} borderRadius="full" bg={on ? 'white' : DASH.blue} color={on ? DASH.ink : 'white'} fontSize="xs"
          fontWeight="700" align="center" justify="center" aria-label={`${count} waiting`}>{count > 99 ? '99+' : count}</Flex>
      )}
    </Flex>
  );
}

function SidebarContent({ dealership, onNavigate }) {
  const { authUser, logout } = useContext(GlobalStore);
  return (
    <Flex direction="column" h="100%" justify="space-between" gap={8}>
      <Stack as="nav" aria-label="Dashboard" spacing={6}>
        {DEALER_GROUPS.map((group) => {
          const links = visibleLinks(group.links, authUser);
          if (!links.length) return null;
          return (
            <Box key={group.title}>
              <Text px={4} mb={2} fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" color="#9CA3AF">{group.title}</Text>
              <Stack spacing={1}>
                {links.map((item) => <SideLink key={item.path} item={item} count={item.badge ? dealership?.[item.badge] : 0} onNavigate={onNavigate} />)}
              </Stack>
            </Box>
          );
        })}
      </Stack>
      <Box>
        <Text px={4} mb={2} fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" color="#9CA3AF">Support</Text>
        <Stack spacing={1}>
          <SideLink item={{ icon: HelpCircle, label: 'Help centre', path: '/support' }} onNavigate={onNavigate} />
          <Flex as="button" type="button" onClick={logout} align="center" gap={3} px={4} h="48px" borderRadius="full" color="#DC2626"
            fontWeight="500" _hover={{ bg: '#FDECEC' }}>
            <LogOut size={20} strokeWidth={1.8} aria-hidden="true" />
            <Text>Log out</Text>
          </Flex>
        </Stack>
      </Box>
    </Flex>
  );
}

function TopSearch() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  return (
    <Box as="form" role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/inventory${text.trim() ? `?q=${encodeURIComponent(text.trim())}` : ''}`); }}
      display={{ base: 'none', md: 'block' }} flex={1} maxW="420px">
      <InputGroup>
        <InputLeftElement h="48px" pl={2} pointerEvents="none" color={DASH.muted}><Search size={20} /></InputLeftElement>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search your cars…" aria-label="Search your cars" h="48px"
          pl={12} borderRadius="full" bg={DASH.page} border="none" _focusVisible={{ boxShadow: `0 0 0 2px ${DASH.blue}` }} />
      </InputGroup>
    </Box>
  );
}

function ProfileChip({ dealership }) {
  const { authUser, logout } = useContext(GlobalStore);
  const fullName = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ');
  const business = dealership?.business_name || authUser?.business_name || 'Your dealership';
  const role = isOwner(authUser) ? 'Owner' : (roleLine(authUser) || authUser?.team_role_label || 'Team member');
  return (
    <Menu placement="bottom-end">
      <MenuButton as={Box} role="button" tabIndex={0} aria-label="Account menu" cursor="pointer" borderRadius="full" bg={DASH.page} pl={1.5} pr={3} py={1.5}
        _hover={{ bg: '#E9ECF1' }} _focusVisible={{ boxShadow: `0 0 0 2px ${DASH.blue}` }}>
        <HStack spacing={3}>
          <Avatar size="sm" src={dealership?.logo || undefined} name={business} />
          <Box display={{ base: 'none', lg: 'block' }} lineHeight={1.2} maxW="180px" textAlign="left">
            <Text fontWeight="600" fontSize="sm" noOfLines={1}>{isOwner(authUser) ? business : (fullName || business)}</Text>
            <Text fontSize="xs" color={DASH.muted} noOfLines={1}>{role}</Text>
          </Box>
          <Box display={{ base: 'none', lg: 'block' }}><ChevronDown size={16} /></Box>
        </HStack>
      </MenuButton>
      <MenuList zIndex={40} borderRadius="16px" py={2}>
        <Box px={4} py={2}>
          <Text fontWeight="600">{fullName || business}</Text>
          {authUser?.email && <Text fontSize="sm" color={DASH.muted}>{authUser.email}</Text>}
        </Box>
        <MenuDivider />
        {canChangeSettings(authUser) && <MenuItem as={RLink} to="/settings" icon={<User size={16} />}>Business profile</MenuItem>}
        {isOwner(authUser) && <MenuItem as={RLink} to="/team" icon={<Users size={16} />}>Team</MenuItem>}
        {dealership?.uuid && <MenuItem as={RLink} to={`/dealership/${dealership.uuid}`} icon={<Car size={16} />}>View my public page</MenuItem>}
        <MenuItem as={RLink} to="/support" icon={<HelpCircle size={16} />}>Help centre</MenuItem>
        <MenuDivider />
        <MenuItem onClick={logout} icon={<LogOut size={16} />} color="#DC2626">Log out</MenuItem>
      </MenuList>
    </Menu>
  );
}

export default function DealerShell({ dealership, children }) {
  const { authUser } = useContext(GlobalStore);
  const [open, setOpen] = useState(false);
  return (
    <Box bg={DASH.page} minH="100vh" px={{ base: 3, md: 4 }} pt={{ base: 3, md: 4 }} pb={10}>
      <Flex as="header" bg="white" borderRadius={DASH.radius} h={{ base: '64px', md: '76px' }} px={{ base: 3, md: 5 }} align="center" gap={{ base: 2, md: 4 }}
        position="sticky" top={{ base: 3, md: 4 }} zIndex={25} boxShadow="0 1px 2px rgba(16,24,40,0.04)">
        <IconButton display={{ base: 'inline-flex', lg: 'none' }} aria-label="Open menu" icon={<MenuIcon size={22} />} variant="ghost" isRound onClick={() => setOpen(true)} />
        <HStack spacing={3} flexShrink={0}>
          <Brand to="/dashboard" />
          <Text display={{ base: 'none', xl: 'block' }} fontSize="sm" color={DASH.muted} borderLeftWidth="1px" pl={3}>Dealer dashboard</Text>
        </HStack>
        <Box flex={1} display="flex" justifyContent="flex-end"><TopSearch /></Box>
        <HStack spacing={{ base: 1, md: 2 }}>
          {canUseWallet(authUser) && (
            <IconButton as={RLink} to="/wallet" aria-label="Wallet" isRound bg={DASH.page} _hover={{ bg: '#E9ECF1' }}
              icon={<Image boxSize="22px" src="/assets/icons/WalletIcon.svg" alt="" />} />
          )}
          <Box bg={DASH.page} borderRadius="full"><ChatLink /></Box>
          <IconButton as={RLink} to="/notifications" aria-label="Notifications" isRound bg={DASH.page} _hover={{ bg: '#E9ECF1' }} icon={<Bell size={20} />} />
          <ProfileChip dealership={dealership} />
        </HStack>
      </Flex>

      <Flex gap={{ base: 0, lg: 5 }} mt={{ base: 3, md: 5 }} align="flex-start">
        <Box as="aside" display={{ base: 'none', lg: 'block' }} w="260px" flexShrink={0} bg="white" borderRadius={DASH.radius} p={4}
          position="sticky" top="112px" h="calc(100vh - 132px)" overflowY="auto">
          <SidebarContent dealership={dealership} />
        </Box>
        <Box as="main" id="main" flex={1} minW={0}>{children}</Box>
      </Flex>

      <Drawer isOpen={open} onClose={() => setOpen(false)} placement="left">
        <DrawerOverlay />
        <DrawerContent borderRightRadius="24px" bg="white">
          <DrawerCloseButton mt={2} />
          <DrawerBody pt={14} pb={6}>
            <SidebarContent dealership={dealership} onNavigate={() => setOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
