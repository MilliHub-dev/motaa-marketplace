import { ChevronDownIcon } from "@chakra-ui/icons"
import { 
    Badge, Box, Button, Card, CardBody,
    CardHeader, Container, Divider, Flex, Heading,
    HStack, Image, Menu, MenuButton, MenuItem,
    MenuList, Switch, Text, VStack, SimpleGrid,
    Input, useMediaQuery,
} from "@chakra-ui/react"
import { Fragment, useContext, useEffect, useState } from "react"
import { GlobalStore } from "../../../App"
import { RiClockwiseLine, RiGasStationLine, } from "react-icons/ri"
import { RxTimer } from "react-icons/rx"
import { TbManualGearbox } from "react-icons/tb"
import { ListingItemCard } from "../../../components"
import { objectifyJSON } from "../../../utils"
import { ListingSkeleton } from "../../../components/loaders"

export const RentListing = ({ props }) => {
    const [listings, setListings] = useState([])
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isMobile] = useMediaQuery('(max-width: 768px)')
    const {axios, notify, commaInt, authUser, apiUrl} = useContext(GlobalStore)

    async function getData(){
        try {
    
            const res = await axios.get(`/listings/rentals/`);
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

    useEffect(() => {
        init();
        console.log("Init Rentals Page")
    }, [])


    const filters = [
        {name: 'Make and Model'},
        {name: 'Price'},
        {name: 'Mileage'},
        {name: 'Location'},
        {name: 'Transmission'},
        {name: 'Vehicle Type'},
        {name: 'Condition'},
        {name: 'Fuel System'},
    ]

    if (loading){
        return <ListingSkeleton />
    }

    return(
        <Fragment>
            <Container maxWidth={'container.xl'} py={4}>

                <Box w={'100%'} mx={'auto'} maxWidth={'900px'} border="2px solid lavender" py={3} px={3} borderRadius="10px">
                    <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Text display="block" textAlign="left" mb={-2} lineHeight="1" fontWeight="600" className="small"> Where </Text>
                            <Input type="address" border="none" placeHolder="City, airport hotel?" className="small" />
                        </VStack>
                        <VStack px={4} borderLeftWidth="1px" borderRightWidth="1px" borderColor="lavender">
                            <Text display="block" textAlign="left" mb={-2} lineHeight="1" fontWeight="600" className="small"> From </Text>
                            <Input as={Button} rightIcon={<ChevronDownIcon />} type="datetime-local" border="none" placeHolder="City, airport hotel?" className="small"> 12th May, 2025 10.00pm</Input>
                        </VStack>
                        <VStack>
                            <Text display="block" textAlign="left" mb={-2} lineHeight="1" fontWeight="600" className="small"> Until </Text>
                            <Input as={Button} rightIcon={<ChevronDownIcon />} type="datetime-local" border="none" placeHolder="City, airport hotel?" className="small"> 12th May, 2025 10.00pm</Input>
                        </VStack>

                        <Button colorScheme="blue" bg="primary">Search</Button>
                    </Flex>
                </Box>

                <Flex my={2} flexWrap={'nowrap'} className="hidden-scroll" gap={4} py={4} overflowX={'auto'}>
                    {
                        filters.map((filter, idx) =>
                            <Menu>
                                {({ isOpen }) => (
                                    <Fragment>
                                    <MenuButton minW={'max-content'} size={'sm'} isActive={isOpen} as={Button} rightIcon={<ChevronDownIcon />}> {filter.name} </MenuButton>
                                    <MenuList py={0} className="small">
                                        <MenuItem>{filter.name}</MenuItem>
                                        <MenuItem onClick={() => alert('Kagebunshin')}>Create a Copy</MenuItem>
                                    </MenuList>
                                    </Fragment>
                                )}
                            </Menu>
                        )
                    }
                </Flex>

                <Heading fontWeight="400" size={'md'} color="primary" className=""> 300+ cars are available in your area </Heading>

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