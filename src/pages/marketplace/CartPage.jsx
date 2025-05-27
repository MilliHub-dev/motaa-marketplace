import {
    Box, Heading,
    Button,
    Container,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Stack,
    Image,
    Text,
    Avatar,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    List,
    ListItem,
    Card,
    CardBody,
    Tag,
    Icon,
    VStack,
    HStack,
    Checkbox,
 } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../../App";
import { jsonifyObject, objectifyJSON } from "../../utils";
import { useSearchParams, NavLink, Link } from "react-router-dom";
// import { SearchIcon, StarIcon, ZapIcon } from '@chakra-ui/icons';
import { RiGasStationLine, RiHeart2Fill, RiHeart2Line, RiMessage2Line, RiSearch2Line } from 'react-icons/ri'
import { motion } from "framer-motion";
import { MechanicListSkeleton } from "../../components/loaders";



export const CartPage = ({ props }) => {
    const [cart, setCart] = useState({
        itemsCount: 0,
        cars: [],
        rentals: [],
        services: [],
        orders: [],
    });
    const [loading, setLoading] = useState(true);
    const {axios, authUser, commaInt, notify, redirect, } = useContext(GlobalStore);

    function init(){
        getData();
        setTimeout(() => setLoading(false), 2500);
    }

    async function removeFromCart( item ){
        setLoading(true);

        const res = await axios.post(`/accounts/cart/`, jsonifyObject({
          item: item.uuid,
          action: 'remove-from-cart',  
        }));

        const data = objectifyJSON(res.data);
        if (res.status === 200){
            notify({
                title: 'Success',
                message: `${item?.title} removed from your cart.`
            });
            getData();
        }
        setTimeout(() => setLoading(false), 1200);
    }

    async function getData(){
        const res = await axios.get(`/accounts/cart/`);
        const data = objectifyJSON(res.data);

        if (res.status === 200){
            console.log("Cart Data:", data.data);
            let cars, rentals, bookings, orders;

            cars = data?.data?.cars;
            rentals = data?.data?.rentals;
            bookings = data?.data?.bookings;
            orders = data?.data?.orders;

            setCart({
                itemsCount: (cars?.length + rentals?.length + bookings?.length),
                cars,
                rentals,
                bookings,
                orders,
            })
        }

    }

    useEffect(() => {
        init();
    }, []);

    if (loading){
        return <MechanicListSkeleton />;
    }

    return (
        <Box px={4} py={4}>
            <Container maxW="container.xl" py={4}>
                <Heading className="subtitle" size={'lg'} mb={5}>Your Cart</Heading>

                <Tabs>
                <TabList
                    border="none"
                    className="hidden-scroll"
                    overflowX="auto"
                    overflowY="hidden"
                    whiteSpace="nowrap"
                    display="flex"
                    py={2}
                    alignItems="center"
                    minHeight="fit-content"
                >
                    <Tab className="subtitle" borderBottom={'2px solid transparent'} gap={1} spacing={1} _selected={{ borderColor: 'primary'}}>
                        Orders
                        <Badge borderRadius="30px" className="subtitle" px="2" color="primary">
                        {cart?.orders?.length}
                        </Badge>
                    </Tab>
                    <Tab className="subtitle" borderBottom={'2px solid transparent'} gap={1} spacing={1} _selected={{ borderColor: 'primary'}}>
                        Cars 
                        <Badge borderRadius="30px" className="subtitle" px="2" color="primary">
                        {cart?.cars?.length}
                        </Badge>
                    </Tab>
                    <Tab className="subtitle" borderBottom={'2px solid transparent'} gap={1} spacing={1} _selected={{ borderColor: 'primary'}}>
                        Rentals
                        <Badge borderRadius="30px" className="subtitle" px="2" color="primary">
                        {cart?.rentals?.length}
                        </Badge>
                    </Tab>
                    <Tab className="subtitle" borderBottom={'2px solid transparent'} gap={1} spacing={1} _selected={{ borderColor: 'primary'}}>
                        Mechanics
                        <Badge borderRadius="30px" className="subtitle" px="2" color="primary">
                        {cart?.bookings?.length}
                        </Badge>
                    </Tab>
                    </TabList>


                    <TabPanels>
                        <TabPanel>
                            <List py="3" spacing={10}>
                                {
                                    cart?.orders?.map((order, idx) => 
                                        <ListItem my={5}>
                                            <Flex gap={4} flexWrap="wrap" justifyContent="space-between" alignItems="center">
                                                <Flex gap={4} flex="1">
                                                    <Box w="110px" h="75px" rounded="lg" overflow="hidden">
                                                        <Image
                                                            loading="eager"
                                                            w="100%"
                                                            h="100%"
                                                            objectFit="cover"
                                                            rounded="lg"
                                                            src={order?.order_item?.vehicle?.images?.[0]?.url || "/placeholder.jpg"}
                                                            alt={order?.order_item?.vehicle?.name || "Vehicle Image"}
                                                        />
                                                    </Box>

                                                    <Box flex="1">
                                                        {order?.order_item?.vehicle?.condition && <Tag>{order?.order_item?.vehicle.condition}</Tag>}
                                                        <Heading size="sm" my={1} display="flex" alignItems="center" gap={2}>
                                                            {order?.order_item?.vehicle?.name} 
                                                        </Heading>
                                                        <Text my={1}>₦{commaInt(order?.order_item?.price)}</Text>
                                                    </Box>
                                                </Flex>

                                                <Flex gap={2} alignItems="center">
                                                {order?.order_type === 'sale' && (
                                                    order?.order_status === 'awaiting-inspection' || order?.order_status === 'inspecting' ?
                                                    <>
                                                     <Button as={Link} px={4} colorScheme="yellow" bg="tertiary" to={`/checkout/inspection/?listingId=${order?.order_item?.uuid}`}>Finish Inspection</Button>
                                                    </>
                                                    : 
                                                    <Button px={4} bgColor="primary" colorScheme="blue">Pay Now {order?.order_status}</Button>
                                                )}

                                                {order?.order_type === 'rental' && (
                                                    <Button px={4} colorScheme="red">Cancel Rental</Button>
                                                )}
                                                </Flex>
                                            </Flex>
                                        </ListItem>

                                    )
                                }
                            </List>
                        </TabPanel>

                        <TabPanel>
                            <List py="3" spacing={10}>
                                {
                                    cart?.cars?.map((car, idx) => 
                                        <ListItem my={5}>
                                            <Flex gap={4} flexWrap="wrap" justifyContent="space-between" alignItems="center">
                                                <Flex gap={4} flex="1">
                                                    <Box w="110px" h="75px" rounded="lg" overflow="hidden">
                                                        <Image
                                                            loading="eager"
                                                            w="100%"
                                                            h="100%"
                                                            objectFit="cover"
                                                            rounded="lg"
                                                            src={car?.vehicle?.images?.[0]?.url || "/placeholder.jpg"}
                                                            alt={car?.vehicle?.name || "Vehicle Image"}
                                                        />
                                                    </Box>

                                                    <Box flex="1">
                                                        {car?.vehicle?.condition && <Tag>{car.vehicle.condition}</Tag>}
                                                        <Heading size="sm" my={1} display="flex" alignItems="center" gap={2}>
                                                            {car?.vehicle?.name} 
                                                        </Heading>
                                                        <Text my={1}>₦{commaInt(car?.price)}</Text>
                                                    </Box>
                                                </Flex>

                                                <Flex gap={2} alignItems="center">
                                                <Button px={4} colorScheme="red" onClick={() => removeFromCart(car)}>Remove</Button>
                                                <NavLink to={`/checkout/?listingId=${car?.uuid}`}>
                                                    <Button px={4} bgColor="primary" colorScheme="blue">Pay Now</Button>
                                                </NavLink>
                                                </Flex>
                                            </Flex>
                                        </ListItem>

                                    )
                                }
                            </List>
                        </TabPanel>

                        <TabPanel>
                            <List px="3" py="3">
                                {
                                    cart?.rentals?.map((rental, idx) => 
                                        <ListItem my={5}>
                                            <Flex gap={4}>
                                                <Box w={'150px'} h={'75px'} rounded={'lg'}>
                                                    <Image lazy w={'100%'}  rounded={'lg'} src={rental?.vehicle?.images[0]?.url} />
                                                </Box>

                                                <Box flex={1}>
                                                    <Heading size="sm"  my={1}> {rental?.vehicle?.name} <Tag> {rental?.vehicle?.condition} </Tag> </Heading>
                                                    <Text my={1} className="bold"> ₦{commaInt(rental?.price)}/{rental?.cycle} </Text>
                                                    {/* <Text my={1}> {rental?.status} </Text> */}
                                                </Box>

                                                
                                                <Flex>
                                                    <Button bgColor="primary" px={4} colorScheme="red"> Remove </Button>
                                                    <NavLink to={`/checkout/?listingId=${rental?.uuid}`}>
                                                        <Button bgColor="primary" px={4} colorScheme="blue"> Pay Now </Button>
                                                    </NavLink>
                                                </Flex>
                                            </Flex>
                                        </ListItem>
                                    )
                                }
                            </List>
                        </TabPanel>

                        <TabPanel>
                            <List px="3" py="3">
                                {
                                    cart?.bookings?.map((booking, idx) => 
                                        <ListItem my={5}>
                                            <Flex gap={4}>
                                                {/*<Box w={'150px'} h={'75px'} rounded={'lg'}>
                                                    <Image lazy w={'100%'}  rounded={'lg'} src={service?.service?.service?.mechanic[0]?.image} />
                                                </Box>*/}

                                                <Box flex={1}>
                                                    <Heading size="sm"  my={1}> {booking?.mechanic} </Heading>
                                                    <Text my={1}> ₦{commaInt(booking?.sub_total)} <Text as="small">(sub total)</Text></Text>
                                                    {
                                                        booking?.services?.map((service, idx) => 
                                                            <Tag key={service}> {service} </Tag>
                                                        )
                                                    }
                                                </Box>

                                                <Flex gap={2} flexWrap={'wrap'}>
                                                    <Button bgColor="danger" px={4} colorScheme="red"> Cancel Booking </Button>
                                                    {booking?.status === 'completed' && <Button bgColor="primary" px={4} colorScheme="blue"> Pay Mechanic </Button>}
                                                </Flex>
                                            </Flex>
                                        </ListItem>
                                    )
                                }
                            </List>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

            </Container>
        </Box>
    )
}

export default CartPage;

