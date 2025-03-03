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
import { ListingItemCard } from "../../../components"
import { objectifyJSON } from "../../../utils"
import { ListingSkeleton } from "../../../components/loaders"
import {
CarBrandFilter,
PriceFilter,
LocationFilter,
TransmissionFilter,
} from "../../../components/filters";


const DatePicker = ({ onChange }) => {
    const input = useRef(null);
    const date = new Date();
    const [value, setValue] = useState('');
    const [open, setOpenState] = useState(false);
    const [label, setLabel] = useState(
        `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    );

    const changeVal = (e) => {
        setValue(e.target.value);
        const dateValue = new Date(e.target.value);
        if (!dateValue) return; // Prevent empty values

        onChange(`${dateValue.toLocaleDateString()} ${dateValue.toLocaleTimeString()}`);
        setLabel(`${dateValue.toLocaleDateString()} ${dateValue.toLocaleTimeString()}`);
    };

    const openPicker = () => {
        if (input.current) {
            window.datepicker = input.current;
            if(!open){
                if (input.current.showPicker) {
                    input.current.showPicker(); // Works in modern browsers
                } else {
                    input.current.click(); // Fallback for older browsers
                }
            }else{
                input.current.blur();
                // if (input.current.hidePicker) {
                //     input.current.hidePicker(); // Works in modern browsers
                // } else {
                //     input.current.click(); // Fallback for older browsers
                // }
            }
        }
    };

    return (
        <Fragment>
            <Button
                rightIcon={<ChevronDownIcon />}
                onClick={openPicker}
                variant="outline"
                className="small"
                position="relative"
            >
                {label}
                <Input
                    type="datetime-local"
                    ref={input}
                    onInput={changeVal}
                    value={value}
                    position="absolute"
                    inset="0"
                    opacity="0"
                    cursor="pointer"
                />
            </Button>
        </Fragment>
    );
}

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
    const {axios, notify, commaInt, authUser, apiUrl} = useContext(GlobalStore);
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
        setTimeout(() => setLoading(false), 2500)
    }

    function changeRental(val){
        console.log("Got Rental:", val);
        setRental({...rental, ...val})
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
                            <Text textAlign={{base: "center", md: "left"}} mb={-2} lineHeight="1" fontWeight="600" className="small">
                                Where
                            </Text>
                            <Input type="text" border="1px solid lavender" placeholder="City, airport, hotel?" className="small" />
                        </VStack>

                        <VStack
                        flex={{ base: "1 1 100%", md: "1 1 auto" }}
                        align="stretch"
                        px={{ base: 0, md: 4 }}
                        borderLeft={{ base: "none", md: "1px solid lavender" }}
                        borderRight={{ base: "none", md: "1px solid lavender" }}
                        >
                            <Text textAlign={{base: "center", md: "left"}} mb={-2} lineHeight="1" fontWeight="600" className="small">
                                From
                            </Text>
                            <DatePicker onChange={(val) => changeRental({ 'from': val })} />
                        </VStack>

                        <VStack flex={{ base: "1 1 100%", md: "1 1 auto" }} align="stretch">
                            <Text textAlign={{base: "center", md: "left"}} mb={-2} lineHeight="1" fontWeight="600" className="small">
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

                <Heading fontWeight="400" size={'md'} color="primary" className=""> {listings?.length} cars are available in your area </Heading>

                <SimpleGrid
                 minChildWidth="300px"
                 maxChildWidth={'350px'}
                 placeItems={isMobile ? 'center' : 'unset'}
                 gap={8}
                 spacing={8}
                 columns={{base: 1, md: 2, lg: 3, xl: 4}}
                >
                    {
                        listings.map((listing, idx) =>
                            <ListingItemCard listing={listing} key={idx} w={{base: '100%', md: 'calc(100% / 2 - 20px)', lg: 'calc(100% / 3 - 20px)'}} maxW={{base: '320px', lg: 'calc(100% / 3 - 20px)'}} />
                        )
                    }
                </SimpleGrid>
            </Container>
        </Fragment>
    )
}


export default RentListing;