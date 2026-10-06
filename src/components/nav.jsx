import { useState, useContext } from 'react';
import {
  Box, Stack, Flex, Image, Text, Divider, Link,
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerCloseButton, DrawerBody, DrawerFooter,
  SimpleGrid, Menu, MenuItem, MenuButton, MenuList, Heading, Button, ButtonGroup, VStack,
  Avatar, IconButton, HStack, Circle, Progress, Container, Tag,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { FaChevronLeft, FaUser } from 'react-icons/fa';
import { RiHeadphoneLine, RiLogoutBoxRLine, RiMenuLine, RiAccountCircleFill, RiTwitterXFill, RiInstagramLine } from 'react-icons/ri';
import { TbSearch } from 'react-icons/tb';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { AiOutlineMessage } from 'react-icons/ai';
import { GiMechanicGarage, GiHomeGarage } from 'react-icons/gi';
import { GrUserWorker } from 'react-icons/gr';
import { FiBell } from 'react-icons/fi';
import { MdOutlineAccountCircle } from 'react-icons/md';
import { LuChartLine } from 'react-icons/lu';
import { HelpCircle, Settings, ArrowLeft, ArrowRight, Package, Receipt, ShoppingBasket, Truck } from 'lucide-react';
import { Home3, Shop, Coin, User } from 'iconsax-react';
import { NavLink, Link as RLink, useNavigate, useLocation } from 'react-router-dom';
import { GlobalStore } from '../App';
import { CustomerSearchBar } from '.';
import { usePartsCartCount } from './parts';

// Public contact/social details (same as the Privacy Policy / Terms contact sections).
export const MOTAA_CONTACT = {
  email: 'support@motaa.net',
  phone: '+2348104484364',
  phoneDisplay: '+234 810 448 4364',
  address: '15 Kawo Road, Kawo, Kaduna State, Nigeria',
  instagram: 'https://www.instagram.com/motaaltd',
  x: 'https://x.com/motaaltd',
};

// Marketing pages, shared by the logged-out navbar, drawer and footer.
const PUBLIC_NAV = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
  { label: 'Spare Parts', to: '/parts' },
  { label: 'For Businesses', to: '/business' },
];

const CUSTOMER_NAV = [
  { label: 'Home', to: '/home' },
  { label: 'Buy', to: '/buy' },
  { label: 'Rent', to: '/rent' },
  { label: 'Find Mechanic', to: '/mechanics' },
  { label: 'Spare Parts', to: '/parts' },
];


export const BackButton = ({ to, onClick, ...props }) => {
  const navigate = useNavigate();

  function goBack(){
    if (to) return navigate(to);
    if (onClick) return onClick();
    // fall back to the home page when there is no in-app history (e.g. a shared link)
    if (window.history.state?.idx > 0) return navigate(-1);
    return navigate('/');
  }

  return (
    <Button
     borderColor="primary"
     variant="outline"
     colorScheme="blue"
     leftIcon={<FaChevronLeft />}
     mb={5}
     onClick={goBack}
     {...props}
    > Back </Button>
  )
}


export const Paginator = ({ onNext, onPrevious, pagination }) => {
  return (
    <ButtonGroup justifyContent="center" w="100%" isAttached mt={8}>
      <Button onClick={onPrevious} isDisabled={!pagination?.previous} variant="outline" size="sm" leftIcon={<ArrowLeft size={20} />}>
        Previous
      </Button>
      <Button onClick={onNext} isDisabled={!pagination?.next} variant="outline" size="sm" rightIcon={<ArrowRight size={20} />}>
        Next
      </Button>
    </ButtonGroup>
  )
}


// Shared sticky header shell for every navbar.
const NavbarShell = ({ children, dark, ...props }) => (
  <Box
   as="header"
   position="sticky"
   top="0px"
   bg={dark ? 'primary' : 'white'}
   color={dark ? 'white' : 'black'}
   w="100%"
   className="navbar"
   zIndex="20"
   {...props}
  >
    <Flex className="navbar-inner" alignItems="center" px={4} py={{ base: 3, md: 4 }} gap={3} justifyContent="space-between" w="100%">
      {children}
    </Flex>
  </Box>
)

const Brand = ({ to = '/', light }) => (
  <Box as={RLink} to={to} flexShrink={0} w={{ base: '64px', md: '80px' }} aria-label="Motaa home">
    <Image
     loading="eager"
     src={light ? '/assets/images/motaa-logo-2.png' : '/assets/images/motaa-logo-3.png'}
     alt=""
     w="100%"
    />
  </Box>
)

const TopLink = ({ to, children, end }) => (
  <Text
   as={NavLink}
   to={to}
   end={end}
   fontWeight="600"
   px={1}
   py={1}
   borderBottomWidth="2px"
   borderColor="transparent"
   _activeLink={{ borderColor: 'tertiary' }}
   _hover={{ opacity: 0.85 }}
  >{children}</Text>
)


export const UnauthenticatedNavbar = () => {
  const [navIsOpen, setNavState] = useState(false);

  return (
    <NavbarShell dark>
      <Brand light />

      <HStack as="nav" aria-label="Main" display={{ base: 'none', md: 'flex' }} spacing={{ md: 5, lg: 10 }}>
        {PUBLIC_NAV.map((item) => <TopLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</TopLink>)}
      </HStack>

      <HStack spacing={{ base: 2, sm: 4 }}>
        <Button as={RLink} to="/signup" display={{ base: 'none', sm: 'inline-flex' }} color="white" leftIcon={<RiAccountCircleFill className="icon" />} variant="link">Sign up</Button>
        <Button as={RLink} to="/login" borderWidth={2} _hover={{ bgColor: 'white', color: 'primary' }} w={{ base: '88px', sm: '100px' }} color="white" borderColor="white" variant="outline">Login</Button>
        <IconButton
         display={{ base: 'inline-flex', md: 'none' }}
         onClick={() => setNavState(true)}
         aria-label="Open menu"
         variant="ghost"
         color="white"
         _hover={{ bg: 'whiteAlpha.200' }}
         icon={<RiMenuLine size={24} />}
        />
      </HStack>

      <Sidebar onClose={() => setNavState(false)} show={navIsOpen} />
    </NavbarShell>
  )
}


const NavIconLink = ({ to, label, icon, ...props }) => (
  <IconButton as={RLink} to={to} aria-label={label} title={label} variant="ghost" icon={icon} fontSize="22px" {...props} />
)

// Parts cart with the number of parts in it. Phones only show it once something is in the cart
// (the menu drawer always links to it), so the navbar still fits a small screen.
const PartsCartLink = () => {
  const count = usePartsCartCount();
  const label = count ? `Parts cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Parts cart';
  return (
    <Box position="relative" display={{ base: count ? 'block' : 'none', md: 'block' }}>
      <NavIconLink to="/parts/cart" label={label} icon={<ShoppingBasket size={22} />} />
      {count > 0 && (
        <Flex position="absolute" top="2px" right="0px" minW="18px" h="18px" px={1} rounded="full" bg="primary" color="white"
          fontSize="11px" fontWeight="700" align="center" justify="center" pointerEvents="none" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </Flex>
      )}
    </Box>
  );
}


export const CustomerNavbar = () => {
  const [navIsOpen, setNavState] = useState(false);
  const [searchIsOpen, setSearchState] = useState(false);
  const { authUser, logout } = useContext(GlobalStore);
  const fullName = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ');

  return (
    <Box position="sticky" top="0px" zIndex="20">
      <NavbarShell position="relative">
        <Brand to="/home" />

        <HStack as="nav" aria-label="Main" display={{ base: 'none', lg: 'flex' }} flex={1} spacing={6} pl={4}>
          {CUSTOMER_NAV.map((item) => <TopLink key={item.to} to={item.to}>{item.label}</TopLink>)}
        </HStack>

        <HStack spacing={{ base: 0, sm: 1, md: 3 }}>
          <IconButton
           display={{ base: 'inline-flex', md: 'none' }}
           onClick={() => setSearchState(!searchIsOpen)}
           aria-label={searchIsOpen ? 'Close search' : 'Search'}
           aria-expanded={searchIsOpen}
           variant="ghost"
           fontSize="22px"
           icon={<TbSearch />}
          />

          <Button
           as={RLink}
           to="/wallet"
           display={{ base: 'none', md: 'inline-flex' }}
           borderRadius="30px"
           leftIcon={<Image boxSize="22px" src="/assets/icons/WalletIcon.svg" alt="" />}
           variant="outline"
           bgColor="#d9ebf5"
           fontWeight="600"
           colorScheme="blue"
           color="primary"
          >Wallet</Button>

          <NavIconLink to="/chat" label="Messages" icon={<AiOutlineMessage />} />
          <NavIconLink to="/notifications" label="Notifications" icon={<FiBell />} />
          <NavIconLink to="/cart" label="Cart" icon={<HiOutlineShoppingCart />} />
          <PartsCartLink />

          <Box display={{ base: 'none', lg: 'block' }}>
            <Menu placement="bottom-end">
              <MenuButton as={IconButton} aria-label="Account menu" variant="ghost" fontSize="24px" icon={<MdOutlineAccountCircle />} />
              <MenuList px={2} zIndex={30}>
                <VStack my={3} spacing={1}>
                  <Avatar name={fullName || undefined} />
                  {fullName && <Text fontWeight="600">{fullName}</Text>}
                  {authUser?.email && <Text fontSize="sm" color="gray.600">{authUser.email}</Text>}
                </VStack>
                <MenuItem as={RLink} to="/parts/orders" icon={<Receipt size={18} />}>My parts orders</MenuItem>
                <MenuItem as={RLink} to="/support" icon={<RiHeadphoneLine size={18} />}>Contact Support</MenuItem>
                <MenuItem onClick={logout} icon={<RiLogoutBoxRLine size={18} />}>Sign Out</MenuItem>
              </MenuList>
            </Menu>
          </Box>

          <IconButton
           display={{ base: 'inline-flex', lg: 'none' }}
           onClick={() => setNavState(true)}
           aria-label="Open menu"
           variant="ghost"
           fontSize="24px"
           icon={<RiMenuLine />}
          />
        </HStack>

        <Sidebar onClose={() => setNavState(false)} show={navIsOpen} />
      </NavbarShell>

      {searchIsOpen &&
        <Box px={3} py={2} w="100%" bg="#fff" display={{ md: 'none' }} borderTopWidth={1}>
          <CustomerSearchBar />
        </Box>
      }
    </Box>
  )
}


// Navbar shared by the dealer, mechanic and parts dealer dashboards.
const BusinessNavbar = ({ sidebarOpen, setSidebarState, hideSidebar }) => {
  const { authUser, logout } = useContext(GlobalStore);
  const fullName = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ');

  return (
    <NavbarShell>
      <Brand to="/dashboard" />

      <HStack spacing={{ base: 1, md: 3 }}>
        <Button
         as={RLink}
         to="/wallet"
         display={{ base: 'none', md: 'inline-flex' }}
         borderRadius="30px"
         leftIcon={<Image boxSize="22px" src="/assets/icons/WalletIcon.svg" alt="" />}
         variant="outline"
         bgColor="#d9ebf5"
         fontWeight="600"
         colorScheme="blue"
         color="primary"
        >Wallet</Button>
        <IconButton
         as={RLink}
         to="/wallet"
         display={{ base: 'inline-flex', md: 'none' }}
         aria-label="Wallet"
         variant="ghost"
         icon={<Image boxSize="24px" src="/assets/icons/WalletIcon.svg" alt="" />}
        />
        <NavIconLink to="/chat" label="Messages" icon={<AiOutlineMessage />} />
        <NavIconLink to="/notifications" label="Notifications" icon={<FiBell />} />

        <Menu placement="bottom-end">
          <MenuButton as={IconButton} icon={<FaUser size={18} />} variant="ghost" aria-label="Account menu" />
          <MenuList py={3} px={3} zIndex={30}>
            <VStack p={3} spacing={1}>
              <Avatar size="lg" name={fullName || undefined} />
              {fullName && <Heading as="p" size="sm">{fullName}</Heading>}
              {authUser?.email && <Text fontSize="sm" color="gray.600">{authUser.email}</Text>}
            </VStack>
            <Divider my={2} />
            <MenuItem as={RLink} to="/settings" icon={<User size="18" />}>Profile</MenuItem>
            <MenuItem as={RLink} to="/support" icon={<RiHeadphoneLine size={18} />}>Contact Support</MenuItem>
            <MenuItem onClick={logout} icon={<RiLogoutBoxRLine size={18} />}>Logout</MenuItem>
          </MenuList>
        </Menu>

        <IconButton
         display={hideSidebar ? 'inline-flex' : { base: 'inline-flex', lg: 'none' }}
         onClick={() => setSidebarState(!sidebarOpen)}
         aria-label="Open menu"
         aria-expanded={!!sidebarOpen}
         variant="ghost"
         fontSize="24px"
         icon={<RiMenuLine />}
        />
      </HStack>
    </NavbarShell>
  )
}

export const DealerNavbar = (props) => <BusinessNavbar {...props} />;
export const MechanicNavbar = (props) => <BusinessNavbar {...props} />;
export const PartsDealerNavbar = (props) => <BusinessNavbar {...props} />;


const DEALER_LINKS = [
  { icon: Home3, label: 'Dashboard', path: '/dashboard' },
  { icon: Coin, label: 'Orders', path: '/orders' },
  { icon: Shop, label: 'Inventory', path: '/inventory' },
  { icon: Package, label: 'Parts shop', path: '/parts-store' },
  { icon: LuChartLine, label: 'Analytics', path: '/analytics' },
  { icon: HelpCircle, label: 'Support', path: '/support' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const MECHANIC_LINKS = [
  { icon: GiHomeGarage, label: 'Dashboard', path: '/dashboard' },
  { icon: GrUserWorker, label: 'Bookings', path: '/bookings' },
  { icon: GiMechanicGarage, label: 'Service Offerings', path: '/services' },
  { icon: Package, label: 'Parts shop', path: '/parts-store' },
  { icon: LuChartLine, label: 'Analytics', path: '/analytics' },
  { icon: HelpCircle, label: 'Support', path: '/support' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// `end`: only the overview itself, not every /parts-store page, marks "Overview" as current.
const PARTS_DEALER_LINKS = [
  { icon: Home3, label: 'Overview', path: '/parts-store', end: true },
  { icon: Package, label: 'Parts', path: '/parts-store/parts' },
  { icon: Coin, label: 'Orders', path: '/parts-store/orders' },
  { icon: Truck, label: 'Shop settings', path: '/parts-store/settings' },
  { icon: HelpCircle, label: 'Support', path: '/support' },
  { icon: Settings, label: 'Business profile', path: '/settings' },
];

// Business header + links; NavLink marks the current section (incl. nested pages like /inventory/add).
const SidebarNavLinks = ({ business, links }) => (
  <VStack align="stretch" spacing={6}>
    <HStack spacing={3}>
      <Avatar size="md" src={business?.logo || undefined} name={business?.business_name || undefined} />
      <Box flex={1} minW={0}>
        <Text fontWeight="600" noOfLines={1}>{business?.business_name || 'Your business'}</Text>
        {business?.slug && <Text fontSize="sm" color="gray.500" noOfLines={1}>@{business.slug}</Text>}
      </Box>
    </HStack>

    <VStack as="nav" aria-label="Dashboard" align="stretch" spacing={2}>
      {links.map((item) => (
        <Button
         key={item.path}
         as={NavLink}
         to={item.path}
         end={item.end}
         w="100%"
         variant="ghost"
         justifyContent="flex-start"
         fontWeight="500"
         leftIcon={<item.icon size={20} />}
         iconSpacing={3}
         _activeLink={{ bgColor: 'primary', color: 'white' }}
        >
          {item.label}
        </Button>
      ))}
    </VStack>
  </VStack>
)

const BusinessSideBar = ({ business, links, sidebarOpen, setSidebarState, mode, ...props }) => {
  // desktop: fixed 280px column; phones/tablets (and pages without a sidebar): drawer opened from the navbar
  const close = () => setSidebarState(false);

  const drawer = (
    <Drawer placement="right" isOpen={!!sidebarOpen} onClose={close}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>
          <DrawerCloseButton />
        </DrawerHeader>
        {/* close the drawer once a link is tapped */}
        <DrawerBody onClick={(e) => e.target.closest('a') && close()}>
          <SidebarNavLinks business={business} links={links} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  if (mode === 'drawer') return drawer;

  return (
    <>
      <Box display={{ base: 'block', lg: 'none' }}>{drawer}</Box>
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        w="280px"
        overflowX="hidden"
        overflowY="auto"
        position="fixed"
        left="0"
        h="100vh"
        bgColor="#fff"
        zIndex="20"
        borderRightWidth={1}
        p={6}
        {...props}
      >
        <SidebarNavLinks business={business} links={links} />
      </Box>
    </>
  )
}

export const DealerDashboardSideBar = ({ dealership, onClose, ...props }) => (
  <BusinessSideBar business={dealership} links={DEALER_LINKS} {...props} />
);

export const MechanicDashboardSideBar = ({ mechanic, onClose, ...props }) => (
  <BusinessSideBar business={mechanic} links={MECHANIC_LINKS} {...props} />
);

export const PartsDealerDashboardSideBar = ({ business, onClose, ...props }) => (
  <BusinessSideBar business={business} links={PARTS_DEALER_LINKS} {...props} />
);


const DrawerLink = ({ to, onClose, children, end }) => (
  <Text
   as={NavLink}
   to={to}
   end={end}
   onClick={onClose}
   py={2}
   px={4}
   borderRadius="md"
   fontWeight="500"
   _activeLink={{ bg: 'blue.50', color: 'primary' }}
  >{children}</Text>
)

export const Sidebar = ({ show, onClose }) => {
  const { authUser, logout } = useContext(GlobalStore);
  const isLoggedIn = !!authUser;

  return (
    <Drawer isOpen={show} onClose={onClose} placement="right">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody color="black">
          <Stack as="nav" aria-label="Menu" spacing={1}>
            {isLoggedIn ? (
              <>
                {CUSTOMER_NAV.map((item) => <DrawerLink key={item.to} to={item.to} onClose={onClose}>{item.label}</DrawerLink>)}
                <DrawerLink to="/parts/cart" onClose={onClose}>Parts cart</DrawerLink>
                <DrawerLink to="/parts/orders" onClose={onClose}>My parts orders</DrawerLink>
                <DrawerLink to="/wallet" onClose={onClose}>Wallet</DrawerLink>
              </>
            ) : (
              <>
                {PUBLIC_NAV.map((item) => <DrawerLink key={item.to} to={item.to} end={item.to === '/'} onClose={onClose}>{item.label}</DrawerLink>)}
                <Stack pt={4} px={4} spacing={3}>
                  <Button as={RLink} to="/signup" onClick={onClose} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Sign up</Button>
                  <Button as={RLink} to="/login" onClick={onClose} variant="outline" borderColor="primary" color="primary">Login</Button>
                </Stack>
              </>
            )}
          </Stack>
        </DrawerBody>

        <DrawerFooter as={Stack} color="black">
          {isLoggedIn &&
            <Button justifyContent="space-between" onClick={logout} variant="ghost" w="100%" rightIcon={<RiLogoutBoxRLine size={20} />}>Sign Out</Button>
          }
          <Button as={RLink} to="/support" onClick={onClose} justifyContent="space-between" variant="ghost" w="100%" rightIcon={<RiHeadphoneLine size={20} />}>Contact Support</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}


export const Footer = () => {
  const { authUser } = useContext(GlobalStore);
  const { pathname } = useLocation();
  const isLoggedIn = !!authUser;
  // /business already ends with its own partner call-to-action
  const showPartnerBand = pathname !== '/business';

  const sections = [
    {
      title: 'Product',
      links: isLoggedIn ? [
        { label: 'Buy a car', url: '/buy' },
        { label: 'Rent a car', url: '/rent' },
        { label: 'Find a mechanic', url: '/mechanics' },
        { label: 'Spare parts', url: '/parts' },
        { label: 'Sell your car', url: '/business' },
      ] : [
        { label: 'Buy a car', url: '/signup' },
        { label: 'Rent a car', url: '/signup' },
        { label: 'Find a mechanic', url: '/signup' },
        { label: 'Spare parts', url: '/parts' },
        { label: 'Sell your car', url: '/signup?type=business&as=dealer' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About us', url: '/about' },
        { label: 'Features', url: '/features' },
        { label: 'For Businesses', url: '/business' },
        { label: 'Careers', coming: true },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help centre', url: '/support' },
        { label: 'Email us', href: `mailto:${MOTAA_CONTACT.email}` },
        { label: 'Blog', coming: true },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', url: '/terms-of-service' },
        { label: 'Privacy Policy', url: '/privacy-policy' },
      ],
    },
  ]

  const socials = [
    { label: 'Motaa on Instagram', href: MOTAA_CONTACT.instagram, icon: RiInstagramLine },
    { label: 'Motaa on X', href: MOTAA_CONTACT.x, icon: RiTwitterXFill },
  ]

  return (
    <Box as="footer" bg="primary" color="white" pt={{ base: 12, md: 20 }} pb={8}>
      <Container maxW="container.lg">
        {showPartnerBand &&
        <Flex pb={8} borderBottomWidth={1} borderColor="whiteAlpha.500" justifyContent="space-between" alignItems={{ md: 'center' }} flexDirection={{ base: 'column', md: 'row' }} gap={6}>
          <Box>
            <Heading as="h2" size="xl" fontWeight="500">Become a partner!</Heading>
            <Text fontSize="lg" mt={3}>Join our community of dealers, car rentals, mechanics and parts sellers.</Text>
          </Box>

          <Flex gap={4} flexWrap="wrap">
            <Button as={RLink} to={isLoggedIn ? '/business' : '/signup?type=business'} size="lg" colorScheme="yellow" bg="tertiary" color="primary">Get Started</Button>
            <Button as={RLink} to="/business" size="lg" bg="white" color="black" _hover={{ bg: 'gray.100' }}>Learn More</Button>
          </Flex>
        </Flex>
        }

        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacingX={6} spacingY={8} py={8}>
          <Box gridColumn={{ base: 'span 2', md: 'span 4', lg: 'span 2' }}>
            <Box as={RLink} to="/" display="block" width="150px" mb={4}>
              <Image src="/assets/images/motaa-logo-2.png" w="100%" alt="Motaa home" />
            </Box>
            <Text fontSize="sm" maxW="xs">
              Note: Transactions made on Motaa are between you and the respective service
              provider. Motaa does not have any liability to you in relation to your purchase.
            </Text>
          </Box>

          {sections.map((section) => (
            <Stack as="nav" aria-label={section.title} key={section.title} spacing={3}>
              <Text as="h2" fontWeight="bold">{section.title}</Text>
              {section.links.map(({ label, url, href, coming }) => (
                url ? (
                  <Link key={label} as={RLink} to={url} fontSize="sm" _hover={{ color: 'tertiary' }}>{label}</Link>
                ) : href ? (
                  <Link key={label} href={href} fontSize="sm" _hover={{ color: 'tertiary' }}>{label}</Link>
                ) : (
                  <Text key={label} fontSize="sm" color="whiteAlpha.800">
                    {label} {coming && <Tag colorScheme="green" size="sm" ml={1}>coming soon</Tag>}
                  </Text>
                )
              ))}
            </Stack>
          ))}
        </SimpleGrid>

        <Box pt={8} borderTopWidth={1} borderColor="whiteAlpha.500">
          <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" spacing={4}>
            <Text fontSize="sm">© {new Date().getFullYear()} Motaa Limited. All rights reserved.</Text>
            <HStack spacing={3}>
              {socials.map((s) => (
                <IconButton
                  key={s.href}
                  as="a"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  icon={<s.icon size={18} />}
                  size="sm"
                  bg="tertiary"
                  color="secondary"
                  _hover={{ bg: 'white' }}
                />
              ))}
            </HStack>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}


export const FormStepper = () => {
  return (
    <Box textAlign="center" p={5}>
      <Image src="/assets/images/motaa-logo-3.png" alt="Motaa" mb={4} width="100px" />

      <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={2}>
        Verify your account
      </Text>
      <Text fontSize="md" color="gray.600" mb={8}>
        Verify your account in 4 easy steps!
      </Text>

      <HStack justifyContent="space-between" spacing={0}>
        <Flex direction="column" align="center">
          <CheckCircleIcon w={6} h={6} color="blue.500" />
          <Text fontSize="xs" color="blue.500" mt={2}>Step 1</Text>
        </Flex>
        <Progress colorScheme="blue" size="xs" value={50} width="40px" my="auto" />
        <Flex direction="column" align="center">
          <Circle size="24px" border="2px solid" borderColor="blue.500" />
          <Text fontSize="xs" color="blue.500" mt={2}>Step 2</Text>
        </Flex>
        <Progress colorScheme="gray" size="xs" value={50} width="40px" my="auto" />
        <Flex direction="column" align="center">
          <Circle size="24px" border="2px solid" borderColor="gray.300" />
          <Text fontSize="xs" color="gray.500" mt={2}>Step 3</Text>
        </Flex>
        <Progress colorScheme="gray" size="xs" value={50} width="40px" my="auto" />
        <Flex direction="column" align="center">
          <Circle size="24px" border="2px solid" borderColor="gray.300" />
          <Text fontSize="xs" color="gray.500" mt={2}>Step 4</Text>
        </Flex>
      </HStack>
    </Box>
  );
};
