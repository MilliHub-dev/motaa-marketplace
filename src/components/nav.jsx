import {useState, useContext, useEffect, Fragment} from 'react';
import {
    Box, Stack, Flex,
    Image, Text,
    useMediaQuery, Icon,
    DrawerContent,
    Divider,
    DrawerHeader,
    DrawerCloseButton,
    DrawerBody,
    Drawer,
    SimpleGrid,
    Link,
    Menu,
    MenuItem,
    MenuButton,
    MenuList,
    Heading,
    Button,
    ButtonGroup,
    VStack,
    Avatar,
    IconButton,
    HStack,
    Tooltip,
    Circle,
    Progress,
    DrawerFooter,
    Container,
    Input,
    Tag,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
} from '@chakra-ui/react';
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import {motion} from 'framer-motion';
import {GlobalStore} from '../App';
import {FcMenu} from 'react-icons/fc';
import {CheckCircleIcon} from '@chakra-ui/icons'
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp, FaUser } from "react-icons/fa";
import { CustomerSearchBar, DashboardSearchBar } from '.';
import { RiAccountCircleLine, RiBellLine, RiFacebookFill, RiHeadphoneLine, RiInstagramFill, RiLinkedinFill, RiLogoutBoxRLine, RiMenuLine, RiTwitterFill, RiAccountCircleFill } from 'react-icons/ri';
import { TbBell, TbSearch } from 'react-icons/tb';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { RxEnvelopeClosed } from 'react-icons/rx';
import { AiOutlineMessage } from 'react-icons/ai';
import { GiMechanicGarage } from 'react-icons/gi';
import { FiBell } from 'react-icons/fi';
import { MdOutlineAccountCircle } from 'react-icons/md';
import { BsTools } from 'react-icons/bs';
import { LuWallet, LuChartLine } from 'react-icons/lu';
import { NavLink, Link as RLink, useNavigate } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowLeft, ArrowRight } from 'lucide-react';
import { 
  LayoutDashboard, Wallet, Clock,
  PiggyBank, BarChart2, HelpCircle,
  Settings, Share2, MoreVertical, TrendingUp
} from 'lucide-react';
import { GiHomeGarage } from "react-icons/gi";
import { GrUserWorker } from "react-icons/gr";
import {
  Wallet3, Home3, Chart, Shop,
  Chart1, Chart2, Chart21, ChartCircle, ChartFail, ChartSquare, ChartSuccess,
  Coin, User, //Toolbox,
} from "iconsax-react";
import { AiOutlineTransaction } from "react-icons/ai";


export const BackButton = ({ to, onClick, ...props }) => {
  const redirect = useNavigate();

  function goBack(){
    if(to){
      return redirect(to);
    }
    if (onClick){
      return onClick();
    }

    const {navigation} = window;
    if (navigation && navigation.canGoBack){
      return navigation.back();
    }else{
      return redirect('/');
    }
  }

  return(
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


export const Paginator = ({ onNext, onPrevious, onClick, pagination }) => {
  const [currentPage, setCurrentPage] = useState(1); // page 1 by default, unaffected by parent state.
  const [pages, setPages] = useState([]); // page 1 by default, unaffected by parent state.
  // const {next, previous, count, offset} = pagination;

  function destructurePages(){
    let _offset = pagination?.offset;
    // just in case there's no offset, prevents zero division error
    if (_offset === 0){
      _offset = 1;
    }
    // make the pages from the offset count, appx.
    let _pages, length = Math.round(pagination?.count/_offset);

    // create a Number Array with the number of pages gotten from div.
    _pages = Array.from({length}, (_, i) => (i + 1)); // [1, 2, 3, ..., n]
    console.log(`You've got ${_pages} pages!`);
    // setPages(..._pages)
  }

  function handlePageClick(pageNum){
    // do some cool shit ()
  }

  useEffect(() => {
    destructurePages();
  }, [])


  return(
    <ButtonGroup justifyContent="center" w="100%" isAttached align="center" mt={8}>
      <Button onClick={onPrevious} disabled={!pagination?.previous} variant="outline" size="sm" leftIcon={<ArrowLeft size={20} />}>
        Previous
      </Button>

      {pages?.map((page, i) => (
        <Button
          key={i}
          size="sm"
          disabled={page === '...'}
          onClick={onClick}
          variant={page === 1 ? 'solid' : 'outline'}
          colorScheme={page === 1 ? 'blue' : 'gray'}
        >
          {(page + 1)}
        </Button>
      ))}
          
      <Button onClick={onNext} disabled={!pagination?.next} variant="outline" size="sm" rightIcon={<ArrowRight size={20} />}>
        Next
      </Button>
    </ButtonGroup>
  )
}


export const UnauthenticatedNavbar = ({ props }) => {
    const [navIsOpen, setNavState] = useState(false);
    const [searchIsOpen, setSearchState] = useState(false);
    const {authUser, onLogout} = useContext(GlobalStore);
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    const isLoggedIn = Boolean(authUser);

    window.onscroll = (ev) => {
      if(window.scrollY > 1000){
        document.getElementById('navbar').classList.add('scrolled');
      }else{
        document.getElementById('navbar').classList.remove('scrolled');
      }
    }

    function toggleSearch(){
      setSearchState(!searchIsOpen);
    }

    function hideNav(){
        setNavState(false)
    }

    function showNav(){
        setNavState(true)
    }

    return(
      <Box
       position={'sticky'}
       top={'0px'}
       bg={'primary'}
       as={motion.div}
       color={"white"}
       flex={1} w={'100%'}
       animate={{ opacity: 1, }}
       initial={{ opacity: 0.6, }}
       transition={'.5s linear'}
       className='navbar'
       id='navbar'
       zIndex="20"
       mb={0}
      >
        <Flex className='navbar-inner'
          alignItems={'center'}
          px={4}
          py={4}
          justifyContent={'space-between'}
          flex={1} w={'100%'}
        >
          <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={isMobile? '60px' : '80px'} height={isMobile ? '40px' : '50px'} className='navbar-brand'>
            <RLink to={'/'}>
              <Image
               loading='eager'
               src={'/assets/images/motaa-logo-2.png'}
               width={'100%'}
               className='navbar-brand'
              />
            </RLink>
          </Box>

          <Flex flex={{base: 1, lg: 3/4}} flexWrap={'wrap'} justifyContent={{base: 'flex-end', md: 'space-around'}} className='navbar-nav' gap={{base: '10px', sm: 5}} alignItems={'center'}>
            {!isMobile && 
              <Fragment>
                <Text as={NavLink} fontWeight={'600'} to={"/#welcome"}> Home </Text>
                <Text as={NavLink} fontWeight={'600'} to={"/#what-we-offer"}> About </Text>
                <Text as={NavLink} fontWeight={'600'} to={"/#find-mechanics"}> Features </Text>
                <Text as={NavLink} fontWeight={'600'} to={"/#partner-with-us"}> For Businesses </Text>
              </Fragment>
            }

            <Fragment>
              <RLink to={"/signup/"}>
                <Button size='md' color="white" leftIcon={<RiAccountCircleFill className="icon" />} variant="link"> Sign up </Button>
              </RLink>
              
              <RLink to={"/login"}>
                <Button borderWidth={2} _hover={{bgColor: "white", color: "primary", }}  w={'100px'} color={'white'} size='md' borderColor={'white'} variant={'outline'}> Login </Button>
              </RLink>
            </Fragment>

            {isMobile &&
              <Button onClick={navIsOpen ? hideNav : showNav} colorScheme='transparent' px={2}>
                <Icon sx={{ fill: 'white', '& *': {fill: 'white'}}} className='icon'><FcMenu /></Icon>
              </Button>
            }
          </Flex>

          <Sidebar onClose={hideNav} show={navIsOpen} />
        </Flex>
      </Box>
    )
}


export const CustomerNavbar = ({ props }) => {
    const [navIsOpen, setNavState] = useState(false);
    const [searchIsOpen, setSearchState] = useState(false);
    const {authUser, onLogout, logout} = useContext(GlobalStore);
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    const [isLaptop] = useMediaQuery('(max-width: 1028px)');
    const isLoggedIn = Boolean(authUser);

    window.onscroll = (ev) => {
      if(window.scrollY > 1000){
        document.getElementById('navbar').classList.add('scrolled');
      }else{
        document.getElementById('navbar').classList.remove('scrolled');
      }
    }

    function toggleSearch(){
      setSearchState(!searchIsOpen);
    }

    function hideNav(){
        setNavState(false)
    }

    function showNav(){
        setNavState(true)
    }

    return(
      <Box
       position={'sticky'}
       top={'0px'}
       bg={'white'}
       as={motion.div}
       color={"black"}
       flex={1} w={'100%'}
       animate={{ opacity: 1, }}
       initial={{ opacity: 0.6, }}
       transition={'.5s linear'}
       className='navbar'
       id='navbar'
       zIndex="20"
       mb={0}
      >
        <Flex className='navbar-inner'
          alignItems={'center'}
          px={4} py={4} gap="10px"
          justifyContent={'space-between'}
          flex={1} w={'100%'}
          >
          <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={'80px'} height={isMobile ? '40px' : '50px'} className='navbar-brand'>
            <RLink to={'/'}>
              <Image
               loading='eager'
               src={'/assets/images/motaa-logo-3.png'}
               width={'100%'}
               className='navbar-brand'
              />
            </RLink>
          </Box>

          <Fragment>
            {!isLaptop && 
              <Flex flex={{base: 8/9, lg: 7/8}} flexWrap={'wrap'} alignItems={'center'}>
                <Flex display={{base: 'none', lg: 'flex'}}  flex={1} flexWrap={'wrap'} className='navbar-nav' gap={6} alignItems={'center'}>
                  <Text as={RLink} fontWeight={'500'} to={"/home"}> Home </Text>
                  <Text as={RLink} fontWeight={'500'} to={"/buy"}> Buy </Text>
                  <Text as={RLink} fontWeight={'500'} to={"/rent"}> Rent </Text>
                  <Text as={RLink} fontWeight={'500'} to={"/mechanics"}> Find Mechanic </Text>
                </Flex>
              </Flex>
            }

           {!isMobile && <CustomerSearchBar flex={1} />} 

            <Flex flex={isMobile ? 1 : 'unset'} flexWrap={'nowrap'} justifyContent={{base: 'space-evenly', lg: 'flex-start'}} className='' gap={isMobile ? 3 : 5} alignItems={'center'}>
              
              {isMobile && 
                <Button onClick={toggleSearch} variant="unstyled"><Icon viewBox='45' className='icon'><TbSearch /></Icon></Button>
              }

              {!isMobile && 
                <Button
                 as={RLink}
                 to="/wallet"
                 borderRadius={'30px'}
                 leftIcon={
                  <Icon
                   fontSize={'25px'}
                   as={Image}
                   src='/assets/icons/WalletIcon.svg'
                  />
                 }
                 variant="outline"
                 bgColor="#d9ebf5"
                 fontWeight="600"
                 colorScheme="blue"
                 color="primary"
                >{"Wallet"}</Button>
              }

              <RLink to={'/chat'}><Icon viewBox='45' className='icon'><AiOutlineMessage /></Icon></RLink>
              <RLink to={'/notifications'}><Icon viewBox='45' className='icon'><FiBell /></Icon></RLink>
              <RLink to={'/cart'}><Icon viewBox='45' className='icon'><HiOutlineShoppingCart /></Icon></RLink>
              {!isLaptop && 
                <Menu to={`/dashboard`}>
                {({ isOpen, onClose }) =>
                <Fragment>
                  <MenuButton onClose={onClose} isOpen={isOpen}>
                    <Icon viewBox='45' className='icon'><MdOutlineAccountCircle /></Icon>
                  </MenuButton>
                  <MenuList px={2}>
                    <Box my={3} placeItems="center">
                      <Avatar name={`${authUser?.first_name} ${authUser?.last_name}`} />
                      <Text>{authUser?.first_name} {authUser?.last_name}</Text>
                    </Box>

                    <Button my={1} as={MenuItem} display={'flex'} justifyContent={'space-between'} onClick={logout} variant={'ghost'} w={'100%'}> Sign Out  <RiLogoutBoxRLine className='icon' /> </Button>
                    <Button my={1} as={MenuItem} display={'flex'} justifyContent={'space-between'} variant={'ghost'} w={'100%'}> Contact Support <RiHeadphoneLine className='icon' />  </Button>
                  </MenuList>
                </Fragment>
                }
                </Menu>
              }
              
              {isLaptop &&
                <Button onClick={navIsOpen ? hideNav : showNav} colorScheme='transparent' px={2}>
                  <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
                </Button>
              }
            </Flex>
            
          </Fragment>
          
          <Sidebar onClose={hideNav} show={navIsOpen} />
        </Flex>

        {isMobile && searchIsOpen &&
          <Fragment>
            <Box px={2} py={2}  w={'100%'} bg="#fff">
              <CustomerSearchBar />
            </Box>
          </Fragment>
        }

      </Box>
    )
}


export const DealerNavbar = ({ sidebarOpen, setSidebarState, ...props }) => {
  const [navIsOpen, setNavState] = useState(false);
  const [searchIsOpen, setSearchState] = useState(false);
  const {authUser, onLogout, logout} = useContext(GlobalStore);
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const isLoggedIn = Boolean(authUser);

  window.onscroll = (ev) => {
    if(window.scrollY > 1000){
      document.getElementById('navbar').classList.add('scrolled');
    }else{
      document.getElementById('navbar').classList.remove('scrolled');
    }
  }

  function toggleSearch(){
    setSearchState(!searchIsOpen);
  }

  function hideNav(){
      setSidebarState(false)
  }

  function showNav(){
      setSidebarState(true)
  }

  return(
    <Box
     position={'sticky'}
     top={'0px'}
     bg={!authUser ? 'primary' : 'white'}
     as={motion.div}
     color={!authUser ? "white": "black"}
     flex={1} w={'100%'}
     animate={{ opacity: 1, }}
     initial={{ opacity: 0.6, }}
     transition={'.5s linear'}
     className='navbar'
     id='navbar'
     zIndex="20"
     mb={0}
    >
      <Flex className='navbar-inner'
        alignItems={'center'}
        px={4}
        py={4}
        justifyContent={'space-between'}
        flex={1} w={'100%'}
        >
        <Flex justifyContent="space-betweeen" alignItems="center">
          <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={isMobile? '60px' : '80px'} height={isMobile ? '40px' : '50px'} className='navbar-brand'>
            <RLink to={'/'}><Image loading='eager'
                src={!authUser ? '/assets/images/motaa-logo-2.png' : '/assets/images/motaa-logo-3.png'}
                width={'100%'} className='navbar-brand' /></RLink>
          </Box>
        </Flex>


        <Flex
         flex={isMobile ? 1 : 'unset'}
         flexWrap={'nowrap'}
         justifyContent={{base: 'space-around', lg: 'flex-end'}}
         gap={isMobile ? 3 : 5}
         alignItems={'center'}
        >
          {/*{isMobile ? 
            <Button px={0} onClick={toggleSearch} variant="unstyled">
              <Icon className='icon'><TbSearch /></Icon>
            </Button>
            :
            <DashboardSearchBar flex={1} />
          }*/}
          {isMobile ? (
              <Button
               as={RLink}
               to="/wallet"
               variant="ghost"
               borderColor="primary"
               px={2}
              >
                <Icon fontSize={'25px'} as={Image} src='/assets/icons/WalletIcon.svg' />
              </Button> 
            ):(
              <Button
               as={RLink}
               to="/wallet"
               borderRadius={'30px'}
               leftIcon={
                <Icon fontSize={'25px'} as={Image} src='/assets/icons/WalletIcon.svg' />
               }
               variant="outline"
               bgColor="#d9ebf5"
               fontWeight="600"
               colorScheme="blue"
               color="primary"
              >Wallet</Button>
            )
          }
          <Button px={2} as={RLink} variant="ghost" to={'/chat'}><Icon viewBox='45' className='icon'><AiOutlineMessage /></Icon></Button>
          <Button px={2} as={RLink} variant="ghost" to={'/notifications'}><Icon viewBox='45' className='icon'><FiBell /></Icon></Button>
          
          <Menu zIndex={2} display="block">
            <MenuButton
              as={IconButton}
              icon={<FaUser size={18} />}
              variant="ghost"
              size="sm"
              aria-label="Profile"
            />

            <MenuList py={3} px={3} zIndex={'2 !important'}>
              <Box placeItems="center" placeContent="center" p={3}>
                <Avatar 
                 size="lg"
                 name={`${authUser?.first_name} ${authUser?.last_name}`}
                 />
                <Heading my={1} size="sm"> {`${authUser?.first_name} ${authUser?.last_name}`} </Heading>
                <Text> {authUser?.email} </Text>
              </Box>
              <Divider my={2} />
              <MenuItem as={Link} gap={2} to={'/profile'}> <User size="20" /> Profile </MenuItem>
              <MenuItem as={Link} gap={2} onClick={logout}> <RiLogoutBoxRLine /> Logout </MenuItem>
            </MenuList>
          </Menu>

          {(isMobile || props.hideSidebar) &&
            <Button onClick={sidebarOpen ? hideNav : showNav} colorScheme='transparent' px={0}>
              <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
            </Button>
          }
        </Flex>          
      </Flex>

      {isMobile && searchIsOpen &&
        <Fragment>
          <Box px={2} py={2}  w={'100%'} bg="#fff">
            <DashboardSearchBar />
          </Box>
        </Fragment>
      }
    </Box>
  )
}


export const DealerDashboardSideBar = ({ dealership, sidebarOpen, setSidebarState, onClose, ...props }) => {
  const NavLinks = ({ dealership, sidebarOpen, setSidebarState }) => {
    const {logout, authUser} = useContext(GlobalStore);
    const pathname = document.location.pathname;

    useEffect(() => {

    }, [window.location])

     const links = [
      { icon: Home3, label: 'Dashboard', path: '/dashboard', active: pathname.includes('dashboard')},
      { icon: Coin, label: 'Orders', path: '/orders', active: pathname.includes('orders')},
      { icon: Shop, label: 'Inventory', path: '/inventory', active: pathname.includes('analytics')},
      { icon: LuChartLine, label: 'Analytics', path: '/analytics', active: pathname.includes('analytics')},
      { icon: HelpCircle, label: 'Support', path: '/support', active: pathname.includes('support')},
      { icon: Settings, label: 'Settings', path: '/settings', active: pathname.includes('settings')},
    ]

    return(
      <VStack align="stretch" spacing={6}>
        <HStack spacing={3}>
          <Avatar size="md" src={dealership?.logo} mx={sidebarOpen ? '0px' : 'auto'} name={`${dealership?.business_name}`} />

          <Box flex={1}>
            <Text fontWeight="medium">{`${dealership?.business_name}`}</Text>
            <Text fontSize="sm" color="gray.500">@{dealership?.slug}</Text>
          </Box>
        </HStack>

        <VStack align="stretch" spacing={2}>
          {links.map((item, index) =>
            <Fragment key={index}>
            {
              item?.children ? (
                <Accordion allowToggle>
                  <AccordionItem border="none">
                    <AccordionButton
                      key={index}
                      as={NavLink}
                      borderRadius="5px"
                      w={'100%'}
                      justifyContent="space-between"
                      alignItems="center"
                      bgColor={item.active ? 'gray' : 'transparent'}
                      _expanded={{ bgColor: 'gray', color: 'white'}}
                    >
                    {({ expanded }) => 
                      <>
                      <Flex flex={1} gap={3} alignItems="center">
                        <item.icon size={20} />
                        <Text fontWeight="600"> {item.label} </Text>
                      </Flex>
                      {expanded ? <FaChevronUp /> : <FaChevronDown />}
                      </>
                    }
                    </AccordionButton>

                    <AccordionPanel px={0}>
                      {
                        item.children.map((child, idx) => 
                          <Tooltip key={idx} isDisabled={sidebarOpen} hasArrow label={item.label} placement="right-start">
                          <Button
                            as={NavLink}
                            to={child.path}
                            w={'100%'}
                            mt={1.5}
                            bgColor="transparent"
                            _activeLink={{ bgColor: 'primary', color: 'white', }}
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Flex flex={1} gap={3} alignItems="center">
                              <item.icon size={20} />
                              <Text> {child.label} </Text>
                            </Flex>                          
                          </Button>
                          </Tooltip>
                        )
                      }
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
                ) : (
                  // <Tooltip key={index} isDisabled={sidebarOpen} hasArrow label={item.label} placement="right-start">
                    <Button
                      key={index}
                      as={NavLink}
                      to={item.path}
                      w={'100%'}
                      bgColor="transparent"
                      _activeLink={{ bgColor: 'primary', color: 'white' }}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Flex flex={1} gap={3} alignItems="center">
                        <item.icon size={20} />
                        <Text> {item.label} </Text>
                      </Flex>
                      {item?.children && !!sidebarOpen && <FaChevronDown />}
                    </Button>
                  // </Tooltip>
                )
            }
            </Fragment>
          )}

          {/* Main Content */}
          <Button
           leftIcon={sidebarOpen ? <FaChevronLeft size={20} /> : <FaChevronRight size={20} />}
           onClick={() => setSidebarState(!sidebarOpen)}
           justifyContent="start"
           colorScheme="gray.500"
           variant="solid"
           bottom="0px"
           zIndex="10"
          > {sidebarOpen && 'Close'} </Button>
        </VStack>
      </VStack>
    )
  }
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const {authUser} = useContext(GlobalStore);

  if (isMobile || props.mode === 'drawer'){
    return(
      <Drawer placement={'right'} isOpen={sidebarOpen} onClose={() => setSidebarState(false)} {...props}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerCloseButton />
          </DrawerHeader>
          
          <DrawerBody>
            <NavLinks sidebarOpen={sidebarOpen} dealership={dealership} setSidebarState={setSidebarState} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    )
  }

  return(
    <Box
      w={"280px"}
      overflow={'hidden'}
      position={"fixed"}
      left="0"
      h={"100vh"}
      bgColor="#fff"
      zIndex="20"
      borderRightWidth={1}
      p={sidebarOpen ? 6 : 2}
      {...props}
    >
      <NavLinks sidebarOpen={sidebarOpen} dealership={dealership} setSidebarState={setSidebarState} />
    </Box>
  )
}



export const MechanicNavbar = ({ sidebarOpen, setSidebarState, ...props }) => {
  const [navIsOpen, setNavState] = useState(false);
  const [searchIsOpen, setSearchState] = useState(false);
  const {authUser, onLogout, logout} = useContext(GlobalStore);
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const isLoggedIn = Boolean(authUser);

  window.onscroll = (ev) => {
    if(window.scrollY > 1000){
      document.getElementById('navbar').classList.add('scrolled');
    }else{
      document.getElementById('navbar').classList.remove('scrolled');
    }
  }

  function toggleSearch(){
    setSearchState(!searchIsOpen);
  }

  function hideNav(){
      setSidebarState(false)
  }

  function showNav(){
      setSidebarState(true)
  }

  return(
    <Box
     position={'sticky'}
     top={'0px'}
     bg={!authUser ? 'primary' : 'white'}
     as={motion.div}
     color={!authUser ? "white": "black"}
     flex={1} w={'100%'}
     animate={{ opacity: 1, }}
     initial={{ opacity: 0.6, }}
     transition={'.5s linear'}
     className='navbar'
     id='navbar'
     zIndex="20"
     mb={0}
    >
      <Flex className='navbar-inner'
        alignItems={'center'}
        px={4}
        py={4}
        justifyContent={'space-between'}
        flex={1} w={'100%'}
        >
        <Flex justifyContent="space-betweeen" alignItems="center">

          <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={isMobile? '60px' : '80px'} height={isMobile ? '40px' : '50px'} className='navbar-brand'>
            <RLink to={'/'}><Image loading='eager'
                src={!authUser ? '/assets/images/motaa-logo-2.png' : '/assets/images/motaa-logo-3.png'}
                width={'100%'} className='navbar-brand' /></RLink>
          </Box>
        </Flex>


        <Flex flex={isMobile ? 1 : 'unset'} flexWrap={'wrap'} justifyContent={{base: 'space-evenly', lg: 'flex-start'}} className='' gap={isMobile ? 3 : 5} alignItems={'center'}>
          
          {isMobile ? (
              <Button
               as={RLink}
               to="/wallet"
               variant="outline"
               borderColor="primary"
              >
                <Icon fontSize={'25px'} as={Image} src='/assets/icons/WalletIcon.svg' />
              </Button> 
            ):(
              <Button
               as={RLink}
               to="/wallet"
               borderRadius={'30px'}
               leftIcon={
                <Icon fontSize={'25px'} as={Image} src='/assets/icons/WalletIcon.svg' />
               }
               variant="outline"
               bgColor="#d9ebf5"
               fontWeight="600"
               colorScheme="blue"
               color="primary"
              >Wallet</Button>
            )
          }
          <RLink to={'/chat'}><Icon viewBox='45' className='icon'><AiOutlineMessage /></Icon></RLink>
          <RLink to={'/notifications'}><Icon viewBox='45' className='icon'><FiBell /></Icon></RLink>
          <Menu zIndex={2} display="block">
            <MenuButton
              as={IconButton}
              icon={<FaUser size={18} />}
              variant="ghost"
              size="sm"
              aria-label="Profile"
            />

            <MenuList py={3} px={3} zIndex={'2 !important'}>
              <Box placeItems="center" placeContent="center" p={3}>
                <Avatar 
                 size="lg"
                 name={`${authUser?.first_name} ${authUser?.last_name}`}
                 />
                <Heading my={1} size="sm"> {`${authUser?.first_name} ${authUser?.last_name}`} </Heading>
                <Text> {authUser?.email} </Text>
              </Box>
              <Divider my={2} />
              <MenuItem as={Link} gap={2} to={'/profile'}> <User size="20" /> Profile </MenuItem>
              <MenuItem as={Link} gap={2} onClick={logout}> <RiLogoutBoxRLine /> Logout </MenuItem>
            </MenuList>
          </Menu>
          {(isMobile || props.hideSidebar) &&
            <Button onClick={sidebarOpen ? hideNav : showNav} colorScheme='transparent' px={2}>
              <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
            </Button>
          }
        </Flex>          
      </Flex>
    </Box>
  )
}


export const MechanicDashboardSideBar = ({ mechanic, sidebarOpen, setSidebarState, onClose, ...props }) => {
  const NavLinks = ({ mechanic, sidebarOpen, setSidebarState }) => {
    const {logout, authUser} = useContext(GlobalStore);
    const pathname = document.location.pathname;

    useEffect(() => {

    }, [window.location])

     const links = [
      { icon: GiHomeGarage, label: 'Dashboard', path: '/dashboard', active: pathname.includes('dashboard')},
      { icon: GrUserWorker, label: 'Bookings', path: '/bookings', active: pathname.includes('bookings')},
      { icon: GiMechanicGarage, label: 'Service Offerings', path: '/services', active: pathname.includes('services')},
      { icon: LuChartLine, label: 'Analytics', path: '/analytics', active: pathname.includes('analytics')},
      { icon: HelpCircle, label: 'Support', path: '/support', active: pathname.includes('support')},
      { icon: Settings, label: 'Settings', path: '/settings', active: pathname.includes('settings')},
    ]

    return(
      <VStack align="stretch" spacing={6}>
        <HStack spacing={3}>
          <Avatar size="md" src={mechanic?.logo} mx={sidebarOpen ? '0px' : 'auto'} name={`${mechanic?.business_name}`} />

          <Box flex={1}>
            <Text fontWeight="medium">{`${mechanic?.business_name}`}</Text>
            <Text fontSize="sm" color="gray.500">@{mechanic?.slug}</Text>
          </Box>
        </HStack>

        <VStack align="stretch" spacing={2}>
          {links.map((item, index) =>
            <Fragment key={index}>
            {
              item?.children ? (
                <Accordion allowToggle>
                  <AccordionItem border="none">
                    <AccordionButton
                      key={index}
                      as={NavLink}
                      borderRadius="5px"
                      w={'100%'}
                      justifyContent="space-between"
                      alignItems="center"
                      bgColor={item.active ? 'gray' : 'transparent'}
                      _expanded={{ bgColor: 'gray', color: 'white'}}
                    >
                    {({ expanded }) => 
                      <>
                      <Flex flex={1} gap={3} alignItems="center">
                        <item.icon size={20} />
                        <Text fontWeight="600"> {item.label} </Text>
                      </Flex>
                      {expanded ? <FaChevronUp /> : <FaChevronDown />}
                      </>
                    }
                    </AccordionButton>

                    <AccordionPanel px={0}>
                      {
                        item.children.map((child, idx) => 
                          <Tooltip key={idx} isDisabled={sidebarOpen} hasArrow label={item.label} placement="right-start">
                          <Button
                            as={NavLink}
                            to={child.path}
                            w={'100%'}
                            mt={1.5}
                            bgColor="transparent"
                            _activeLink={{ bgColor: 'primary', color: 'white', }}
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Flex flex={1} gap={3} alignItems="center">
                              <item.icon size={20} />
                              <Text> {child.label} </Text>
                            </Flex>                          
                          </Button>
                          </Tooltip>
                        )
                      }
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
                ) : (
                  // <Tooltip key={index} isDisabled={sidebarOpen} hasArrow label={item.label} placement="right-start">
                    <Button
                      key={index}
                      as={NavLink}
                      to={item.path}
                      w={'100%'}
                      bgColor="transparent"
                      _activeLink={{ bgColor: 'primary', color: 'white' }}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Flex flex={1} gap={3} alignItems="center">
                        <item.icon size={20} />
                        <Text> {item.label} </Text>
                      </Flex>
                      {item?.children && !!sidebarOpen && <FaChevronDown />}
                    </Button>
                  // </Tooltip>
                )
            }
            </Fragment>
          )}

          {/* Main Content */}
          <Button
           leftIcon={sidebarOpen ? <FaChevronLeft size={20} /> : <FaChevronRight size={20} />}
           onClick={() => setSidebarState(!sidebarOpen)}
           justifyContent="start"
           colorScheme="gray.500"
           variant="solid"
           bottom="0px"
           zIndex="10"
          > {sidebarOpen && 'Close'} </Button>
        </VStack>
      </VStack>
    )
  }
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const {authUser} = useContext(GlobalStore);

  if (isMobile || props.mode === 'drawer'){
    return(
      <Drawer placement={'right'} isOpen={sidebarOpen} onClose={() => setSidebarState(false)} {...props}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerCloseButton />
          </DrawerHeader>
          
          <DrawerBody>
            <NavLinks sidebarOpen={sidebarOpen} mechanic={mechanic} setSidebarState={setSidebarState} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    )
  }

  return(
    <Box
      w={"280px"}
      overflow={'hidden'}
      position={"fixed"}
      left="0"
      h={"100vh"}
      bgColor="#fff"
      zIndex="20"
      borderRightWidth={1}
      p={sidebarOpen ? 6 : 2}
      {...props}
    >
      <NavLinks sidebarOpen={sidebarOpen} mechanic={mechanic} setSidebarState={setSidebarState} />
    </Box>
  )
}


export const Sidebar = ({ show, onClose, }) => {
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    const {authUser, logout} = useContext(GlobalStore);
    const isLoggedIn = !!authUser;
    return (
      <Drawer className="sidebar" position="fixed" zIndex="20" isOpen={show} onClose={onClose} placement='right'>
        <DrawerContent>
            <DrawerHeader>
                <DrawerCloseButton />
            </DrawerHeader>

            <DrawerBody>
              {
                isLoggedIn ? (
                  // isMobile &&
                  <Stack>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/home"}>Home</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/buy"}>Buy</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/rent"}>Rent</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/mechanics"}>Find Mechanics</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/wallet"}>Wallet</Text>
                  </Stack>
                ) : (
                <Stack>
                  <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#welcome"} >Home</Text>
                  <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#what-we-offer"} >About</Text>
                  <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#find-mechanics"} >Features</Text>
                  <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#partner-with-us"} >For Businesses</Text>
                </Stack>
                )
              }
            </DrawerBody>

            <DrawerFooter as={Stack}>
                {isLoggedIn && 
                  <Button display={'flex'} justifyContent={'space-between'} onClick={logout} variant={'ghost'} w={'100%'}> Sign Out  <RiLogoutBoxRLine className='icon' /> </Button>
                }
                <Button display={'flex'} justifyContent={'space-between'} variant={'ghost'} w={'100%'}> Contact Support <RiHeadphoneLine className='icon' />  </Button>
            </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
}


export const Footer = ({ props }) => {
  const sections = [
    {
      title: 'Product',
      links: [
        {label: 'Buy a car', url: '/signup' }, 
        {label: 'Sell your car', url: '/signup' },
        {label: 'Rent a car', url: '/signup'},
        {label: 'Find Mechanic', url: '/signup'}
      ],
    },
    {
      title: 'Company',
      links: [
        {label: 'About us', url: '/#about-us' }, 
        {label: 'Careers', coming: true },
        {label: 'Press', coming: true},
        {label: 'News', coming: true},
      ],
    },
    {
      title: 'Resources',
      links: [
        {label: 'Blog', url: '/blog' }, 
        {label: 'Newsletter', url: '/bad'},
        {label: 'Events', },
        {label: 'Help centre', url: '/help'}
      ],
    },
    {
      title: 'Legal',
      links: [
        {label: 'Terms of Service', url: '/terms-of-service' }, 
        {label: 'Privacy Policy', url: '/privacy-policy' },
        {label: 'Licenses', url: '/licenses'}
      ],
    },
  ]

  return (
    <Box bg="primary" color="white" pt={20} pb={8}>
      <Container maxW="container.lg">

        <Box pb={8} borderBottomWidth={1} borderColor="gray.200">
          <Flex justifyContent="space-between" flexWrap="wrap">
            <Box>
              <Heading size="xl" fontWeight="400">Become a partner!</Heading>
              <Text fontSize="lg" mt={3}>Join our successful community of dealers, car rentals, and mechanics. </Text>
            </Box>

            <Flex gap={5}>
              <Button size="lg" colorScheme="yellow" bg="tertiary" color="primary"> Get Started </Button>
              <Button size="lg" colorScheme="white" bg="white" color="black"> Learn More </Button>
            </Flex>
          </Flex>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 6 }} spacing={8} py={8}>
          <Box gridColumn="span 2">
            <Box width="150px" height="70px">
              <Image src="/assets/images/motaa-logo-2.png" mb={4} w="100%" alt="Motaa" />
            </Box>

            <Text fontSize="sm" color="white.700" maxW="xs">
              Note: Transactions made on Motaa are between you and the respective service
              provider. Motaa does not have any liability to you in relation of your purchase.
            </Text>
          </Box>
          
          {sections.map((section) => (
            <Stack key={section.title} spacing={4}>
              <Text fontWeight="bold">{section.title}</Text>
              {section.links.map(({ label, url, coming}) => (
                <Text
                  key={label}
                  as={url && RLink}
                  to={url}
                  fontSize="sm"
                  color="white.800"
                  cursor="pointer"
                  _hover={{ color: 'gray.500' }}
                >
                  {label} {coming ? <Tag colorScheme="green" size="sm"> coming soon </Tag> : null}
                </Text>
              ))}
            </Stack>
          ))}
        </SimpleGrid>

        <Box pt={8} borderTopWidth={1} borderColor="gray.200">
          <Stack
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
            spacing={4}
          >
            <Text fontSize="sm" color="white">
              © {new Date().getFullYear()} Motaa Limited. All rights reserved.
            </Text>
            <HStack spacing={4}>
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map(
                (SocialIcon, index) => (
                  <Icon
                    key={index}
                    as={SocialIcon}
                    boxSize={'30px'}
                    color="gray.800"
                    cursor="pointer"
                    _hover={{ color: 'blue.500' }}
                    px={1.5}
                    py={1.35}
                    bg={'tertiary'}
                    borderRadius={'5px'}
                  />
                )
              )}
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
      {/* Logo */}
      <Image src="/assets/images/motaa-logo-3.png" alt="Logo" mb={4} width="100px" />

      {/* Title */}
      <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={2}>
        Verify your account
      </Text>
      <Text fontSize="md" color="gray.600" mb={8}>
        Verify your account in 4 easy steps!
      </Text>

      {/* Stepper */}
      <HStack justifyContent="space-between" spacing={0}>
        {/* Step 1 */}
        <Flex direction="column" align="center">
          <CheckCircleIcon w={6} h={6} color="blue.500" />
          <Text fontSize="xs" color="blue.500" mt={2}>Step 1</Text>
        </Flex>

        {/* Connector */}
        <Progress colorScheme="blue" size="xs" value={50} width="40px" my="auto" />

        {/* Step 2 */}
        <Flex direction="column" align="center">
          <Circle size="24px" border="2px solid" borderColor="blue.500" />
          <Text fontSize="xs" color="blue.500" mt={2}>Step 2</Text>
        </Flex>

        {/* Connector */}
        <Progress colorScheme="gray" size="xs" value={50} width="40px" my="auto" />

        {/* Step 3 */}
        <Flex direction="column" align="center">
          <Circle size="24px" border="2px solid" borderColor="gray.300" />
          <Text fontSize="xs" color="gray.500" mt={2}>Step 3</Text>
        </Flex>

        {/* Connector */}
        <Progress colorScheme="gray" size="xs" value={50} width="40px" my="auto" />

        {/* Step 4 */}
        <Flex direction="column" align="center">
          <Circle size="24px" border="2px solid" borderColor="gray.300" />
          <Text fontSize="xs" color="gray.500" mt={2}>Step 4</Text>
        </Flex>
      </HStack>
    </Box>
  );
};





