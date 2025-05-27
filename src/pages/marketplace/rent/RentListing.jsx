import { ChevronDownIcon } from "@chakra-ui/icons"
import { 
    Badge, Box, Button, Card, CardBody,
    CardHeader, Container, Divider, Flex, Heading,
    HStack, Image, Menu, MenuButton, MenuItem,
    MenuList, Switch, Text, VStack, SimpleGrid,
    Input, useMediaQuery,
} from "@chakra-ui/react"
import { Fragment, useContext, useEffect, useState, useRef } from "react"
import { GlobalStore } from "../../../App"
import { RiClockwiseLine, RiGasStationLine, RiFilterLine } from "react-icons/ri"
import { RxTimer } from "react-icons/rx"
import { TbManualGearbox } from "react-icons/tb"
import { ListingItemCard, DatePicker } from "../../../components"
import { objectifyJSON } from "../../../utils"
import { ListingSkeleton } from "../../../components/loaders"
import { CustomPlacesAutocomplete } from "../../../components/maps"
import {Autocomplete} from "@react-google-maps/api";
import {
    CarBrandFilter,
    PriceFilter,
    LocationFilter,
    TransmissionFilter,
} from "../../../components/filters";


export const RentListing = ({ props }) => {
    const [listings, setListings] = useState([]);
    const [rental, setRental] = useState({
        'where': '',
        'from': '',
        'until': ''
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    const {axios, notify, commaInt, authUser, apiUrl, otherContext, setOtherContext} = useContext(GlobalStore);
    const [autocomplete, setAutocomplete] = useState(null);
    const [location, setLocation] = useState({lat: 10, lng: 8, name: 'Current Location'});
    const onLoad = (auto) => setAutocomplete(auto);

    const onPlaceChanged = () => {
        if (autocomplete) {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setLocation({ lat, lng, name: place.name });
            setRental({ ...rental, where: place.formatted_address || place.name});
          }
        }
    };

    /**
     * @param filter: filter object
     * e.g { brand: 'bmw'}
     * e.g { min_price: 120000, max_price: 5000000}
     * 
     * */
    function applyFilter({filter, value}){
        let url = window.location.search;
        const params = new URLSearchParams(url);
        const _filters = appliedFilters;
        params.delete(filter);

        if (!_filters.includes(filter) && Boolean(value)){
            _filters.push(filter);
            params.append(filter, value);
        }else if (_filters.includes(filter) && !Boolean(value)){
            _filters.splice(_filters.indexOf(filter), 1);
        }
        setAppliedFilters([ ..._filters ]);

        // convert filterList to url param
        getData(`/listings/rentals/?${params.toLocaleString()}`);
    }

    async function getData(url=`/listings/rentals/`){
        try {
            const res = await axios.get(url);
            const data = objectifyJSON(res.data);
    
            setData(data?.data);
            setListings(data?.data?.results)
            
            if (!res.status === 200){
                notify({
                    title: 'Error',
                    body: data?.message || "Something went wrong"
                })
            }
        }catch(error){
            console.log("Error fetching rentals:", error)
        }
    }

    function init(){
        getData();
        setTimeout(() => setLoading(false), 2500);
    }

    function changeRental(val){
        const newVal = {...rental, ...val}
        console.log("Got Rental:", newVal);
        setRental(newVal);
        setOtherContext({ ...otherContext, rental})
    }

    useEffect(() => {
        init();
        console.log("Init Rentals Page")
    }, [])

    if (loading){
        return <ListingSkeleton />
    }

    const filters = [
        <CarBrandFilter onChange={applyFilter} />,
        <PriceFilter onChange={applyFilter} />,
        <LocationFilter onChange={applyFilter} />,
        <TransmissionFilter onChange={applyFilter} />,
    ]

    return(
        <Fragment>
            <Container maxWidth={'container.xl'} py={4}>

                <Box
                    w="100%"
                    mx="auto"
                    maxWidth="900px"
                    border="2px solid lavender"
                    py={3}
                    px={3}
                    borderRadius="10px"
                >
                    <Flex
                        flexWrap="wrap"
                        justifyContent={{ base: "center", md: "space-between" }}
                        alignItems={{base: "center", md: 'end'}}
                        gap={3}
                    >
                        <VStack flex={{ base: "1 1 100%", md: "1 1 auto" }} align="stretch">
                            <Text textAlign={{base: "center", md: "left"}} mb={0.25} lineHeight="1" fontWeight="600" className="small">
                                Where
                            </Text>
                            <CustomPlacesAutocomplete onPlaceChange={console.log} />
                            {/*<Autocomplete
                              onLoad={onLoad}
                              style={{width: "100%"}}
                              onPlaceChanged={onPlaceChanged}
                              className="w-full"
                            >
                                <Input type="text" border="1px solid lavender" placeholder="City, airport, hotel?" className="small" />
                            </Autocomplete>*/}
                        </VStack>

                        <VStack
                        flex={{ base: "1 1 100%", md: "1 1 auto" }}
                        align="stretch"
                        px={{ base: 0, md: 4 }}
                        borderLeft={{ base: "none", md: "1px solid lavender" }}
                        borderRight={{ base: "none", md: "1px solid lavender" }}
                        >
                            <Text textAlign={{base: "center", md: "left"}} mb={0.25} lineHeight="1" fontWeight="600" className="small">
                                From
                            </Text>
                            <DatePicker onChange={(val) => changeRental({ 'from': val })} />
                        </VStack>

                        <VStack flex={{ base: "1 1 100%", md: "1 1 auto" }} align="stretch">
                            <Text textAlign={{base: "center", md: "left"}} mb={0.25} lineHeight="1" fontWeight="600" className="small">
                                Until
                            </Text>
                            <DatePicker onChange={(val) => changeRental({ 'until': val })} />
                        </VStack>

                        <Button
                            colorScheme="blue"
                            bg="primary"
                            w={{ base: "100%", md: "auto" }}
                        >
                            Search
                        </Button>
                    </Flex>
                </Box>


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

                <Heading fontWeight="400" mb={3} size={'md'} color="primary" className=""> {listings?.length} cars are available in your area </Heading>

                <SimpleGrid
                 placeItems={isMobile ? 'center' : 'unset'}
                 gap={8}
                 spacing={8}
                 columns={{base: 1, md: 2, lg: 3, xl: 4}}
                >
                    {
                        listings.map((listing, idx) =>
                            <ListingItemCard
                             listing={listing}
                             key={idx}
                             w="100%"
                             maxW={'350px'}
                            />
                        )
                    }
                </SimpleGrid>
            </Container>
        </Fragment>
    )
}


export default RentListing;