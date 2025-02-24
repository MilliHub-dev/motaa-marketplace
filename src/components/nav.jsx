import {useState, useContext, useEffect, Fragment} from 'react';
import {
    Box, Stack, Flex,
    Image, Text,
    useMediaQuery, Icon,
    DrawerContent,
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
    FadeIn,
    Input,
} from '@chakra-ui/react';
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import {motion} from 'framer-motion';
import {GlobalStore} from '../App';
import {FcMenu} from 'react-icons/fc';
import {CheckCircleIcon} from '@chakra-ui/icons'
import { FaChevronLeft, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { SearchBar } from '.';
import { RiAccountCircleLine, RiBellLine, RiFacebookFill, RiHeadphoneLine, RiInstagramFill, RiLinkedinFill, RiLogoutBoxRLine, RiMenuLine, RiTwitterFill, RiAccountCircleFill } from 'react-icons/ri';
import { TbBell, TbSearch } from 'react-icons/tb';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { RxEnvelopeClosed } from 'react-icons/rx';
import { AiOutlineMessage } from 'react-icons/ai';
import { FiBell } from 'react-icons/fi';
import { MdOutlineAccountCircle } from 'react-icons/md';
import { LuWallet } from 'react-icons/lu';
import { NavLink, Link as RLink, useNavigate } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowLeft, ArrowRight } from 'lucide-react';
import { LayoutDashboard, Wallet, Clock, PiggyBank, BarChart2, HelpCircle, Settings, Share2, MoreVertical, TrendingUp } from 'lucide-react'
import { LuLineChart } from "react-icons/lu";
import { GiHomeGarage } from "react-icons/gi";
import {
  Wallet3, Home3, Chart, Shop,
  Chart1, Chart2, Chart21, ChartCircle, ChartFail, ChartSquare, ChartSuccess,
  Coin, Coin1,Money, Money2, Money3, Money4, MoneyAdd, MoneyArchive,
  MoneyChange, MoneyForbidden, MoneyRecive, MoneyRemove, MoneySend, MoneyTick, MoneyTime, Moneys
} from "iconsax-react";
import { AiOutlineTransaction } from "react-icons/ai";


export const BackButton = ({ to, onClick }) => {
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
                <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
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
                <Flex display={{base: 'none', lg: 'flex'}}  flex={1} flexWrap={'wrap'} className='navbar-nav' gap={3} alignItems={'center'}>
                  <Text as={RLink} fontWeight={'600'} to={"/home"}> Home </Text>
                  <Text as={RLink} fontWeight={'600'} to={"/buy"}> Buy </Text>
                  <Text as={RLink} fontWeight={'600'} to={"/rent"}> Rent </Text>
                  <Text as={RLink} fontWeight={'600'} to={"/mechanics"}> Find Mechanic </Text>
                </Flex>
              </Flex>
            }

            {!isMobile && <SearchBar flex={1} />}

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
              <SearchBar />
            </Box>
          </Fragment>
        }

      </Box>
    )
}


export const DealerNavbar = ({ props, sidebarOpen, setSidebarState }) => {
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
          <Button onClick={sidebarOpen ? hideNav : showNav} colorScheme='transparent' px={2}>
            <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
          </Button>

          <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={isMobile? '60px' : '80px'} height={isMobile ? '40px' : '50px'} className='navbar-brand'>
            <RLink to={'/'}><Image loading='eager'
                src={!authUser ? '/assets/images/motaa-logo-2.png' : '/assets/images/motaa-logo-3.png'}
                width={'100%'} className='navbar-brand' /></RLink>
          </Box>
        </Flex>


        <Flex flex={isMobile ? 1 : 'unset'} flexWrap={'wrap'} justifyContent={{base: 'space-evenly', lg: 'flex-start'}} className='' gap={isMobile ? 3 : 5} alignItems={'center'}>
          {isMobile ? 
            <Button onClick={toggleSearch} variant="unstyled"><Icon viewBox='45' className='icon'><TbSearch /></Icon></Button>
            : <SearchBar flex={1} />
          }
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
        </Flex>          
      </Flex>

      {isMobile && searchIsOpen &&
        <Fragment>
          <Box px={2} py={2}  w={'100%'} bg="#fff">
            <SearchBar />
          </Box>
        </Fragment>
      }
    </Box>
  )
}


export const MechanicNavbar = ({ props }) => {
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
          <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={isMobile? '60px' : '80px'} height={isMobile ? '40px' : '50px'} className='navbar-brand'>
            <RLink to={'/'}><Image loading='eager'
                src={!authUser ? '/assets/images/motaa-logo-2.png' : '/assets/images/motaa-logo-3.png'}
                width={'100%'} className='navbar-brand' /></RLink>
          </Box>

          { authUser ? (
            <Fragment>
              {!isMobile && 
                <Flex flex={{base: 8/9, lg: 7/8}} flexWrap={'wrap'} alignItems={'center'}>
                  <Flex display={{base: 'none', lg: 'flex'}}  flex={1} flexWrap={'wrap'} className='navbar-nav' gap={3} alignItems={'center'}>
                    <Text as={RLink} fontWeight={'600'} to={"/home"}> Home </Text>
                    <Text as={RLink} fontWeight={'600'} to={"/buy"}> Buy </Text>
                    <Text as={RLink} fontWeight={'600'} to={"/rent"}> Rent </Text>
                    <Text as={RLink} fontWeight={'600'} to={"/mechanics"}> Find Mechanic </Text>
                  </Flex>

                  <SearchBar flex={1} />
                </Flex>
              }

              <Flex flex={isMobile ? 1 : 'unset'} flexWrap={'wrap'} justifyContent={{base: 'space-evenly', lg: 'flex-start'}} className='' gap={isMobile ? 3 : 5} alignItems={'center'}>
                {isMobile && 
                  <Button onClick={toggleSearch} variant="unstyled"><Icon viewBox='45' className='icon'><TbSearch /></Icon></Button>
                }

                {!isMobile && isLoggedIn &&
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
                }

                <RLink to={'/chat'}><Icon viewBox='45' className='icon'><AiOutlineMessage /></Icon></RLink>
                <RLink to={'/notifications'}><Icon viewBox='45' className='icon'><FiBell /></Icon></RLink>

                {authUser?.user_type === "customer" &&
                  <>
                    <RLink to={'/cart'}><Icon viewBox='45' className='icon'><HiOutlineShoppingCart /></Icon></RLink>
                    <RLink to={`/dashboard`}><Icon viewBox='45' className='icon'><MdOutlineAccountCircle /></Icon></RLink>
                  </>
                }
              </Flex>
              
              <Button onClick={navIsOpen ? hideNav : showNav} colorScheme='transparent' px={2}>
                <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
              </Button>
            </Fragment>
          ):(
            <Flex flex={{base: 1, lg: 3/4}} flexWrap={'wrap'} justifyContent={{base: 'flex-end', md: 'space-around'}} className='navbar-nav' gap={{base: '10px', sm: 5}} alignItems={'center'}>
              {!isMobile && 
                <Fragment>
                  <Text as={NavLink} fontWeight={'600'} to={"/home/#welcome"}> Home </Text>
                  <Text as={NavLink} fontWeight={'600'} to={"/home/#what-we-offer"}> About </Text>
                  <Text as={NavLink} fontWeight={'600'} to={"/home/#find-mechanics"}> Features </Text>
                  <Text as={NavLink} fontWeight={'600'} to={"/home/#partner-with-us"}> For Businesses </Text>
                </Fragment>
              }

              {!isLoggedIn &&
                <Fragment>
                  <RLink to={"/signup/"}>
                    <Button size='md' color="white" leftIcon={<RiAccountCircleFill className="icon" />} variant="link"> Sign up </Button>
                  </RLink>
                  
                  <RLink to={"/login"}>
                    <Button borderWidth={2} colorScheme="blue"  w={'100px'} color={'white'} size='md' borderColor={'white'} variant={'outline'}> Login </Button>
                  </RLink>
                </Fragment>
              }

              {isMobile &&
                <Button onClick={navIsOpen ? hideNav : showNav} colorScheme='transparent' px={2}>
                  <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
                </Button>
              }
            </Flex>
          )}

          <Sidebar onClose={hideNav} show={navIsOpen} />
        </Flex>

        {isMobile && searchIsOpen &&
          <Fragment>
            <Box px={2} py={2}  w={'100%'} bg="#fff">
              <SearchBar />
            </Box>
          </Fragment>
        }

      </Box>
    )
}


const NavLinks = ({ dealership, sidebarOpen, setSidebarState }) => {
  const links = [
    { icon: Home3, label: 'Dashboard', path: '/dashboard' },
    { icon: Coin, label: 'Transactions', path: '/transactions'},
    { icon: Shop, label: 'Inventory', path: '/inventory', children: [
        { icon: GiHomeGarage, label: 'Car Lot', active: true, path: '/listings' },
      ]
    },
    { icon: LuLineChart, label: 'Analytics', path: '/analytics', children: [
      {icon: Chart, label: 'Sales', path: '/sales'}
    ]},
    
    { icon: Chart, label: 'Ads Center', path: '/ads'},
    { icon: HelpCircle, label: 'Support', path: '/support'},
    { icon: Settings, label: 'Settings', path: '/settings'},
  ]
  return(
    <VStack align="stretch" spacing={6}>
      <HStack spacing={3}>
        <Avatar size="sm" src={dealership?.logo} mx={sidebarOpen ? '0px' : 'auto'} name={`${dealership?.business_name}`} />

        {sidebarOpen &&
          <>
            <Box flex={1}>
              <Text fontWeight="medium">{`${dealership?.business_name}`}</Text>
              <Text fontSize="sm" color="gray.500">@{dealership?.slug}</Text>
            </Box>
            <Menu zIndex={2} display="block">
              <MenuButton
                as={IconButton}
                icon={<Share2 size={18} />}
                variant="ghost"
                size="sm"
                aria-label="Share"
              />

              <MenuList py={0} zIndex={'200 !important'}>
                <MenuItem>Copy Link</MenuItem>
                <MenuItem>Facebook</MenuItem>
                <MenuItem>Instagram</MenuItem>
                <MenuItem>X (Twitter)</MenuItem>
              </MenuList>
            </Menu>
          </>
        }
      </HStack>

      <VStack align="stretch" spacing={2}>
        {links.map((item, index) => (
          <RLink key={index} to={item.path}>
          <Tooltip isDisabled={sidebarOpen} hasArrow label={item.label} placement="right-start">
            <Flex
              key={index}
              as={Button}
              w={'100%'}
              variant={item.active ? 'solid' : 'ghost'}
              colorScheme={item.active ? 'blue' : 'gray'}
              justifyContent="space-between"
               alignItems="center"
            >
              <Flex flex={1} gap={3} alignItems="center">
                <item.icon size={20} />
                <Text> {sidebarOpen && item.label} </Text>
              </Flex>
              {item?.children && !!sidebarOpen && <FaChevronDown />}
            </Flex>
          </Tooltip>
          </RLink>
        ))}

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

export const DealerDashboardSideBar = ({ dealership, sidebarOpen, setSidebarState, onClose }) => {
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const {authUser} = useContext(GlobalStore);


  if (isMobile){
    return(
      <Drawer placement={'left'} isOpen={sidebarOpen} onClose={() => setSidebarState(false)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerCloseButton />
          </DrawerHeader>
          
          <DrawerBody>
            <NavLinks sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    )
  }


  return(
    <Box
      w={sidebarOpen ? "280px" : "70px"}
      overflow={'hidden'}
      position={"fixed"}
      left="0"
      h={"100vh"}
      bgColor="#fff"
      zIndex="20"
      borderRightWidth={1}
      p={sidebarOpen ? 6 : 2}
    >
      <NavLinks sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} />
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
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/dashboard"}>Dashboard</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/home"}>Home</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/buy"}>Buy</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/rent"}>Rent</Text>
                    <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/mechanics"}>Find Mechanics</Text>
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
      links: ['Buy a car', 'Sell your car', 'Rent a car', 'Find Mechanic'],
    },
    {
      title: 'Company',
      links: ['About us', 'Careers', 'Press', 'News'],
    },
    {
      title: 'Resources',
      links: ['Blog', 'Newsletter', 'Events', 'Help centre'],
    },
    {
      title: 'Legal',
      links: ['Terms', 'Privacy', 'Cookies', 'Licenses'],
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
              {section.links.map((link) => (
                <Text
                  key={link}
                  fontSize="sm"
                  color="white.800"
                  cursor="pointer"
                  _hover={{ color: 'gray.500' }}
                >
                  {link}
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





