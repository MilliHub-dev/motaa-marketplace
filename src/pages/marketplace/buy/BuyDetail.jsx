import { Avatar, Badge, Box, Button, Container, Divider, Flex, Heading, Icon, Image, List, ListItem, Stack, Text } from "@chakra-ui/react"
import { Fragment, useContext, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { GlobalStore } from "../../../App";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import {ImageCarousel, LocationBreadcrumb} from "../../../components";
import { ListingDetailSkeleton } from "../../../components/loaders";
import { objectifyJSON } from "../../../utils";

const BuyDetail = ({ }) => {
    const {listingId} = useParams();
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoadingState] = useState(true);
    const [listing, setListing] = useState();
    const {authUser, axios, notify, commaInt} = useContext(GlobalStore);

    async function getData(){
        const res = await axios.get(`/listings/buy/${listingId}/`, {
            headers: {
                'Authorization': `Token ${authUser.token}`
            }
        });
        let data = objectifyJSON(res.data);
        if (res.status === 200){
            setListing(data.data.listing);
            setRecommended(data.data.recommended);
        }
    }

    function init(){
        getData();
    }

    useEffect(() => {
        init();
        setTimeout(() => setLoadingState(false), 2500)
    }, []);

    if (loading){
        return <ListingDetailSkeleton />
    }

    return(
        <Container display={'block'} w={'100%'} maxW={'container.lg'} py={'2rem'}>
            <LocationBreadcrumb label={listing?.title} />
            
            <Box my={5}>
                <Heading size={'lg'} className="title"> {listing?.title} </Heading>
                <Text> {listing?.vehicle.dealer.location} </Text>
            </Box>

            <Flex my={5} justifyContent={'space-between'} gap={4} flexWrap={'wrap'} alignItems={'flex-start'}>
                <Stack flex={{base: 1, md: 8/12, lg: (8/12)}} w={{base: '100%'}}>
                    <ImageCarousel w={'100%'} height={'350px'} images={listing?.vehicle?.images} />
                </Stack>

                <Box flex={{base: 1, md: 4/12, lg: (4/12)}} border={'2px solid lavender'} borderRadius={'10px'} p={3}>
                    <Flex gap={2}>
                        <Avatar name={listing?.vehicle?.dealer?.business_name} src={listing?.vehicle?.dealer?.logo}  />
                        <Stack>
                            <Heading size={'sm'}> {listing?.vehicle?.dealer?.business_name} </Heading>
                            <Text size={'sm'} className="small"> {listing?.vehicle.dealer.location} </Text>
                        </Stack>
                    </Flex>

                    <Box mt={3}>
                        <Badge> Price: </Badge>
                        <Heading size={'md'}><span className="subtitle">₦{commaInt(listing?.price)}</span></Heading>
                    </Box>

                    <Divider my={5} />

                    <Stack columnGap={4}>
                        <Button as={Link} to={`/checkout/?listingId=${listingId}`} bg={'primary'} colorScheme="blue" w={'100%'}> Start Transaction </Button>
                        <Button variant={'outline'} colorScheme="blue" w={'100%'}> Enquire Now </Button>
                    </Stack>
                </Box>
            </Flex>

            <Stack w={{md: 8/12, lg: (8/12)}} py="4rem">
                <Box my={5}>
                    <Heading className="subtitle" size={'md'} mb={4}> Overview </Heading>
                    
                    <Flex columnGap={5}>
                        <List w={{ base: '100%', md: '50%'}}>
                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Mileage: </span>
                                <span> {listing.vehicle.mileage} miles </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Transmission: </span>
                                <span> {listing.vehicle.transmission} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Usage: </span>
                                <span> {listing.vehicle.condition} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Power: </span>
                                <span> {listing.vehicle.power || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Engine size: </span>
                                <span> {listing.vehicle.engine_size || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Fuel type: </span>
                                <span> {listing.vehicle.fuel_system} </span>
                            </ListItem>

                        </List>
                        
                        <List w={{ base: '100%', md: '50%'}}>
                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Custom Duty: </span>
                                <span> {listing.vehicle.custom_duty ? 'Yes' : 'No'} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Doors: </span>
                                <span> {listing.vehicle.doors || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Seats: </span>
                                <span> {listing.vehicle.seats || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Drivetrain: </span>
                                <span> {listing.vehicle.drivetrain || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Vehicle type: </span>
                                <span> {listing.vehicle.vehicle_type || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Color: </span>
                                <span> {listing.vehicle.color || "N/A"} </span>
                            </ListItem>

                        </List>
                    </Flex>
                </Box>
                
                <Box my={5}>
                    <Heading className="subtitle" size={'md'} mb={4}> Performance & Stats </Heading>

                    <List w={{ base: '100%', md: '50%'}}>
                        <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                            <span> Top Speed: </span>
                            <span> {listing.vehicle?.top_speed || "N/A"} </span>
                        </ListItem>

                        <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                            <span> Horse Power: </span>
                            <span> {listing.vehicle?.horse_power || "N/A"} </span>
                        </ListItem>
                    </List>
                </Box>

                <Box my={5}>
                    <Heading className="subtitle" size={'md'} mb={4}> Seller notes </Heading>
                    <Text border={'1px solid grey'} dangerouslySetInnerHTML={{__html: listing.notes || "No additional info."}} p={3} rounded={'md'}></Text>
                </Box>  
            </Stack>
        </Container>
    )
}




export default BuyDetail;