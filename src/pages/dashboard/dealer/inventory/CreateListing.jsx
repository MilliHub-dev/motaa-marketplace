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
  ButtonGroup,
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
import {CloseIcon} from "@chakra-ui/icons";
import {BackButton} from '../../../../components/nav';
import {GlobalStore} from '../../../../App';
import {objectifyJSON} from '../../../../utils';
import { ArrowLeft, DeleteIcon, Upload, AlertTriangle, Zap, Clock, Settings, MessageCircle, Bell } from "lucide-react"
import { useState, useEffect, useContext, useRef } from "react";

// Step Indicator Component
function StepIndicator({ currentStep }) {
  const steps = ["Upload Images", "Enter details", "Review", "Publish"]

  return (
    <Box w="full" maxW="600px" mx="auto" mb={8}>
      <HStack justify="space-between" mb={2}>
        {steps.map((step, index) => (
          <VStack key={index} spacing={2}>
            <Box
             w={'20px'} h={'20px'}
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
function DocumentUpload({ title, description, onUpload }) {
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

        <SimpleGrid gap={4} minChildWidth={'200px'} columns={{  sm: 2, md: 3, lg: 4, xl: 4 }} placeItems="center">
          {uploads?.filter((upload) => upload.file.type?.split('/')[0] === 'image').map((image, idx) => (
            <Box key={image.file.name || image.previewUrl} rounded={"lg"} w={'100%'} maxW="200px" position="relative">
              <Image h="120px" w={'100%'} mb={2} src={image?.previewUrl} borderRadius="10px" />
              <Badge bg="gray.200" color="primary" size="md" py="5px" px="12px" placeItems="center" position="absolute" top="5px" right="5px" borderRadius="full">{`${idx+1}`}</Badge>
              <IconButton onClick={() => removeItem(image)} colorScheme="red" position="absolute" bottom="15px" right="5px" borderRadius="full" size="sm" icon={<CloseIcon />} />
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
      <FormControl isRequired mx={'auto'}>
        <FormLabel>Lisiting Type</FormLabel>
        <ButtonGroup size='md' isAttached variant='outline' mt={3}>
          <Button onClick={() => setFormData({...formData, listing_type: 'sale'})} 
           bgColor={formData?.listing_type === 'sale' ? 'primary' : 'transparent'}
           color={formData?.listing_type === 'sale' ? 'white' : 'primary'}
           borderTopWidth={2} borderBottomWidth={2}
           borderLeftWidth={2}
           colorScheme={'blue'}
           borderColor="cornflowerblue"
           borderRadius="30px" px={'35px'}
          >Direct Sale</Button>

          <Button onClick={() => setFormData({...formData, listing_type: 'rental'})}
           bgColor={formData?.listing_type === 'rental' ? 'primary' : 'transparent'}
           color={formData?.listing_type === 'rental' ? 'white' : 'primary'}
           borderTopWidth={2} borderBottomWidth={2}
           borderRightWidth={2}
           colorScheme={'blue'}
           borderColor="cornflowerblue"
           borderRadius="30px" px={'35px'}
          >Rental</Button>
        </ButtonGroup>
      </FormControl>

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
            <option>Alfa Romeo</option>
            <option>BMW</option>
            <option>Mercedes-Benz</option>
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
      </SimpleGrid>

      <FormControl isRequired>
        <FormLabel>VIN/Chassis Number</FormLabel>
        <Input
          placeholder="Enter Number..."
          value={formData.vin}
          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
        />
      </FormControl>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
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
          <FormLabel>Trim</FormLabel>
          <Select
            placeholder="Select trim"
            isRequired={true}
            name="trim"
            value={formData.trim}
            onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
          >
            <option>Base</option>
            <option>Sport</option>
            <option>Luxury</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
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
      </SimpleGrid>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
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
      </SimpleGrid>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
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
      </SimpleGrid>

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
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

      <SimpleGrid columns={{base: 1, md: 2}} spacing={6}>
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


// Review Component
function ReviewCard({ formData }) {
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
              <Text fontSize="2xl" fontWeight="bold">
                {formData.year} {formData.brand} {formData.model}
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
  const [currentStep, setCurrentStep] = useState(0);
  const {axios, notify, authUser, redirect} = useContext(GlobalStore); 
  const [formData, setFormData] = useState({});
  const [form, setForm] = useState(null);
  const toast = useToast();
  const formRef = useRef();
  window.formRef = formRef;

  const handleContinue = () => {
    if (currentStep < 3) {
      try{
        if (currentStep === 1){
          const inputs = formRef.current.querySelectorAll('[required]');
          for (let input of inputs){
            if (!input.value.trim()){
               notify({
                title: "Not so fast!",
                body: "Hey! You gotta fill all the required fields with, they're marked with a red *",
                level: "danger",
                duration: 5000,
                isClosable: false,
              });

               return
            }
          }
        }
      }catch(error){
        console.log("Oops:", error)
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePublish = async () => {
    const payload = new FormData(formRef.current);
    let keys = Object.keys(formData);

    for(var i=0; i < keys.length; i++){
      let key = keys[i];
      let val = formData[key];
      if(key === 'images'){
        for(var j=0; j < val.length; j++){
          payload.append('image', val[j].file, val[j].file.name);
        }
      }else{
        payload.append(key, val);
      }
    }

    const res = await axios.post('/admin/dealership/listings/create/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const data = objectifyJSON(data);
    if (res.status === 200){
      console.log("Created listing", data)
      toast({
        title: "Listing submitted for review",
        description: "We'll notify you once the review is complete.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      redirect('/inventory');
    }
  }

  return (
    <Box>
      <Container maxW="9xl" pb={16}>
        <BackButton
          // onClick={}
        />

        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading size="lg" className="bold">Add a Listing</Heading>
            <Text color="gray.600">Upload your car in 4 easy steps!</Text>
          </Box>

          <StepIndicator currentStep={currentStep} />
          <form style={{width:"100%"}} encType="multipart/form-data" ref={formRef} id="details-form" onSubmit={e => e.preventDefault()} method='post'>
          {currentStep === 0 && (
            <VStack spacing={8} w="full" maxW="600px">
              <DocumentUpload
                title="Upload up to 12 images of your car"
                description="See image upload guidelines"
                onUpload={(files) => {
                  console.log("Uploads:", files)
                  setFormData({ ...formData, images: [...files] });
                }}
              />
              <Button disabled={formData?.images?.length > 0 ? false : true} colorScheme="blue" size="lg" w="full" onClick={handleContinue}>
                Continue
              </Button>
            </VStack>
          )}

          {currentStep === 1 && (
            <VStack spacing={8} w="full">
            
              <CarDetailsForm formData={formData} setFormData={setFormData} />
              <Button colorScheme="blue" form="details-form" type="submit" size="lg" w="full" maxW="600px" onClick={handleContinue}>
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
          </form>
        </VStack>
      </Container>
    </Box>
  )
}

