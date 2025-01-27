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
    Text,
    Avatar,
    Badge,
    Card,
    CardBody,
    Icon,
    VStack,
    HStack,
    Wrap,
    WrapItem,
    Menu,
    MenuList,
    MenuItem,
    MenuButton,
    MenuItemOption,
    Checkbox,
 } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../../../App";
import { jsonifyObject, objectifyJSON } from "../../../utils";
import { useNavigate, useSearchParams } from "react-router-dom";
// import { SearchIcon, StarIcon, ZapIcon } from '@chakra-ui/icons';
import { RiGasStationLine, RiHeart2Fill, RiHeart2Line, RiMessage2Line, RiSearch2Line } from 'react-icons/ri'
import { motion } from "framer-motion";
import { MechanicListSkeleton } from "../../../components/loaders";
import { LocationBreadcrumb } from "../../../components";



export const MechanicSearchPage = ({ props }) => {
    const find =  useSearchParams(window.location)[0].get('find');
    const [searchResults, setSearchResults] = useState(null);
    const [query, setQuery] = useState(find);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const {axios, authUser, commaInt, notify, } = useContext(GlobalStore);
    const redirect = useNavigate();
    
    function init(){
        getData();
        setTimeout(() => setLoading(false), 2500)
    }

    async function getData(){
        const res = await axios.get(`/mechanics/find/?find=${find}`);
        const data = objectifyJSON(res.data);
        console.log("Search results:", data);
        setSearchResults(data.data);
        setMatches(data?.data?.results);
    }

    function handleSearch(){
        // simply redirect to this page with the new params
        redirect(`/search/mechanics/?find=${query}`)
    }

    useEffect(() => {
        init();
        return () => {

        }
    }, [find]);

    if (loading){
        return <MechanicListSkeleton />;
    }

    return (
        <Box px={4} py={4}>
            <Container maxW="container.lg" py={4}>
                <LocationBreadcrumb label={find} />

                <Heading className="subtitle" size={'md'} mt={3} mb={5}> Showing {searchResults?.pagination?.offset + 1} - {searchResults?.pagination?.limit} of {searchResults?.pagination?.count} results for "{find}" </Heading>
                {/* Search Header */}
                <Flex gap={4} mb={6}>
                    <InputGroup flex={1} borderRadius={'30px !important'}>
                        <InputLeftElement pointerEvents="none">
                            <RiSearch2Line color="gray.300" />
                        </InputLeftElement>
                        
                        <Input placeholder="Search here..." value={query} onInput={e => setQuery(e.target.value)} />
                    </InputGroup>
                    <Button onClick={handleSearch} variant="outline" color={'primary'} colorScheme="blue">Advanced search</Button>
                </Flex>

                {/* Filters */}
                <Flex gap={2} mb={6} flexWrap="wrap">
                    <Menu placeholder="Location" w={'max-content'}>
                        <Select as={MenuButton} maxW={'max-content'}>
                            <option selected disabled> Services </option>
                        </Select>
                        <MenuList>
                            <MenuItem gap={3} value="worldwide" closeOnSelect={false}>
                                <Checkbox />
                                <Text> Engine Repair </Text>
                            </MenuItem>

                            <MenuItem gap={3} value="us" closeOnSelect={false}>
                                <Checkbox />
                                <Text> Paint Job </Text>
                            </MenuItem>
                        </MenuList>
                    </Menu>

                    <Menu placeholder="Location" w={'max-content'}>
                        <Select as={MenuButton} maxW={'max-content'}>
                            <option selected disabled> Location </option>
                        </Select>
                        <MenuList>
                            <MenuItem gap={3} value="worldwide" closeOnSelect={false}>
                                <Checkbox />
                                <Text> Nearest to Me </Text>
                            </MenuItem>

                            <MenuItem gap={3} value="us" closeOnSelect={false}>
                                <Checkbox />
                                <Text> Nationwide </Text>
                            </MenuItem>

                            <MenuItem gap={3} value="us" closeOnSelect={false}>
                                <Checkbox />
                                <Text> Abuja </Text>
                            </MenuItem>

                            <MenuItem gap={3} value="us" closeOnSelect={false}>
                                <Checkbox />
                                <Text> Kaduna </Text>
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>

                {/* Results */}
                <Stack spacing={4}>
                {
                    matches?.map((mech, idx) =>
                        <Card key={idx} shadow={'lg'} my={3}>
                            <CardBody>
                                <Flex gap={4} flexWrap={'wrap'}>
                                    <Avatar size="lg" name={mech?.user?.name} src="/placeholder.svg?height=50&width=50" />
                                    <Box flex={1}>
                                        <Flex justify="space-between" alignItems={'center'} mb={2}>
                                            <Box>
                                                <Text fontWeight="semibold">{mech?.user?.name}</Text>
                                                <Text fontSize="lg" fontWeight="medium">   </Text>
                                                <Text fontSize="sm" color="gray.500">{mech?.location}</Text>
                                            </Box>
                                            <Badge title="Availablility"
                                             textTransform={'capitalize'}
                                             fontSize={'13px'}
                                             rounded={'lg'}
                                             colorScheme={mech?.available ? 'green' : 'gray'}
                                            >
                                                {mech?.available ? "Available" : "Not Available"}
                                            </Badge>
                                        </Flex>
                                        {/* MIGHT DELETE LATER
                                        <HStack spacing={4} mb={2}>
                                            <Text fontWeight="medium">$147/hr</Text>
                                            <Flex align="center">
                                                <Icon as={RiGasStationLine} color="yellow.400" />
                                                <Text ml={1}>98% Job Success</Text>
                                            </Flex>
                                            <Text>$800K+ earned</Text>
                                        </HStack> 
                                        */}

                                        <Wrap spacing={2} mb={4}>
                                            {/* Services offered */}
                                            {mech?.services?.map((service, key) => 
                                                <WrapItem key={key}>
                                                    <Badge>{service.service}</Badge>
                                                </WrapItem>
                                            )}
                                        </Wrap>

                                        <Text fontSize="sm" color="gray.600" mb={2}>
                                            {mech?.about || "No description available."}
                                        </Text>

                                        {mech?.job_history &&
                                            <Text fontSize="sm" color="green.500">
                                                {mech?.user?.name} has worked {mech?.job_history?.length} jobs related to your search.
                                            </Text>
                                        }

                                        <Wrap gap={3} my={2}>
                                            <Button w={{base: '100%', md: 'auto' }} variant={'ghost'} colorScheme={'yellow'} leftIcon={<RiMessage2Line />}>  Contact {mech?.user?.name.split(' ')[0]} </Button>
                                            <Button w={{base: '100%', md: 'auto' }} colorScheme="blue" bg={'primary'}> Hire {mech?.user?.name} </Button>
                                        </Wrap>
                                    </Box>
                                </Flex>
                            </CardBody>
                        </Card>
                    )
                }
                </Stack>
            </Container>
        </Box>
    )
}

export default MechanicSearchPage;

