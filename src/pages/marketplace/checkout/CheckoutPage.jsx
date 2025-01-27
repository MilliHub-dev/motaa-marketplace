import {useState, useEffect, useContext} from 'react';
import {motion} from "framer-motion";
import {useParams, useSearchParams, Link} from 'react-router-dom';
import {GlobalStore} from "../../../App";
import {objectifyJSON, jsonifyObject} from "../../../utils";
import {
  Box,
  Container,
  Heading,
  VStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Text,
  Image,
  HStack,
  Flex,
  Badge,
  Divider,
  IconButton,
  InputGroup,
  InputLeftAddon,
  FormErrorMessage,
  RadioGroup,
  Checkbox,
  Radio,
  useRadio,
  useRadioGroup,
} from '@chakra-ui/react'
import { Clock, Gauge, Zap, MoreVertical, PiggyBank, Wallet, CreditCard, Warehouse, BanknoteIcon } from 'lucide-react'


const PaymentOptions = [
  { icon: Wallet, label: 'Pay with Wallet', value: 'wallet' },
  { icon: CreditCard, label: 'Pay Online', value: 'card' },
  { icon: BanknoteIcon, label: 'Pay After Inspection', value: 'inspection' },
  { icon: Warehouse, label: 'Reserve Vehicle', disabled: true, value: 'reserve' },
  { icon: PiggyBank, label: 'Car Financing', disabled: true, value: 'finance-aid' },
]


const RadioCard = ({ option, onInput, ...props }) => {
  const { getInputProps, getRadioProps } = useRadio(props);
  const input = getInputProps();
  const [order, setOrder] = useState({})
  const checkbox = getRadioProps();

  return(
    <VStack as={'label'} isDisabled={option.disabled ? true : false}>
      <Box
        p={4} {...checkbox}
        isDisabled={option.disabled ? true : false}
        borderWidth={1}
        borderRadius="20px"
        spacing={2}
        cursor={option.disabled ? 'not-allowed' : 'pointer'}
        position="relative"
        width={'120px'}
        height={'120px'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        _checked={{
          bg: 'primary',
          color: 'white',
          borderColor: 'grey.600',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
      >
      <option.icon size={40} />
      {option.disabled && (
        <Text
         color="white"
         fontWeight="600"
         position="absolute"
         textAlign="center"
         left={'0px'}
         width={'100%'}
         bottom={"0px"}
         bgColor="primary"
         fontSize="xs"
         py={1.5}
         borderRadius="0px 0px 20px 20px"
        >Coming Soon!</Text>
      )}
      </Box>
      <Text fontSize="sm" textAlign="center">
        {option.label}
      </Text>
      <input {...input} />
    </VStack>
  )
}


function CheckoutPage({ props }) {
  const {axios, authUser} = useContext(GlobalStore);
  const params = new URLSearchParams(document.location.search);
  const listingId = params.get('listingId');
  const [checkoutPayload, setCheckoutPayload] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    country: '', // get from phone number extension
    state: '',
    city: '', // also used as lga
    lga: '', // also used as lga
    address: '',
    zip_code: '',
    payment_option: '',
  });

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'payment-option',
    onChange: val => {
      let payload = checkoutPayload;
      payload.payment_option = val;
      setCheckoutPayload({...payload})
    },
  });

  const groupy = getRootProps();

  function init(){
    getData();
  }

  async function getData(){
    const res = await axios.get(`/listings/checkout/${listingId}/`);
    const data = objectifyJSON(res.data);

    console.log("Got Data:", data)
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <Box bg="white" minH="100vh">
      <Box bg="blue.600" py={8} mb={8}>
        <Container maxW="container.xl" textAlign="center">
          <Heading color="white" size="lg" className="subtitle" fontWeight="400">Checkout</Heading>
          <Text color="whiteAlpha.900" mt={2}>Get Ready to own a Car!</Text>
        </Container>
      </Box>

      <Container maxW="90%">
        <Flex gap={8}>
          {/* Form Section */}
          <Box flex={2.9/4} pb={10}>
            <Heading size="lg" mb={6}>Confirm your details</Heading>
            <VStack spacing={6} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>First name</FormLabel>
                  <Input defaultValue={authUser?.first_name} px={4} py={5} />
                </FormControl>

                <FormControl>
                  <FormLabel>Last name</FormLabel>
                  <Input defaultValue={authUser?.last_name} px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Phone Number</FormLabel>
                  <InputGroup>
                    <InputLeftAddon children="+234" px={4} py={5} />
                    <Input defaultValue={authUser?.phone_number} px={4} py={5} />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input defaultValue={authUser?.email} type="email" px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>State of Residency</FormLabel>
                  <Select defaultValue="FCT ABUJA" py={5}>
                    <option>FCT ABUJA</option>
                    <option>LAGOS</option>
                    <option>KANO</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>LGA</FormLabel>
                  <Select defaultValue="AMAC" py={5}>
                    <option>AMAC</option>
                    <option>BWARI</option>
                    <option>GWAGWALADA</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Current Address</FormLabel>
                <Input as={motion.textarea} minH="70px" defaultValue="No.13 Asemankase street, Wuse Zone 2 Abuja" px={4} py={5} />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Date of Birth</FormLabel>
                  <Input type="date" defaultValue="1964-12-05" px={4} py={5} />
                </FormControl>
                <FormControl>
                  <FormLabel>Postal Code (optional)</FormLabel>
                  <Input defaultValue="904012" px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              <Divider my={4} />

              <Box>
                <SimpleGrid columns={2} spacing={4} mb={4}>
                  <Text>Price:</Text>
                  <Text textAlign="right">₦41,500,000</Text>
                  <Text>0.5% VAT & fees</Text>
                  <Text textAlign="right">₦60,000</Text>
                  <Text>Inspection fee:</Text>
                  <Text textAlign="right">₦5,000</Text>
                </SimpleGrid>
                <FormControl>
                  <Input placeholder="Enter Promo Code" px={4} py={5} />
                </FormControl>
                <Divider my={4} />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total:</Text>
                  <Text>41,565,000</Text>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={4}>Choose a payment option</Text>
                <SimpleGrid columns={5} spacing={4} {...groupy}>
                  {PaymentOptions.map((option, index) => {
                    const radio = getRadioProps({ value: option.value, isDisabled: option.disabled });

                    return (
                      <RadioCard key={index} option={option} value={option.value} {...radio} />
                    )}
                  )}
                </SimpleGrid>
              </Box>

              {/*<Text fontSize="sm" color="gray.600">
                This is text field is meant to explain whatever payment option is chosen above,
                prototype would be available if needed 👍
              </Text>*/}


              <Box p={4} bg="blue.50" borderRadius="lg">
                <HStack spacing={2}>
                  <Checkbox defaultChecked />
                  <Text fontSize="sm">
                    Motaa does not sell cars. If you're buying online, any funds deducted from your card or
                    wallet are kept in an escrow account until you are satisfied with the dealer.
                  </Text>
                </HStack>
                <Button variant="link" colorScheme="blue" size="sm" mt={2}>
                  What is escrow?
                </Button>
              </Box>

              <VStack spacing={4}>
                <Button colorScheme="blue" bg="primary" size="lg" width="100%">
                  PROCEED
                </Button>
                <Button as={Link} to="/" variant="ghost" width="100%">
                  CANCEL
                </Button>
              </VStack>
            </VStack>
          </Box>

          {/* Car Details Section */}
          <Box flex={1/4}>
            <Box
              borderWidth={1}
              borderRadius="lg"
              overflow="hidden"
              position="relative"
              top={4}
            >
              <Image
                src="/placeholder.svg?height=300&width=500"
                alt="2021 Hyundai Kona"
              />
              <Box p={6}>
                <Flex justify="space-between" align="start" mb={4}>
                  <Box>
                    <Heading size="lg">2021 Hyundai Kona</Heading>
                    <Badge>FOREIGN USED</Badge>
                  </Box>
                  <IconButton
                    icon={<MoreVertical size={16} />}
                    variant="ghost"
                    aria-label="More options"
                  />
                </Flex>
                <HStack spacing={4} mb={4}>
                  <HStack>
                    <Clock size={16} />
                    <Text>800 miles</Text>
                  </HStack>
                  <HStack>
                    <Gauge size={16} />
                    <Text>Automatic</Text>
                  </HStack>
                  <HStack>
                    <Zap size={16} />
                    <Text>Electric</Text>
                  </HStack>
                </HStack>
                <HStack>
                  <Text>FCT, AMAC</Text>
                  <Badge colorScheme="purple">CUSTOM DUTY ✓</Badge>
                </HStack>
              </Box>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default CheckoutPage;

