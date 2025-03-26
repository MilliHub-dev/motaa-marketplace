import { 
  Box, Button, Checkbox, FormControl, FormLabel,
  Input, Stack, Switch, Textarea, VStack, Heading,
  Image, Tabs, TabList, TabPanels, Tab, TabPanel,
  IconButton, Select, Avatar,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaUpload } from "react-icons/fa";




const DealershipSettings = () => {
  const [dealership, setDealership] = useState({
    logo: "", // Placeholder for logo
    business_name: "",
    headline: "",
    about: "",
    cac_number: "",
    tin_number: "",
    offers_rental: false,
    offers_purchase: true,
    offers_drivers: false,
    offers_trade_in: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDealership({
      ...dealership,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = () => {
    console.log("Saved Dealership Data:", dealership);
  };

  return (
    <VStack spacing={6} align="stretch" p={6} w="100%" mx="auto">
      <Heading size="lg">Dealership Settings</Heading>
      <Tabs variant="enclosed">
        <TabList>
          <Tab fontWeight="600">Business Profile</Tab>
          <Tab fontWeight="600">Billing</Tab>
          <Tab fontWeight="600">Payout</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <BusinessProfile dealership={dealership} setDealership={setDealership} />
          </TabPanel>
          <TabPanel>
            <Heading size="md">Billing Information</Heading>
            <p>Billing settings will go here.</p>
          </TabPanel>
          <TabPanel>
            <Heading size="md">Payout Settings</Heading>
            <p>Payout settings will go here.</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default DealershipSettings;




const BusinessProfile = ({ dealership, setDealership,  }) => {

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDealership({
      ...dealership,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    console.log("Saved Dealership Data:", dealership);
  };

  return (
    <VStack spacing={6} align="stretch" p={6} maxW="800px" mx="auto">
      <Heading size="lg">Business Profile</Heading>
      
      {/* Logo Upload Card */}
      <Box p={4} borderWidth={1} borderRadius="lg" textAlign="center">
        <FormLabel>Logo</FormLabel>
        <Box position="relative" display="inline-block">
          <Avatar name={dealership?.business_name} />
          <IconButton icon={<FaUpload />} aria-label="Upload Logo" size="lg" />
          <Input
            type="file"
            name="logo"
            opacity={0}
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            onChange={handleChange}
          />
        </Box>
        {dealership.logo && <Image src={dealership.logo} boxSize="100px" mt={2} />}
      </Box>

      <FormControl>
        <FormLabel>Business Name</FormLabel>
        <Input name="business_name" value={dealership.business_name} onChange={handleChange} />
      </FormControl>
      
      <FormControl>
        <FormLabel>Headline</FormLabel>
        <Input name="headline" value={dealership.headline} onChange={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel>About</FormLabel>
        <Textarea name="about" value={dealership.about} onChange={handleChange} maxLength={400} />
      </FormControl>

      <FormControl>
        <FormLabel>CAC Number</FormLabel>
        <Input name="cac_number" value={dealership.cac_number} onChange={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel>TIN Number</FormLabel>
        <Input name="tin_number" value={dealership.tin_number} onChange={handleChange} />
      </FormControl>

      {/* Services List Selector */}
      <FormControl>
        <FormLabel>Choose Services</FormLabel>
        <Select name="services" value={dealership.services} onChange={handleChange}>
          <option value="Car Sale">Car Sale</option>
          <option value="Car Dealership">Car Dealership</option>
          <option value="Car Finance Agent">Car Finance Agent</option>
          <option value="Car Leasing">Car Leasing</option>
        </Select>
      </FormControl>

      {/* Customer Care Details */}
      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input type="email" name="customer_email" value={dealership.customer_email} onChange={handleChange} />
      </FormControl>

      <FormControl>
        <FormLabel>Customer Care Phone Number</FormLabel>
        <Input type="tel" name="customer_phone" value={dealership.customer_phone} onChange={handleChange} />
      </FormControl>

      <Button colorScheme="blue" onClick={handleSubmit}>Save Changes</Button>
    </VStack>
  );
}
