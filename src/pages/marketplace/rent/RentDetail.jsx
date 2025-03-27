import { Fragment, useContext, useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { GlobalStore } from "../../../App";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { LocationBreadcrumb, DatePicker, ReviewCard, RatingCard,  } from "../../../components";
import { Country, State, City } from 'country-state-city';
import { ListingDetailSkeleton } from "../../../components/loaders";
import { 
  ChevronLeft, ChevronRight, Star, Users,
  DoorOpen, Zap, Gauge, Key, Camera, Music,
  Smartphone, Sun, BatteryCharging, Shield,
  CheckCircle, MessageCircle, Heart, Share2 
} from 'lucide-react'
import { objectifyJSON } from "../../../utils";
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Button,
  HStack,
  VStack,Divider, List, ListItem, Stack,
  Image,
  Avatar,
  Badge,
  Flex,
  Icon,
  Progress,
  SimpleGrid,
  Input,
  Select,
  Switch,
  IconButton,
  useColorModeValue,
  useMediaQuery,
} from '@chakra-ui/react'


const FeatureIcons = [
  { icon: <Key />, label: 'Keyless Entry' },
  { icon: <Camera />, label: 'Parking Camera' },
  { icon: <Music />, label: 'Car Play' },
  { icon: <Smartphone />, label: 'Android Auto' },
  { icon: <Sun />, label: 'Sun Roof' },
  { icon: <BatteryCharging />, label: 'USB-C Charging' },
  { icon: <Shield />, label: 'Lane Assist' },
  { icon: <Zap />, label: 'Wireless Charging' },
]

function FeatureCard({ feature }) {
  const iconObj = FeatureIcons.find((feat) => feat.label.toLowerCase() === feature.toLowerCase());

  return (
    <HStack spacing={3}>
      <Box
        px={4}
        py={3}
        bg="lavender"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {iconObj ? iconObj.icon : <Text>❓</Text>} {/* Fallback if no icon found */}
      </Box>
      <Text fontSize="md">{feature}</Text>
    </HStack>
  );
}


// Image Carousel Component
function ImageCarousel({ ...props }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState([])
  const [loading, setLoadingState] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoadingState(false), 500);
    if (props.images){
      setImages(props.images)
    }
  }, [])

  if(loading){
    return null
  }

  return (
    <Box position="relative">
      <Image
        src={images[currentImage]?.url}
        alt="Vehicle"
        w="full"
        h="400px"
        objectFit="cover"
        borderRadius="lg"
      />
      <HStack
        position="absolute"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        spacing={2}
      >
        {images?.map((_, index) => (
          <Box
            key={index}
            w={index === currentImage ? 7 : 2}
            h={2}
            borderRadius="full"
            bg={index === currentImage ? "primary" : "whiteAlpha.600"}
            cursor="pointer"
            onClick={() => setCurrentImage(index)}
          />
        ))}
      </HStack>
      <IconButton
        icon={<ChevronLeft size="30px" />}
        position="absolute"
        p={5}
        borderRadius="full"
        left={4}
        top="50%"
        transform="translateY(-50%)"
        onClick={() => setCurrentImage((prev) => (prev > 0 ? prev - 1 : images?.length - 1))}
        variant="solid"
        colorScheme="blackAlpha"
        aria-label="Previous image"
      />
      <IconButton
        icon={<ChevronRight size="30px" />}
        position="absolute"
        p={5}
        borderRadius="full"
        right={4}
        top="50%"
        transform="translateY(-50%)"
        onClick={() => setCurrentImage((prev) => (prev < images?.length - 1 ? prev + 1 : 0))}
        variant="solid"
        colorScheme="blackAlpha"
        aria-label="Next image"
      />
    </Box>
  )
}



export default function RentalDetails() {
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const {listingId} = useParams();
    const [reviews, setReviews] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoadingState] = useState(true);
    const [listing, setListing] = useState();
    const {authUser, axios, notify, commaInt, otherContext, setOtherContext} = useContext(GlobalStore);
    const [isMobile] = useMediaQuery('(max-width: 768px)');

    async function getData(){
      try{
        // console.log("Other Context", oth)
        const res = await axios.get(`/listings/rentals/${listingId}/`);
        let data = objectifyJSON(res.data);
        if (res.status === 200){
          setListing(data.data.listing);
          setRecommended(data.data.recommended);
          let rats = [], _reviews = data.data.listing.vehicle.dealer.reviews;
          setReviews(_reviews)
          for(var i=0; i < _reviews?.length; i++){
            console.log("Rat:", _reviews[i].ratings)
            rats.push(_reviews[i].ratings);
          }
          setRatings(rats)
        }
      }catch(error){
        console.log("Error getting ratings", error)
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

  return (
    <Box minH="100vh">
        <Container maxW="container.xl" pt={5} pb={16}>
            <LocationBreadcrumb label={listing?.title} />

            <Grid
             templateColumns={{base: '1fr', md: '2fr 1fr' }}
             templateAreas={{base: 'unset', md: `"listing form"`}}
             mt={10}
             gap={8}
            >

              {/* Right Column - Booking Form */}
              <BookingForm listing={listing} gridArea={{base:'unset', md: "form"}} />

              {/* Left Column */}
              <Box gridArea={{base:'unset', lg: "listing"}}>
                <ImageCarousel
                  images={listing?.vehicle?.images}
                />

                <Box mt={8}>
                  <HStack justify="space-between" mb={4}>
                    <Box>
                      <Heading size="lg">{listing?.title}</Heading>
                      <HStack spacing={1}>
                        <Text>5.0</Text>
                        <Icon as={Star} fill="yellow" color="orange" />
                        <Text color="gray.500">(5 leases)</Text>
                      </HStack>
                    </Box>
                    <Heading size="lg">₦{commaInt(listing?.price)}<Text className="small" color="gray.700" fontWeight="light" as="span">/{listing?.payment_cycle}</Text></Heading>
                  </HStack>

                  <Box mb={8}>
                    <Heading size="md" fontWeight={'500'} mb={4}>Description</Heading>
                    <Text color="gray.600" borderRadius="10px" px={2} py={3} border="1px solid gray">
                      {listing?.notes}
                    </Text>
                  </Box>

                  <Box mb={8}>
                    <Heading size="md" mb={4} fontWeight={'500'}>Features & Accessories</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {listing?.vehicle?.features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} />
                      ))}
                    </SimpleGrid>
                  </Box>

                  <Box mb={8}>
                    <Heading size="md" mb={4} fontWeight={'500'}>Host</Heading>
                    <HStack spacing={4}>
                      <Avatar size="lg" src={listing?.vehicle?.dealer?.logo} name={listing?.vehicle?.dealer?.business_name} />
                      <Box flex={1}>
                        <HStack>
                          <Heading size="sm">{listing?.vehicle?.dealer?.business_name}</Heading>
                          <Badge colorScheme="blue">
                            <HStack spacing={1}>
                              <CheckCircle size={12} />
                              <Text>VERIFIED</Text>
                            </HStack>
                          </Badge>
                        </HStack>
                        <HStack spacing={1}>
                          <Icon as={Star} color="tertiary" fill="tertiary" />
                          <Text>{listing?.vehicle?.dealer?.rating}</Text>
                          <Text color="gray.500">({reviews?.length} review{reviews?.length > 1 && 's'})</Text>
                        </HStack>
                      </Box>
                    </HStack>
                    <Text fontSize="sm">
                      Top rated host on Motaa with exceptional rental provides on <span className="bold">Motaa</span>
                    </Text>
                  </Box>

                  {/* Ratings */}
                    <RatingCard
                     avg_rating={listing?.vehicle?.dealer?.rating}
                     ratings={ratings}
                    />

                  <VStack align="stretch" mb={4} spacing={6}>
                    {reviews?.map((review, index) => (
                      <ReviewCard
                        key={index}
                        review={review}
                      />
                    ))}
                  </VStack>
        


                  <Button as={Link} to={`/dealership/${listing?.vehicle?.dealer?.uuid}`} variant="outline" color="primary" colorScheme="blue">
                    See more reviews
                  </Button>

                  {/* Recommended Cars */}
                  <Stack display={recommended?.length < 1 &&  'none'}>
                      <Heading textAlign="center" size="md" my={3}> Recommended Cars for You </Heading>

                      <SimpleGrid
                       minChildWidth="300px"
                       maxChildWidth={'350px'}
                       placeItems={isMobile ? 'center' : 'unset'}
                       gap={8}
                       spacing={8}
                       columns={{base: 1, md: 2, lg: 3, xl: 4}}
                      >
                          {recommended?.map((listing, idx) =>
                              <ListingItemCard
                               listing={listing}
                               key={idx}
                               w="100%"
                               maxW={'350px'}
                              />
                          )}
                      </SimpleGrid>
                  </Stack>

                </Box>
              </Box>
            </Grid>
      </Container>
    </Box>
  )
}



const BookingForm = ({ listing, ...props }) => {
  const {authUser, axios, notify, commaInt, otherContext, setOtherContext} = useContext(GlobalStore);
  const [from, setFrom] = useState(otherContext?.rental?.from);
  const [until, setUntil] = useState(otherContext?.rental?.until);
  const [where, setLocation] = useState(otherContext?.rental?.where);

  console.log("Other context:", otherContext.rental)

  return(
    <Box {...props}>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        p={6}
        bg="white"
        boxShadow="sm"
      >
        <VStack spacing={4} align="stretch">
          <Box>
            <Text mb={2}>From</Text>
            <DatePicker defaultValue={from} onChange={val => setFrom(val)} w="100%" />
          </Box>
          
          <Box>
            <Text mb={2}>Until</Text>
            <DatePicker defaultValue={until} onChange={val => setUntil(val)} w="100%" />
          </Box>

          <Box>
            <Text mb={2}>Location</Text>
            <Input type="address" name="location" onInput={e => setLocation(e.target.value)} value={where} placeholder="Select location" />
          </Box>

          <HStack justify="space-between">
            <Text>Driver</Text>
            <Switch colorScheme="blue" />
          </HStack>

          <Button
           as={Link}
           to={`/checkout/?listingId=${listing?.uuid}`}
           colorScheme="blue"
           bg="primary"
           size="lg"
           isDisabled={where?.trim() ? false : true}
           borderRadius="10px"
          >
            Book Rental
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}



