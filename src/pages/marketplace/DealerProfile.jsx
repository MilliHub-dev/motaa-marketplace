import {
  Box,
  Container,
  HStack,
  VStack,
  Text,
  Button,
  Avatar,
  Badge,
  Image,
  SimpleGrid,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import {useState, useEffect, useContext} from 'react';
import {useParams, } from 'react-router-dom';
import {GlobalStore} from '../../App';
import {objectifyJSON, jsonifyObject} from '../../utils';
import { 
  MessageCircle, MapPin, Clock, Star,
  MessageSquare,  Bell, ShoppingCart, User,
  MoreVertical, Building2, CheckCircle, Share2,
} from 'lucide-react';


function Stats({ number, label }) {
  return (
    <VStack spacing={1}>
      <Text fontWeight="bold" fontSize="lg">
        {number}
      </Text>
      <Text color="gray.600" fontSize="sm">
        {label}
      </Text>
    </VStack>
  )
}

function ServiceTag({ children }) {
  return (
    <Badge
      px={3}
      py={1}
      bg="gray.100"
      color="gray.800"
      rounded="full"
      fontSize="sm"
    >
      {children}
    </Badge>
  )
}

function RatingCard() {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bg="white"
      boxShadow="sm"
    >
      <HStack spacing={3} mb={4}>
        <Avatar
          size="sm"
          name="MANGA AUTOS"
          src="/placeholder.svg?height=32&width=32"
        />
        <Box>
          <HStack>
            <Text fontWeight="bold">MANGA AUTOS</Text>
            <Badge colorScheme="blue">
              <CheckCircle size={12} />
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            ABUJA, NIGERIA
          </Text>
        </Box>
      </HStack>

      <HStack spacing={1} mb={2}>
        <Text fontWeight="bold" fontSize="xl">
          5.0
        </Text>
        <Star fill="currentColor" color="yellow.400" size={20} />
        <Text color="gray.600" fontSize="sm">
          (2k reviews)
        </Text>
      </HStack>

      <VStack align="stretch" spacing={2}>
        <HStack color="gray.600" fontSize="sm">
          <Clock size={16} />
          <Text>Opens 9:00AM - 6:00PM</Text>
        </HStack>
        <HStack color="gray.600" fontSize="sm">
          <MessageSquare size={16} />
          <Text>Responds in 15 minutes</Text>
        </HStack>
      </VStack>
    </Box>
  )
}

export default function DealerProfile() {
  const {axios, authUser, notify} = useContext(GlobalStore);
  const [dealer, setDealer] = useState({});
  const [loading, setLoading] = useState(true);
  const {dealerId} = useParams();

  async function getData(){
    const res = await axios.get(`/listings/dealer/${dealerId}/`);
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      setDealer(data);
    }
  }

  function init(){
    getData();
    setTimeout(() => setLoading(false), 2500)
  }

  useEffect(() => {
    init();
  }, [])


  if (loading){
    return null;
  }

  return (
    <Box minH="100vh">
      {/* Cover Image */}
      <Box position="relative" h="300px">
        <Image
          src="/assets/images/features-image-1.png"
          alt="Dealer cars"
          w="full"
          h="full"
          objectFit="cover"
        />
      </Box>

      <Container maxW="container.lg" py={0}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} as={Flex} alignItems="self-start">
          {/* Main Content */}
          <Box gridColumn="span 2">
            {/* Profile Header */}
            <HStack spacing={4} mb={6}>
              
              <Box
                mt={'-20px'}
                bg="white"
                borderRadius={'50%'}
                zIndex={'20'}
                p={2}
              >
                <Avatar
                  size="lg"
                  name="MANGA AUTOS"
                  src="/placeholder.svg?height=96&width=96"
                />
              </Box>

              <Box flex={1}>
                <HStack py={2}>
                  <Text fontSize="lg" fontWeight="bold">
                    MANGA AUTOS
                  </Text>
                  <Badge colorScheme="blue">
                    <CheckCircle size={16} />
                  </Badge>
                </HStack>
                <HStack spacing={2}>
                  <Badge variant="subtle" colorScheme="blue">
                    Car Dealership
                  </Badge>
                  <HStack spacing={1}>
                    <MapPin size={16} />
                    <Text>Abuja, Nigeria</Text>
                  </HStack>
                </HStack>
              </Box>


              <HStack>
                <Button leftIcon={<MessageCircle size={20} />} colorScheme="gray" variant="outline" borderRadius="30px"> Message </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<MoreVertical size={20} />}
                    variant="ghost"
                  />
                  <MenuList placement="left">
                    <MenuItem icon={<Share2 size={16} />}>Share Profile</MenuItem>
                    <MenuItem>Report Dealer</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </HStack>

            {/* Stats */}
            <HStack spacing={8} mb={6}>
              <Stats number="1,456" label="Listings" />
              <Stats number="180.2K" label="Followers" />
              <Stats number="78" label="Following" />
            </HStack>

            {/* Bio */}
            <Box mb={6}>
              <Text fontSize="sm" color="gray.600">
                We are verified dealers in all types of motor vehicle. RC: 3403974
                🇳🇬. We deal with brand new, foreign used, and Neatly used cars.
                We got you covered💯
              </Text>
            </Box>

            {/* Services */}
            <Box mb={6}>
              <Text fontWeight="medium" mb={3}>
                Services
              </Text>
              <Flex gap={2} flexWrap="wrap">
                <ServiceTag>Car Sale</ServiceTag>
                <ServiceTag>Car Dealership</ServiceTag>
                <ServiceTag>Car Finance Agent</ServiceTag>
                <ServiceTag>Car Leasing</ServiceTag>
                <ServiceTag>Car Loans</ServiceTag>
                <ServiceTag>Sell-Your-Car</ServiceTag>
              </Flex>
            </Box>

            <Divider mb={6} />
          </Box>

          {/* Sidebar */}
          <Box position="relative" top={'10px'}>
            <RatingCard />
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  )
}

