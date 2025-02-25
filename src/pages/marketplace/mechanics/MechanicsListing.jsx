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
    Grid,
    GridItem,
    Image,
    Tag,
    ButtonGroup,
    Divider,
    Checkbox,
    useColorModeValue,
 } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../../../App";
import { jsonifyObject, objectifyJSON } from "../../../utils";
import { useSearchParams, Link } from "react-router-dom";
import { SearchIcon, StarIcon, ZapIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { RiGasStationLine, RiHeart2Fill, RiHeart2Line, RiMessage2Line, RiSearch2Line } from 'react-icons/ri'
import { motion } from "framer-motion";
import {BiBuildings} from 'react-icons/bi';
import {GrLocation} from 'react-icons/gr';
import {ArrowLeft, ArrowRight} from 'lucide-react';
import { MechanicListSkeleton } from "../../../components/loaders";
import { 
  LocationFilter,
} from "../../../components/filters";
import { Paginator } from "../../../components/nav";

export const MechanicListPage = ({ props }) => {
    const bgColor = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.700')
    const [searchResults, setSearchResults] = useState(null);
    const [matches, setMatches] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const {axios, authUser, commaInt, notify, redirect, } = useContext(GlobalStore);
    const filters = [
      <LocationFilter onChange={console.log} />
    ]
    
    function init(){
        getData();
        setTimeout(() => setLoading(false), 2500);
    }

    async function getData(){
        const res = await axios.get(`/mechanics/`);
        const _data = objectifyJSON(res.data);
        console.log("Mechs:", _data)
        setSearchResults(_data.data);
        setMatches(_data?.data?.results);
        setData(_data?.data?.pagination)
    }

    useEffect(() => {
        init();
    }, []);

    if (loading){
        return <MechanicListSkeleton />;
    }

    return(
    <Box minH="100vh">
        <Container maxW="container.xl" py={8}>
            {/* Search and Location */}
            <Container maxW={"container.lg"}>
                <Flex gap={4} mb={6} flexWrap={'wrap'}>
                  <InputGroup size="lg" flex={1}>
                    <InputLeftElement>
                      <SearchIcon className="w-5 h-5 text-gray-400" />
                    </InputLeftElement>
                    <Input placeholder="Engine Service" bg={bgColor} />
                  </InputGroup>
                  <Button
                    size="lg"
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                    bg={bgColor}
                  >
                    Abuja, Garki
                  </Button>
                </Flex>
            </Container>

            {/* Filters */}
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

            {/* Results Count */}
            <Text fontSize="xl" className="subtitle" color="primary" fontWeight="medium" mb={6}>
              {matches?.length} Mechanic{matches?.length > 1 && 's'} are available near you.
            </Text>

            {/* Mechanics List */}
            <Flex gap={6} alignItems="self-start" flexWrap="wrap-reverse">
              <VStack spacing={0} flex={1}>
                {matches?.map((mechanic) => (
                  <Box
                    key={mechanic.id}
                    w="full"
                    bg={bgColor}
                    p={6}
                    borderBottomWidth={2}
                    borderColor={borderColor}
                  >
                    <Flex gap={4}>
                        <Link to={`/mechanics/${mechanic?.uuid}`}>
                            <Avatar size="lg" name={mechanic?.business_name ? mechanic?.business_name : mechanic?.user?.name} />
                        </Link>
                      <Box flex={1}>
                        <Flex justify="space-between" align="start">
                          <Box>
                            <Link to={`/mechanics/${mechanic?.uuid}`}>
                                <Heading size="sm" mb={1}> {mechanic?.business_name ? mechanic?.business_name : mechanic?.user?.name} {mechanic?.mechanic_type === 'business' && <Icon> <BiBuildings size={25} /> </Icon>} </Heading>
                            </Link>
                            <Text color="gray.800" fontWeight="md" fontSize="lg"> {mechanic?.headline} </Text>
                          </Box>

                          <Badge colorScheme="blue" fontSize="xs">
                            TOP RATED
                          </Badge>
                        </Flex>

                        <Flex align="center" gap={1} mt={2} color="gray.600">
                          <GrLocation />
                          <Text fontSize="md">{mechanic?.location}</Text>
                          <Text fontSize="md" color="gray.700">
                            • {mechanic.distance || "> 2km away"}
                          </Text>
                        </Flex>

                        <HStack spacing={2} mt={4} flexWrap="wrap">
                            {mechanic?.services?.map((service, idx) => {
                                if (idx >= 3){
                                    return (
                                        <Tag size="lg" py={3} px={4} variant="subtle" bgColor="lightgrey" opacity={.9} borderRadius="30px">
                                          +{(mechanic?.services?.length - idx)}
                                        </Tag>
                                    )
                                }else{
                                    return (
                                        <Tag
                                          key={idx}
                                          size="lg"
                                          variant="subtle"
                                          borderRadius="30px"
                                          p={3}
                                          bgColor="lightgrey"
                                          opacity={".9"}
                                        >
                                          {service?.service}
                                        </Tag>
                                    )}
                                })
                            }
                        </HStack>

                        <Divider my={4} />

                        <Flex justify="flex-start" columnGap={5} flexWrap="wrap" align="center">
                          <Flex align="center" gap={1}>
                            <Text color="gray.600">
                              Services start from:
                            </Text>
                            <Text fontSize="lg" fontWeight="bold">
                              {mechanic?.startingPrice}
                            </Text>
                          </Flex>

                          <Flex align="center" gap={1}>
                            <Text color="gray.600">Average Rating: {mechanic?.rating}</Text>
                            <StarIcon className="w-4 h-4" color="tertiary" />
                          </Flex>
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>

              {/* Map Section */}
              <Box
                w={{base: "300px", md: "300px", lg: "400px"}}
                h="500px"
                bg={bgColor}
                borderRadius="20px"
                borderWidth={1}
                borderColor={borderColor}
                px={4} py={4}
                top={4}
              >
                <Box h={'320px'} borderWidth="1px" rounded="15px" ></Box>
                
                <Flex my={5} gap={2} borderWidth="1px" rounded="lg" px={2} py={4}>
                  <Text> Location: </Text>
                  <Text flex={1}> {'Abuja, FCT'} </Text>
                </Flex>

                <Button w="100%" size="lg" colorScheme="blue" p={4}>Expand Map</Button>
              </Box>
            </Flex>

            {/* Pagination */}
            {/*<Paginator pagination={data?.pagination} onPrevious onNext onClick />*/}
        </Container>
    </Box>
    )
}

export default MechanicListPage;

