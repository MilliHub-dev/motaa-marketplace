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
  ImageUploader,
  CreateRentalForm,
  ListingReviewCard,
  CreateSaleForm,
} from '../../../../components/forms';
import {GlobalStore} from '../../../../App';
import {objectifyJSON, jsonifyObject} from '../../../../utils';
import { ArrowLeft, DeleteIcon, Upload, AlertTriangle, Zap, Clock, Settings, MessageCircle, Bell } from "lucide-react"
import { useState, useEffect, useContext, useRef } from "react";


export default function AddListing() {
  const [currentStep, setCurrentStep] = useState(0);
  const {axios, notify, authUser, redirect} = useContext(GlobalStore); 
  const [formData, setFormData] = useState({
    uuid: null,
    listing_type: 'sale',
    features: [],
  });
  const [form, setForm] = useState(null);
  const steps = ["Enter details", "Upload Images", "Review", "Publish"]
  const toast = useToast();
  const formRef = useRef();
  window.formRef = formRef;

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
            return handleCreate();
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
    const payload = new FormData(formRef.current);
    payload.append('action',  'upload-images');
    payload.append('listing',  formData?.uuid);
    for(var i=0; i < formData?.images?.length; i++){
      payload.append(
        'image',
        formData?.images[i]?.file,
        formData?.images[i]?.file.name
      );
    }

    const res = await axios.post('/admin/dealership/listings/create/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.status === 200){
      setCurrentStep(currentStep+1)
    }
  }

  const handleCreate = async () => {
    const res = await axios.post('/admin/dealership/listings/create/', jsonifyObject({
        action: 'create-listing',
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
    const res = await axios.post('/admin/dealership/listings/create/', jsonifyObject({
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

  return (
    <Box>
      <Container maxW="9xl" pb={16}>
        <BackButton
          onClick={currentStep > 0 ? () => setCurrentStep(currentStep -1) : undefined}
        />

        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading size="lg" className="bold">Add a Listing</Heading>
            <Text color="gray.600">Upload your car in 3 easy steps!</Text>
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

                    { formData?.listing_type === 'rental' ?
                      <CreateRentalForm formData={formData} setFormData={setFormData} />
                      :
                      <CreateSaleForm formData={formData} setFormData={setFormData} />
                    }
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
                    onUpload={(files) => {
                      console.log("Uploads:", files)
                      setFormData({ ...formData, images: [...files] });
                    }}
                    data={formData?.images}
                  />
                  <Button disabled={formData?.images?.length > 0 ? false : true} colorScheme="blue" size="lg" w="full" onClick={handleContinue}>
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

