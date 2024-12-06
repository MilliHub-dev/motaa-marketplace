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
import { RiGasStationLine, RiHeart2Fill, RiHeart2Line, RiSearch2Line } from 'react-icons/ri'
import { motion } from "framer-motion";
import { ListingItemCard, LocationBreadcrumb } from "../../../components";
import { SearchCarsSkeleton } from "../../../components/loaders";



export const CarSearchPage = ({ props }) => {
    const [searchResults, setSearchResults] = useState(null);
    const [matches, setMatches] = useState([]);
    const find =  useSearchParams(window.location)[0].get('find');
    const [query, setQuery] = useState(find);
    const [loading, setLoading] = useState(true);
    const {axios, authUser, commaInt, notify, } = useContext(GlobalStore);
    const redirect = useNavigate();

    function init(){
        setLoading(true);
        getData();
        setTimeout(() => setLoading(false), 2500)
    }

    async function getData(){
        const res = await axios.get(`/listings/find/?find=${find}`);
        const data = objectifyJSON(res.data);
        setSearchResults(data?.data);
        setMatches(data?.data?.results);
    }

    
    function handleSearch(){
        // simply redirect to this page with the new params
        redirect(`/search/cars/?find=${query}`)
    }

    useEffect(() => {
        init();
    }, [find]);

    if (loading){
        return <SearchCarsSkeleton />;
    }

    return (
        <Box py={4}>
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
                <Flex flexWrap={'wrap'} justifyContent={{base: 'space-evenly', lg: 'flex-start'}} rowGap={6} columnGap={6} py={'2rem'}>
                {
                    matches?.map((listing, idx) =>
                        <ListingItemCard listing={listing} key={idx} w={{base: '100%', md: 'calc(100% / 2 - 20px)', lg: 'calc(100% / 3 - 20px)'}} maxW={{base: '320px', lg: 'calc(100% / 3 - 20px)'}} />
                    )
                }
                </Flex>
            </Container>
        </Box>
    )
}

export default CarSearchPage;

