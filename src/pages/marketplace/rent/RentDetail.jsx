import { Fragment, useContext, useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { GlobalStore } from "../../../App";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { LocationBreadcrumb} from "../../../components";
import { Country, State, City } from 'country-state-city';
import { ListingDetailSkeleton } from "../../../components/loaders";
import { ChevronLeft, ChevronRight, Star, Users, DoorOpen, Zap, Gauge, Key, Camera, Music, Smartphone, Sun, BatteryCharging, Shield, CheckCircle, MessageCircle, Heart, Share2 } from 'lucide-react'
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
} from '@chakra-ui/react'


// Image Carousel Component
function ImageCarousel({ images }) {
  const [currentImage, setCurrentImage] = useState(0)

  return (
    <Box position="relative">
      <Image
        src={images[currentImage].url}
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
        {images.map((_, index) => (
          <Box
            key={index}
            w={2}
            h={2}
            borderRadius="full"
            bg={index === currentImage ? "white" : "whiteAlpha.600"}
            cursor="pointer"
            onClick={() => setCurrentImage(index)}
          />
        ))}
      </HStack>
      <IconButton
        icon={<ChevronLeft />}
        position="absolute"
        left={4}
        top="50%"
        transform="translateY(-50%)"
        onClick={() => setCurrentImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
        variant="solid"
        colorScheme="blackAlpha"
        aria-label="Previous image"
      />
      <IconButton
        icon={<ChevronRight />}
        position="absolute"
        right={4}
        top="50%"
        transform="translateY(-50%)"
        onClick={() => setCurrentImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
        variant="solid"
        colorScheme="blackAlpha"
        aria-label="Next image"
      />
    </Box>
  )
}

// Feature Card Component
function FeatureCard({ icon, label }) {
  return (
    <HStack
      p={3}
      bg="gray.50"
      borderRadius="md"
      spacing={3}
    >
      <Icon as={icon} />
      <Text fontSize="sm">{label}</Text>
    </HStack>
  )
}

// Review Card Component
function ReviewCard({ name, rating, date, comment, avatar }) {
  return (
    <Box mb={6}>
      <HStack mb={2}>
        <Avatar size="sm" name={name} src={avatar} />
        <Box>
          <Text fontWeight="medium">{name}</Text>
          <HStack spacing={1}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                as={Star}
                color={i < rating ? "yellow.400" : "gray.300"}
                fill={i < rating ? "currentColor" : "none"}
                w={3}
                h={3}
              />
            ))}
          </HStack>
        </Box>
        <Text fontSize="sm" color="gray.500" ml="auto">
          {date}
        </Text>
      </HStack>
      <Text color="gray.600" fontSize="sm">
        {comment}
      </Text>
    </Box>
  )
}

// Car Card Component
function CarCard({ image, title, price, rating, reviews, host }) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
    >
      <Image
        src={image || "/placeholder.svg?height=200&width=300"}
        alt={title}
        h="200px"
        w="full"
        objectFit="cover"
      />
      <Box p={4}>
        <HStack justify="space-between" mb={2}>
          <Heading size="sm">{title}</Heading>
          <Badge colorScheme="blue">VERIFIED</Badge>
        </HStack>
        <HStack spacing={1} mb={2}>
          <Icon as={Star} color="yellow.400" />
          <Text>{rating}</Text>
          <Text color="gray.500">({reviews} reviews)</Text>
        </HStack>
        <Text fontWeight="bold" fontSize="xl" color="blue.600">
          ₦{price.toLocaleString()}/hour
        </Text>
        <Text fontSize="sm" color="gray.500">
          by {host}
        </Text>
      </Box>
    </Box>
  )
}

export default function RentalDetails() {
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const {listingId} = useParams();
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoadingState] = useState(true);
    const [listing, setListing] = useState();
    const {authUser, axios, notify, commaInt} = useContext(GlobalStore);

    async function getData(){
        try{

            const res = await axios.get(`/listings/rentals/${listingId}/`);
            let data = objectifyJSON(res.data);
            if (res.status === 200){
                setListing(data.data.listing);
                setRecommended(data.data.recommended);
                console.log(data.data.listing)
            }
        }catch(error){
            
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

  const features = [
    { icon: Key, label: 'Keyless Entry' },
    { icon: Camera, label: 'Parking Camera' },
    { icon: Music, label: 'Car Play' },
    { icon: Smartphone, label: 'Android Auto' },
    { icon: Sun, label: 'Moon Roof' },
    { icon: BatteryCharging, label: 'USB C Charging' },
    { icon: Shield, label: 'Lane Assist' },
    { icon: Zap, label: 'Wireless Charging' },
  ]

  const ratings = {
    Cleanliness: 4.8,
    Communication: 4.7,
    Maintenance: 4.9,
    Accuracy: 4.8,
    Convenience: 4.9,
  }

  return (
    <Box minH="100vh">
        <Container maxW="container.xl" pt={5} pb={16}>
            <LocationBreadcrumb label={listing?.title} />

            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} mt={10} gap={8}>
              {/* Left Column */}
              <Box>
                <ImageCarousel
                  images={listing?.vehicle?.images}
                />

                <Box mt={8}>
                  <HStack justify="space-between" mb={4}>
                    <Box>
                      <Heading size="lg">{listing?.title}</Heading>
                      <HStack spacing={1}>
                        <Icon as={Star} color="yellow.400" />
                        <Text>5.0</Text>
                        <Text color="gray.500">(89 trips)</Text>
                      </HStack>
                    </Box>
                    <Heading size="lg" color="blue.600">₦{commaInt(listing?.price)}/{listing?.cycle}</Heading>
                  </HStack>

                  <Box mb={8}>
                    <Heading size="md" mb={4}>Features & Accessories</Heading>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                      ))}
                    </SimpleGrid>
                  </Box>

                  <Box mb={8}>
                    <Heading size="md" fontWeight={'500'} mb={4}>Description</Heading>
                    <Text color="gray.600">
                      Experience luxury redefined with our 2023 Rolls Royce Ghost. 
                      This masterpiece combines timeless elegance with cutting-edge technology, 
                      offering an unparalleled driving experience.
                    </Text>
                  </Box>


                  <Box mb={8}>
                    <Heading size="md" mb={4}>Host</Heading>
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
                          <Icon as={Star} color="yellow.400" />
                          <Text>5.0</Text>
                          <Text color="gray.500">(234 reviews)</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Top rated host on Motaa with exceptional rental provides on Motaa
                        </Text>
                      </Box>
                    </HStack>
                  </Box>


                  <Box mb={8}>
                    <Heading size="md" mb={4}>Ratings & reviews</Heading>
                    <HStack spacing={2} mb={6}>
                      <Heading size="lg">5.0</Heading>
                      <Icon as={Star} color="yellow.400" w={6} h={6} />
                    </HStack>

                    <VStack align="stretch" spacing={4} mb={8}>
                      {Object.entries(ratings).map(([category, rating]) => (
                        <Box key={category}>
                          <HStack justify="space-between" mb={2}>
                            <Text>{category}</Text>
                            <Text>{rating}</Text>
                          </HStack>
                          <Progress value={rating * 20} colorScheme="blue" />
                        </Box>
                      ))}
                    </VStack>

                    <VStack align="stretch" spacing={6}>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <ReviewCard
                          key={index}
                          name="Musa Adams"
                          rating={5}
                          date="10 hours ago"
                          comment="Good host, normally replies fast. The Rolls Royce served well for me and my date, I will surely come back to rent the car again."
                          avatar="/placeholder.svg?height=40&width=40"
                        />
                      ))}
                    </VStack>

                    <Button variant="ghost" colorScheme="blue">
                      See more reviews
                    </Button>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4}>Recommended cars for you</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      {recommended?.map((car, index) => (
                        <CarCard key={index} {...car} />
                      ))}
                    </SimpleGrid>
                  </Box>
                </Box>
              </Box>

              {/* Right Column - Booking Form */}
              <Box position="sticky" top={24}>
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
                      <Input type="datetime-local" />
                    </Box>
                    <Box>
                      <Text mb={2}>Until</Text>
                      <Input type="datetime-local" />
                    </Box>
                    <Box>
                      <Text mb={2}>Pickup Location</Text>
                      <Select placeholder="Select location">
                        <option>Lagos Phase 1</option>
                        <option>Abuja Central</option>
                      </Select>
                    </Box>
                    <Box>
                      <Text mb={2}>Return Location</Text>
                      <Select placeholder="Select location">
                        <option>Lagos Phase 1</option>
                        <option>Abuja Central</option>
                      </Select>
                    </Box>

                    <HStack justify="space-between">
                      <Text>Driver</Text>
                      <Switch colorScheme="blue" />
                    </HStack>

                    <Button colorScheme="blue" bg="primary" size="lg">
                      Book Rental
                    </Button>
                  </VStack>
                </Box>
              </Box>
            </Grid>
      </Container>
    </Box>
  )
}



