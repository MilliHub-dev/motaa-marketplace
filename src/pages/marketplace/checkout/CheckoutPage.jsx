import {useState, useEffect, useContext} from 'react';
import {motion} from "framer-motion";
import {useParams, useSearchParams, Link, useNavigate} from 'react-router-dom';
import {GlobalStore} from "../../../App";
import {objectifyJSON, jsonifyObject} from "../../../utils";
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
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
  Tag,
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
  Icon,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  useRadio,
  useRadioGroup,
  useMediaQuery,
  useDisclosure,
} from '@chakra-ui/react'
import { Clock, Gauge, Zap, MoreVertical, PiggyBank, Wallet, CreditCard, Warehouse, BanknoteIcon } from 'lucide-react'
import { HiMiniReceiptPercent } from 'react-icons/hi2'
import { LuMapPin } from 'react-icons/lu'
import { RxCaretLeft, RxCaretRight, RxTimer } from 'react-icons/rx';
import { RiGasStationLine } from 'react-icons/ri';
import { TbManualGearbox } from 'react-icons/tb';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { Country, State, City }  from 'country-state-city';



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
  const params = new URLSearchParams(document.location.search);
  const listingId = params.get('listingId');
  const redirect = useNavigate();
  const {axios, authUser, commaInt} = useContext(GlobalStore);
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [listing, setListing] = useState();
  const [order, setOrder] = useState();
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [checkoutPayload, setCheckoutPayload] = useState({
    listing: listingId,
    first_name: authUser?.first_name || '',
    last_name: authUser?.last_name || '',
    email: authUser?.email || '',
    phone_number: authUser?.phone_number || '',
    currency: 'NGN',
    country: '', // get from phone number extension
    state: '',
    city: '', // also used as lga
    lga: '', // also used as lga
    address: '',
    zip_code: '',
    payment_option: 'card',
    amount: 0.0,
  });

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'payment-option',
    onChange: val => {
      let payload = checkoutPayload;
      checkoutPayload.payment_option = val;
      setCheckoutPayload({...checkoutPayload})
    },
  });

  const groupy = getRootProps();

  function redeemCoupon(e){
    e.preventDefault();
  }

  function changeValue(val){
    let data = checkoutPayload;
    setCheckoutPayload({...data, ...val})
  }

  function init(){
    getData();
    console.log(Country.getAllCountries())
  }

  async function getData(){
    const res = await axios.get(`/listings/checkout/${listingId}/`);
    const data = objectifyJSON(res.data);
    if(res.status === 200){
      setListing(data.listing);
      changeValue({amount: parseInt(data.listing.price)})
    }
    console.log("Got Data:", data);
  }

  function proceedToCheckout(e){
    e.preventDefault();
    console.table("Checking out with: ", checkoutPayload);
    onOpen()
  }

  const {onClose, onOpen, isOpen} = useDisclosure();
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

      <Container maxW="90%" pb={10}>
        <Flex gap={8} flexWrap={{base: 'wrap', md: 'unset'}}>
          {/* Form Section */}
          <Box flex={{base: 1, md: 2.65/4}} pb={10} w={'100%'}>
            <Text className="bold" fontSize="22px" mb={6}>Confirm your details</Text>
            <VStack spacing={6} align="stretch">
              <SimpleGrid spacing={4} columns={{base: 1, md: 2}}>
                <FormControl flex={1}>
                  <FormLabel>First name</FormLabel>
                  <Input onInput={(e) => changeValue({ first_name: e.target.value})} defaultValue={checkoutPayload?.first_name} px={4} py={5} />
                </FormControl>

                <FormControl flex={1}>
                  <FormLabel>Last name</FormLabel>
                  <Input onInput={(e) => changeValue({ last_name: e.target.value})} defaultValue={checkoutPayload?.last_name} px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid spacing={4} columns={{base: 1, md: 2}}>
                <FormControl>
                  <FormLabel>Phone Number</FormLabel>
                  <InputGroup>
                    <InputLeftAddon>
                      <Select px={2} py={5} onInput={(e) => changeValue({ country: e.target.value})}>
                        {countryList.map((place) => 
                          <option
                           onClick={(e) => setStateList(State.getStatesOfCountry(place['isoCode']))}
                           value={place['name']}
                          > +{place['phonecode']} {place['flag']}</option>
                        )}
                      </Select>
                    </InputLeftAddon>

                    <Input
                     onInput={(e) => changeValue({ phone_number: e.target.value})}
                     defaultValue={checkoutPayload?.phone_number} px={4} py={5}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input onInput={(e) => changeValue({ email: e.target.value})} defaultValue={checkoutPayload?.email} type="email" px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid spacing={4} columns={{base: 1, md: 2}}>
                <FormControl>
                  <FormLabel>State of Residency</FormLabel>
                  <Select>
                    {stateList.map((place) => 
                      <option
                       onClick={(e) => setCityList(
                        City.getCitiesOfState(place['countryCode'], place['isoCode'])
                        )}
                       value={place['name']}
                      > {place['name']} </option>
                    )}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>City</FormLabel>
                  <Select onInput={(e) => changeValue({ city: e.target.value})} defaultValue="AMAC">
                    {cityList.map((place) => 
                      <option value={place['name']}> {place['name']} </option>
                    )}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Current Address</FormLabel>
                <Input as={motion.textarea} minH="70px" onInput={(e) => changeValue({ address: e.target.value})} defaultValue={checkoutPayload?.address} px={4} py={5} />
              </FormControl>

              <SimpleGrid spacing={4} columns={{base: 1, md: 2}}>
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
                  <Text fontWeight="600">Price:</Text>
                  <Text fontWeight="600" textAlign="right">₦{commaInt(listing?.price)}</Text>
                  <Text fontWeight="600">0.5% VAT & fees</Text>
                  <Text fontWeight="600" textAlign="right">₦60,000</Text>
                  <Text fontWeight="600">Inspection fee:</Text>
                  <Text fontWeight="600" textAlign="right">₦5,000</Text>
                </SimpleGrid>

                <form method="POST" onSubmit={redeemCoupon}>
                  <Flex gap={8}>
                    <Input placeholder="Enter Promo Code" px={4} py={5} />
                    <Button w={'100px'} colorScheme="blue" bg="primary"> Apply </Button>
                  </Flex>
                </form>

                <Divider my={4} />
                <Flex justify="space-between" fontWeight="bold">
                  <Heading size="md">Total:</Heading>
                  <Heading size="md">₦{commaInt(listing?.price)}</Heading>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={4}>Choose a payment option</Text>
                <Flex flexWrap="nowrap" w="100%" overflowX="auto" flexDirection="row" className="hidden-scroll" gap={4}>
                  {PaymentOptions.map((option, index) => {
                    const radio = getRadioProps({ value: option.value, isDisabled: option.disabled });

                    return (
                      <RadioCard key={index} option={option} value={option.value} {...radio} />
                    )}
                  )}
                </Flex>
              </Box>

              <Divider my={3} />

              <Text fontSize="sm" color="gray.600">
                This is text field is meant to explain whatever payment option is chosen above,
                prototype would be available if needed 👍
              </Text>


              <Box placeItems="center">
                <HStack spacing={4} p={4} borderWidth={1} borderColor="primary" bg="blue.50" borderRadius="lg">
                  <Checkbox defaultChecked />
                  <Text fontSize="sm">
                    Motaa does not sell cars. If you're buying online, any funds deducted from your card or
                    wallet are kept in an escrow account until you are satisfied with the dealer.
                  </Text>
                </HStack>
                <Button variant="link" colorScheme="blue" mt={2} textDecoration="underline" size="sm" mt={2}>
                  What is escrow?
                </Button>
              </Box>

              <VStack spacing={4}>
                <Button onClick={proceedToCheckout} size="xl" colorScheme="blue" bg="primary" size="lg" width="100%">
                  PROCEED
                </Button>

                <Button bgColor="blue.50" size="xl" p="12px" color="primary" variant="ghost" width="100%" as={Link} to="/">
                  CANCEL
                </Button>
              </VStack>
            </VStack>
          </Box>

          {/* Car Details Section */}
          <Box flex={{base: 1, md: 1.35/4}}>
            <Box
              borderWidth={1}
              borderRadius="30px"
              position="relative"
            >
              <Box w="100%" h="250px" px={3} py={3} >
                <Image
                  src={listing?.vehicle?.images[0]?.url}
                  alt={listing?.title}
                  w="100%"
                  h="100%"
                  borderRadius={'20px'}
                />
              </Box>
              <Box p={6}>
                <Flex justifyContent={'space-between'} alignItems={'center'}>
                    <Heading size="md" className="subtitle"> {listing?.title} </Heading>
                    <Badge color="grey.500" className="bold"> {listing?.vehicle?.condition} </Badge>
                </Flex>

                <Flex justifyContent={'flex-start'} alignItems={'center'} gap={2} my={2}>
                    <Text as={Flex} gap={1} alignItems={'center'} fontWeight="600"> <RxTimer /> {commaInt(listing?.vehicle?.mileage) || 0} miles</Text>
                    <Text as={Flex} gap={1} alignItems={'center'} fontWeight="600"> <TbManualGearbox /> {listing?.vehicle?.transmission}</Text>
                    <Text as={Flex} gap={1} alignItems={'center'} fontWeight="600"> <RiGasStationLine /> {listing?.vehicle?.fuel_system}</Text>
                </Flex>

                <Divider my={3} />

                <Flex justifyContent={'space-between'} alignItems={'center'} my={2}>
                    <Text className="small bold" color="gray.600" as={Flex} alignItems="baseline" gap={1}> <Icon> <LuMapPin size={25} /> </Icon> {listing?.vehicle?.dealer?.location} </Text>
                    {
                      listing?.vehicle?.custom_duty &&
                      <Tag fontWeight={'bold'} gap={1.5}> <span> Custom Duty </span> <Icon> <BsFillPatchCheckFill color="#de06bc" size={25} /> </Icon> </Tag>
                    }
                </Flex>
              </Box>
            </Box>
          </Box>
        </Flex>

        <PaymentModal
         isOpen={isOpen}
         onClose={onClose}
         checkoutPayload={checkoutPayload}
         lisitng={listing}
        />
      </Container>
    </Box>
  )
}



const PaymentModal = ({ isOpen, onClose, listing, checkoutPayload, ...props }) => {
  const {
    currency, amount, payment_option,
    email, phone_number, first_name, last_name,
  } = checkoutPayload;

  const config = {
    // public_key: process.env.REACT_APP_FLW_TEST_PUBLIC_KEY,
    public_key: "FLWPUBK_TEST-6d708e896eb3ba9f1ee4e1e73509e9e5-X",
    tx_ref: Date.now(),
    amount: amount > 500000 ? 500000 : amount,
    currency: currency,
    payment_options: payment_option,
    customer: {
      email: email,
      phone_number: phone_number,
      name: `${first_name} ${last_name}`,
    },
    customizations: {
      title: `${listing?.vehicle?.dealer?.business_name}`,
      description: `Payment for: ${listing?.title}`,
      logo: listing?.vehicle?.dealer?.logo,
    },
    meta: {
      listing: listing?.uuid,
      transaction_type: listing?.listing_type,
    }
  };

  const handleFlutterPayment = useFlutterwave(config);

  function onPaymentComplete(response){
    console.log("payment complete", response)
  }

  function onModalClose(){
    // user cancelled the payment flow
  }

  function payUp(){
    try{
      handleFlutterPayment({
        callback: (response) => {
          console.log(response);
          onPaymentComplete(response);
          closePaymentModal(); // this will close the modal programmatically
        },
        onClose: () => {
          onModalClose();
        },
      });
    }catch(err){
      console.log("error paying up:", err)
    }
  }

  return(
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        <ModalOverlay px={4} />
        <ModalContent w={'90%'} maxW={'700px'}>
          <ModalHeader>
            <Heading size="md"> Checkout </Heading>
            <ModalCloseButton />
          </ModalHeader>

          <ModalBody>
            <Button w="100%" bg="primary" colorScheme="blue" onClick={payUp}> Pay now </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
  )
}




export default CheckoutPage;

