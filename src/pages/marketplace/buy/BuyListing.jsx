import { ChevronDownIcon } from "@chakra-ui/icons"
import {
    Badge, Box, Button, Card, CardBody, CardHeader,
    Container, Divider, Flex, Heading, HStack, Image,
    Menu, MenuButton, MenuItem, MenuList, Switch, Text,
    ButtonGroup, Checkbox, Input, SimpleGrid,
    useMediaQuery, Tag, TagLabel, TagCloseButton,


} from "@chakra-ui/react"
import { Fragment, useContext, useEffect, useState } from "react"
import { GlobalStore } from "../../../App"
import { RiClockwiseLine, RiGasStationLine, RiFilterLine } from "react-icons/ri"
import { RxTimer } from "react-icons/rx"
import { TbManualGearbox } from "react-icons/tb"
import { ListingItemCard } from "../../../components"
import { Paginator } from "../../../components/nav"
import { objectifyJSON } from "../../../utils"
import { ListingSkeleton } from "../../../components/loaders"
import {
CarBrandFilter,
PriceFilter,
LocationFilter,
TransmissionFilter,
} from "../../../components/filters";

const BuyListing = ({ }) => {
    const [listings, setListings] = useState([]);
    const [matches, setMatches] = useState([]);
    const [appliedFilters, setAppliedFilters] = useState({});
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
        getData(`/listings/buy/?offset${pageNum*25}`)
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

    async function getData(url=`/listings/buy/`){
        const res = await axios.get(url,);
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
    
    /**
     * @param filter: filter object
     * e.g { filter: 'brands', value : 'bmw', 'audi'}
     * e.g { filter: 'price', value: 1200000-5000000}
     * 
     * */
    function applyFilter({ filter, value }) {
        const params = new URLSearchParams();

        // Create a new copy of appliedFilters to avoid mutations
        let updatedFilters = { ...appliedFilters };

        if (Boolean(value)) {
            // Add/update the filter value
            updatedFilters[filter] = value;
        } else {
            // Remove the filter if the value is falsy
            delete updatedFilters[filter];
        }

        // Convert appliedFilters to URL parameters
        Object.entries(updatedFilters).forEach(([key, val]) => {
            params.set(key, val);
        });

        setAppliedFilters(updatedFilters);
        console.log("Applied filters", appliedFilters)

        // Send updated filter parameters to the server
        getData(`/listings/buy/?${params.toString()}`);
    }

    function removeFilter(filter) {
        applyFilter({ filter, value: null }); // Pass a falsy value to trigger removal logic
    }



    function init(){
        getData();
        setTimeout(() => setLoadingState(false), 2500);
    }

    useEffect(() => {
        init()
    }, [])

    useEffect(() => {

    }, [listings, carType,])

    const filters = [
        <CarBrandFilter onChange={applyFilter} />,
        <PriceFilter onChange={applyFilter} />,
        <LocationFilter onChange={applyFilter} />,
        <TransmissionFilter onChange={applyFilter} />,
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
                    <Button
                     minW={'max-content'}
                     size={'md'} borderRadius={'10px'}
                     as={Box}
                     bgColor="gray.100"
                     leftIcon={<RiFilterLine />}
                    > Filters </Button>
                    {
                        filters.map((filter, idx) => (filter))
                    }
                </Flex>
                
                <FilterList appliedFilters={appliedFilters} onRemove={removeFilter} />

                <SimpleGrid
                 placeItems={isMobile ? 'center' : 'unset'}
                 gap={8}
                 spacing={8}
                 columns={{base: 1, md: 2, lg: 3, xl: 4}}
                >
                    {
                        carType === 'new' ? (
                            listings?.filter((listing) => ['new', 'New'].includes(listing?.vehicle?.condition)).map((listing, idx) =>
                                <ListingItemCard
                                 listing={listing}
                                 key={idx}
                                 w="100%"
                                 maxW={'350px'}
                                />
                            )
                        ):(
                            listings?.filter((listing) => !['new', 'New'].includes(listing?.vehicle?.condition)).map((listing, idx) =>
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


const FilterList = ({ appliedFilters, onRemove }) => {
    useEffect(() => {

    }, [appliedFilters]);

    return(
        <Flex my={2} py={2} flexWrap={'nowrap'} gap={4} overflowX={'auto'} className="hidden-scroll">
            {
                Object.keys(appliedFilters)?.map((key, idx) => 
                    <Tag size="lg" key={idx} variant="outline" colorScheme="blue" borderColor="primary">
                        <TagLabel textTransform="capitalize">{key}: {appliedFilters[key]}</TagLabel>
                        <TagCloseButton onClick={() => onRemove(key)} />
                    </Tag>
                )
            }
        </Flex>
    )

}

// Image Carousel Component
function BannerCarousel({ images }) {
  const [currentImage, setCurrentImage] = useState(0)

  return (
    <Box
        w="100%"
        position="relative"
        flex={{ base: 'unset', md: 3.8 / 4, lg: 3.5 / 4 }}
        backgroundImage={`url('${images[currentImage].url}')`}
        backgroundRepeat="no-repeat"
        backgroundSize="cover"
        backgroundPosition="center top"
        h="210px"
        borderRadius="20px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}  // Ensures some padding on smaller screens
    >
        {images[currentImage]?.caption && (
            <Box
            position="absolute"
            // bottom="18%"  // Adjusted distance from bottom
            left="50%"
            w={'100%'}
            transform="translateX(-50%)"
            maxW="80%"  // Ensures the caption doesn't stretch too wide
            maxH="50%"  // Prevents overflow for long captions
            overflowY="auto"  // Allows scrolling if needed
            textAlign="center"
            p={2}
            >
            <Heading
                color="white"
                size="lg"
                textShadow="-2px 2px 10px black"
            >
                {images[currentImage].caption}
            </Heading>
            </Box>
        )}
        <HStack position="absolute" bottom={4} left="50%" transform="translateX(-50%)" spacing={2}>
            {images.map((_, index) => (
            <Box
                key={index}
                w={index === currentImage ? 8 : 2}
                h={2}
                borderRadius="full"
                bg={index === currentImage ? 'primary' : 'whiteAlpha.600'}
                cursor="pointer"
                onClick={() => setCurrentImage(index)}
            />
            ))}
        </HStack>
    </Box>
  )
}




export default BuyListing