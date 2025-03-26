import { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../../../App";
import { jsonifyObject, objectifyJSON } from "../../../utils";
import { useSearchParams, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Text,
  Avatar,
  Badge,
  Button,
  Tag,
  Progress,
  VStack,
  HStack,
  Heading,
  IconButton,
  Select,
  Input,
  useColorModeValue,
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, StarIcon, VerifiedIcon, MessageCircleIcon, MoreHorizontalIcon } from 'lucide-react'
import {IoRibbonOutline} from 'react-icons/io5';
import {LocationBreadcrumb} from '../../../components';
import { ChatPopup } from "../../../components/chat";
import { MapComponent } from "../../../components/maps";
import {Autocomplete} from "@react-google-maps/api";


export const MechanicDetailPage = ({ }) => {
  const [mechanic, setMechanic] = useState(null);
  const {mechId} =  useParams()
  const [loading, setLoading] = useState(true);
  const [showPopup, setPopupState] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [locationName, setLocationName] = useState("Current Location");
  const [inputValue, setInputValue] = useState("Your Current Location");
  const [location, setLocation] = useState({lat: 10, lng: 8, name: 'Current Location'});
  const {axios, authUser, commaInt, notify, redirect, } = useContext(GlobalStore);
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const bgColor = useColorModeValue('white', 'gray.800')

  function init(){
    getData();
    setTimeout(() => setLoading(false), 2000)
  }

  async function getData(){
    const res = await axios.get(`/mechanics/${mechId}`);
    const data = objectifyJSON(res.data);
    setMechanic(data?.data);
  }

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
          // setLocation({
          //   lat: position.coords.latitude,
          //   lng: position.coords.longitude,
          //   name: "Current Location"
          // });
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
          <Box flex={1}>
            {/* Profile Header */}
            <Box bg={bgColor} p={6} rounded="lg" mb={4}>
              <Flex gap={4}>
                <Avatar size={{base: 'xl', lg: "xl"}} name={mechanic?.business_name || mechanic?.user?.name} src={mechanic?.logo} />
                <Box flex={1}>
                  
                  <Flex justify="space-between" align="start" flexWrap="wrap-reverse">
                    <Box>
                      <Flex align="center" gap={2}>
                        <Heading size="lg">{mechanic?.business_name || mechanic?.user?.name}</Heading>
                        <VerifiedIcon fill="cornflowerblue" color="white" />
                      </Flex>

                      <Flex align="center" gap={2} mt={2} color="gray.600">
                        <MapPinIcon className="w-4 h-4" />
                        <Text>{mechanic?.location}</Text>
                        <Text color="gray.700"> • 300m away</Text>
                      </Flex>
                    </Box>
                    
                    <Flex gap={2}>
                      <Button gap={2} variant="outline" onClick={() => setPopupState(true)}>
                        <MessageCircleIcon className="w-4 h-4 mr-2" />
                        Chat
                      </Button>

                      <IconButton
                        variant="outline"
                        icon={<MoreHorizontalIcon className="w-4 h-4" />}
                        aria-label="More options"
                      />
                    </Flex>
                  </Flex>
                  <Flex flexWrap="wrap" align="center" gap={2} mt={4}>
                    <Tag colorScheme="blue" gap={1.5} alignItems="center"><IoRibbonOutline size={20} /> Top Rated</Tag>
                    
                    <Flex align="center" gap={1}>
                      <Text fontWeight="bold">{mechanic?.rating}</Text>
                      <StarIcon size={20} color="orange" fill="orange" />
                      <Text color="gray.500">({mechanic?.reviews?.length} Reviews)</Text>
                    </Flex>

                  </Flex>
                </Box>
              </Flex>
            </Box>

            {/* About Section */}
            <Box bg={bgColor} p={6} rounded="lg" mb={4}>
              <Heading size="md" fontWeight="400" mb={4}>About Me</Heading>
              <Text color="gray.600">{mechanic?.about}</Text>
            </Box>

            {/* Skills Section */}
            <Box bg={bgColor} p={6} rounded="lg" mb={4}>
              <Heading size="md" mb={4}>Services</Heading>
              <Flex gap={2} flexWrap="wrap">
                {mechanic?.services?.map((service) => (
                  <Tag key={service?.service} size="lg" borderRadius={'30px'} p={3} variant="subtle">
                    {service?.service}
                  </Tag>
                ))}
              </Flex>
            </Box>

            {/* Photo Gallery */}
{/*            <Box bg={bgColor} p={6} rounded="lg" mb={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Photo Gallery</Heading>
                <Button variant="link" colorScheme="blue">
                  See all
                </Button>
              </Flex>
              <Box position="relative">
                <Flex overflow="hidden" rounded="lg">
                  {images.map((src, index) => (
                    <Box
                      key={index}
                      flexShrink={0}
                      w="full"
                      transform={`translateX(-${currentImageIndex * 100}%)`}
                      transition="transform 0.3s ease-in-out"
                    >
                      <img src={src} alt={`Gallery ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                    </Box>
                  ))}
                </Flex>
                <IconButton
                  icon={<ChevronLeftIcon />}
                  aria-label="Previous image"
                  position="absolute"
                  left={2}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  isDisabled={currentImageIndex === 0}
                />
                <IconButton
                  icon={<ChevronRightIcon />}
                  aria-label="Next image"
                  position="absolute"
                  right={2}
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                  isDisabled={currentImageIndex === images.length - 1}
                />
              </Box>
            </Box>*/}

            {/* Ratings & Reviews */}
            <Box bg={bgColor} p={6} rounded="lg">
              <Heading size="md" mb={6}>Ratings & reviews</Heading>
              <Flex align="center" gap={4} mb={6}>
                <Heading size="xl">{mechanic?.rating}</Heading>
                <Box flex={1}>
                  <Text mb={2}>Service Delivery</Text>
                  <Progress value={94} size="sm" colorScheme="blue" rounded="full" />
                  <Text mt={4} mb={2}>Communication</Text>
                  <Progress value={96} size="sm" colorScheme="blue" rounded="full" />
                  <Text mt={4} mb={2}>Value for work</Text>
                  <Progress value={90} size="sm" colorScheme="blue" rounded="full" />
                </Box>
              </Flex>

              <VStack spacing={6} align="stretch">
                {mechanic?.reviews?.map((review) => (
                  <Box key={review.id}>
                    <Flex gap={3}>
                      <Avatar size="sm" name={review.name} />
                      <Box flex={1}>
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="bold">{review.name}</Text>
                          <Text color="gray.500" fontSize="sm">{review.date}</Text>
                        </Flex>
                        <Flex gap={1} my={1}>
                          {Array(5).fill('').map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                              fill="currentColor"
                            />
                          ))}
                        </Flex>
                        <Text color="gray.600">{review.text}</Text>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>

              {/*<Button variant="link" colorScheme="blue" mt={6}>
                See more reviews
              </Button>*/}
            </Box>
          </Box>

          {/* Sidebar */}
          <Box w={{ base: 'full', md: '40%', lg: '400px' }}>
            <Box position="relative" top={4}>
              <Box bg={bgColor} className="map-wrapper">
                {/* Map placeholder */}
                <Box
                  style={{height: "320px"}}
                  mb={4}
                  as={MapComponent}
                  location={location}
                />
                            
                <VStack  w="100%">
                  <Flex w="100%" my={2} gap={2} borderWidth="1px" alignItems="center" rounded="lg" px={2} py={1}>
                    <Text>Location:</Text>

                    <Autocomplete
                      onLoad={onLoad}
                      style={{width: "100%"}}
                      onPlaceChanged={onPlaceChanged}
                      className="w-full"
                    >
                      <Input
                        flex={1}
                        w="100%"
                        border="none"
                        outline="none"
                        placeholder="Search location..."
                      />
                    </Autocomplete>
                  </Flex>
                  
                  <Select placeholder="Choose Service">
                    {mechanic?.services?.map((service) =>
                      <option> {service?.service} </option>
                    )}
                  </Select>
                  
                  <Button colorScheme="blue" size="lg" w="full">
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


