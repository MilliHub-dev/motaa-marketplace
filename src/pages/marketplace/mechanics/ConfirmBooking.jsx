import { useState, useEffect, useContext } from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Avatar,
  HStack,
  VStack,
  Image,
  Alert,
  AlertIcon,
  Textarea,
} from "@chakra-ui/react"
import {
  BsCash,
  BsGeoAlt,
  BsTools,
  BsCreditCard,
  BsInfoCircle,
  BsStarFill,
  BsChevronDown,
  BsSend,
  BsAward,
} from "react-icons/bs"
import { MapComponent, CustomPlacesAutocomplete } from "../../../components/maps";
import { BackButton } from "../../../components/nav";
import { ChatPopup } from "../../../components/chat";
import { objectifyJSON, jsonifyObject } from "../../../utils";
import { GlobalStore } from "../../../App";
import {useParams, useSearchParams} from "react-router-dom";


const ConfirmBooking = () => {
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [problemDescription, setProblemDescription] = useState("")
  const [mechanic, setMechanic] = useState()
  const [loading, setLoading] = useState(true)
  const [showChatPopup, setChatPopupState] = useState(false)
  const [location, setLocation] = useState({lat: 10, lng: 8, name: 'Current Location'});
  const {axios, notify, redirect} = useContext(GlobalStore)

  const {mechId} = useParams();
  const [params] = useSearchParams();
  const service = params.get('service')
  const address = params.get('address')
  const lat = params.get('lat')
  const lng = params.get('lng')


  function init(){
    getData();
    setTimeout(() => setLoading(false), 2000)
  }

  async function getData(){
    const res = await axios.get(`/mechanics/${mechId}`);
    const data = objectifyJSON(res.data);
    if (res.status === 200){
      console.log("Got Mechanic:", data.data)
      setMechanic(data?.data);
    }
  }


  const toggleIssue = (issue) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue))
    } else {
      setSelectedIssues([...selectedIssues, issue])
    }
  }

  useEffect(() => {
    init();
  }, [])

  if (loading){
    return null
  }

  return (
    <Container maxW="full" p={0}>
      <Flex direction={{ base: "column", md: "row" }} minH="100vh">
        {/* Left Side - Booking Details */}
        <Box w={{ base: "100%", md: "40%" }} p={6} borderRight="1px solid" borderColor="gray.200">
          <VStack align="stretch" spacing={3}>
            <Box>
              <BackButton />
            </Box>

            <Box>
              <Heading as="h1" size="lg" fontWeight="bold" mb={4}>
                Confirm your booking
              </Heading>
            </Box>

            {/* Mechanic Profile */}
            <Flex align="center">
              <Avatar size="lg" src={mechanic?.logo} name={mechanic?.business_name ? mechanic?.business_name : mechanic?.user?.name} mr={4} />
              <Box>
                <Heading as="h2" size="md" fontWeight="semibold">
                  {mechanic?.business_name ? mechanic?.business_name : mechanic?.user?.name}
                </Heading>
                <HStack spacing={2} mt={1}>
                  <Icon as={BsAward} color="blue.500" />
                  <Text fontWeight="medium" color="gray.700" fontSize="sm">
                    Top Rated
                  </Text>
                  <Text color="gray.400">•</Text>
                  <HStack spacing={1}>
                    <Text fontWeight="bold">{mechanic?.rating}</Text>
                    <Icon as={BsStarFill} color="yellow.400" />
                    <Text color="gray.500" fontSize="sm">
                      ({mechanic?.reviews?.length} Reviews)
                    </Text>
                  </HStack>
                </HStack>
              </Box>
            </Flex>

            {/* Location */}
            <HStack my={1}>
              <Icon as={BsGeoAlt} color="blue.500" boxSize={5} />
              <Text>
                <Text as="span" fontWeight="medium">
                  Your Location:
                </Text>{" "}
                No.15 Ibrahim Babangida Way
              </Text>
            </HStack>

            {/* Service */}
            <HStack my={1}>
              <Icon as={BsTools} color="blue.500" boxSize={5} />
              <Text>
                <Text as="span" fontWeight="medium">
                  Service:
                </Text>{" "}
                Engine servicing
              </Text>
            </HStack>

            {/* Booking Fee */}
            <HStack my={1}>
              <Box
                bg="green.500"
                color="white"
                p={1}
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <BsCreditCard size={16} />
              </Box>
              <Text>
                <Text as="span" fontWeight="medium">
                  Booking Fee:
                </Text>{" "}
                <Text as="span" fontWeight="bold">
                  ₦5,000
                </Text>
              </Text>
            </HStack>

            {/* Info Box */}
            <Alert colorScheme="blue" status="info" borderRadius="md" py={3}>
              <AlertIcon as={BsInfoCircle} />
              <Text fontSize="sm" colorScheme="blue">
                The Booking fee is a consultation fee charged by all mechanics, this fee does not cover services
                delivered by the mechanics.
              </Text>
            </Alert>

            {/* Payment Method */}
            <Box>
              <Text fontWeight="medium" mb={2}>
                Choose payment method
              </Text>
              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={3}
                cursor="pointer"
                _hover={{ borderColor: "gray.300" }}
              >
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Box
                      bg="green.500"
                      color="white"
                      p={1}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <BsCash size={16} />
                    </Box>
                    <Text fontWeight="medium">Cash</Text>
                    <Text fontWeight="medium">Wallet</Text>
                    <Text fontWeight="medium">Cash</Text>
                    <Text fontWeight="medium">Cash</Text>
                  </HStack>
                  <Icon as={BsChevronDown} />
                </Flex>
              </Box>
            </Box>


            {/* Action Buttons */}
            <VStack spacing={3} mt={4}>
              <Button w="full" colorScheme="blue" size="lg" bg="#0460cc" _hover={{ bg: "#0354b4" }} borderRadius="md">
                Confirm Booking
              </Button>
              <Button
                w="full"
                variant="outline"
                size="lg"
                borderColor="gray.300"
                color="gray.600"
                borderRadius="md"
                leftIcon={<BsSend />}
                onClick={() => setChatPopupState(true)}
              >
                Contact
              </Button>
            </VStack>
          </VStack>
        </Box>

        {/* Right Side - Map */}
        <Box w={{ base: "100%", md: "60%" }} position="relative">
          <MapComponent
            alt="Map showing location"
            objectFit="cover"
            w="100%"
            h="100%"
            location={location}            
          />
        </Box>
      </Flex>

      <ChatPopup
       isOpen={showChatPopup}
       onClose={() => setChatPopupState(false)}
       recipient_type="mechanic" 
       recipient_id={mechanic?.uuid}
      />
    </Container>
  )
}

// Helper component for icons
const Icon = ({ as, color, boxSize }) => {
  const Component = as
  return (
    <Box color={color} mr={2}>
      {<Component size={boxSize ? boxSize * 4 : 16} />}
    </Box>
  )
}

export default ConfirmBooking
