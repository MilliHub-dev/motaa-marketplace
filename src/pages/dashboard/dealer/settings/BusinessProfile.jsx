import { 
  Box, Button, Checkbox, FormControl, FormLabel,
  Input, Stack, Switch, Textarea, VStack, Heading,
  Image, Tabs, TabList, TabPanels, Tab, TabPanel,
  IconButton, Select, Avatar, Flex, HStack, Text,
  Divider, Tag,
} from "@chakra-ui/react";
import { useState, useEffect, useContext, useRef } from "react";
import { FaUpload } from "react-icons/fa";
import {GlobalStore} from '../../../../App'
import {objectifyJSON, jsonifyObject} from '../../../../utils'
import { Search, Bell, CloudUpload, ChevronDown, ArrowRight } from "lucide-react";




export const BusinessProfile = ({  }) => {
  const {axios, notify, authUser} = useContext(GlobalStore);
  const imageRef = useRef();
  const [dealership, setDealership] = useState({
    logo: "", // Placeholder for logo
    business_name: "",
    headline: "",
    about: "",
    owner: {},
    cac_number: "",
    tin_number: "",
    services: [],
    offers_rental: false,
    offers_purchase: true,
    offers_drivers: false,
    offers_trade_in: false,
    contact_email: '',
    contact_phone: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDealership({
      ...dealership,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const slugify = (text) => {
    if (text){
      return text.toLocaleLowerCase().replace(/['#@*()!"$%&]*/g, '').replaceAll(' ', '-')
    }else{
      return ''
    }
  }


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const preview = URL.createObjectURL(file)
    setDealership({ ...dealership, logo: {file, preview}});
  }

  async function getDealership() {
    const res = await axios.get('/admin/dealership/settings/');
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      // console.log("My settings:", data.data);
      setDealership(data.data)
    }
  }


  async function handleSubmit() {
    const payload = new FormData();
    const keys = Object.keys(dealership);


    for (let key of keys){
      if (key === 'logo' && typeof dealership[key] !== 'string'){
        const logo = dealership['logo'];
        if(logo){
          payload.append('new-logo', file, file.name)
        }
      }else{
        payload.append(key, dealership[key])
      }
    }

    console.log("Payload", payload)
    const res = await axios.post('/admin/dealership/settings/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      notify({
        title: 'Settings saved!',
        color: 'green'
      })
      setDealership(data.data)
    }
  }


  let dealerServices = [
    'Car Leasing',
    'Car Sale',
    'Drivers',
  ]


  useEffect(() => {
    getDealership();
  }, [])

  return (
    <VStack spacing={6} align="stretch" py={6} maxW="container.xl" w="100%">
      {/* Logo Upload Card */}
      <Box bg="white" border="1px solid" borderColor="#d0d5dd" borderRadius="xl" p={6} mb={6}>
        <VStack>
          {
            dealership?.logo?.file ? (
              <Image src={dealership?.logo?.preview} w="80px"  />
            ): (
              <Image src={dealership?.logo} w="80px"  />
            )
          }

          <Button onClick={e => imageRef.current.click()} variant="link" color="#0460cc" fontSize="sm" fontWeight="medium" leftIcon={<CloudUpload size={16} />}>
            Upload image
          </Button>
          <Input type="file" hidden ref={imageRef} accept="image/*" onInput={handleImageUpload} />
          <VStack mt={4} spacing={0}>
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="#101828">
              {dealership?.business_name}
            </Heading>
            <Text fontSize="xs" color="#667085">
              {dealership?.location}
            </Text>
            <HStack flexWrap={{base: 'wrap', md: 'nowrap'}} justifyContent="center" mt={2} fontSize="sm" color="#667085">
              <Text>{dealership?.contact_email}</Text>
              <Text>•</Text>
              <Text>{dealership?.contact_phone}</Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>

      <FormControl>
        <FormLabel>Business Name</FormLabel>
        <Input name="business_name" value={dealership?.business_name} onChange={handleChange} />

        <Text size="xs" color="gray.500" mt={2}> @{slugify(dealership?.business_name)} </Text>
      </FormControl>
      
      <FormControl>
        <FormLabel>Headline</FormLabel>
        <Input name="headline" value={dealership?.headline} onChange={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel>About</FormLabel>
        <Textarea name="about" value={dealership?.about} onChange={handleChange} maxLength={400} />
      </FormControl>

      <FormControl>
        <FormLabel>CAC Number</FormLabel>
        <Input name="cac_number" disabled value={dealership?.cac_number} onChange={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel>TIN Number</FormLabel>
        <Input name="tin_number" disabled value={dealership?.tin_number} onChange={handleChange} />
      </FormControl>

      {/* Services List Selector */}
      <Box border="1px solid" borderColor="#d0d5dd" borderRadius="lg" overflow="hidden">
        <Box p={3} borderBottom="1px solid" borderColor="#d0d5dd">
          <FormLabel fontWeight="medium" mb={2}> Choose services </FormLabel>
          <Flex flexWrap="wrap" gap={2}>
          {
            dealerServices?.map((service) => {
              const selected = dealership?.services?.includes(service);
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
                  onClick={() => 
                    setDealership({
                      ...dealership,
                      services: [...dealership?.services, service]
                    })
                  }
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
              dealership?.services?.map((service) => 
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
                  // onClick={() => removeService(service)}
                  onClick={() => {
                    const deals = dealership.services;
                    deals.splice(deals.indexOf(service), 1);
                    setDealership({ ...dealership, services:[...deals] })
                  }}
                >
                  {service}
                </Tag>
              )
            }
            {dealership?.services.length < 1 && <Text> Select at least one service you offer </Text>}
          </Flex>
        </Box>
      </Box>

      <Divider my={4} />

      {/* Customer Care Details */}
      <Heading size="md"> Contact Details </Heading>

      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input type="email" name="contact_email" value={dealership?.contact_email} onChange={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel>Customer Care Phone Number</FormLabel>
        <Input type="tel" name="contact_phone" value={dealership?.contact_phone} onChange={handleChange} />
      </FormControl>

      <Button colorScheme="blue" onClick={handleSubmit}>Save Changes</Button>
    </VStack>
  );
}


export default BusinessProfile;