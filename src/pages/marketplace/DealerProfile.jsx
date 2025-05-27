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
  Heading,
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
import {BackButton} from '../../components/nav';
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
      px={4}
      py={2}
      bg="gray.200"
      color="gray.800"
      rounded="full"
      textTransform="capitalize"
      fontSize="md"
    >
      {children}
    </Badge>
  )
}

function RatingCard({ dealer }) {
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
          size="lg"
          name={dealer?.business_name}
          src={dealer?.logo}
        />
        <Box>
          <HStack>
            <Text fontWeight="bold">{dealer?.business_name}</Text>
            <Badge colorScheme="blue">
              <CheckCircle size={12} />
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            {dealer?.location}
          </Text>
        </Box>
      </HStack>

      <HStack spacing={1} mb={2}>
        <Text fontWeight="bold" fontSize="xl">
          {dealer?.rating || '0.0'}
        </Text>
        <Star fill="currentColor" color="yellow.400" size={20} />
        <Text color="gray.600" fontSize="sm">
          ({dealer?.reviews?.length} reviews)
        </Text>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {/*<HStack color="gray.600" fontSize="sm">
          <Clock size={16} />
          <Text>Opens 9:00AM - 6:00PM</Text>
        </HStack>*/}

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
      setDealer(data.data);
      console.table(data.data)
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

        <BackButton
          position={'absolute'}
          left={'30px'}
          top={'10%'}
          variant="solid"
          color="white"
        />
      </Box>

      <Container maxW={'1100px'} py={0}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} as={Flex} alignItems="self-start">
          {/* Main Content */}
          <Box gridColumn="span 2">
            {/* Profile Header */}
            <HStack spacing={4} mb={6}>
              
              <Box
                mt={'-20px'}
                bg="white"
                borderRadius={'50%'}
                zIndex={'1'}
                p={2}
              >
                <Avatar
                  size="xl"
                  name={dealer?.business_name}
                  src={dealer?.logo}
                />
              </Box>

              <Box flex={1}>
                <HStack py={2}>
                  <Text fontSize="lg" fontWeight="bold">
                    {dealer?.business_name}
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
              <Stats number={dealer?.listings?.length} label="Listings" />
              <Stats number={dealer?.listings?.length} label="Deals" />
              {/*<Stats number="180.2K" label="Followers" />
              <Stats number="78" label="Following" />*/}
            </HStack>

            {/* Bio */}
            <Box mb={6}>
              <Heading size="md" my={2}>Bio </Heading>
              <Text color="gray.600">{dealer?.about}</Text>
            </Box>

            {/* Services */}
            <Box mb={6}>
              <Heading size="md" my={2}>Services </Heading>
              <Flex gap={2} flexWrap="wrap">
                {dealer?.services?.map(service => 
                  <ServiceTag key={service}>{service}</ServiceTag>
                )}
              </Flex>
            </Box>

            <Divider mb={6} />
          </Box>

          {/* Sidebar */}
          <Box position="relative" top={'10px'}>
            <RatingCard dealer={dealer} />
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  )
}

