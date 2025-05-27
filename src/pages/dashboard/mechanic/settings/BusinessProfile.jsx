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


let mechServices = [
  'Oil Change',
  'Paint Job',
  'Body Work',
  'Engine Repair',
]

export const BusinessProfile = ({  }) => {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const imageRef = useRef();
  const [mechanic, setMechanic] = useState({
    logo: "", // Placeholder for logo
    business_name: "",
    headline: "",
    about: "",
    owner: {},
    cac_number: "",
    tin_number: "",
    services: [],
    contact_email: '',
    contact_phone: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMechanic({
      ...mechanic,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const slugify = (text) => {
    return text.toLocaleLowerCase().replace(/['#@*()!"$%&]*/g, '').replaceAll(' ', '-')
  }

  const changeValue = (key, value) => {
    const oldValue = mechanic
    oldValue[`${key}`] = value;
    setMechanic({ ...oldValue })
  }

  function removeService(service){
    const oldValue = mechanic?.services;
    oldValue.pop(service)
    changeValue('services', [...oldValue])
  }


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const preview = URL.createObjectURL(file)
    setMechanic({ ...mechanic, logo: {file, preview}});
  }

  async function getMechanicSettings() {
    const res = await axios.get('/admin/mechanics/settings/');
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      setMechanic(data.data)
    }
  }


  async function handleSubmit() {
    const payload = new FormData();
    const keys = Object.keys(mechanic);


    for (let key of keys){
      if (key === 'logo' && typeof mechanic['logo'] !== 'string'){
        const file = mechanic['logo'].file;
        payload.append('new-logo', file, file.name)
      }else{
        console.log("New setting")
        payload.append(key, mechanic[key])
      }
    }

    const res = await axios.post('/admin/mechanics/settings/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      console.log("My new settings:", data.data)
      setMechanic(data.data)
    }
  }



  useEffect(() => {
    getMechanicSettings();
  }, [])

  return (
    <VStack spacing={6} align="stretch" py={6} maxW="container.xl" w="100%">
      {/* Logo Upload Card */}
      <Box bg="white" border="1px solid" borderColor="#d0d5dd" borderRadius="xl" p={6} mb={6}>
        <VStack>
          {
            mechanic?.logo?.file ? (
              <Image src={mechanic?.logo?.preview} w="80px"  />
            ): (
              <Image src={mechanic?.logo} w="80px"  />
            )
          }

          <Button onClick={e => imageRef.current.click()} variant="link" color="#0460cc" fontSize="sm" fontWeight="medium" leftIcon={<CloudUpload size={16} />}>
            Upload image
          </Button>
          <Input type="file" hidden ref={imageRef} accept="image/*" onInput={handleImageUpload} />
          <VStack mt={4} spacing={0}>
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="#101828">
              {mechanic?.business_name}
            </Heading>
            <Text fontSize="xs" color="#667085">
              {mechanic?.location}
            </Text>
            <HStack flexWrap={{base: 'wrap', md: 'nowrap'}} justifyContent="center" mt={2} fontSize="sm" color="#667085">
              <Text>{mechanic?.contact_email}</Text>
              <Text>•</Text>
              <Text>{mechanic?.contact_phone}</Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>

      <FormControl>
        <FormLabel>Business Name</FormLabel>
        <Input name="business_name" value={mechanic?.business_name} onChange={handleChange} />

        <Text size="xs" color="gray.500" mt={2}> @{slugify(mechanic?.business_name)} </Text>
      </FormControl>
      
      <FormControl>
        <FormLabel>Headline</FormLabel>
        <Input name="headline" value={mechanic?.headline} onInput={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel>About</FormLabel>
        <Textarea name="about" value={mechanic?.about} onInput={handleChange} maxLength={400} />
      </FormControl>

      <FormControl>
        <FormLabel>CAC Number</FormLabel>
        <Input name="cac_number" disabled value={mechanic?.cac_number}/>
      </FormControl>

      <FormControl>
        <FormLabel>TIN Number</FormLabel>
        <Input name="tin_number" disabled value={mechanic?.tin_number}/>
      </FormControl>

      {/* Choose Services */}
      <Box mb={6}>
        <FormLabel fontWeight="medium" mb={2}> Services Offered </FormLabel>
        <Box border="1px solid" borderColor="#d0d5dd" borderRadius="lg" overflow="hidden">
          <Box p={3} borderBottom="1px solid" borderColor="#d0d5dd">
            <FormLabel fontWeight="medium" mb={2}> Choose services </FormLabel>
            <Flex flexWrap="wrap" gap={2}>
            {
              mechServices?.map((service) => {
                const selected = mechanic?.services?.includes(service);
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
                    onClick={() => changeValue('services', [...mechanic?.services, service])}
                  >
                    {service?.service}
                  </Tag>
                )
              }
            )}
            </Flex>
          </Box>

          <Box p={3}>
            <Flex flexWrap="wrap" gap={2}>
              {
                mechanic?.services?.map((service) => 
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
                    {service?.service} @ {commaInt(service?.charge)}
                  </Tag>
                )
              }
              {mechanic?.services.length < 1 && <Text> Select at least one service you offer </Text>}
            </Flex>
          </Box>
        </Box>
      </Box>

      <Divider my={4} />

      {/* Customer Care Details */}
      <Heading size="md" pb={0} mb={0}> Contact Details </Heading>
      <Text as="small"> Customer care contact details  </Text>

      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input type="email" name="contact_email" value={mechanic?.contact_email} onInput={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel> Phone Number</FormLabel>
        <Input type="tel" name="contact_phone" value={mechanic?.contact_phone} onInput={handleChange} />
      </FormControl>

      <Button colorScheme="blue" onClick={handleSubmit}>Save Changes</Button>
    </VStack>
  );
}


export default BusinessProfile;