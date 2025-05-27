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
import { Clock, Gauge, Zap, MoreVertical, PiggyBank, Wallet, CreditCard, Warehouse, BanknoteIcon } from 'lucide-react';
import { HiMiniReceiptPercent } from 'react-icons/hi2'
import { LuMapPin } from 'react-icons/lu'
import { RxCaretLeft, RxCaretRight, RxTimer } from 'react-icons/rx';
import { RiGasStationLine } from 'react-icons/ri';
import { TbManualGearbox } from 'react-icons/tb';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { Country, State, City }  from 'country-state-city';
import {
  FlutterwavePaymentModal,
  WalletPaymentModal,
  PaystackPaymentModal,
} from '../../../components/wallet';
import {
  CashMoneyIcon,
  CarFinancingIcon,
  CarParkingIcon,
  PayOnlineIcon,
  EmptyWalletIcon
} from '../../../components/icons';
import {CalendarPicker} from '../../../components';
import {CustomPlacesAutocomplete} from '../../../components/maps';




const PaymentOptions = [
  { icon: EmptyWalletIcon, label: 'Pay with Wallet', value: 'wallet' },
  { icon: PayOnlineIcon, label: 'Pay Online', value: 'online-payment' },
  { icon: CashMoneyIcon, label: 'Pay After Inspection', value: 'pay-after-inspection' },
  { icon: CarParkingIcon, label: 'Reserve Vehicle', disabled: true, value: 'reserve-vehicle' },
  { icon: CarFinancingIcon, label: 'Car Financing', disabled: true, value: 'finance-aid' },
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
        borderWidth={4}
        borderRadius="20px"
        opacity={option?.disabled && 0.7}
        spacing={2}
        cursor={option.disabled ? 'not-allowed' : 'pointer'}
        position="relative"
        width={'120px'}
        height={'120px'}
        display="flex"
        alignItems="center"
        // isChecked={checkoutPayload?.payment_option === option?.value}
        justifyContent="center"
        _checked={{
          borderColor: 'primary',
          color: 'white',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
      >
      <option.icon width={'40px'} height="40px" viewBox="0 0 50 55" />
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
  const [order, setOrder] = useState({});
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
    location:{
      country: '', // get from phone number extension
      state: '',
      city: '', // also used as lga
      lga: '', // also used as lga
      lat: '',
      lng: '',
      address: '',
      zip_code: '',
      street_address: '',
      formatted_address: '',
      place_id: '',
    },
    payment_option: 'online-payment',
    amount: 0.0,
  });

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'payment-option',
    onChange: val => {
      let payload = checkoutPayload;
      payload.payment_option = val;
      if (val === 'pay-after-inspection'){
        payload.amount = order.inspection_fee
      }
      setCheckoutPayload({...payload})
    },
  });
  
  const groupy = getRootProps();
  const {onClose, onOpen, isOpen} = useDisclosure();

  function redeemCoupon(e){
    e.preventDefault();
  }

  function changeValue(val){
    let data = checkoutPayload;
    setCheckoutPayload({...data, ...val})
  }

  function init(){
    getData();
  }

  async function getData(){
    const res = await axios.get(`/listings/checkout/${listingId}/`);
    const data = objectifyJSON(res.data);
    if(res.status === 200){
      setListing(data.listing);
      changeValue({amount: parseInt(data.listing.price)})
    }
    setOrder(data.fees);
  }

  function onLocationChanged({ lat, lng, ...location }){
    console.log('Location', {lat, lng, ...location});
  }
  
  function proceedToCheckout(e){
    e.preventDefault();
    switch(checkoutPayload.payment_option){
      case 'pay-after-inspection':{
        // setCheckoutPayload({ ...checkoutPayload, amount: order.inspection_fee })
        onOpen();
        break;
      }
      case 'wallet':{
        onOpen();
        break;
      }
      default:{
        onOpen();
        break;
      }
    }
    console.table("Checking out with: ", checkoutPayload);
    // onOpen();
  }
  
  async function onSuccess(response){
    const res = await axios.post(`/listings/checkout/${listingId}/`, JSON.stringify({
      ...checkoutPayload
    }));
    const data = objectifyJSON(res.data);
    if(res.status === 200){
      if (checkoutPayload.payment_option === 'pay-after-inspection'){
        onClose();
        console.log("Time for Inspection")
        return redirect(`/checkout/inspection/?listingId=${listingId}`);
      }
      return redirect('/');
    }
  }

  useEffect(() => {
    setCountryList(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (checkoutPayload.country) {
      const selectedCountry = Country.getAllCountries().find(c => c.name === checkoutPayload.country);
      setStateList(selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []);
      setCityList([]);
    }
  }, [checkoutPayload.country]);

  useEffect(() => {
    init();
  }, []);

  let total = 0.0;
  total += Number(listing?.price)
  total += Number(order?.motaa_fee)
  total += Number(order?.tax)
  total += Number(order?.inspection_fee)


  return (
    <Box bg="white" minH="100vh">
      <Box bg="blue.600" py={8} mb={8}>
        <Container maxW="container.xl" textAlign="center">
          <Heading color="white" size="lg" className="subtitle" fontWeight="400">Checkout</Heading>
          <Text color="whiteAlpha.900" mt={2}>
            {listing?.listing_type === 'sale' ? 'Get Ready to own a Car!' : 'Setup Your Rental'}
          </Text>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={10}>
        <Flex gap={8} flexWrap={{base: 'wrap', lg: 'unset'}}>
          {/* Form Section */}
          <Box pb={10} w={'100%'}>
            <Text className="bold" fontSize="22px" mb={6}>Confirm your details</Text>
            <VStack spacing={6} align="stretch">
              <SimpleGrid spacing={4} columns={{base: 1, md: 2}}>
                <FormControl isDisabled flex={1}>
                  <FormLabel>First name</FormLabel>
                  <Input onInput={(e) => changeValue({ first_name: e.target.value})} defaultValue={checkoutPayload?.first_name} px={4} py={5} />
                </FormControl>

                <FormControl isDisabled flex={1}>
                  <FormLabel>Last name</FormLabel>
                  <Input onInput={(e) => changeValue({ last_name: e.target.value})} defaultValue={checkoutPayload?.last_name} px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid spacing={4} columns={{base: 1, md: 2}}>
                <FormControl isRequired={!authUser?.phone_number} isDisabled={authUser?.phone_number}>
                  <FormLabel>Phone Number</FormLabel>
                  <InputGroup>
                    <InputLeftAddon px={0} w="70px">
                      <Select
                        minW="auto"
                        flexShrink={1}
                        onChange={(e) => {
                          const selectedCountry = countryList.find(c => c.name === e.target.value);
                          setCheckoutPayload({ ...checkoutPayload, country: e.target.value, state: '', city: '' });
                          setStateList(selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []);
                          setCityList([]);
                        }}
                      >
                        {countryList.map((place) => (
                          <option key={place.isoCode} value={place.name}>
                            <Icon as={'svg'} xmlns="http://www.w3.org/2000/svg">{place.flag}</Icon>
                            {" " + place.name}
                          </option>
                        ))}
                      </Select>
                    </InputLeftAddon>
                    <Input placeholder={'+'} flex={1} value={checkoutPayload.phone_number} onChange={(e) => setCheckoutPayload({ ...checkoutPayload, phone_number: e.target.value })} />
                  </InputGroup>
                </FormControl>

                <FormControl isDisabled>
                  <FormLabel>Email</FormLabel>
                  <Input onInput={(e) => changeValue({ email: e.target.value})} defaultValue={checkoutPayload?.email} type="email" px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Delivery Location</FormLabel>
                <CustomPlacesAutocomplete
                  value={checkoutPayload?.location?.formatted_address}
                  onPlaceChange={onLocationChanged}
                  inputProps={{border: '1px solid lavender', name: 'address', type: 'address'}}
                />
              </FormControl>

              <SimpleGrid spacing={4} columns={{base: 1, md: 2}}>
                <FormControl isRequired>
                  <FormLabel>Street Address</FormLabel>
                  <Input name="street-address" px={4} py={5} />
                </FormControl>

                <FormControl>
                  <FormLabel>Postal Code (optional)</FormLabel>
                  <Input name="postal-code" px={4} py={5} />
                </FormControl>
              </SimpleGrid>

              {
                listing?.listing_type === 'rental' &&
                <Box>
                  <FormControl>
                    <FormLabel>Rental Period</FormLabel>
                    <CalendarPicker
                     defaultValue={null}
                     onSelect={(val) => {
                      console.log("Rental Range", val)
                      changeValue({ start_date: val })
                     }}
                     mode='range'
                     border={'1px solid lavender'}
                     rounded="md"
                     // fromDate={''} // get from url params
                     // toDate={''}
                    />
                  </FormControl>
                </Box>
              }

              <Divider my={4} />

              <Box>
                <SimpleGrid columns={2} spacing={4} mb={4}>
                  <Text fontWeight="600">Price:</Text>
                  <Text fontWeight="600" textAlign="right">₦{commaInt(listing?.price)}</Text>
                  <Text fontWeight="600">0.5% fee + Tax </Text>
                  <Text fontWeight="600" textAlign="right">₦{commaInt(order?.tax + order?.motaa_fee)}</Text>
                  <Text fontWeight="600">Inspection fee:</Text>
                  <Text fontWeight="600" textAlign="right">₦{commaInt(order?.inspection_fee)}</Text>
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
                  <Heading size="md">₦{commaInt(total)}</Heading>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={4}>Choose a payment option</Text>
                <Flex flexWrap="nowrap" w="100%" overflowX="auto" py={2} px={2} flexDirection="row" className="hidden-scroll" gap={4}>
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
                {
                  checkoutPayload.payment_option === 'wallet' ?
                  "The amount for this order will be charged from your wallet balance. \
                  If your balance is not sufficient to cover the charge, you will not be able to complete your order." :
                  checkoutPayload.payment_option === 'online-payment' ? 
                  "You will be redirected to a Flutterwave payment page where you can pay with your card or bank transfer." :
                  checkoutPayload.payment_option === 'pay-after-inspection' ?
                  "You will be redirected to a Flutterwave payment page to pay a small inspection fee."
                  : "Select a payment option"
                }
              </Text>

              <Box placeItems="center">
                <HStack spacing={4} p={4} borderWidth={1} borderColor="primary" bg="blue.50" borderRadius="lg">
                  <Checkbox defaultChecked />
                  <Text fontSize="sm">
                    Motaa does not sell cars. If you're buying online, any funds deducted from your card or
                    wallet are kept in an escrow account until you are satisfied with the dealer.
                  </Text>
                </HStack>
                <Button variant="link" colorScheme="blue" mt={2} textDecoration="underline" size="sm">
                  What is escrow?
                </Button>
              </Box>

              <VStack spacing={4}>
                <Button onClick={proceedToCheckout} colorScheme="blue" bg="primary" size="lg" width="100%">
                  PROCEED
                </Button>

                <Button bgColor="blue.50" p="12px" color="primary" variant="ghost" width="100%" as={Link} to="/">
                  CANCEL
                </Button>
              </VStack>
            </VStack>
          </Box>

          {/* Car Details Section */}
          <Box w="100%" maxW="350px">
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

        {
          (listing && (
            checkoutPayload?.payment_option === 'online-payment' || 
            checkoutPayload?.payment_option === 'pay-after-inspection' 
            )
          ) ? ( isOpen &&
            <PaystackPaymentModal
             isOpen={isOpen}
             onClose={onClose}
             onSuccess={onSuccess}
             payload={checkoutPayload}
             customizations={{
                title: "Motaa Checkout",
                logo: listing?.vehicle?.dealer?.logo,
                description: `Payment for ${listing?.title}`,
             }}
            />
          ): checkoutPayload?.payment_option === 'wallet' ? ( isOpen &&
            <WalletPaymentModal
              payload={{amount: total, recipient: listing?.vehicle?.dealer}}
              isOpen={isOpen}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          ):(null)
        }

      </Container>
    </Box>
  )
}




export default CheckoutPage;

