// The business dashboards' frame (dealers, mechanics, parts sellers): a top bar (logo, search, wallet, messages,
// notifications, profile) and a sidebar of grouped links, both as white rounded cards on a soft grey page. Phones
// get the sidebar as a drawer. Team members only see the links their role can use (utils/team.js; the server
// enforces the same rules).
import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerOverlay, Flex, HStack, IconButton, Image, Input, InputGroup,
  InputLeftElement, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Stack, Text,
} from '@chakra-ui/react';
import {
  BarChart3, Bell, Boxes, CalendarCheck, Car, ChevronDown, HelpCircle, Images, LayoutGrid, LogOut, Menu as MenuIcon, Package, Receipt, Search,
  Settings, Store, Truck, User, Users, Wrench,
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

export const MECHANIC_GROUPS = [
  { title: 'Home', links: [
    { icon: LayoutGrid, label: 'Overview', path: '/dashboard' },
    { icon: CalendarCheck, label: 'Bookings', path: '/bookings', badge: 'pending_requests' },
    { icon: Wrench, label: 'Services', path: '/services' },
    { icon: Images, label: 'Gallery', path: '/gallery' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ] },
  { title: 'More services', links: [
    { icon: Package, label: 'Parts shop', path: '/parts-store' },
    { icon: Truck, label: 'Towing vans', path: '/transport' },
  ] },
  { title: 'Business', links: [
    { icon: Users, label: 'Team', path: '/team', ownerOnly: true },
    { icon: Settings, label: 'Settings', path: '/settings', settings: true },
  ] },
];

export const PARTS_GROUPS = [
  { title: 'Home', links: [
    { icon: LayoutGrid, label: 'Overview', path: '/parts-store', end: true },
    { icon: Boxes, label: 'Parts', path: '/parts-store/parts' },
    { icon: Receipt, label: 'Orders', path: '/parts-store/orders', badge: 'new_orders' },
  ] },
  { title: 'Business', links: [
    { icon: Store, label: 'Shop settings', path: '/parts-store/settings', settings: true },
    { icon: Users, label: 'Team', path: '/team', ownerOnly: true },
    { icon: Settings, label: 'Business profile', path: '/settings', settings: true },
  ] },
];

/** What each kind of business sees in the frame. */
export const SHELLS = {
  dealer: { groups: DEALER_GROUPS, label: 'Dealer dashboard', home: '/dashboard', search: { path: '/inventory', placeholder: 'Search your cars…' } },
  mechanic: { groups: MECHANIC_GROUPS, label: 'Mechanic dashboard', home: '/dashboard', search: { path: '/bookings', placeholder: 'Search bookings…' } },
  parts: { groups: PARTS_GROUPS, label: 'Parts shop', home: '/parts-store', search: { path: '/parts-store/parts', placeholder: 'Search your parts…' } },
};

/** A link is current when the path matches (and its ?kind=, for the two transport links). */
function useIsCurrent() {
  const { pathname, search } = useLocation();
  return (path, end) => {
    const [base, query] = path.split('?');
    const onPath = pathname === base || (!end && pathname.startsWith(`${base}/`));
    if (!onPath) return false;
    if (!query) return true;
    return new URLSearchParams(search).get('kind') === new URLSearchParams(query).get('kind');
  };
}

function SideLink({ item, count, onNavigate }) {
  const isCurrent = useIsCurrent();
  const on = isCurrent(item.path, item.end);
  const Icon = item.icon;
  return (
    <Flex as={NavLink} className="side-link" to={item.path} onClick={onNavigate} aria-current={on ? 'page' : undefined} align="center" gap={3} px={4} h="48px"
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

// The links scroll on their own when they don't fit (short laptop screens, lots of groups); Help and Log out stay
// pinned at the bottom. Soft fades at the top/bottom edge show there is more to scroll to.
const SIDEBAR_SCROLL_SX = {
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
  scrollbarColor: '#D5DBE3 transparent',
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-track': { background: 'transparent !important', boxShadow: 'none' },
  '&::-webkit-scrollbar-thumb': { background: '#D5DBE3 !important', borderRadius: '6px' },
  '@media (max-height: 760px)': { '.side-link': { height: '42px' } },
};

function useScrollEdges() {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setEdges({ top: el.scrollTop > 4, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); observer?.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  return [ref, edges];
}

const Fade = ({ side, show }) => (
  <Box position="absolute" left={0} right="6px" h="28px" pointerEvents="none" zIndex={1} transition="opacity .2s" opacity={show ? 1 : 0}
    {...(side === 'top' ? { top: 0, bgGradient: 'linear(to-b, white, transparent)' } : { bottom: 0, bgGradient: 'linear(to-t, white, transparent)' })} />
);

function SidebarContent({ groups, counts, onNavigate }) {
  const { authUser, logout } = useContext(GlobalStore);
  const [scrollRef, edges] = useScrollEdges();
  return (
    <Flex direction="column" h="100%" minH={0}>
      <Box position="relative" flex={1} minH={0}>
        <Fade side="top" show={edges.top} />
        <Box ref={scrollRef} h="100%" overflowY="auto" pr={1} mr={-1} sx={SIDEBAR_SCROLL_SX}>
          <Stack as="nav" aria-label="Dashboard" spacing={6} pb={2}>
            {groups.map((group) => {
              const links = visibleLinks(group.links, authUser);
              if (!links.length) return null;
              return (
                <Box key={group.title}>
                  <Text px={4} mb={2} fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" color="#9CA3AF">{group.title}</Text>
                  <Stack spacing={1}>
                    {links.map((item) => <SideLink key={item.path} item={item} count={item.badge ? counts?.[item.badge] : 0} onNavigate={onNavigate} />)}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
        <Fade side="bottom" show={edges.bottom} />
      </Box>
      <Box flexShrink={0} pt={3} mt={2} borderTopWidth="1px" borderColor={DASH.line} sx={{ '@media (max-height: 760px)': { '.side-link': { height: '42px' } } }}>
        <Stack spacing={1}>
          <SideLink item={{ icon: HelpCircle, label: 'Help centre', path: '/support' }} onNavigate={onNavigate} />
          <Flex as="button" type="button" className="side-link" onClick={logout} align="center" gap={3} px={4} h="48px" borderRadius="full" color="#DC2626"
            fontWeight="500" _hover={{ bg: '#FDECEC' }}>
            <LogOut size={20} strokeWidth={1.8} aria-hidden="true" />
            <Text>Log out</Text>
          </Flex>
        </Stack>
      </Box>
    </Flex>
  );
}

function TopSearch({ path, placeholder }) {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  return (
    <Box as="form" role="search" onSubmit={(e) => { e.preventDefault(); navigate(`${path}${text.trim() ? `?q=${encodeURIComponent(text.trim())}` : ''}`); }}
      display={{ base: 'none', md: 'block' }} flex={1} maxW="420px">
      <InputGroup>
        <InputLeftElement h="48px" pl={2} pointerEvents="none" color={DASH.muted}><Search size={20} /></InputLeftElement>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder.replace('…', '')} h="48px"
          pl={12} borderRadius="full" bg={DASH.page} border="none" _focusVisible={{ boxShadow: `0 0 0 2px ${DASH.blue}` }} />
      </InputGroup>
    </Box>
  );
}

function ProfileChip({ business: info }) {
  const { authUser, logout } = useContext(GlobalStore);
  const fullName = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ');
  const business = info?.name || authUser?.business_name || 'Your business';
  const role = isOwner(authUser) ? 'Owner' : (roleLine(authUser) || authUser?.team_role_label || 'Team member');
  return (
    <Menu placement="bottom-end">
      <MenuButton as={Box} role="button" tabIndex={0} aria-label="Account menu" cursor="pointer" borderRadius="full" bg={DASH.page} pl={1.5} pr={3} py={1.5}
        _hover={{ bg: '#E9ECF1' }} _focusVisible={{ boxShadow: `0 0 0 2px ${DASH.blue}` }}>
        <HStack spacing={3}>
          <Avatar size="sm" src={info?.logo || undefined} name={business} />
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
        {info?.publicUrl && <MenuItem as={RLink} to={info.publicUrl} icon={<Car size={16} />}>View my public page</MenuItem>}
        <MenuItem as={RLink} to="/support" icon={<HelpCircle size={16} />}>Help centre</MenuItem>
        <MenuDivider />
        <MenuItem onClick={logout} icon={<LogOut size={16} />} color="#DC2626">Log out</MenuItem>
      </MenuList>
    </Menu>
  );
}

/**
 * kind: 'dealer' | 'mechanic' | 'parts' (see SHELLS). business: { name, logo, publicUrl }.
 * counts: numbers for the sidebar badges, e.g. { pending_orders: 2 }.
 */
export function BusinessShell({ kind = 'dealer', business, counts, children }) {
  const { authUser } = useContext(GlobalStore);
  const [open, setOpen] = useState(false);
  const shell = SHELLS[kind] || SHELLS.dealer;
  return (
    <Box bg={DASH.page} minH="100vh" px={{ base: 3, md: 4 }} pt={{ base: 3, md: 4 }} pb={10}>
      <Flex as="header" bg="white" borderRadius={DASH.radius} h={{ base: '64px', md: '76px' }} px={{ base: 3, md: 5 }} align="center" gap={{ base: 2, md: 4 }}
        position="sticky" top={{ base: 3, md: 4 }} zIndex={25} boxShadow="0 1px 2px rgba(16,24,40,0.04)">
        <IconButton display={{ base: 'inline-flex', lg: 'none' }} aria-label="Open menu" icon={<MenuIcon size={22} />} variant="ghost" isRound onClick={() => setOpen(true)} />
        <HStack spacing={3} flexShrink={0}>
          <Brand to={shell.home} />
          <Text display={{ base: 'none', xl: 'block' }} fontSize="sm" color={DASH.muted} borderLeftWidth="1px" pl={3}>{shell.label}</Text>
        </HStack>
        <Box flex={1} display="flex" justifyContent="flex-end">{shell.search && <TopSearch {...shell.search} />}</Box>
        <HStack spacing={{ base: 1, md: 2 }}>
          {canUseWallet(authUser) && (
            <IconButton as={RLink} to="/wallet" aria-label="Wallet" isRound bg={DASH.page} _hover={{ bg: '#E9ECF1' }}
              icon={<Image boxSize="22px" src="/assets/icons/WalletIcon.svg" alt="" />} />
          )}
          <Box bg={DASH.page} borderRadius="full"><ChatLink /></Box>
          <IconButton as={RLink} to="/notifications" aria-label="Notifications" isRound bg={DASH.page} _hover={{ bg: '#E9ECF1' }} icon={<Bell size={20} />} />
          <ProfileChip business={business} />
        </HStack>
      </Flex>

      <Flex gap={{ base: 0, lg: 5 }} mt={{ base: 3, md: 5 }} align="flex-start">
        <Box as="aside" display={{ base: 'none', lg: 'block' }} w="260px" flexShrink={0} bg="white" borderRadius={DASH.radius} p={4}
          position="sticky" top="112px" h="calc(100vh - 132px)" sx={{ '@supports (height: 100dvh)': { height: 'calc(100dvh - 132px)' } }} overflow="hidden">
          <SidebarContent groups={shell.groups} counts={counts} />
        </Box>
        <Box as="main" id="main" flex={1} minW={0}>{children}</Box>
      </Flex>

      <Drawer isOpen={open} onClose={() => setOpen(false)} placement="left">
        <DrawerOverlay />
        <DrawerContent borderRightRadius="24px" bg="white">
          <DrawerCloseButton mt={2} />
          <DrawerBody pt={14} pb={6} display="flex" flexDirection="column" overflow="hidden">
            <SidebarContent groups={shell.groups} counts={counts} onNavigate={() => setOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

/** The dealer dashboard's frame. */
export default function DealerShell({ dealership, children }) {
  return (
    <BusinessShell kind="dealer" counts={dealership}
      business={{ name: dealership?.business_name, logo: dealership?.logo, publicUrl: dealership?.uuid ? `/dealership/${dealership.uuid}` : null }}>
      {children}
    </BusinessShell>
  );
}
