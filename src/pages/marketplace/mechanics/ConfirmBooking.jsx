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
  Wrap,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
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
import {useParams, useSearchParams, useNavigate} from "react-router-dom";
import { usePaystackPayment, PaystackButton } from 'react-paystack';
import { CashMoneyIcon, EmptyWalletIcon, TopRatedBadgeIcon } from "../../../components/icons";


const PAYSTACK_LIVE_KEY = (import.meta.env.VITE_PAYSTACK_LIVE_PUBLIC_KEY);

const PaymentButton = ({ config, onSuccess, onClose }) => {
  const handlePayment = usePaystackPayment(config);
  const componentProps = {
    ...config,
    text: 'Confirm Booking',
    onSuccess: (reference) => onSuccess(reference),
    onClose: () => onClose(),
  }

  return(
    <Button
     as={PaystackButton}
     colorScheme="blue"
     bg="primary" size="lg"
     w="full" {...componentProps}
    />
  )
}

const ConfirmBooking = () => {
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [description, setDescription] = useState("")
  const [services, setServices] = useState([])
  const [location, setLocation] = useState({lat: 10, lng: 8, name: 'Current Location'});
  const [mechanic, setMechanic] = useState()
  const [loading, setLoading] = useState(true)
  const [showChatPopup, setChatPopupState] = useState(false)
  const {axios, notify, authUser} = useContext(GlobalStore);
  const redirect = useNavigate();


  const {mechId} = useParams();
  const [params] = useSearchParams();
  const address = params.get('address');
  const lat = params.get('lat')
  const lng = params.get('lng')


  const getFinalAmount = (amt) => {
    return (amt * 100)
  }

  const onModalClose = (ev) => {
    console.log("modal closed", ev)
  }

  const onPaymentComplete = async (response) => {

    if (response && response.status === 'success'){
      const payload = {
        services,
        transaction_id: response.reference,
        problem_description: description,
      }

      const res = await axios.post(`/mechanics/${mechId}/`, jsonifyObject(payload));
      const data = objectifyJSON(res.data);
      console.log("Payload:", payload)

      if (res.status === 200){
        setTimeout(() => redirect('/home'), 300);
        setTimeout(() => notify({
          title: 'Booking Request sent!',
          color: 'green',
          level: 'success'
        }))

        return
      }

      return notify({
        title: "Error",
        body: data.message,
        color: 'red'
      })
    }

    return notify({
      title: "Payment failed",
      body: response.message,
      color: 'red'
    })


  }

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

  const config = {
    publicKey: PAYSTACK_LIVE_KEY,
    reference: 'mch-bk-'.concat((new Date()).getTime().toString()),
    amount: getFinalAmount(100),
    email: authUser?.email,
    onSuccess: onPaymentComplete,
    metadata: {
      display_name: 'Transaction Type',
      variable_name: 'Transaction_Type',
      value: 'Mechanic Booking Fee',
    }
  };

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
                  <Flex alignItems="center">
                    <TopRatedBadgeIcon viewBox="0 0 25 24" width="20px" height="20px" />
                    <Text fontWeight="600" color="gray.700" fontSize="sm">{mechanic?.level}</Text>
                  </Flex>

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
              <Text>{address}</Text>
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

            <Box my={2}>
              <Text mb={1} fontWeight="600"> Problem Description </Text>
              <Textarea value={description} onInput={e => setDescription(e.target.value)} placeholder="Please describe your problem"> </Textarea>
            </Box>

            <MultiSelectPills options={mechanic?.services?.map(service => service?.service)} onChange={setServices}  />

            {/* Payment Method */}
            <Box>
              <Text fontWeight="medium" mb={2}>
                Choose payment method
              </Text>
              <Menu
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={3}
                cursor="pointer"
                width="100%"
                _hover={{ borderColor: "gray.300" }}
              >
                <MenuButton as={Button} textAlign="left" w="100%" align="center" size="lg" rightIcon={<BsChevronDown />}>
                  {
                    paymentMethod === 'cash' ?
                    <> <CashMoneyIcon size={16} /> Cash </>
                    :
                    <> <EmptyWalletIcon size={16} /> Wallet </>
                  }
                </MenuButton>

                <MenuList w="100%">
                  <MenuItem onClick={e => setPaymentMethod('wallet')} borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                    <EmptyWalletIcon size={16} /> Wallet
                  </MenuItem>
                  <MenuItem onClick={e => setPaymentMethod('cash')} borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                    <CashMoneyIcon size={16} /> Cash
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>


            {/* Action Buttons */}
            <VStack spacing={3} mt={4}>
              <PaymentButton onSuccess={onPaymentComplete} onClose={onModalClose} config={config} />
              
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



const MultiSelectPills = ({ options = [], onChange }) => {
  const [selected, setSelected] = useState([]);

  const handleSelect = (option) => {
    if (!selected.includes(option)) {
      const updated = [...selected, option];
      setSelected(updated);
      onChange(updated);
    }
  };

  const handleUnselect = (option) => {
    const updated = selected.filter((item) => item !== option);
    setSelected(updated);
    onChange(updated);
  };

  const availableOptions = options.filter((opt) => !selected.includes(opt));

  return (
    <Box rounded="md" border="1px solid lavender" p={3} my={3}>
      <Text fontWeight="bold" mb={2}>
        Services
      </Text>
      <Wrap mb={2}>
        {availableOptions.length < 1 && <Text> Nothing more to choose from. </Text>}
        {availableOptions.map((option, idx) => (
          <WrapItem key={idx}>
            <Tag
              size="lg"
              variant="subtle"
              colorScheme="gray"
              cursor="pointer"
              onClick={() => handleSelect(option)}
              borderRadius="full"
            >
              <TagLabel>{option}</TagLabel>
            </Tag>
          </WrapItem>
        ))}
      </Wrap>

      <Text fontWeight="bold" mb={2} borderBottom={'1px solid gray'} pb={3}></Text>
      <Wrap>
        {selected.length < 1 && <Text> Select at least 1 service you need </Text>}
        {selected.map((option, idx) => (
          <WrapItem key={idx}>
            <Tag
              size="lg"
              variant="solid"
              colorScheme="blue"
              borderRadius="full"
            >
              <TagLabel>{option}</TagLabel>
              <TagCloseButton onClick={() => handleUnselect(option)} />
            </Tag>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  );
};


export default ConfirmBooking
