import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Text,
  Tag, TagLabel,
  TagCloseButton,
  Button,
  Input,
  Select,
  Image,
  IconButton,
  ButtonGroup,
  Progress,
  Textarea,
  FormControl,
  FormLabel,
  InputGroup,
  // FadeIn,
  Badge,
  useToast,
  Link,
  Avatar,
  Heading,
  SimpleGrid,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import {CloseIcon} from "@chakra-ui/icons";
import {BackButton} from './nav';
import {GlobalStore} from '../App';
import {objectifyJSON} from '../utils';
import { ArrowLeft, DeleteIcon, Upload, AlertTriangle, Zap, Clock, Settings, MessageCircle, Bell } from "lucide-react"
import { useState, useEffect, useContext, useRef } from "react";


// Review Component
export function ListingReviewCard({ formData }) {
  return (
    <VStack spacing={6} align="stretch" maxW="600px" mx="auto">
      <Box borderWidth={1} borderRadius="lg" overflow="hidden">
        <Image
          src={formData?.images[0]?.previewUrl || "/placeholder.svg"}
          alt="Car preview"
          w="full"
          h="300px"
          objectFit="cover"
        />
        <Box p={6}>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold">
                {formData.title}
              </Text>
              <Badge colorScheme="gray">{formData?.usage}</Badge>
            </VStack>
            <VStack align="end" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
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
              <Text>{formData.fuel_system}</Text>
            </HStack>
          </HStack>

          <HStack>
            <Text color="gray.600">FCT, AMAC</Text>
            <Badge colorScheme="purple"> CUSTOM DUTY ✓</Badge>
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


// Step Indicator Component
export function StepIndicator({ steps, currentStep }) {
  
  return (
    <Box w="full" maxW="600px" mx="auto" mb={8}>
      <HStack justify="space-between" mb={2}>
        {steps.map((step, index) => (
          <VStack key={index} spacing={2}>
            <Box
             w={'25px'} h={'25px'}
             borderRadius="full"
             placeItems="center"
             placeContent="center"
             borderColor={index <= currentStep ? "primary" : "gray.200"}
             borderWidth={'2px'}
            >
              <Box
               w={3} h={3}
               borderRadius="full"
               bg={index <= currentStep ? "primary" : "gray.200"}
              />
            </Box>
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
export function DocumentUploader({ title, description, data, onUpload, maxFileSize=2000 }) {
  const [uploads, setUploads] = useState([]);

  function removeItem(item) {
    let all = uploads;
    let idx = all.indexOf(item)
    all.splice(idx, 1)
    setUploads([...all]);
    onUpload([...all]);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleFileDrop(e) {
    e.preventDefault();
    if (uploads.length < 12){
      uploadFile(e.dataTransfer.files[0]);
    }
  }

  async function uploadFile(file) {
    let previewUrl = URL.createObjectURL(file);
    const data = { file, previewUrl };
    let allUploads = [...uploads, data];
    setUploads([...allUploads]);
    onUpload([...allUploads]);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (uploads.length < 12){
      let files = Array.from(e.target.files).slice(0, (12 - uploads.length));
      const fileData = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      let allUploads = [...uploads, ...fileData];
      setUploads([...allUploads]);
      onUpload([...allUploads]);
    }
  }

  useEffect(() => {

  }, [uploads])

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
            PDF, DOCX, XLSX, TXT, or JPG (max. {maxFileSize})
          </Text>
        </VStack>
        <Input multiple id={`upload-${title}`} type="file" hidden onChange={handleUpload} accept=".pdf,.docx,.txt" />
      </Box>
      <Box my={10} w="100%">
        {uploads?.map((file) => (
          <Box key={file.file.name || file.previewUrl} my={2} px={3} as={Flex} justifyContent="space-between" alignItems={'center'} py={2} width={'full'} borderWidth="2px" borderRadius="10px" borderColor="primary">
            <Text color="primary"> {file.file.name} </Text>
            <IconButton onClick={() => removeItem(file)} color="red" borderColor="red" variant="outline" borderRadius="full" icon={<DeleteIcon />} />
          </Box>
        ))}
      </Box>
    </VStack>
  );
}


// Image Upload Component
export function ImageUploader({ title, description, data, onUpload, limit=12 }) {
  const [uploads, setUploads] = useState(data || []);

  function removeItem(item) {
    let all = uploads;
    let idx = all.indexOf(item)
    all.splice(idx, 1)
    setUploads([...all]);
    onUpload([...all]);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleFileDrop(e) {
    e.preventDefault();
    if (uploads.length < limit){
      uploadFile(e.dataTransfer.files[0]);
    }
  }

  async function uploadFile(file) {
    let previewUrl = URL.createObjectURL(file);
    const data = { file, previewUrl };
    let allUploads = [...uploads, data];
    setUploads([...allUploads]);
    onUpload([...allUploads]);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (uploads.length < 12){
      let files = Array.from(e.target.files).slice(0, (limit - uploads.length));
      const fileData = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      let allUploads = [...uploads, ...fileData];
      setUploads([...allUploads]);
      onUpload([...allUploads]);
    }
  }

  useEffect(() => {

  }, [uploads])

  return (
    <VStack spacing={2} align="start" w="full" mb={8}>
      <Text fontWeight="medium">Upload up to {limit} images {title} </Text>
      <Link color="blue.500" fontSize="sm">
        See image upload guidelines
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
      
      <Flex gap={4} overflowX="auto" w="100%" flexWrap="nowrap" placeItems="center">
        {uploads?.map((image, idx) => (
          <Box key={image.previewUrl} rounded={"lg"} minW={'200px'} maxW="200px" position="relative">
            <Image h="120px" w={'100%'} mb={2} src={image?.previewUrl} borderRadius="10px" />
            <Badge bg="gray.200" color="primary" size="md" py="5px" px="12px" placeItems="center" position="absolute" top="5px" right="5px" borderRadius="full">{`${idx+1}`}</Badge>
            <IconButton onClick={() => removeItem(image)} colorScheme="red" position="absolute" bottom="15px" right="5px" borderRadius="full" size="sm" icon={<CloseIcon />} />
          </Box>
        ))}
      </Flex>
    </VStack>
  );
}

const CarFeatures = [
  'Air Conditioning', 'Keyless Entry', 'Car Play', 
  'Parking Camera', 'Android Auto', 'Baby Seat',
  'USB-C charging', 'Lane Assist', 'Auto-Drive', 'Sun Roof'
]

const CarBrands = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Dodge", "Ferrari", "Fiat", "Ford",
  "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Innoson", "Jaguar", "Jeep", "Kia", "Lamborghini",
  "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "Mini", "Mitsubishi", "Nissan", "Peugeot", "Porsche", "Ram", "Renault", "Rolls-Royce",
  "Saab", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"
]

// Car Details Form Component
export function CreateRentalForm({ formData, setFormData }) {

  return (
    <VStack spacing={6} align="stretch" w="full">
      <FormControl isRequired>
        <FormLabel>Listing Title</FormLabel>
        <Input
          placeholder="eg Ford Focus Mini Edition"
          isRequired={true}
          name="title"
          value={formData.title}
          onInput={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </FormControl>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
        
        <FormControl isRequired>
          <FormLabel>Car Brand</FormLabel>
          <Select
            placeholder="Select brand"
            isRequired={true}
            name="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          >
            {CarBrands?.map(brand => <option value={brand}>{brand}</option>)}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Model</FormLabel>
          <Input
            placeholder="Car model"
            isRequired={true}
            value={formData.model}
            onInput={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Rental Price</FormLabel>
          <InputGroup>
            <Input
              type="number"
              isRequired={true}
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </InputGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Payment Cycle</FormLabel>
          <Select
           name="payment-cycle"
           isRequired
           value={formData.payment_cycle}
           onChange={(e) => setFormData({ ...formData, payment_cycle: e.target.value })}
          >
            <option value='day'>Daily</option>
            <option value='week'>Weekly</option>
            <option value='month'>Monthly</option>
            <option value='year'>Annually</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Condition</FormLabel>
          <Select
            placeholder="Choose condition"
            name="condition"
            isRequired={true}
            value={formData.usage}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          >
            <option value="new">New</option>
            <option value="local-used">Used (Local)</option>
            <option value="uk-used">Used (UK)</option>
            <option value="us-used">Used (US)</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>VIN/Chassis Number</FormLabel>
          <Input
            placeholder="Enter Number..."
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Vehicle Type</FormLabel>
          <Select
            placeholder="Select Vehicle Type"
            value={formData.body}
            name="vehicle_type"
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="coupe">Coupe</option>
            <option value="convertible">Convertible</option>
            <option value="truck">Truck</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Fuel System</FormLabel>
          <Select
            placeholder="Select fuel type"
            value={formData.fuel}
            name="fuel_system"
            onChange={(e) => setFormData({ ...formData, fuel_system: e.target.value })}
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Transmission</FormLabel>
          <Select
            name="transmission"
            isRequired={true}
            placeholder="Select transmission"
            value={formData.transmission}
            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
          >
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Doors</FormLabel>
          <Select
            placeholder="Select Door number"
            value={formData.doors}
            name="doors"
            onChange={(e) => setFormData({ ...formData, doors: e.target.value })}
          >
            <option>2</option>
            <option>3</option>
            <option>4</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Seats</FormLabel>
          <Select
            placeholder="Select seats number"
            value={formData.seats}
            name="seats"
            onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
          >
            <option>2</option>
            <option>4</option>
            <option>5</option>
            <option>7</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Mileage</FormLabel>
          <Input
            name="mileage"
            isRequired={true}
            type="number"
            min={0}
            placeholder="0 miles"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Drive train</FormLabel>
          <Select
            placeholder="Choose an option"
            value={formData.drivetrain}
            name="drivetrain"
            onChange={(e) => setFormData({ ...formData, drivetrain: e.target.value })}
          >
            <option value="4WD">4WD (4 Wheel drive)</option>
            <option value="AWD">AWD (All Wheel drive)</option>
            <option value="FWD">FWD (Front Wheel drive)</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <FormControl isRequired>
        <FormLabel>Features</FormLabel>
        <Flex gap={3} w="full" flexWrap="wrap">
          {
            CarFeatures?.map((feature) => 
              <Tag
               borderWidth={2}
               key={feature}
               size="lg"
               minW="120px"
               maxW="max-content"
               borderRadius="5px"
               borderColor={formData?.features?.includes(feature) && "white"}
               color={formData?.features?.includes(feature) && "white"}
               bgColor={formData?.features?.includes(feature) ? "primary" : "white"}
               px={4} py={3}
               cursor="pointer"
               transition="0.5s"
               gapRight={10}
               onClick={() => {
                  const features = [...formData?.features]
                  if (!features.includes(feature)){
                    features.push(feature)
                    setFormData({ ...formData, features: [...features]})
                  }
               }
              }
              >
                <TagLabel flex={1}> {feature} </TagLabel>
                {formData?.features?.includes(feature) &&
                  <TagCloseButton opacity={1} color="white" onClick={() => {
                    const features = [...formData?.features]
                    if (features.includes(feature)){
                      features.splice(features.indexOf(feature), 1)
                      setFormData({ ...formData, features: [...features]})
                    }
                  }} />
                }
              </Tag>
            )
          }
        </Flex>
      </FormControl>

      <FormControl>
        <FormLabel>Seller Notes <small>(optional)</small></FormLabel>
        <Textarea
          placeholder="Enter a description or any information that might be relevant to the customer..."
          value={formData.notes}
          name="notes"
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          maxLength={700}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Maximum of 700 characters
        </Text>
      </FormControl>
    </VStack>
  )
}


// Car Details Form Component
export function EditListingForm({ formData, setFormData }) {

  return (
    <VStack spacing={6} align="stretch" w="full">
      <FormControl isRequired>
        <FormLabel>Listing Title</FormLabel>
        <Input
          placeholder="eg Ford Focus Mini Edition"
          isRequired={true}
          name="title"
          value={formData?.title}
          onInput={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </FormControl>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
        
        <FormControl isRequired>
          <FormLabel>Car Brand</FormLabel>
          <Select
            placeholder="Select brand"
            isRequired={true}
            name="brand"
            value={formData?.vehicle?.brand}
            onChange={
              (e) => setFormData(
                { ...formData, vehicle: {...formData?.vehicle, brand: e.target.value}
              })
            }
          >
            {CarBrands?.map(brand => <option value={brand}>{brand}</option>)}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Model</FormLabel>
          <Input
            placeholder="Car model"
            isRequired={true}
            value={formData?.vehicle?.model}
            onInput={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, model: e.target.value} })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Rental Price</FormLabel>
          <InputGroup>
            <Input
              type="number"
              isRequired={true}
              placeholder="Enter price"
              value={formData?.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </InputGroup>
        </FormControl>

        {
          formData?.listing_type === 'rental' &&
          <FormControl isRequired>
            <FormLabel>Payment Cycle</FormLabel>
            <Select
             name="payment-cycle"
             isRequired
             value={formData?.payment_cycle}
             onChange={(e) => setFormData({ ...formData, payment_cycle: e.target.value })}
            >
              <option value='day'>Daily</option>
              <option value='week'>Weekly</option>
              <option value='month'>Monthly</option>
              <option value='year'>Annually</option>
            </Select>
          </FormControl>
        }
        
        <FormControl isRequired>
          <FormLabel>Condition</FormLabel>
          <Select
            placeholder="Choose condition"
            name="condition"
            isRequired={true}
            value={formData?.vehicle?.condition}
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, condition: e.target.value} })}
          >
            <option value="new">New</option>
            <option value="used-local">Local Used</option>
            <option value="used-foreign">Foreign Used</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>VIN/Chassis Number</FormLabel>
          <Input
            placeholder="Enter Number..."
            value={formData?.vehicle?.vin}
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, vin: e.target.value} })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Vehicle Type</FormLabel>
          <Select
            placeholder="Select Vehicle Type"
            value={formData?.vehicle?.type}
            name="vehicle_type"
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, vehicle_type: e.target.value} })}
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="coupe">Coupe</option>
            <option value="convertible">Convertible</option>
            <option value="truck">Truck</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Fuel System</FormLabel>
          <Select
            placeholder="Select fuel type"
            value={formData?.vehicle?.fuel_system}
            name="fuel_system"
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, fuel_system: e.target.value} })}
          >
            <option>Petrol</option>
            <option>Diesel</option>
            <option>Hybrid</option>
            <option>Electric</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Transmission</FormLabel>
          <Select
            name="transmission"
            isRequired={true}
            placeholder="Select transmission"
            value={formData?.vehicle?.transmission}
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, transmission: e.target.value} })}
          >
            <option>Automatic</option>
            <option>Manual</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Doors</FormLabel>
          <Select
            placeholder="Select Door number"
            value={formData?.vehicle?.doors}
            name="doors"
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, doors: e.target.value} })}
          >
            <option>2</option>
            <option>3</option>
            <option>4</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Seats</FormLabel>
          <Select
            placeholder="Select seats number"
            value={formData?.vehicle?.seats}
            name="seats"
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, seats: e.target.value} })}
          >
            <option>2</option>
            <option>4</option>
            <option>5</option>
            <option>7</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Mileage</FormLabel>
          <Input
            name="mileage"
            isRequired={true}
            type="number"
            min={0}
            placeholder="0 miles"
            value={formData?.vehicle?.mileage}
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, mileage: e.target.value} })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Drive train</FormLabel>
          <Select
            placeholder="Choose an option"
            value={formData?.vehicle?.drivetrain}
            name="drivetrain"
            onChange={(e) => setFormData({ ...formData, vehicle: {...formData.vehicle, drivetrain: e.target.value} })}
          >
            <option value="4WD">4WD (4 Wheel drive)</option>
            <option value="AWD">AWD (All Wheel drive)</option>
            <option value="FWD">FWD (Front Wheel drive)</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <FormControl isRequired>
        <FormLabel>Features</FormLabel>
        <Flex gap={3} w="full" flexWrap="wrap">
          {
            CarFeatures?.map((feature) => 
              <Tag
               borderWidth={2}
               key={feature}
               size="lg"
               minW="120px"
               maxW="max-content"
               borderRadius="5px"
               borderColor={formData?.vehicle?.features?.includes(feature) && "white"}
               color={formData?.vehicle?.features?.includes(feature) && "white"}
               bgColor={formData?.vehicle?.features?.includes(feature) ? "primary" : "white"}
               px={4} py={3}
               cursor="pointer"
               transition="0.5s"
               gapRight={10}
               onClick={() => {
                  const features = [...formData?.vehicle?.features]
                  if (!features?.includes(feature)){
                    features?.push(feature);
                    console.log("features:", features)
                    setFormData({ ...formData, vehicle: {...formData.vehicle, features }})
                  }
                  console.log("Set features:", formData.vehicle.features)
               }
              }
              >
                <TagLabel flex={1}> {feature} </TagLabel>
                {formData?.vehicle?.features?.includes(feature) &&
                  <TagCloseButton opacity={1} color="white" onClick={() => {
                    const features = [...formData.vehicle.features]
                    if (features.includes(feature)){
                      features.splice(features.indexOf(feature), 1)
                      setFormData({ ...formData, vehicle: {...formData.vehicle, features: [...features]}})
                    }
                  }} />
                }
              </Tag>
            )
          }
        </Flex>
      </FormControl>

      <FormControl>
        <FormLabel>Seller Notes <small>(optional)</small></FormLabel>
        <Textarea
          placeholder="Enter a description or any information that might be relevant to the customer..."
          value={formData?.notes}
          name="notes"
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          maxLength={700}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Maximum of 700 characters
        </Text>
      </FormControl>
    </VStack>
  )
}

// Car Details Form Component
export function CreateSaleForm({ formData, setFormData }) {
  return (
    <VStack spacing={6} align="stretch" w="full">
      <FormControl isRequired>
        <FormLabel>Listing Title</FormLabel>
        <Input
          placeholder="eg Ford Focus Mini Edition"
          isRequired={true}
          name="title"
          value={formData.title}
          onInput={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </FormControl>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
        <FormControl isRequired>
          <FormLabel>Car Brand</FormLabel>
          <Select
            placeholder="Select brand"
            isRequired={true}
            name="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          >
            {CarBrands?.map(brand => <option key={brand} value={brand}>{brand}</option>)}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Model</FormLabel>
          <Input
            placeholder="Car model"
            isRequired={true}
            value={formData.model}
            onInput={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>VIN/Chassis Number</FormLabel>
          <Input
            placeholder="Enter Number..."
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Year of Manufacture</FormLabel>
          <Select
            placeholder="Select year"
            isRequired={true}
            name="year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Price</FormLabel>
          <InputGroup>
            <Input
              type="number"
              isRequired={true}
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </InputGroup>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Condition</FormLabel>
          <Select
            placeholder="Choose condition"
            name="condition"
            isRequired={true}
            value={formData.usage}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          >
            <option value="new">New</option>
            <option value="local-used">Used (Local)</option>
            <option value="uk-used">Used (UK)</option>
            <option value="us-used">Used (US)</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Vehicle Type</FormLabel>
          <Select
            placeholder="Select Vehicle Type"
            value={formData.body}
            name="vehicle_type"
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="coupe">Coupe</option>
            <option value="convertible">Convertible</option>
            <option value="truck">Truck</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Fuel System</FormLabel>
          <Select
            placeholder="Select fuel type"
            value={formData.fuel}
            name="fuel_system"
            onChange={(e) => setFormData({ ...formData, fuel_system: e.target.value })}
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Transmission</FormLabel>
          <Select
            name="transmission"
            isRequired={true}
            placeholder="Select transmission"
            value={formData.transmission}
            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
          >
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Registration</FormLabel>
          <Select
            placeholder="Select registration"
            value={formData.registration}
            name="registration"
            onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
          >
            <option>Registered</option>
            <option>Unregistered</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Mileage</FormLabel>
          <Input
            name="mileage"
            isRequired={true}
            type="number"
            min={0}
            placeholder="0 miles"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Drive train</FormLabel>
          <Select
            placeholder="Choose an option"
            value={formData.drivetrain}
            name="drivetrain"
            onChange={(e) => setFormData({ ...formData, drivetrain: e.target.value })}
          >
            <option value="4WD">4WD (4 Wheel drive)</option>
            <option value="AWD">AWD (All Wheel drive)</option>
            <option value="FWD">FWD (Front Wheel drive)</option>
          </Select>
        </FormControl>
      
        <FormControl isRequired>
          <FormLabel>Doors</FormLabel>
          <Select
            placeholder="Select"
            value={formData.doors}
            name="doors"
            onChange={(e) => setFormData({ ...formData, doors: e.target.value })}
          >
            <option>2</option>
            <option>3</option>
            <option>4</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Seats</FormLabel>
          <Select
            placeholder="Select seats number"
            value={formData.seats}
            name="seats"
            onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
          >
            <option>2</option>
            <option>4</option>
            <option>5</option>
            <option>7</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <FormControl>
        <FormLabel>Seller Notes <small>(optional)</small></FormLabel>
        <Textarea
          placeholder="Enter a description or any information that might be relevant to the customer..."
          value={formData.notes}
          name="notes"
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

