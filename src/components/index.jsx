import {
    Box, Flex, IconButton, Heading,
    Badge, Text, Divider,
    HStack,
    PinInput,
    PinInputField,
    Card,
    CardBody,
    Button,
    Input,
    CardHeader,
    Image,
    Icon,
    Fade,
    LinkBox,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    useDisclosure,
    AspectRatio,
    Select,
    Menu,
    MenuItem,
    MenuButton,
    MenuList,
    BreadcrumbItem,
    BreadcrumbLink,
    Breadcrumb,
} from '@chakra-ui/react';
import {Fragment, useContext, useEffect, useState} from 'react';
import { RiGasStationLine, RiHeart2Fill, RiHeart2Line, RiSearch2Line } from 'react-icons/ri'
import { RxCaretLeft, RxCaretRight, RxTimer } from 'react-icons/rx';
import { TbManualGearbox } from 'react-icons/tb';
import { GlobalStore } from '../App';
import { FcCheckmark } from 'react-icons/fc';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';



export const ListingItemCard = ({ listing, ...props }) => {
    const {commaInt} = useContext(GlobalStore);
    const {vehicle, } = listing;
    const [image, setImage] = useState({});
    const [index, setIndex] = useState(0);

    function discount(price, dprice){
        const percent = (dprice / price) * 100
        return percent
    }

    useEffect(() => {
        setImage(vehicle.images[0])
    }, []);

    function nextImage(idx){
        let images = vehicle.images
        idx += index
        if (idx >= images.length){
            idx = 0
        }
        if (idx < 0){
            idx = (images.length - 1)
        }

        setIndex(idx)
        setImage(images[idx]);
    }

    let type = 'buy';

    if (listing.listing_type === 'sale'){
        type = 'buy';
    }
    if (listing.listing_type === 'rental'){
        type = 'rent';
    }

    return(
        <Box position="relative" {...props}>
            <Card shadow={'lg'} p={0} w={'100%'} rounded={'10px'}>
                <CardHeader p={0}>
                    <Box
                        width={'100%'}
                        minH={'170px'}
                        maxH={'270px'}
                        borderRadius={'10px'}
                        position={'relative'}
                    >
                        <NavLink to={`/${type}/${listing.uuid}`}>
                            <LinkBox
                                // to
                                flex={1} w={'100%'} height={'200px'}
                                position={'relative'}
                                sx={{
                                    backgroundImage: `url(${image.url})`,
                                    borderRadius: '10px',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: 'cover',
                                    backgroundPositionX: '70%',
                                    backgroundPositionY: '70%',
                                }}
                            />
                        </NavLink>
                        {
                            vehicle?.images.length > 1 &&
                            <Flex position={'absolute'} bottom={'15px'} gap={2} right={'15px'}>
                                <Icon cursor={'pointer'} rounded={'5px'} bg={'rgba(210, 210, 210, 0.48)'} color={'#fff'} p={'5px'} onClick={() => nextImage(-1)} className='icon' > <RxCaretLeft /> </Icon>
                                <Icon cursor={'pointer'} rounded={'5px'} bg={'rgba(210, 210, 210, 0.48)'} color={'#fff'} p={'5px'} onClick={() => nextImage(1)}  className='icon'> <RxCaretRight /> </Icon>
                            </Flex>
                        }
                        {/* <Image width={'100%'} height={'100%'} src={image.url} rounded={'10px'} /> */}

                    </Box>
                </CardHeader>

                <CardBody p={3}>
                    <Flex justifyContent={'space-between'} alignItems={'center'}>
                        <Heading size="sm" className="subtitle"> {listing?.title} </Heading>
                        <Badge> {listing?.vehicle.condition} </Badge>
                    </Flex>

                    <Flex justifyContent={'flex-start'} alignItems={'center'} gap={2} my={2}>
                        <Text as={Flex} gap={1} alignItems={'center'} className="smalltext"> <RxTimer /> {commaInt(listing.vehicle.mileage) || 0} miles</Text>
                        <Text as={Flex} gap={1} alignItems={'center'} className="smalltext"> <TbManualGearbox /> {listing.vehicle.transmission}</Text>
                        <Text as={Flex} gap={1} alignItems={'center'} className="smalltext"> <RiGasStationLine /> {listing.vehicle.fuel_system}</Text>
                    </Flex>

                    <Heading size="sm" className="subtitle"> ₦{commaInt(listing?.price)} </Heading>

                    <Divider my={3} />

                    <Flex justifyContent={'space-between'} alignItems={'center'} my={2}>
                        <Text className="small-text"> {listing?.vehicle.dealer.location} </Text>
                        {/*
                            listing.vehicle.custom_duty &&
                            <Badge fontWeight={'bold'}> <span> Custom Duty </span> <Icon> <BxCheck /> </Icon> </Badge>
                        */}
                        {/* } */}
                    </Flex>
                </CardBody>
            </Card>
        </Box>
    )
}


export const SearchBar = ({ onSearch, ...props }) => {
    const {notify, redirect} = useContext(GlobalStore);
    const [menuOpen, setMenuState] = useState(false);
    const [target, setTarget] = useState('cars');
    const [query, setQuery] = useState('');
    const nav = useNavigate();

    function handleSearch(e){
        e.preventDefault();
        nav(`/search/${target}/?find=${query}`);
    }

    useEffect(() => {
        return () => {
            setQuery('');
        }
    }, [])

    return (
        <form method='post' onSubmit={handleSearch}>
        <Flex rounded={'30px'} alignItems={'center'} zIndex={'100'} gap={2} justifyContent={'space-between'} pl={4} pr={0} py={0} border={'1px solid lightgrey'} {...props}>
            <Icon className='icon' fontSize={'20px'}><RiSearch2Line /> </Icon>
            <Input
             type='search'
             value={query} pl={0}
             rounded={'30px'} flex={1}
             className='no-style ellipsis small'
             placeholder='Search for cars, rentals or mechanics...'
             onInput={(e) => setQuery(e.target.value)}
            />
            <Menu>
                <Select  maxW={'min-content'} onClick={() => setMenuState(!menuOpen)} type='button' rounded={'30px'} as={MenuButton} textTransform={'capitalize'}>
                    <option value={target}>{target}</option>
                </Select>

                <MenuList minW={'max-content'} py={0}>
                    <MenuItem as={motion.button} type='button' onClick={() => setTarget('cars')} > Cars </MenuItem>
                    <MenuItem as={motion.button} type='button' onClick={() => setTarget('mechanics')}  maxW={'max-content'}> Mechanics </MenuItem>
                </MenuList>
            </Menu>
        </Flex>
        </form>
    )
}


export const CenteredLayout = ({ children, wrapperProps, ...props }) => {
    return(
        <Box as={Flex} w={'100%'} justifyContent={'center'} align={'center'} flex={1} minH={'40vh'} {...wrapperProps}>
            <Box flex={1} {...props}>{children}</Box>
        </Box>
    )
}


export const OTPField = ({ onChange, value}) => {

    return(
        <HStack my={3} alignItems={'center'} justifyContent={'center'}>
            <PinInput otp size={'lg'} value={value} onChange={onChange}>
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
            </PinInput>
        </HStack>
    )
}


export const DNDUploadField = ({ accept, multiple=true, onUpload, ...props}) => {
    const [uploads, setUploads] = useState([]);

    function handleInput(e){
        const files = e.target.files;

        for (let _file of files){
            const file = new File(_file)
            const data = {
                'name': file.name,
                'size': file.size,
            }
            setUploads([
                ...uploads,
                data
            ])
            onUpload({...data});
        }

    }

    return(
        <Box border={'2px dashed grey'} py={5} px={3}>
            <Input type='file' hidden={true} multiple={multiple} onInput={handleInput} />
        </Box>
    )
}



export function ImageCarousel({ images, ...props }) {
  const [currentImage, setCurrentImage] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <Box >
        <Box position="relative" mb={4}>
            <Box
                sx={{
                    backgroundImage: `url(${images[currentImage].url})`,
                    borderRadius: '10px',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPositionX: '50%',
                    backgroundPositionY: '70%',
                }}
                w={'100%'}
                minH={'350px'}
                cursor="zoom-in"
                onClick={onOpen}
                // {...props}
            ></Box>

            <IconButton
            fontSize={"35px"}
            rounded={"full"}
            style={{background: 'rgba(0, 0, 0, 0.43)', color: '#fff'}}
            aria-label="Previous image"
            icon={<ChevronLeftIcon />}
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={previousImage}
            bg="white"
            _hover={{ bg: 'gray.100' }}
            />
        
            <IconButton
            fontSize={"35px"}
            rounded={"full"}
            style={{background: 'rgba(0, 0, 0, 0.43)', color: '#fff'}}
            aria-label="Next image"
            icon={<ChevronRightIcon />}
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={nextImage}
            bg="white"
            _hover={{ bg: 'gray.100' }}
            />
        </Box>

        <HStack spacing={2} overflowX="auto" pb={2}>
        {images.map((img, index) => (
            <AspectRatio
            key={index}
            ratio={4/3}
            w="24"
            minW="24"
            cursor="pointer"
            onClick={() => setCurrentImage(index)}
            >
            <Image
                src={img.url}
                alt={`Thumbnail ${index + 1}`}
                objectFit="cover"
                borderRadius="md"
                borderWidth={2}
                borderColor={currentImage === index ? 'blue.500' : 'transparent'}
            />
            </AspectRatio>
        ))}
        </HStack>

        <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
            <ModalBody p={0}>
            <AspectRatio ratio={4/3}>
                <Box position="relative">
                <Image
                    src={images[currentImage].url}
                    alt={`Car image ${currentImage + 1}`}
                    objectFit="cover"
                />
                <IconButton
                    aria-label="Previous image"
                    icon={<ChevronLeftIcon />}
                    position="absolute"
                    left={2}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={previousImage}
                />
                <IconButton
                    aria-label="Next image"
                    icon={<ChevronRightIcon />}
                    position="absolute"
                    right={2}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={nextImage}
                />
                </Box>
            </AspectRatio>
            </ModalBody>
        </ModalContent>
        </Modal>
    </Box>
  )
}


export const LocationBreadcrumb = ({ label }) => {
  // Get the current URL from window.location.pathname (remove protocol and domain)
  const path = window.location.pathname;
  
  // Split the path into individual segments (remove any empty strings from the array)
  const pathSegments = path.split('/').filter(segment => segment);

  // Initialize the breadcrumb items
  const breadcrumbItems = pathSegments.slice(0, -1).map((segment, index) => {
    // Construct the path up to the current segment (excluding the last one)
    const routeTo = '/' + pathSegments.slice(0, index + 1).join('/');

    return (
      <BreadcrumbItem key={index}>
        <BreadcrumbLink as={Link} to={routeTo} textTransform={'capitalize'}>
          {segment.replace(/-/g, ' ')} {/* Replace hyphens with spaces */}
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
  });

  // Add the label as the final breadcrumb, without a link
  breadcrumbItems.push(
    <BreadcrumbItem key="current" isCurrentPage>
      <BreadcrumbLink>{label}</BreadcrumbLink>
    </BreadcrumbItem>
  );

  return (
    <Breadcrumb separator=">">
      <BreadcrumbItem>
        <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      {breadcrumbItems}
    </Breadcrumb>
  );
};



