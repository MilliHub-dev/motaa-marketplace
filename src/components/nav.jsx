import {useState, useContext, useEffect, Fragment} from 'react';
import {
    Box, Stack, Flex,
    Image, Button, Text,
    useMediaQuery, Icon,
    DrawerContent,
    DrawerHeader,
    DrawerCloseButton,
    DrawerBody,
    Drawer,
    Link,
    HStack,
    Circle,
    Progress,
    DrawerFooter,
    Container,
    Input,
} from '@chakra-ui/react';
import {motion} from 'framer-motion';
import {GlobalStore} from '../App';
import {FcMenu} from 'react-icons/fc';
import {CheckCircleIcon} from '@chakra-ui/icons'
import { SearchBar } from '.';
import { RiAccountCircleLine, RiBellLine, RiFacebookFill, RiHeadphoneLine, RiInstagramFill, RiLinkedinFill, RiLogoutBoxRLine, RiMenuLine, RiMessage2Fill, RiMessage2Line, RiNotification2Fill, RiNotification2Line, RiNotification3Line, RiNotification4Line, RiNotificationLine, RiShoppingCart2Line, RiTwitterFill } from 'react-icons/ri';
import { TbBell, TbSearch } from 'react-icons/tb';
import { RxEnvelopeClosed } from 'react-icons/rx';
import { NavLink, Link as RLink } from 'react-router-dom';
// import { Link } from 'react-router-dom';


export const Navbar = ({ props }) => {
    const [navIsOpen, setNavState] = useState(false);
    const {authUser, onLogout} = useContext(GlobalStore);
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    const isLoggedIn = !!authUser;

    window.onscroll = (ev) => {
        if(window.scrollY > 1000){
            document.getElementById('navbar').classList.add('scrolled');
        }else{
            document.getElementById('navbar').classList.remove('scrolled');
        }
    }

    function hideNav(){
        setNavState(false)
    }

    function showNav(){
        setNavState(true)
    }

    return(
      <Box position={'sticky'} top={'0px'} bg={'white'} as={motion.div} flex={1} w={'100%'} animate={{ opacity: 1, }} initial={{ opacity: 0.6, }} transition={'.5s linear'} className='navbar' id='navbar'>
        <Flex className='navbar-inner'
          alignItems={'center'}
          px={4}
          py={4}
          justifyContent={'space-between'}
          flex={1} w={'100%'}
        >
        <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={isMobile? '60px' : '80px'} height={isMobile ? '40px' : '50px'} className='navbar-brand'>
          <RLink to={'/'}><Image loading='eager' src='/assets/images/motaa-logo-3.png' width={'100%'} className='navbar-brand' /></RLink>
        </Box>

        { authUser ? (
          <Fragment>
            <Flex flex={{base: 8/9, lg: 7/8}} flexWrap={'wrap'} alignItems={'center'}>
              <Flex display={{base: 'none', lg: 'flex'}}  flex={1} flexWrap={'wrap'} className='navbar-nav' gap={4} alignItems={'center'}>
                <Text as={RLink} to={"/"}> Home </Text>
                <Text as={RLink} to={"/buy"}> Buy </Text>
                <Text as={RLink} to={"/sell"}> Sell </Text>
                <Text as={RLink} to={"/rent"}> Rent </Text>
                <Text as={RLink} to={"/mechanics"}> Find Mechanic </Text>
              </Flex>
              {!isMobile && <SearchBar flex={1} />}
            </Flex>

            <Flex flexWrap={'wrap'} justifyContent={'flex-start'} className='' gap={isMobile ? 3 : 5} alignItems={'center'}>
              {isMobile && 
                <Link><Icon viewBox='45' className='icon'><TbSearch /></Icon></Link>
              }
              <Link><Icon viewBox='45' className='icon'><TbBell /></Icon></Link>
              <Link><Icon viewBox='45' className='icon'><RiShoppingCart2Line /></Icon></Link>
              <RLink to={'/chat'}><Icon viewBox='45' className='icon'><RiMessage2Line /></Icon></RLink>
              <Link><Icon viewBox='45' className='icon'><RiAccountCircleLine /></Icon></Link>
            </Flex>
            
            
            <Button onClick={navIsOpen ? hideNav : showNav} colorScheme='transparent' px={2}>
              <Icon sx={{ fill: 'black', '& *': {fill: 'black'}}} className='icon'><FcMenu /></Icon>
            </Button>
          </Fragment>
        ):(
          <Flex flex={3/4} flexWrap={'wrap'} className='navbar-nav' gap={8} alignItems={'center'}>
              <Text as={NavLink} to={"/home/#welcome"}> Home </Text>
              <Text as={NavLink} to={"/home/#what-we-offer"}> About </Text>
              <Text as={NavLink} to={"/home/#find-mechanics"}> Features </Text>
              <Text as={NavLink} to={"/home/#partner-with-us"}> For Businesses </Text>
              {
                  isLoggedIn ? (
                    <Fragment>
                      <Button onClick={onLogout}> Sign out </Button>
                    </Fragment>
                  ) : (
                      <Fragment>
                        <RLink to={"/login"}><Button> Sign In </Button></RLink>
                        <RLink to={"/signup/?user_type=dealer"}><Button> Register </Button></RLink>
                      </Fragment>
                  )
              }
          </Flex>
        )}

        <Sidebar onClose={hideNav} show={navIsOpen} />
        </Flex>
      </Box>
    )
}


export const Sidebar = ({ show, onClose, }) => {
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    const {authUser, logout} = useContext(GlobalStore);
    const isLoggedIn = !!authUser;
    return (
        <Fragment>
          <Drawer className="sidebar" isOpen={show} onClose={onClose} placement='right'>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerCloseButton />
                </DrawerHeader>

                <DrawerBody>
                  {
                    isLoggedIn ? (
                      isMobile ?
                      <Stack>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/"} >Home</Text>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/buy"}>Buy</Text>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/sell"}>Sell</Text>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/rent"}>Rent</Text>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/mechanics"}>Find Mechanics</Text>
                      </Stack>
                      :
                      <Stack>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#welcome"} >Home</Text>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#what-we-offer"} >About</Text>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#find-mechanics"} >Features</Text>
                        <Text onClick={onClose} py={1} px={4} my={2} as={NavLink} to={"/#partner-with-us"} >For Businesses</Text>
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
        </Fragment>
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



export const Footer =({ props })=>{
    return(
        
        <footer>
          <Box bg={'primary'}>

            {/* Newsletter */}
            <Container py={'50px'} textAlign={'center'}>
              <Text className='subtitle' mb={4} color={'#fff'}> Subscribe to our newsletter! </Text>
              <Text color={'#fff'} className='smalltext' mb={4}> Never miss a beat. Subscribe now and keep up to date
                  with the latest news, deals and discounts on <b>Motaa</b>.
              </Text>

              <Flex gap={3} flex={1} justifyContent={'center'}>
                <Flex px={2} bg={'#fff'} alignItems={'center'} borderRadius={'5px'} justifyContent={'flex-start'} columnGap={4}>
                  <Icon><RxEnvelopeClosed className='icon' /></Icon>
                  <Input px={0} flex={1} type='email' border={'none'} sx={{ border: 'none', outline: 'none !important', boxShadow: 'none !important'}} placeholder='Email address' />
                </Flex>

                <Button bg={'tertiary'} className="smalltext" color={'primary'} colorScheme='yellow'> Subscribe </Button>
              </Flex>
            </Container>
            <hr />
            
            <Box px={{base: 4, md: '4rem'}} py={4}>
              <Flex flexWrap={'wrap'} py={4} alignItems={'center'} gap={4} justifyContent={'space-between'}>
                <Box as={Flex} alignItems={'center'} justifyContent={'center'} width={'80px'} height={'50px'} className='navbar-brand'>
                  <Image src='/assets/images/motaa-logo-2.png' width={'100%'} className='navbar-brand' />
                </Box>

                <Flex flexWrap={'wrap'} justifyContent={'space-between'} alignItems={'center'} gap={4}>
                  <Text color={'white'}> Contact Us <Text as={motion.a} color='tertiary' href='mailto:hello@motaa.net'>hello@motaa.net</Text></Text>
                  <Flex alignItems={'center'} justifyContent={'space-between'} gap={4}>
                    <Text color={'white'}> Follow Us </Text>
                    <Flex gap={2}>
                      <Icon alignItems={'center'} justifyContent={'center'} display={'flex'} px={1.5} py={1.35} bg={'tertiary'} borderRadius={'200px'} className='icon'><RiFacebookFill /></Icon>
                      <Icon alignItems={'center'} justifyContent={'center'} display={'flex'} px={1.5} py={1.35} bg={'tertiary'} borderRadius={'200px'} className='icon'><RiTwitterFill /></Icon>
                      <Icon alignItems={'center'} justifyContent={'center'} display={'flex'} px={1.5} py={1.35} bg={'tertiary'} borderRadius={'200px'} className='icon'><RiInstagramFill /></Icon>
                      <Icon alignItems={'center'} justifyContent={'center'} display={'flex'} px={1.5} py={1.35} bg={'tertiary'} borderRadius={'200px'} className='icon'><RiLinkedinFill /></Icon>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>


              <Flex flexWrap={'wrap'} py={4} gap={4} alignItems={'center'} justifyContent={'space-between'}>
                <Flex alignItems={'center'} justifyContent={'space-between'} gap={4}>
                  <Text as={motion.a} href="#" color={'white'}> Privacy Policy </Text>
                  <Text as={motion.a} href="#" color={'white'}> Terms of Use </Text>
                </Flex>

                <Text color={'white'}> &copy; {`${new Date().getFullYear()}`} <b>Motaa Limited.</b> All Rights Reserved.</Text>
              </Flex>
            </Box>

          </Box>
        </footer>
    )
}




