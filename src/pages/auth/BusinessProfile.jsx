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
import { redirect, useNavigate, useParams, Link as RLink } from "react-router-dom";
import { RiCircleFill, RiCircleLine, RiMailCloseFill, RiMailFill, RiMessage2Line, RiMessage3Line, RiMessageLine } from "react-icons/ri";
import { FcSms, FcVoicemail } from "react-icons/fc";
import { FaGoogle, FaFacebook, FaArrowRight } from "react-icons/fa";
import { RxChatBubble, RxEnvelopeOpen } from "react-icons/rx";
import { jsonifyObject, objectifyJSON } from "../../utils";
import { auth } from "../../firebase";
import firebase from 'firebase/compat/app';


function BusinessProfile({onSubmit, ...props }) {
  const {payload} = useContext(SignupContext);
  const [logoPreview, setLogoPreview] = useState('')
  const [businessProfile, setBusinessProfile] = useState({
    logo: null,
    business_name: '',
    services: [],
    location: null,
    business_type: '',
    about: '',
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

  async function setupBusinessProfile(){
    const payload = new FormData();
    payload.append('logo', businessProfile.logo?.file, businessProfile.logo?.file?.name)
    payload.append('business_type', businessProfile.business_type)
    payload.append('business_name', businessProfile.business_name)
    payload.append('services', businessProfile.services)
    const res = await axios.post('/signup/business/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  return (
    <Box minH="100vh" bg="white">
      <Container maxW="3xl" py={8} px={4}>
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
            
            <input
             hidden
             ref={imageRef}
             type="file"
             allow="image/*"
             onInput={(e) => {
              const file = e.target.files[0];
              changeValue('logo', file);
              console.log('logo', file);
              setLogoPreview(URL.createObjectURL(businessProfile?.logo))
             }}
            />

            <VStack mt={4} w="80%" maxW={"500px"} spacing={4}>
              <Input
               type="text" w="100%"
               value={businessProfile.business_name}
               placeholder="Business Name"
               onInput={e => changeValue('business_name', e.target.value)}
              />

              <Input
               type="address" w="100%"
               value={businessProfile.location}
               placeholder="Business Address"
               onInput={e => changeValue('location', e.target.value)}
              />
            </VStack>
          </VStack>
        </Box>

        {/* Opening Times */}
        {/*<Box mb={6}>
          <FormLabel fontWeight="medium" mb={2}>
            Opening times
          </FormLabel>
          <HStack spacing={4}>
            <Select defaultValue="10:00am" flex={1}>
              <option value="9:00am">9:00am</option>
              <option value="10:00am">10:00am</option>
              <option value="11:00am">11:00am</option>
            </Select>
            <Flex alignItems="center" justifyContent="center">
              <HStack spacing={1}>
                <Box h={1} w={1} borderRadius="full" bg="#d0d5dd"></Box>
                <Box h={1} w={1} borderRadius="full" bg="#d0d5dd"></Box>
                <Box h={1} w={1} borderRadius="full" bg="#d0d5dd"></Box>
              </HStack>
            </Flex>
            <Select defaultValue="12:00pm" flex={1}>
              <option value="12:00pm">12:00pm</option>
              <option value="1:00pm">1:00pm</option>
              <option value="2:00pm">2:00pm</option>
            </Select>
          </HStack>
        </Box>*/}

        {/* About Your Business */}
        <Box mb={6}>
          <FormLabel fontWeight="medium" mb={2}>
            About your Business
          </FormLabel>
          <Textarea placeholder="Enter a brief description of your business. Minimum of 100 characters..." minH="100px" borderColor="#d0d5dd" />
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

          <FormControl mb={4}>
            <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
              Email
            </FormLabel>
            <Input type="email" placeholder="info@company.com" borderColor="#d0d5dd" />
          </FormControl>

          <FormControl isInvalid={true}>
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
                placeholder="+234 123 456 7890"
                defaultValue="+234 123 456 7890"
                borderColor="#cb1a14"
                borderLeftRadius={0}
              />
            </InputGroup>
            <FormErrorMessage color="#cb1a14" fontSize="xs" mt={1}>
              Please enter a correct phone number!
            </FormErrorMessage>
          </FormControl>
        </Box>

        {/* Upload Workshop Images */}
{/*        <Box mb={6}>
          <FormLabel fontWeight="medium" mb={1}>
            Upload 5 images of your workshop
          </FormLabel>
          <Flex alignItems="center" gap={1} mb={4}>
            <Button variant="link" fontSize="sm" color="#0460cc" rightIcon={<ArrowRight size={12} />}>
              See image upload guidelines
            </Button>
          </Flex>

          <Box border="1px dashed" borderColor="#d0d5dd" borderRadius="lg" p={8} mb={4}>
            <VStack>
              <Flex w={10} h={10} borderRadius="full" bg="#f2f4f7" alignItems="center" justifyContent="center" mb={4}>
                <CloudUpload size={20} color="#667085" />
              </Flex>
              <Button onClick={() => imagesRef.current.click()} variant="link" color="#0460cc" fontWeight="medium" mb={1}>
                Click to upload
              </Button>
              <Text fontSize="sm" color="#667085">
                or drag and drop
              </Text>
              <Text fontSize="xs" color="#667085" mt={1}>
                SVG, PNG, JPG or GIF (max. 800x400px)
              </Text>

              <input hidden ref={imagesRef} multiple={true} type="file" allow="image/*" />
            </VStack>
          </Box>

          <Flex gap={2}>
            <Box position="relative" borderRadius="lg" overflow="hidden">
              <Image
                src="https://via.placeholder.com/150x100"
                alt="Workshop image 1"
                objectFit="cover"
                w="full"
                h="80px"
              />
              <Flex
                position="absolute"
                top={1}
                left={1}
                bg="blackAlpha.600"
                color="white"
                w={5}
                h={5}
                borderRadius="full"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
              >
                1
              </Flex>
            </Box>
          </Flex>
        </Box>
*/}
        {/* Submit Button */}
        <Box mt={8}>
          <Button w="full" bg="#0460cc" color="white" _hover={{ bg: "#0354b4" }}>
            Save
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

export default BusinessProfile;

