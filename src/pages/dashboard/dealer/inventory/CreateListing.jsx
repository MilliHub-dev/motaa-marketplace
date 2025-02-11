import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Text,
  Button,
  Input,
  Select,
  Image,
  IconButton,
  Progress,
  Textarea,
  FormControl,
  FormLabel,
  InputGroup,
  Badge,
  useToast,
  Link,
  Avatar,
  Heading,
  SimpleGrid,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import {BackButton} from '../../../../components/nav';
import { ArrowLeft, DeleteIcon, Upload, AlertTriangle, Zap, Clock, Settings, MessageCircle, Bell } from "lucide-react"
import { useState } from "react"

// Step Indicator Component
function StepIndicator({ currentStep }) {
  const steps = ["Upload Images", "Enter details", "Review", "Publish"]

  return (
    <Box w="full" maxW="600px" mx="auto" mb={8}>
      <HStack justify="space-between" mb={2}>
        {steps.map((step, index) => (
          <VStack key={index} spacing={2}>
            <Box w={3} h={3} borderRadius="full" bg={index <= currentStep ? "blue.500" : "gray.200"} />
            <Text
              fontSize="sm"
              color={index <= currentStep ? "black" : "gray.500"}
              fontWeight={index === currentStep ? "medium" : "normal"}
            >
              {step}
            </Text>
          </VStack>
        ))}
      </HStack>
      <Progress value={(currentStep / (steps.length - 1)) * 100} size="xs" colorScheme="blue" />
    </Box>
  )
}


// Document Upload Component
function DocumentUpload({ title, description, onUpload }) {
  const [uploads, setUploads] = useState([]);

  function removeItem(idx) {
    setUploads((prevUploads) => prevUploads.filter((_, i) => i !== idx));
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleFileDrop(e) {
    e.preventDefault();
    uploadFile(e.dataTransfer.files[0]);
  }

  async function uploadFile(file) {
    let previewUrl = URL.createObjectURL(file);
    const data = { file, previewUrl };
    setUploads((prevUploads) => [...prevUploads, data]);
  }

  async function handleUpload(e) {
    e.preventDefault();
    let files = Array.from(e.target.files);
    
    const fileData = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setUploads((prevUploads) => [...prevUploads, ...fileData]);
  }

  return (
    <VStack spacing={2} align="start" w="full" mb={8}>
      <Text fontWeight="medium">{title}</Text>
      <Link color="blue.500" fontSize="sm">
        See document upload guidelines
      </Link>
      <Box
        w="full"
        h="200px"
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="lg"
        borderColor="gray.200"
        bg="gray.50"
        _hover={{ borderColor: "blue.500" }}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        cursor="pointer"
        onClick={() => document.getElementById(`upload-${title}`).click()}
      >
        <VStack h="full" justify="center" spacing={2}>
          <Upload size={24} className="text-gray-400" />
          <Text color="blue.500" fontWeight="medium">
            Click to upload
          </Text>
          <Text fontSize="sm" color="gray.500">
            or drag and drop
          </Text>
          <Text fontSize="xs" color="gray.500">
            SVG, PNG, JPG or GIF (max. 800x400px)
          </Text>
        </VStack>
        <Input multiple id={`upload-${title}`} type="file" hidden onChange={handleUpload} accept="image/*" />
      </Box>
      <Box my={10} w="100%">
        {uploads?.filter((upload) => upload.file.type?.split('/')[0] !== 'image').map((file) => (
          <Box key={file.file.name || file.previewUrl} my={2} px={3} as={Flex} justifyContent="space-between" alignItems={'center'} py={2} width={'full'} borderWidth="2px" borderRadius="10px" borderColor="primary">
            <Text color="primary"> {file.file.name} </Text>
            <IconButton onClick={() => removeItem(file)} color="red" borderColor="red" variant="outline" borderRadius="full" icon={<DeleteIcon />} />
          </Box>
        ))}

        <SimpleGrid gap={4} minChildWidth={'100px'} columns={{  sm: 2, md: 3, lg: 4, xl: 4 }} placeItems="center">
          {uploads?.filter((upload) => upload.file.type?.split('/')[0] === 'image').map((image) => (
            <Box key={image.file.name || image.previewUrl} rounded={"lg"} w={'100%'} maxW="200px">
              <Image h="100px" w={'100%'} mb={2} src={image?.previewUrl} borderRadius="10px" />
              <IconButton onClick={() => removeItem(image)} color="red" variant="outline" w="full" icon={<DeleteIcon />} />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
}


// Car Details Form Component
function CarDetailsForm({ formData, setFormData }) {
  return (
    <VStack spacing={6} align="stretch" w="full" maxW="600px">
      <SimpleGrid columns={2} spacing={6}>
        <FormControl>
          <FormLabel>Car Brand</FormLabel>
          <Select
            placeholder="Select brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          >
            <option>Alfa Romeo</option>
            <option>BMW</option>
            <option>Mercedes-Benz</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Model</FormLabel>
          <Select
            placeholder="Select model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          >
            <option>Model 1</option>
            <option>Model 2</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={2} spacing={6}>
        <FormControl>
          <FormLabel>Year of Manufacture</FormLabel>
          <Select
            placeholder="Select year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i} value={2024 - i}>
                {2024 - i}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Trim</FormLabel>
          <Select
            placeholder="Select trim"
            value={formData.trim}
            onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
          >
            <option>Base</option>
            <option>Sport</option>
            <option>Luxury</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={2} spacing={6}>
        <FormControl>
          <FormLabel>Price</FormLabel>
          <InputGroup>
            <Input
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </InputGroup>
        </FormControl>
        <FormControl>
          <FormLabel>Usage</FormLabel>
          <Select
            placeholder="Select usage"
            value={formData.usage}
            onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
          >
            <option>New</option>
            <option>Used</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={2} spacing={6}>
        <FormControl>
          <FormLabel>Transmission</FormLabel>
          <Select
            placeholder="Select transmission"
            value={formData.transmission}
            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
          >
            <option>Automatic</option>
            <option>Manual</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Registration</FormLabel>
          <Select
            placeholder="Select registration"
            value={formData.registration}
            onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
          >
            <option>Registered</option>
            <option>Unregistered</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <FormControl>
        <FormLabel>VIN/Chassis Number</FormLabel>
        <Input
          placeholder="Enter Number..."
          value={formData.vin}
          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
        />
      </FormControl>

      <SimpleGrid columns={2} spacing={6}>
        <FormControl>
          <FormLabel>Body</FormLabel>
          <Select
            placeholder="Select body type"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          >
            <option>Sedan</option>
            <option>SUV</option>
            <option>Coupe</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Fuel</FormLabel>
          <Select
            placeholder="Select fuel type"
            value={formData.fuel}
            onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
          >
            <option>Petrol</option>
            <option>Diesel</option>
            <option>Electric</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <FormControl>
        <FormLabel>Seller Notes</FormLabel>
        <Textarea
          placeholder="Enter a description or any information that might be relevant to the customer..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          maxLength={400}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Maximum of 400 characters
        </Text>
      </FormControl>
    </VStack>
  )
}


// Review Component
function ReviewCard({ formData }) {
  return (
    <VStack spacing={6} align="stretch" maxW="600px" mx="auto">
      <Box borderWidth={1} borderRadius="lg" overflow="hidden">
        <Image
          src={formData.images?.[0] || "/placeholder.svg"}
          alt="Car preview"
          w="full"
          h="300px"
          objectFit="cover"
        />
        <Box p={6}>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold">
                {formData.year} {formData.brand} {formData.model}
              </Text>
              <Badge colorScheme="gray">FOREIGN USED</Badge>
            </VStack>
            <VStack align="end" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                ₦{Number(formData.price).toLocaleString()}
              </Text>
              <Text color="green.500" fontSize="sm">
                +0.5% added fees
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={6} mb={4}>
            <HStack>
              <Clock size={16} />
              <Text>{formData.mileage || "800"} miles</Text>
            </HStack>
            <HStack>
              <Settings size={16} />
              <Text>{formData.transmission}</Text>
            </HStack>
            <HStack>
              <Zap size={16} />
              <Text>{formData.fuel}</Text>
            </HStack>
          </HStack>

          <HStack>
            <Text color="gray.600">FCT, AMAC</Text>
            <Badge colorScheme="purple">CUSTOM DUTY ✓</Badge>
          </HStack>
        </Box>
      </Box>

      <Box p={4} bg="orange.50" borderRadius="md" borderLeftWidth={4} borderLeftColor="orange.400">
        <HStack>
          <AlertTriangle className="text-orange-500" />
          <Box>
            <Text fontWeight="medium">Reviews normally take 2-24 hours.</Text>
            <Text fontSize="sm" color="gray.600">
              Why we do reviews?
            </Text>
            <UnorderedList fontSize="sm" color="gray.600" mt={2}>
              <ListItem>To avoid duplicate listings.</ListItem>
              <ListItem>To ensure validity of vehicle.</ListItem>
              <ListItem>To increase customer trust in your listings.</ListItem>
            </UnorderedList>
          </Box>
        </HStack>
      </Box>
    </VStack>
  )
}


export default function AddListing() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const toast = useToast()

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePublish = () => {
    toast({
      title: "Listing submitted for review",
      description: "We'll notify you once the review is complete.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
  }

  return (
    <Box>
      <Container maxW="7xl" pb={16}>
        <BackButton />

        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading size="lg" className="bold">Add a Listing</Heading>
            <Text color="gray.600">Upload your car in 4 easy steps!</Text>
          </Box>

          <StepIndicator currentStep={currentStep} />

          {currentStep === 0 && (
            <VStack spacing={8} w="full" maxW="600px">
              <DocumentUpload
                title="Upload Car License"
                onUpload={(e) => {
                  // Handle file upload
                }}
              />
              <DocumentUpload
                title="Upload Custom Duty"
                onUpload={(e) => {
                  // Handle file upload
                }}
              />
              <Button colorScheme="blue" size="lg" w="full" onClick={handleContinue}>
                Continue
              </Button>
            </VStack>
          )}

          {currentStep === 1 && (
            <VStack spacing={8} w="full">
              <CarDetailsForm formData={formData} setFormData={setFormData} />
              <Button colorScheme="blue" size="lg" w="full" maxW="600px" onClick={handleContinue}>
                Continue
              </Button>
            </VStack>
          )}

          {currentStep === 2 && (
            <VStack spacing={8} w="full">
              <ReviewCard formData={formData} />
              <HStack spacing={4}>
                <Button colorScheme="blue" size="lg" onClick={handlePublish}>
                  Publish
                </Button>
                <Button colorScheme="green" size="lg" leftIcon={<Zap />}>
                  Boost & Publish
                </Button>
                <Button variant="outline" size="lg" onClick={() => setCurrentStep(0)}>
                  Cancel
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

