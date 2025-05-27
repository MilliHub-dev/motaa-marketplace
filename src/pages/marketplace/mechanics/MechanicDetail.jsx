import { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../../../App";
import { jsonifyObject, objectifyJSON } from "../../../utils";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Text,
  Avatar,
  Badge,
  Button,
  Tag,
  SimpleGrid,
  Progress,
  VStack,
  HStack,
  Heading,
  IconButton,
  Select,
  Input,
  Collapse,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import {
 ChevronDownIcon, ChevronUpIcon,
 ChevronLeftIcon, ChevronRightIcon,
 MapPinIcon, StarIcon, VerifiedIcon,
 MessageCircleIcon, MoreHorizontalIcon
} from 'lucide-react'
import {IoRibbonOutline} from 'react-icons/io5';
import {LocationBreadcrumb, ReviewCard, RatingCard,} from '../../../components';
import { ChatPopup } from "../../../components/chat";
import { MapComponent, CustomPlacesAutocomplete } from "../../../components/maps";
import { CashMoneyIcon, TopRatedBadgeIcon } from "../../../components/icons";


const ServiceAccordion = ({ service, ...props }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      p={4}
      mb={4}
      boxShadow="sm"
      bg="white"
      _hover={{ boxShadow: "md" }}
    >
      <Flex justify="space-between" align="center">
        <Box>
          <Text fontSize="xl" fontWeight="bold">
            {service?.service}
          </Text>
          <Flex mt={1} gap={3} alignItems="center">
            <Text size="md" color="green">
              <CashMoneyIcon />
              { service?.charge > 0 ?
                ` Starting at: ${parseInt(service?.charge).toLocaleString()}`
                : " Free"
              }
            </Text>
            <Badge colorScheme="blue">{service?.charge_rate} rate</Badge>
          </Flex>
        </Box>
        <IconButton
          aria-label="Toggle description"
          icon={isOpen ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
          onClick={onToggle}
          variant="ghost"
        />
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Box mt={4} color="gray.600" fontSize="sm">
          {service?.description || 'No description available'}
        </Box>
      </Collapse>
    </Box>
  );
};


export const MechanicDetailPage = ({ }) => {
  const [mechanic, setMechanic] = useState(null);
  const {mechId} =  useParams()
  const [loading, setLoading] = useState(true);
  const [showPopup, setPopupState] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState();
  const {axios, authUser, commaInt, notify, } = useContext(GlobalStore);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const bgColor = useColorModeValue('white', 'gray.800');
  const redirect = useNavigate();

  function init(){
    setLoading(true);
    getData();
    setTimeout(() => setLoading(false), 2500)
  }

  function reverseGeocode(lat, lng) {
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const place = results[0].address_components.find(addr => addr.types.includes("administrative_area_level_2"));
        const formattedAddress = place.long_name;
        setLocationName(formattedAddress);
      } else {
        console.error("Geocoder failed due to: " + status);
      }
    });
  }

  async function getData(){
    const res = await axios.get(`/mechanics/${mechId}`);
    const data = objectifyJSON(res.data);
    setMechanic(data?.data);
  }

  const onLoad = (auto) => setAutocomplete(auto);

  function getDistance(distanceFrom){
    return 'Unknown Distance'
  }

  function gotoBookingPage(){

    if(address && address.trim()){
      if (location && locationName.trim()){
        const {lat, lng} = location;
        return redirect(`/mechanics/book/${mechId}/?lat=${lat}&lng=${lng}&address=${address}`)
      }
      return notify({
        title: "Error",
        body: 'Please enter a location',
        color: 'red',
      })
    }
    return notify({
      title: "Error",
      body: 'Please enter your house address',
      color: 'red',
    })
  }

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLocation({ lat, lng, name: place.name });
        setLocationName(place.formatted_address || place.name);
      }
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Current Location", position)
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current Location"
          });
          reverseGeocode(position.coords.latitude, position.coords.longitude);
          setLocationName("Current Location");
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

  useEffect(() => {
      init()
  }, []);


  if (loading){
    return null;
  }
  
  return (
    <Box minH="100vh" pb={8}>
      <Container maxW="7xl">
        <Box px={2} py={4}>
          <LocationBreadcrumb label={mechanic?.business_name || mechanic?.user?.name} />
        </Box>

        <Flex gap={6} direction={{ base: 'column', md: 'row' }} alignItems="self-start">
          {/* Main Content */}
          <Box w={{ base: 'full', md: '56%', lg: 'calc(100% - 450px)' }}>
            {/* Profile Header */}
            <Box bg={bgColor} p={6} rounded="lg" mb={4}>
              <Flex gap={4} >
                <Avatar size={{base: 'xl', lg: "xl"}} name={mechanic?.business_name || mechanic?.user?.name} src={mechanic?.logo} />
                
                <Box flex={1}>                  
                  <Flex align="center" gap={2}>
                      <Heading size="lg">{mechanic?.business_name || mechanic?.user?.name}</Heading>
                      <VerifiedIcon fill="cornflowerblue" color="white" />
                  </Flex>
                  
                  <Flex flexWrap="wrap" align="center" gap={2} mt={4}>
                    <Badge
                     colorScheme="blue"
                     gap={1.5}
                     p={"5px"}
                     rounded="lg"
                     alignItems="center"
                    >
                      <TopRatedBadgeIcon viewBox="0 0 27 28" w="20px" h="20px" />
                      {mechanic?.level}
                    </Badge>
                  
                    <Flex align="center" gap={1}>
                      <Text fontWeight="bold">{mechanic?.rating}</Text>
                      <StarIcon size={20} color="orange" fill="orange" />
                      <Text color="gray.500">({mechanic?.reviews?.length} Reviews)</Text>
                    </Flex>
                  </Flex>

                  <Flex align="center" gap={2} mt={2} color="gray.600">
                    <MapPinIcon size="20px" className="w-4 h-4" />
                    <Text>{mechanic?.location || 'N/A'}</Text>
                    <Text color="gray.700"> • {getDistance(mechanic?.location)}</Text>
                  </Flex>
                </Box>
              </Flex>
            </Box>

            {/* About Section */}
            <Box bg={bgColor} border="1px solid lavender" p={6} rounded="lg" mb={4}>
              <Heading size="md" mb={4}>About {mechanic?.business_type === 'business' ? 'Us' : 'Me'}</Heading>
              <Text color="gray.600">{mechanic?.about || "No description available"}</Text>
            </Box>

            {/* Services Section */}
            <Box bg={bgColor} p={6} rounded="lg" mb={4}>
              <Heading size="md" mb={4}>Services</Heading>
              <SimpleGrid spacing={2} alignItems="flex-start" minChildWidth={'300px'} columns={{ base: 1, md: 2, lg: 3}} flexWrap="wrap">
                {mechanic?.services?.map((service) => (
                  <ServiceAccordion key={service?.uuid} service={service} />
                ))}
              </SimpleGrid>
            </Box>

            {/* Ratings & Reviews */}
            <Box bg={bgColor} p={6} rounded="lg">
              <RatingCard
                avg_rating={mechanic?.rating}
                ratings={[mechanic?.ratings]}
              />

              <VStack spacing={6} align="stretch">
                {mechanic?.reviews?.map((review) => 
                  <ReviewCard key={review.id} rating={review} />
                )}
              </VStack>
            </Box>
          </Box>

          {/* Sidebar */}
          <Box w={{ base: 'full', md: '40%', lg: '400px' }}>
            <Box position="relative" top={4} border="1px solid gray" p={3} rounded="2xl">
              <Box bg={bgColor} className="map-wrapper">
                {/* Map placeholder */}
                <Box
                  style={{height: "320px"}}
                  mb={4}
                  as={MapComponent}
                  location={location}
                />
                            
                <VStack pt={4} w="100%">
                  <Flex w="100%" my={1.25} gap={2} borderWidth="1px" alignItems="center" rounded="lg" px={2} py={1}>
                    <Text>Location:</Text>

                    <CustomPlacesAutocomplete
                      onLoad={onLoad}
                      style={{width: "100%"}}
                      onPlaceChanged={onPlaceChanged}
                      className="w-full"
                      value={locationName}
                      placeholder="Search location"
                    />
                  </Flex>

                  <Flex w="100%" my={1.25} gap={2} borderWidth="1px" alignItems="center" rounded="lg" px={2} py={1}>
                    <Text>Street Address:</Text>
                    <Input
                      flex={1}
                      w="100%"
                      border="none"
                      outline="none"
                      type="address"
                      name="address"
                      value={address}
                      onInput={e => setAddress(e.target.value)}
                      placeholder="e.g No. 6 Sule Drive"
                    />
                  </Flex>
                  
                  <Button colorScheme="blue" size="lg" w="full" onClick={gotoBookingPage}>
                    Book Now
                  </Button>
                </VStack>
              </Box>
            </Box>
          </Box>
        </Flex>
      </Container>

      <ChatPopup
       isOpen={showPopup}
       onClose={() => setPopupState(false)}
       recipient_type="mechanic" 
       recipient_id={mechanic?.uuid}
      />
    </Box>
  )
}

export default MechanicDetailPage;


