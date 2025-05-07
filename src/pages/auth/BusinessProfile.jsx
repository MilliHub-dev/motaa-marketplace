import { Search, Bell, CloudUpload, ChevronDown, ArrowRight } from "lucide-react"
import {
  Avatar,
  Box,
  Button,
  Container,
  InputGroup,
  InputLeftAddon,
  VStack,
  IconButton,
  FormErrorMessage,
  Textarea,
  Tag,
  Card,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  Link,
  ButtonGroup,
  PinInput,
  PinInputField,
  Select,
  SelectField,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useContext, useRef, useState, createContext, useEffect } from "react";
import { GlobalStore } from "../../App";
import { SignupContext } from "./Signup";
import {motion} from 'framer-motion';
import { CenteredLayout, OTPField } from "../../components";
import { CustomPlacesAutocomplete } from "../../components/maps";
import { redirect, useNavigate, useParams, useSearchParams, Link as RLink } from "react-router-dom";
import { RiCircleFill, RiCircleLine, RiMailCloseFill, RiMailFill, RiMessage2Line, RiMessage3Line, RiMessageLine } from "react-icons/ri";
import { FcSms, FcVoicemail } from "react-icons/fc";
import { FaGoogle, FaFacebook, FaArrowRight } from "react-icons/fa";
import { RxChatBubble, RxEnvelopeOpen } from "react-icons/rx";
import { jsonifyObject, objectifyJSON } from "../../utils";
import { auth } from "../../firebase";
import firebase from 'firebase/compat/app';



function BusinessProfile({onSubmit, ...props }) {
  const {payload} = useContext(SignupContext);
  const {onAuthenticated, axios, logout, notify} = useContext(GlobalStore);
  const [logoPreview, setLogoPreview] = useState('')
  const [params] = useSearchParams();
  const user_type = params.get('user_type') || 'dealer'
  const [businessProfile, setBusinessProfile] = useState({
    logo: null,
    business_name: '',
    services: [],
    location: {
      lat: '',
      lng: '',
      country: '',
      state: '',
      city: '',
      zip_code: '',
      place_id: '',
      street_address: '',
    },
    business_type: '',
    about: '',
    headline: '',
    contact_phone: '',
    contact_email: '',
  });

  let mechServices = [
    'Oil Change',
    'Paint Job',
    'Body Work',
    'Engine Repair',
  ]

  let dealerServices = [
    'Car Rentals',
    'Car Sales',
    'Drivers',
  ]

  const servicesOffered = payload?.business_type === 'mechanic' ? mechServices : dealerServices;
  const imageRef = useRef()
  const imagesRef = useRef()

  const changeValue = (key, value) => {
    const oldValue = businessProfile
    oldValue[`${key}`] = value;
    setBusinessProfile({ ...oldValue })
  }

  function removeService(service){
    const oldValue = businessProfile.services;
    oldValue.pop(service)
    changeValue('services', [...oldValue])
  }

  async function setupBusinessProfile(e){
    e.preventDefault();

    if (!businessProfile.logo){
      return notify({
        color: 'red',
        title: 'Please Upload your Logo'
      })
    }
    
    // images must be < 2mb
    if (businessProfile.logo && businessProfile.logo.size/10**6 > 2.048){
      return notify({
        color: 'red',
        title: 'Your Logo file size exceeds 2mb',
        timeout: 4500,
      })
    }

    try{
      const authUser = objectifyJSON(localStorage.getItem('motaa-auth-user'));
      const payload = new FormData();
      payload.append('action', 'setup-business-profile')
      payload.append('user_type', user_type)
      payload.append('logo', businessProfile?.logo, businessProfile.logo?.name)
      payload.append('business_type', businessProfile.business_type)
      payload.append('about', businessProfile.about)
      payload.append('headline', businessProfile.headline)
      payload.append('business_name', businessProfile.business_name)
      payload.append('contact_phone', businessProfile.contact_phone)
      payload.append('contact_email', businessProfile.contact_email)
      payload.append('services', businessProfile.services)
      payload.append('location', JSON.stringify(businessProfile.location))
      const res = await axios.post('/accounts/register/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${authUser?.token}`
        }
      })
      const data = objectifyJSON(res.data);

      if (res.status === 200){
        console.log("New business data:", data);
        localStorage.removeItem('motaa-auth-user');
        redirect('/login', 200)
        setTimeout(() => notify({
          title: 'Success',
          body: "Welcome to Motaa, Please log in to continue."
        }), 1200)
      }else{
        notify({
          title: 'Error',
          timeout: 5000,
          body: data.message,
          color: 'red'
        })
      }
    }catch(error){
        notify({
          title: 'Error',
          timeout: 5000,
          body: error.message,
          color: 'red'
        })

    }
  }

  return (
    <Box minH="100vh" bg="white">
      <Container maxW="3xl" py={8} px={4}>
      <form id="profileForm" method="post" onSubmit={setupBusinessProfile} encType="multipart/form-data">
        {/* Profile Image */}
        <Box bg="white" border="1px solid" borderColor="#d0d5dd" borderRadius="xl" p={6} mb={6}>
          <VStack>
            <Flex alignItems="center" justifyContent="center" mb={2}>
              <Avatar
               w="20" h="20"
               borderRadius="full"
               src={logoPreview}
               name={businessProfile?.business_name}
              />
            </Flex>

            <Button
             onClick={() => imageRef.current.click()}
             variant="link" color="#0460cc"
             fontSize="sm" fontWeight="medium"
             leftIcon={<CloudUpload size={16} />}
            >
              Upload your logo
            </Button>
            
            <Input
             hidden
             ref={imageRef}
             type="file"
             allow="image/*"
             isRequired
             name="logo"
             onInput={(e) => {
              const file = e.target.files[0];
              changeValue('logo', file);
              setLogoPreview(URL.createObjectURL(businessProfile?.logo))
             }}
            />

            <VStack mt={4} w="80%" maxW={"500px"} spacing={4}>
            <FormControl isRequired>
              <FormLabel> Business Name </FormLabel>
              <Input
               type="text" w="100%"
               value={businessProfile.business_name}
               placeholder="Business Name"
               onInput={e => changeValue('business_name', e.target.value)}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel> Business Headline or Motto </FormLabel>
              <Input
               type="address" w="100%"
               value={businessProfile.headline}
               placeholder="Business Headline / Motto"
               onInput={e => changeValue('headline', e.target.value)}
              />
            </FormControl>

            </VStack>
          </VStack>
        </Box>


        {/* About Your Business */}
        <Box mb={6}>
          <FormLabel fontWeight="medium" mb={2}>
            About your Business
          </FormLabel>
          <Textarea
            onInput={(e) => changeValue('about', e.target.value)}
           placeholder="Enter a brief description of your business. Minimum of 50 characters..."
           minH="100px"
           borderColor="#d0d5dd"
          />
        </Box>

        {/* Choose Services */}
        <Box mb={6}>
          <FormLabel fontWeight="medium" mb={2}> Services Offered </FormLabel>
          <Box border="1px solid" borderColor="#d0d5dd" borderRadius="lg" overflow="hidden">
            <Box p={3} borderBottom="1px solid" borderColor="#d0d5dd">
              <FormLabel fontWeight="medium" mb={2}> Choose services </FormLabel>
              <Flex flexWrap="wrap" gap={2}>
              {
                servicesOffered?.map((service) => {
                  const selected = businessProfile?.services?.includes(service);
                  if (selected) return null;
                  return (
                    <Tag
                      variant={selected ? "solid" : "outline"}
                      size="lg"
                      cursor="pointer"
                      borderRadius="full"
                      fontSize="sm"
                      bg={selected ? "#f2f4f7" : "white"}
                      color={selected ? "#101828" : "#667085"}
                      borderColor="#d0d5dd"
                      _hover={{ bg: selected ? "#e4e7ec" : "gray.50" }}
                      onClick={() => changeValue('services', [...businessProfile?.services, service])}
                    >
                      {service}
                    </Tag>
                  )
                }
              )}
              </Flex>
            </Box>

            <Box p={3}>
              <Flex flexWrap="wrap" gap={2}>
                {
                  businessProfile?.services?.map((service) => 
                    <Tag
                      variant={"solid"}
                      cursor="pointer"
                      size="lg"
                      borderRadius="full"
                      fontSize="sm"
                      bg={"#0460cc"}
                      color={"white"}
                      borderColor={"#0460cc"}
                      _hover={{ bg: "#0354b4"}}
                      onClick={() => removeService(service)}
                    >
                      {service}
                    </Tag>
                  )
                }
                {businessProfile?.services.length < 1 && <Text> Select at least one service you offer </Text>}
              </Flex>
            </Box>
          </Box>
        </Box>

        {/* Contact Details */}
        <Box mb={6}>
          <FormLabel fontWeight="medium" mb={2}>
            Contact details
          </FormLabel>
          <Text fontSize="sm" color="#667085" mb={4}>
            This would be shown on inspection slips and transaction receipts.
          </Text>

          <FormControl isRequired mb={4}>
            <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
              Email
            </FormLabel>
            <Input type="email" placeholder="info@company.com" borderColor="#d0d5dd"
                onInput={(e) => changeValue('contact_email', e.target.value)}
             />
          </FormControl>

          <FormControl isRequired isInvalid={true}>
            <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
              Phone Number
            </FormLabel>
            <InputGroup>
              <InputLeftAddon
                bg="white"
                borderColor="#d0d5dd"
                px={2}
                children={
                  <Flex alignItems="center">
                    <Box w={6} h={4} position="relative">
                      <Box position="absolute" inset={0} bg="#6da544" w="33.33%"></Box>
                      <Box position="absolute" inset={0} left="33.33%" bg="white" w="33.33%"></Box>
                      <Box position="absolute" inset={0} left="66.66%" bg="#6da544" w="33.33%"></Box>
                    </Box>
                    <ChevronDown size={16} ml={1} color="#667085" />
                  </Flex>
                }
              />
              <Input
                type="tel"
                placeholder="+2341234567890"
                value={businessProfile.contact_phone}
                onInput={(e) => changeValue('contact_phone', e.target.value)}
              />
            </InputGroup>
          </FormControl>
        </Box>

        <FormControl isRequired mb={4}>
          <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
            Street Address
          </FormLabel>
          <Input type="address" placeholder="e.g Suite 4. Acura Plaza" borderColor="#d0d5dd"
              onInput={(e) => changeValue('location', {...businessProfile.location, street_address: e.target.value})}
           />
        </FormControl>

        <FormControl isRequired mb={4}>
          <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
            Physical Location <small> Select a Location on Google </small>
          </FormLabel>
          <CustomPlacesAutocomplete onPlaceChange={({...data}) => changeValue('location', {...businessProfile.location, ...data})} />
        </FormControl>

        {/* Submit Button */}
        <Box mt={8}>
          <Button form="profileForm" type="submit" w="full" bg="#0460cc" color="white" _hover={{ bg: "#0354b4" }}>
            Create your Profile
          </Button>
        </Box>
      </form>
      </Container>
    </Box>
  )
}

export default BusinessProfile;

