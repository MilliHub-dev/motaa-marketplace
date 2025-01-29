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
import { useSearchParams } from "react-router-dom";
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
    });
    const [loading, setLoading] = useState(true);
    const {axios, authUser, commaInt, notify, redirect, } = useContext(GlobalStore);

    function init(){
        getData();
        setTimeout(() => setLoading(false), 2500);
    }

    async function getData(){
        const res = await axios.get(`/accounts/cart/`);
        const data = objectifyJSON(res.data);

        if (res.status === 200){
            console.log("Cart Data:", data.data)
            // setCartItems(data?.data)
            let cars, rentals, services;

            cars = data?.data?.cart_items?.filter((item) => item.item_type === 'car');
            rentals = data?.data?.cart_items?.filter((item) => item.item_type === 'rental');
            services = data?.data?.cart_items?.filter((item) => item.item_type === 'service');

            setCart({
                itemsCount: data?.data?.cart_items?.length,
                cars,
                rentals,
                services
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
                    <TabList border="none" className="hidden-scroll" overflowX="scroll">
                        <Tab gap={4} mx={2} className="subtitle" fontWeight="">
                            Cars 
                            <Badge borderRadius="30px" className="subtitle" px="2" color="primary">{cart?.cars?.length}</Badge>
                        </Tab>
                        <Tab gap={4} mx={2} className="subtitle" fontWeight="">
                            Rentals
                            <Badge borderRadius="30px" className="subtitle" px="2" color="primary">{cart?.rentals?.length}</Badge>
                        </Tab>
                        <Tab gap={4} mx={2} className="subtitle" fontWeight="">
                            Mechanics
                            <Badge borderRadius="30px" className="subtitle" px="2" color="primary">{cart?.services?.length}</Badge>
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <List px="3" py="3" spacing={10}>
                                {
                                    cart?.cars?.map((car, idx) => 
                                        <ListItem my={5}>
                                            <Flex gap={4}>
                                                <Box w={'120px'} h={'60px'} rounded={'lg'}>
                                                    <Image lazy w={'100%'}  rounded={'lg'} src={car?.listing?.vehicle?.images[0]?.url} />
                                                </Box>

                                                <Box flex={1}>
                                                    <Heading size="sm"  my={1}> {car?.listing?.vehicle?.name} <Tag> {car?.listing?.vehicle?.condition} </Tag> </Heading>
                                                    <Text my={1}> ₦{commaInt(car?.listing?.price)} </Text>
                                                    <Text my={1}> {car?.status} </Text>
                                                </Box>

                                                
                                                <Flex gap={2}>
                                                    <Button px={4} colorScheme="red"> Remove </Button>
                                                    <Button bgColor="primary" px={4} colorScheme="blue"> Pay Now </Button>
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
                                                    <Image lazy w={'100%'}  rounded={'lg'} src={rental?.listing?.vehicle?.images[0]?.url} />
                                                </Box>

                                                <Box flex={1}>
                                                    <Heading size="sm"  my={1}> {rental?.listing?.vehicle?.name} <Tag> {rental?.listing?.vehicle?.condition} </Tag> </Heading>
                                                    <Text my={1}> ₦{commaInt(rental?.listing?.price)}/{rental?.listing?.cycle} </Text>
                                                    <Text my={1}> {rental?.status} </Text>
                                                </Box>

                                                
                                                <Flex>
                                                    <Button bgColor="primary" px={4} colorScheme="red"> Remove </Button>
                                                    <Button bgColor="primary" px={4} colorScheme="blue"> Checkout </Button>
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
                                    cart?.services?.map((service, idx) => 
                                        <ListItem my={5}>
                                            <Flex gap={4}>
                                                <Box w={'150px'} h={'75px'} rounded={'lg'}>
                                                    <Image lazy w={'100%'}  rounded={'lg'} src={service?.service?.service?.mechanic[0]?.url} />
                                                </Box>

                                                <Box flex={1}>
                                                    <Heading size="sm"  my={1}> {service?.service?.vehicle?.name} </Heading>
                                                    <Text my={1}> ₦{commaInt(service?.service?.price)} </Text>
                                                    
                                                </Box>

                                                <Flex>
                                                    <Button bgColor="primary" px={4} colorScheme="red"> Remove </Button>
                                                    <Button bgColor="primary" px={4} colorScheme="blue"> Book Now </Button>
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

