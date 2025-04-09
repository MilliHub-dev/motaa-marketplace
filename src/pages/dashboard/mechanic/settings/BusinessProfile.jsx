import { useState } from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Text,
  Textarea,
  VStack,
  IconButton,
  FormErrorMessage,
} from "@chakra-ui/react"
import { Search, Bell, CloudUpload, ChevronDown, ArrowRight } from "lucide-react"

function BusinessProfile() {
  const [selectedServices, setSelectedServices] = useState(["HVAC Repair"])

  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service))
    } else {
      setSelectedServices([...selectedServices, service])
    }
  }

  return (
    <Box minH="100vh" bg="white">
      <Container maxW="3xl" py={8} px={4}>
        <VStack textAlign="center" mb={8} spacing={1}>
          <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="#101828">
            Complete your profile setup.
          </Heading>
          <Text color="#667085">
            Personalise your profile in order to standout
            <br display={{ base: "none", sm: "block" }} /> from the crowd!
          </Text>
        </VStack>

        {/* Profile Image */}
        <Box bg="white" border="1px solid" borderColor="#d0d5dd" borderRadius="xl" p={6} mb={6}>
          <VStack>
            <Flex w="20" h="20" bg="#f2f4f7" borderRadius="full" alignItems="center" justifyContent="center" mb={2}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20 21C20 19.6044 20 18.9067 19.8278 18.3389C19.44 17.0605 18.4395 16.06 17.1611 15.6722C16.5933 15.5 15.8956 15.5 14.5 15.5H9.5C8.10444 15.5 7.40665 15.5 6.83886 15.6722C5.56045 16.06 4.56004 17.0605 4.17224 18.3389C4 18.9067 4 19.6044 4 21M16.5 7.5C16.5 9.98528 14.4853 12 12 12C9.51472 12 7.5 9.98528 7.5 7.5C7.5 5.01472 9.51472 3 12 3C14.4853 3 16.5 5.01472 16.5 7.5Z"
                  stroke="#98A2B3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Flex>
            <Button variant="link" color="#0460cc" fontSize="sm" fontWeight="medium" leftIcon={<CloudUpload size={16} />}>
              Upload image
            </Button>
            <VStack mt={4} spacing={0}>
              <Heading as="h3" fontSize="md" fontWeight="semibold" color="#101828">
                KINSLEY IFEANYI
              </Heading>
              <Text fontSize="xs" color="#667085">
                ABUJA, NIGERIA
              </Text>
              <HStack mt={2} fontSize="sm" color="#667085">
                <Text>09012345789</Text>
                <Text>•</Text>
                <Text>kinify@gmail.com</Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Opening Times */}
        <Box mb={6}>
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
        </Box>

        {/* About You */}
        <Box mb={6}>
          <FormLabel fontWeight="medium" mb={2}>
            About you
          </FormLabel>
          <Text fontSize="sm" color="#667085" mb={2}>
            Enter a brief description of your dealership.
          </Text>
          <Textarea placeholder="Maximum of 400 characters..." minH="100px" borderColor="#d0d5dd" />
        </Box>

        {/* Choose Services */}
        <Box mb={6}>
          <FormLabel fontWeight="medium" mb={2}>
            Choose services
          </FormLabel>
          <Box border="1px solid" borderColor="#d0d5dd" borderRadius="lg" overflow="hidden">
            <Box p={3} borderBottom="1px solid" borderColor="#d0d5dd">
              <Text fontWeight="medium">Car Final</Text>
            </Box>
            <Box p={3} borderBottom="1px solid" borderColor="#d0d5dd">
              <Flex flexWrap="wrap" gap={2}>
                <Button
                  variant={selectedServices.includes("Engine Repair") ? "solid" : "outline"}
                  size="sm"
                  borderRadius="full"
                  fontSize="sm"
                  bg={selectedServices.includes("Engine Repair") ? "#f2f4f7" : "white"}
                  color={selectedServices.includes("Engine Repair") ? "#101828" : "#667085"}
                  borderColor="#d0d5dd"
                  _hover={{ bg: selectedServices.includes("Engine Repair") ? "#e4e7ec" : "gray.50" }}
                  onClick={() => toggleService("Engine Repair")}
                >
                  Engine Repair
                </Button>
                <Button
                  variant={selectedServices.includes("Car Detail") ? "solid" : "outline"}
                  size="sm"
                  borderRadius="full"
                  fontSize="sm"
                  bg={selectedServices.includes("Car Detail") ? "#f2f4f7" : "white"}
                  color={selectedServices.includes("Car Detail") ? "#101828" : "#667085"}
                  borderColor="#d0d5dd"
                  _hover={{ bg: selectedServices.includes("Car Detail") ? "#e4e7ec" : "gray.50" }}
                  onClick={() => toggleService("Car Detail")}
                >
                  Car Detail
                </Button>
              </Flex>
            </Box>
            <Box p={3}>
              <Flex flexWrap="wrap" gap={2}>
                <Button
                  variant={selectedServices.includes("HVAC Repair") ? "solid" : "outline"}
                  size="sm"
                  borderRadius="full"
                  fontSize="sm"
                  bg={selectedServices.includes("HVAC Repair") ? "#0460cc" : "white"}
                  color={selectedServices.includes("HVAC Repair") ? "white" : "#667085"}
                  borderColor={selectedServices.includes("HVAC Repair") ? "#0460cc" : "#d0d5dd"}
                  _hover={{ bg: selectedServices.includes("HVAC Repair") ? "#0354b4" : "gray.50" }}
                  onClick={() => toggleService("HVAC Repair")}
                >
                  HVAC Repair
                </Button>
                <Button
                  variant={selectedServices.includes("Car Upgrade") ? "solid" : "outline"}
                  size="sm"
                  borderRadius="full"
                  fontSize="sm"
                  bg={selectedServices.includes("Car Upgrade") ? "#0460cc" : "white"}
                  color={selectedServices.includes("Car Upgrade") ? "white" : "#667085"}
                  borderColor={selectedServices.includes("Car Upgrade") ? "#0460cc" : "#d0d5dd"}
                  _hover={{ bg: selectedServices.includes("Car Upgrade") ? "#0354b4" : "gray.50" }}
                  onClick={() => toggleService("Car Upgrade")}
                >
                  Car Upgrade
                </Button>
                <Button
                  variant={selectedServices.includes("Car Re-model") ? "solid" : "outline"}
                  size="sm"
                  borderRadius="full"
                  fontSize="sm"
                  bg={selectedServices.includes("Car Re-model") ? "#0460cc" : "white"}
                  color={selectedServices.includes("Car Re-model") ? "white" : "#667085"}
                  borderColor={selectedServices.includes("Car Re-model") ? "#0460cc" : "#d0d5dd"}
                  _hover={{ bg: selectedServices.includes("Car Re-model") ? "#0354b4" : "gray.50" }}
                  onClick={() => toggleService("Car Re-model")}
                >
                  Car Re-model
                </Button>
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
        <Box mb={6}>
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
              <Button variant="link" color="#0460cc" fontWeight="medium" mb={1}>
                Click to upload
              </Button>
              <Text fontSize="sm" color="#667085">
                or drag and drop
              </Text>
              <Text fontSize="xs" color="#667085" mt={1}>
                SVG, PNG, JPG or GIF (max. 800x400px)
              </Text>
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
            <Box position="relative" borderRadius="lg" overflow="hidden">
              <Image
                src="https://via.placeholder.com/150x100"
                alt="Workshop image 2"
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
                2
              </Flex>
            </Box>
            <Box position="relative" borderRadius="lg" overflow="hidden">
              <Image
                src="https://via.placeholder.com/150x100"
                alt="Workshop image 3"
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
                3
              </Flex>
            </Box>
            <Box position="relative" borderRadius="lg" overflow="hidden">
              <Image
                src="https://via.placeholder.com/150x100"
                alt="Workshop image 4"
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
                4
              </Flex>
            </Box>
          </Flex>
        </Box>

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

