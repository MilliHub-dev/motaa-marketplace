import { 
  Box, Button, Checkbox, FormControl, FormLabel,
  Input, Stack, Switch, Textarea, VStack, Heading,
  Image, Tabs, TabList, TabPanels, Tab, TabPanel,
  IconButton, Select, Avatar,
} from "@chakra-ui/react";
import { useState, useEffect, useContext } from "react";
import { FaUpload } from "react-icons/fa";
import {Outlet} from 'react-router-dom';
import BusinessProfile from './BusinessProfile';
import {objectifyJSON} from '../../../../utils';
import {GlobalStore} from '../../../../App';


const DealershipSettings = () => {

  // const {axios, notify, authUser} = useContext(GlobalStore);

  // async function getDealership() {
  //   const res = await axios.get('/admin/dealership/settings/');
  //   const data = objectifyJSON(res.data);

  //   if (res.status === 200){
  //     console.log("My settings:", data.data)
  //   }
  // }

  // useEffect(() => {

  // }, [])
  
  return (
    <VStack spacing={6} align="stretch" p={6} w="100%" mx="auto">
      <Heading size="lg">Dealership Settings</Heading>

      <BusinessProfile />

      {/* Update use tabs for separation of settings, move payout and billing settings to wallet settings */}
      {/*<Tabs variant="enclosed">
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
      </Tabs>*/}
    </VStack>
  );
};

export default DealershipSettings;

