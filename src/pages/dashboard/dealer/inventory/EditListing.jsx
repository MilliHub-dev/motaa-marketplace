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
import {
  StepIndicator,
  DocumentUploader,
  EditListingForm,
  CreateSaleForm,
  // ImageUploader,
  // ListingReviewCard,
} from '../../../../components/forms';
import {GlobalStore} from '../../../../App';
import {objectifyJSON, jsonifyObject} from '../../../../utils';
import { ArrowLeft, DeleteIcon, Upload, AlertTriangle, Zap, Clock, Settings, MessageCircle, Bell } from "lucide-react"
import { useState, useEffect, useContext, useRef } from "react";
import {useParams} from 'react-router-dom';


export default function EditListing() {
  const [currentStep, setCurrentStep] = useState(0);
  const {axios, notify, authUser, redirect} = useContext(GlobalStore); 
  const {listingId} = useParams();
  const [listing, setListing] = useState({})
  const [formData, setFormData] = useState({
    uuid: '',
    listing_type: '',
    price: 0,
    vehicle: {
      images: [],
      condition: ''
    },
  });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const steps = ["Enter details", "Upload Images", "Review", "Publish"]
  const toast = useToast();
  const formRef = useRef();
  window.formRef = formRef;

  async function init(){
    const res = await axios.get(`/admin/dealership/listings/${listingId}/`)
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      console.log('Data:', data.data)
      setListing(data.data)
      setFormData(data.data)
    } 
  }

  const handleContinue = () => {
    if (currentStep < 3) {
      try{
        switch(currentStep){
          case 1: {
            return handleImageUpload()
          }
          case 2: {
            return handlePublish()
          }
          default:{
            const inputs = formRef.current.querySelectorAll('[required]');
            for (let input of inputs){
              if (!input.value.trim()){
                 notify({
                  title: "Not so fast!",
                  body: "Hey! You gotta fill all the required fields with, they're marked with a red *",
                  color: "red",
                  duration: 5000,
                  isClosable: false,
                });

                 return
              }
            }
            return handleEdit();
          }
        }
      }catch(error){
        console.log("Oops:", error)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  async function handleImageUpload(){
    const images = formData.vehicle.images;
    const payload = new FormData(formRef.current);
    payload.append('action',  'upload-images');

    for(var i=0; i < images?.length; i++){
      if (!images[i].uuid){
        payload.append(
          'image',
          images[i]?.file,
          images[i]?.file.name
        );
      }
    }

    const res = await axios.post(`/admin/dealership/listings/${listingId}/`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.status === 200){
      setCurrentStep(currentStep+1)
    }
  }

  async function removeImage(image){
    const res = await axios.post(`/admin/dealership/listings/${listingId}/`, jsonifyObject({
      action: 'remove-image',
      image_id: image.uuid,
    }));
    if (res.status === 200){
      console.log("removed image from database")
    }
  }

  const handleEdit = async () => {
    const res = await axios.post(`/admin/dealership/listings/${listingId}/`, jsonifyObject({
        action: 'edit-listing',
        ...formData
      })
    )
    const data = objectifyJSON(res.data)

    if (res.status === 200){
      setFormData({ ...formData, uuid: data.data.uuid})
      toast({
        title: "Listing submitted for review",
        description: "We'll notify you once the review is complete.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      return setCurrentStep(currentStep+1);
    }
  }
  
  const handlePublish = async () => {
    const res = await axios.post(`/admin/dealership/listings/${listingId}/`, jsonifyObject({
        listing: formData?.uuid,
        action: 'publish-listing'
      })
    )

    if (res.status === 200){
      toast({
        title: "Listing submitted for review",
        description: "We'll notify you once the review is complete.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      return redirect('/inventory');
    }
  }

  useEffect(() => {
    init();
    setTimeout(() => setLoading(false), 500)
  }, [])

  return (
    <Box>
      <Container maxW="9xl" pb={16}>
        <BackButton
          onClick={currentStep > 0 ? () => setCurrentStep(currentStep -1) : undefined}
        />

        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading size="lg" className="bold">Edit a Listing</Heading>
            <Text color="gray.600">Edit your listing in 3 easy steps!</Text>
          </Box>

          <StepIndicator currentStep={currentStep} steps={steps} />
          <Container maxW={{sm: '100%', lg: "85%"}}>
            <form style={{width:"100%", placeItems: 'center', placeContent: 'center'}} encType="multipart/form-data" ref={formRef} id="details-form" onSubmit={e => e.preventDefault()} method='post'>
              {currentStep === 0 && (
                  <VStack spacing={8} w="full">
                    <FormControl isRequired mx={'auto'} width="100%">
                      <FormLabel>Lisiting Type</FormLabel>
                      <ButtonGroup size='md' isAttached variant='outline' mt={3} width="full">
                        <Button onClick={() => setFormData({...formData, listing_type: 'sale'})} 
                         bgColor={formData?.listing_type === 'sale' ? 'primary' : 'transparent'}
                         color={formData?.listing_type === 'sale' ? 'white' : 'primary'}
                         borderTopWidth={2} borderBottomWidth={2}
                         borderLeftWidth={2} flex={1}
                         colorScheme={'blue'}
                         borderColor="cornflowerblue"
                         borderRadius="10px" py={5}
                        >Direct Sale</Button>

                        <Button onClick={() => setFormData({...formData, listing_type: 'rental'})}
                         bgColor={formData?.listing_type === 'rental' ? 'primary' : 'transparent'}
                         color={formData?.listing_type === 'rental' ? 'white' : 'primary'}
                         borderTopWidth={2} borderBottomWidth={2}
                         borderRightWidth={2} flex={1}
                         colorScheme={'blue'}
                         borderColor="cornflowerblue"
                         borderRadius="10px" py={5}
                        >Rental</Button>
                      </ButtonGroup>
                    </FormControl>

                    <EditListingForm formData={formData} setFormData={setFormData} />
                    <Button colorScheme="blue" form="details-form" type="submit" size="lg" w="full" maxW="600px" onClick={handleContinue}>
                      Continue
                    </Button>
                  </VStack>
              )}

              {currentStep === 1 && (
                <VStack spacing={8} w="full">
                  <ImageUploader
                    title="of your car"
                    limit={12}
                    description="See image upload guidelines"
                    onRemove={removeImage}
                    onUpload={(files) => {
                      console.log("Uploads:", files)
                      setFormData({ ...formData, vehicle: {...formData?.vehicle, images: [...files]} });
                    }}
                    data={formData?.vehicle.images}
                  />
                  <Button disabled={formData?.vehicle.images?.length > 0 ? false : true} colorScheme="blue" size="lg" w="full" onClick={handleContinue}>
                    Continue
                  </Button>
                </VStack>
              )}

              {currentStep === 2 && (
                <VStack spacing={8} w="full">
                  <ListingReviewCard formData={formData} />
                  <HStack spacing={4}>
                    <Button colorScheme="blue" size="md" onClick={handlePublish}>
                      Publish
                    </Button>

                    <Button variant="outline" size="md" onClick={() => setCurrentStep(0)}>
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              )}
            </form>
          </Container>
        </VStack>
      </Container>
    </Box>
  )
}


function ListingReviewCard({ formData }) {
  return (
    <VStack spacing={6} align="stretch" maxW="600px" mx="auto">
      <Box borderWidth={1} borderRadius="lg" overflow="hidden">
        <Image
          src={formData?.vehicle.images[0]?.previewUrl || "/placeholder.svg"}
          alt="Car preview"
          w="full"
          h="300px"
          objectFit="cover"
        />
        <Box p={6}>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold">
                {formData?.title}
              </Text>
              <Badge colorScheme="gray">{formData?.vehicle?.condition}</Badge>
            </VStack>
            <VStack align="end" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                ₦{Number(formData?.price).toLocaleString()}
              </Text>
              <Text color="green.500" fontSize="sm">
                +0.5% added fees
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={6} mb={4}>
            <HStack>
              <Clock size={16} />
              <Text>{formData?.vehicle?.mileage || "800"} miles</Text>
            </HStack>
            <HStack>
              <Settings size={16} />
              <Text>{formData?.vehicle?.transmission}</Text>
            </HStack>
            <HStack>
              <Zap size={16} />
              <Text>{formData?.vehicle?.fuel_system}</Text>
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



// Image Upload Component
function ImageUploader({ title, description, data, onRemove, onUpload, limit=12 }) {
  const [uploads, setUploads] = useState(data || []);
  const {axios} = useContext(GlobalStore);

  async function removeItem(item) {
    if (item.uuid && onRemove){
      onRemove(item)
    }

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
            <Image h="120px" w={'100%'} mb={2} src={image?.uuid ? image?.url : image?.previewUrl} borderRadius="10px" />
            <Badge bg="gray.200" color="primary" size="md" py="5px" px="12px" placeItems="center" position="absolute" top="5px" right="5px" borderRadius="full">{`${idx+1}`}</Badge>
            <IconButton onClick={() => removeItem(image)} colorScheme="red" position="absolute" bottom="15px" right="5px" borderRadius="full" size="sm" icon={<CloseIcon />} />
          </Box>
        ))}
      </Flex>
    </VStack>
  );
}