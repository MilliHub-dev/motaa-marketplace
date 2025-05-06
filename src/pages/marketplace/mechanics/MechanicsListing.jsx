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
    Alert,
    Icon,
    VStack,
    HStack,
    Image,
    Tag,
    ButtonGroup,
    Divider,
    Checkbox,
    useColorModeValue,
 } from "@chakra-ui/react";
import { useContext, useEffect, useState, Fragment, useRef } from "react";
import { GlobalStore } from "../../../App";
import { jsonifyObject, objectifyJSON } from "../../../utils";
import { useSearchParams, Link } from "react-router-dom";
import { SearchIcon, StarIcon,  ChevronDownIcon } from '@chakra-ui/icons';
import {  RiFilterLine, } from 'react-icons/ri'
import {BiBuildings} from 'react-icons/bi';
import {GrLocation} from 'react-icons/gr';
import { MechanicListSkeleton } from "../../../components/loaders";
import { MapComponent, CustomPlacesAutocomplete } from "../../../components/maps";
import { TopRatedBadgeIcon } from "../../../components/icons";
import { 
  ServiceFilter
} from "../../../components/filters";
import { Paginator } from "../../../components/nav";



export const MechanicListPage = ({ props }) => {
  const [searching, setSearching] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [locationName, setLocationName] = useState("Current Location");
  const [inputValue, setInputValue] = useState("Your Current Location");
  const [query, setQuery] = useState("");
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const [location, setLocation] = useState({ lat: 10, lng: 8, name: "Current Location" });
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [matches, setMatches] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { axios, authUser, commaInt, notify, redirect } = useContext(GlobalStore);
  const mapRef = useRef();

  const onLoad = (auto) => setAutocomplete(auto);

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLocation({ lat, lng, name: place.name });
        setInputValue(place.formatted_address || place.name);
      }
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
        },
        (error) => {
          setError("Unable to retrieve location.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  function expandMap(e) {
    e.preventDefault();
    const control = document.querySelector("button.gm-fullscreen-control");
    if (control) control.click();
  }

  const filters = [
    <ServiceFilter onChange={console.log} />
  ];

  async function getData() {
    try {
      const res = await axios.get(`/mechanics/`);
      const _data = objectifyJSON(res.data);
      setSearchResults(_data.data);
      setMatches(_data?.data?.results);
      setData(_data?.data?.pagination);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
    }
  }

  async function performSearch() {
    try {
      const res = await axios.get(`/mechanics/find/?find=${query}`);
      const _data = objectifyJSON(res.data);
      setSearchResults(_data.data);
      setMatches(_data?.data?.results);
      setData(_data?.data?.pagination);
      setSearching(true)
    } catch (error) {
      console.error("Error fetching mechanics:", error);
    }
  }

  function cancelSearch(){
    setSearching(false);
    setQuery("");
    getData();
  }

  useEffect(() => {
    getData();
    setTimeout(() => setLoading(false), 2500);
  }, []);

  if (loading) {
    return <MechanicListSkeleton />;
  }

  return (
    <Box minH="100vh">
        <Container maxW="container.xl" py={8}>
          {/* Search and Location */}
          <Container maxW={"container.xl"}>
            <Flex gap={4} mb={6} flexWrap={"wrap"}>
              <InputGroup size="lg" flex={1}>
                <InputLeftElement>
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </InputLeftElement>
                <Input value={query} placeholder="Engine Service" bg={bgColor} onInput={e => setQuery(e.target.value)} />
              </InputGroup>

              <Button onClick={performSearch} isDisabled={!query.trim()} borderRadius={5} size="lg" bg="primary" colorScheme="primary" >
                Search
              </Button>
            </Flex>
          </Container>

          {/* Filters */}
          <Flex my={2} py={2} flexWrap={"nowrap"} gap={4} overflowX={"auto"} className="hidden-scroll">
            <Button minW={"max-content"} size={"md"} borderRadius={"10px"} as={Box} bgColor="gray.100" leftIcon={<RiFilterLine />}>
              Filters
            </Button>
            {filters.map((filter, idx) => <Fragment key={idx}>{filter}</Fragment>)}
          </Flex>

          {
            searching &&
            <Alert colorScheme="yellow" w="100%" gap={3} my={3} rounded="md" display={'flex'}>
              <Text flex={1}> Showing results for "{query}" </Text>
              <Button onClick={cancelSearch} colorScheme="yellow"> Cancel </Button>
            </Alert>
          }

          {/* Results Count */}
          <Text fontSize="xl" className="subtitle" color="primary" fontWeight="medium" mb={6}>
            {matches?.length} Mechanic{matches?.length > 1 && "s"} are available near you.
          </Text>

          <Flex gap={6} alignItems="self-start" flexWrap="wrap-reverse">
            {/* Mechanics List */}
            <VStack w="100%" spacing={0} flex={1} maxW={{ md: "calc(100% - 350px)", lg: "calc(100% - 450px)" }}>
              {matches?.map((mechanic) => (
                <Box key={mechanic.id} w="full" bg={bgColor} p={6} borderBottomWidth={2} borderColor={borderColor}>
                  <Box as={Flex} direction={{ base: 'column', md: 'row'}} gap={4} flexWrap="wrap">
                    <Link to={`/mechanics/${mechanic?.uuid}`}>
                      <Avatar size="lg" name={mechanic?.business_name || mechanic?.user?.name} src={mechanic?.logo} />
                    </Link>

                    <Box flex={1}>
                      <Flex justify="space-between" align="start">
                        <Box>
                          <Link to={`/mechanics/${mechanic?.uuid}`}>
                            <Heading size="md" fontWeight="600" mb={1}>
                              {mechanic?.business_name || mechanic?.user?.name}
                              {mechanic?.mechanic_type === "business" && <Icon> <BiBuildings size={25} /> </Icon>}
                            </Heading>
                          </Link>
                          <Text color="gray.800" fontWeight="md" fontSize="sm">
                            {mechanic?.headline}
                          </Text>
                        </Box>
                        <Badge colorScheme="blue" fontSize="xs" p={'5px'} display="flex" align="center" rounded="lg">
                          <TopRatedBadgeIcon viewBox="0 0 27 28" w="20px" h="20px" /> {mechanic?.level}
                        </Badge>
                      </Flex>

                      <Flex align="center" gap={1} mt={2} color="gray.600">
                        <GrLocation />
                        <Text fontSize="md">{mechanic?.location}</Text>
                        <Text fontSize="md" color="gray.700">
                          • {mechanic?.distance || "> 2km away"}
                        </Text>
                      </Flex>

                      <HStack spacing={2} mt={4} flexWrap="wrap">
                        {mechanic?.services?.map((service, idx) =>
                          idx < 3 ? (
                            <Tag key={idx} size="sm" variant="subtle" borderRadius="30px" px={4} py={2} bgColor="lightgrey" opacity={".9"}>
                              {service?.service}
                            </Tag>
                          ) : (
                            idx === 3 && (
                              <Tag size="lg" py={3} px={4} variant="subtle" bgColor="lightgrey" opacity={0.9} borderRadius="30px">
                                +{mechanic?.services?.length - idx}
                              </Tag>
                            )
                          )
                        )}
                      </HStack>

                      <Divider my={4} />

                      <Flex justify="flex-start" columnGap={5} flexWrap="wrap" align="center">
                        <Flex align="center" gap={1}>
                          <Text color="gray.600">Services start from:</Text>
                          <Text fontSize="lg" fontWeight="bold">{parseInt(mechanic?.price_start).toLocaleString()}</Text>
                        </Flex>

                        <Flex align="center" gap={1}>
                          <Text color="gray.600">Average Rating: {mechanic?.rating}</Text>
                          <StarIcon className="w-4 h-4" color="tertiary" />
                        </Flex>
                      </Flex>
                    </Box>
                  </Box>
                </Box>
              ))}
            </VStack>

            {/* Map Section */}
            <Box className="map-wrapper" w="100%" maxW={{ md: "300px", lg: "400px" }} minH="500px" bg={bgColor} borderRadius="20px" borderWidth={1} borderColor={borderColor} px={4} py={4} top={4}>
              <Box w="100%" as={MapComponent} ref={mapRef} data-map-id="mech" style={{ height: "320px", }} className="map-rounded" location={location} />      
              <Flex my={5} gap={2} borderWidth="1px" alignItems="center" rounded="lg" px={2} py={1}>
                <Text>Location:</Text>

                <CustomPlacesAutocomplete
                  onLoad={onLoad}
                  onPlaceChanged={onPlaceChanged}
                />
              </Flex>
              <Button w="100%" size="lg" colorScheme="blue" onClick={expandMap} p={4}>Expand Map</Button>
            </Box>
          </Flex>
        </Container>
    </Box>
  );
};

export default MechanicListPage;

