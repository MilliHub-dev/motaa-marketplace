import { ChevronDownIcon } from "@chakra-ui/icons"
import {
    Badge, Box, Button, Card, CardBody, CardHeader,
    Container, Divider, Flex, Heading, HStack, Image,
    Menu, MenuButton, MenuItem, MenuList, Switch, Text,
    ButtonGroup, Checkbox, Input, SimpleGrid,
    useMediaQuery,

} from "@chakra-ui/react"
import { Fragment, useContext, useEffect, useState } from "react"
import { GlobalStore } from "../../../App"
import { RiClockwiseLine, RiGasStationLine, } from "react-icons/ri"
import { RxTimer } from "react-icons/rx"
import { TbManualGearbox } from "react-icons/tb"
import { ListingItemCard } from "../../../components"
import { Paginator } from "../../../components/nav"
import { objectifyJSON } from "../../../utils"
import { ListingSkeleton } from "../../../components/loaders"

const BuyListing = ({ }) => {
    const [listings, setListings] = useState([]);
    const [matches, setMatches] = useState([]);
    const [data, setData] = useState(null);
    const [carType, setCarType] = useState('new');
    const {axios, notify, commaInt} = useContext(GlobalStore);
    const [loading, setLoadingState] = useState(true);
    const [isMobile] = useMediaQuery('(max-width: 768px)')
    const banners = [
        {
            url: '/assets/images/workshop.png',
            caption: 'Get Priority Access'
        },
        {
            url: '/assets/images/mechanic-image.png',
            caption: 'Get Vetted Professionals'
        },
    ]

    function gotoPage(pageNum){
        console.log("Page:", pageNum)
        // const res = await axios.get(`/listings/buy/`,);
        // let data = objectifyJSON(res.data);
    }

    async function gotoNextPage(){
        await setLoadingState(true)
        const next = data?.pagination?.next || null;
        if (next){
            const res = await axios.get(`${next}`,);
            const _data = objectifyJSON(res.data);


            if (res.status === 200){
                setData(_data?.data);
                setListings(_data?.data?.results);
                setTimeout(() => setLoadingState(false), 500)
            }
        }
    }

    async function gotoPrevPage(){
        await setLoadingState(true)
        const prev = data?.pagination?.previous || null;
        if (prev){
            const res = await axios.get(`${prev}`,);
            const _data = objectifyJSON(res.data);


            if (res.status === 200){
                setData(_data?.data);
                setListings(_data?.data?.results);
                setTimeout(() => setLoadingState(false), 500)
            }
        }
    }

    async function getData(){
        const res = await axios.get(`/listings/buy/`,);
        let _data = objectifyJSON(res.data);

        setData(_data.data);
        setListings(_data?.data?.results);
        
        if (!res.status === 200){
            notify({
                title: 'Error',
                body: data?.message || "Something went wrong"
            })
        }

    }

    function init(){
        getData();
        setTimeout(() => setLoadingState(false), 2500);
    }

    useEffect(() => {
        init()
    }, [])

    useEffect(() => {
        // if (carType === 'new'){
        //     const _matches = listings?.filter((elem) => elem.vehicle.condition === 'new' )
        //     setMatches(_matches)
        // }else{
        //     const _matches = listings?.filter((elem) => elem.vehicle.condition !== 'new' )
        //     setMatches(_matches)
        // }

    }, [listings, carType])

    const filters = [
        {
            name: 'Make and Model',
            component: ({ onChange, onClose }) => (
                <Box>
                    <MenuItem as={Text}> Select Make and Model </MenuItem>

                    {
                        ['BMW', 'Audi', 'Toyota', 'Benz']
                        .map((make) => <MenuItem key={make} as={Checkbox}> {make} </MenuItem>
                    )}
                </Box>
            )
        },
        {
            name: 'Price',
            component: ({ onChange, onClose }) => (
                <Box>
                    <MenuItem as={Text}> Set min and max amount </MenuItem>
                    <Box px={2} py={2} display={'block'}>
                        <Text> Min Amount </Text>
                        <Input type="number" min="1" step="0.01" />
                    </Box>
                    <Box px={2} py={2} display={'block'}>
                        <Text> Max Amount </Text>
                        <Input type="number" min="1" step="0.01" />
                    </Box>
                    <Box px={2} display={'block'}>
                        <Button onClick={onClose} colorScheme="blue" bgColor="primary" w={'100%'}> Confirm </Button>
                    </Box>
                </Box>
            )
        },
    ]

    if (loading){
        return <ListingSkeleton />
    }

    return(
        <Fragment>
            <Container maxWidth={'container.xl'} py={4}>
                <Flex align="center" mb={5} flexWrap="wrap-reverse" gap={{base: 2, md:8}} justify="space-between">
                    <Box>
                        <Heading size={'lg'} className="subtitle"> Cars for Sale </Heading>
                        <ButtonGroup size='md' isAttached variant='outline' mt={3}>
                            <Button onClick={() => setCarType('new')} 
                             bgColor={carType === 'new' ? 'primary' : 'transparent'}
                             color={carType === 'new' ? 'white' : 'primary'}
                             borderTopWidth={2} borderBottomWidth={2}
                             borderLeftWidth={2}
                             colorScheme={'blue'}
                             borderColor="cornflowerblue"
                             borderRadius="30px" px={'35px'}
                            >New</Button>

                            <Button onClick={() => setCarType('used')}
                             bgColor={carType === 'used' ? 'primary' : 'transparent'}
                             color={carType === 'used' ? 'white' : 'primary'}
                             borderTopWidth={2} borderBottomWidth={2}
                             borderRightWidth={2}
                             colorScheme={'blue'}
                             borderColor="cornflowerblue"
                             borderRadius="30px" px={'35px'}
                            >Used</Button>
                        </ButtonGroup>
                    </Box>

                    <BannerCarousel images={banners} />
                </Flex>

                <Flex my={2} py={2} flexWrap={'nowrap'} gap={4} overflowX={'auto'} className="hidden-scroll">
                    {
                        filters.map(({name, component}, idx) =>
                            <Menu closeOnSelect={false}>
                                {({ isOpen, onClose, }) => (
                                    <Fragment>
                                        <MenuButton minW={'max-content'} size={'md'} borderRadius={'10px'} isActive={isOpen} as={Button} rightIcon={<ChevronDownIcon />}> {name} </MenuButton>
                                        <MenuList>
                                            {
                                                component({
                                                     onChange: (value) => console.log(value),
                                                     onClose: onClose
                                                })
                                            }
                                        </MenuList>
                                    </Fragment>
                                )}
                            </Menu>
                        )
                    }
                </Flex>

                <SimpleGrid
                 minChildWidth="300px"
                 maxChildWidth={'350px'}
                 placeItems={isMobile ? 'center' : 'unset'}
                 gap={8}
                 spacing={8}
                 columns={{base: 1, md: 2, lg: 3, xl: 4}}
                >
                    {
                        carType === 'new' ? (
                            listings.filter((listing) => listing?.vehicle?.condition === 'new').map((listing, idx) =>
                                <ListingItemCard
                                 listing={listing}
                                 key={idx}
                                 w="100%"
                                 maxW={'350px'}
                                />
                            )
                        ):(
                            listings.filter((listing) => listing?.vehicle?.condition !== 'new').map((listing, idx) =>
                                <ListingItemCard
                                 listing={listing}
                                 key={idx}
                                 w="100%"
                                 maxW={'350px'}
                                />
                            )
                        )
                    }
                </SimpleGrid>

                <Paginator pagination={data?.pagination} onNext={gotoNextPage} onPrevious={gotoPrevPage} onClick={console.log} />
            </Container>
        </Fragment>
    )
}


// Image Carousel Component
function BannerCarousel({ images }) {
  const [currentImage, setCurrentImage] = useState(0)

  return (
    <Box w="100%" position="relative" flex={{base: 'unset', md: 3.8/4, lg: 3.5/4}}>
      <Image
        src={images[currentImage].url}
        alt="Vehicle"
        w="full"
        loading="eager"
        h="180px"
        objectFit="cover"
        borderRadius="20px"
      />
        {images[currentImage]?.caption &&
            <Heading
             color="#fff"
             position="absolute"
             left={{base: "15%", md: '20%'}}
             top={{base: "15%", md: '60px'}}
             textShadow="-5px 5px 20px black"
            > {images[currentImage].caption} </Heading>
        }
      <HStack
        position="absolute"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        spacing={2}
      >
        {images.map((_, index) => (
          <Box
            key={index}
            w={index === currentImage ? 8 : 2}
            h={2}
            borderRadius="full"
            bg={index === currentImage ? "primary" : "whiteAlpha.600"}
            cursor="pointer"
            onClick={() => setCurrentImage(index)}
          />
        ))}
      </HStack>
    </Box>
  )
}



export default BuyListing