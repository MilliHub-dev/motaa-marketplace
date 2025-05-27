import { useState, useEffect, useContext } from "react"
import {GlobalStore} from '../../../../App';
import {objectifyJSON, jsonifyObject} from '../../../../utils';
import {ComboBox} from '../../../../components';
import {
  Box,
  Button,
  Flex,
  Heading,
  Avatar,
  HStack,
  Stack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  Select,
  FormControl,
  FormLabel,
  MenuButton,
  MenuItem,
  MenuList,
  Badge,
  Switch,
} from "@chakra-ui/react"
import {MoreVertical, Plus} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom'


export const CreateServiceOffering = () => {
  const [services, setServices] = useState([]);
  const [serviceOffering, setServiceOffering] = useState({
    service: '',
    charge: '',
    charge_rate: 'flat',
    description: '',
  });
  const {axios, notify, authUser } = useContext(GlobalStore);
  const redirect = useNavigate()

  async function init(){
    const res = await axios.get('/admin/mechanics/services/add/');
    const data = await objectifyJSON(res.data);

    if (res.status === 200){
      setServices(data?.data);
    }

  }


  async function handleCreate(e){
    e.preventDefault();
    const payload = {
      ...serviceOffering
    }
    const res = await axios.post('/admin/mechanics/services/add/', jsonifyObject(payload));
    const data = await objectifyJSON(res.data);

    if (res.status === 201){
      console.log("Bookings:", data);
      notify({
        'title': 'Successfully created new service'
      })
      return redirect('/services');
    }
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {/* Header */}
      <Heading as="h1" size="lg" mb={6}>
        Add a New Service
      </Heading>
    
      <Stack maxW={700}>
        <form method="POST" onSubmit={handleCreate}>
          <FormControl my={3} isRequired>
            <FormLabel> Service Title </FormLabel>
            <ComboBox defaultOptions={[...services?.map(service => service.title)]} onSelect={value => setServiceOffering({ ...serviceOffering, title: value })} />
          </FormControl>

          <FormControl my={3} isRequired>
            <FormLabel> Service Charge / Cost </FormLabel>
            <Input value={serviceOffering?.charge} onInput={e => setServiceOffering({ ...serviceOffering, charge: e.target.value })} type="number" name="charge" />
          </FormControl>

          <FormControl my={3} isRequired>
            <FormLabel> Charge Rate </FormLabel>
            <Select defaultValue={serviceOffering?.charge_rate} value={serviceOffering?.charge_rate} onInput={e => setServiceOffering({ ...serviceOffering, charge_rate: e.target.value })} name="charge_rate">
              <option disabled selected> Choose Rate </option>
              <option value="flat"> Flat Rate </option>
              <option value="hourly"> Hourly Rate </option>
            </Select>
          </FormControl>
          
          <FormControl>
            <Button w="full" bg="primary" colorScheme="blue" size="lg" type="submit"> Create Service </Button>
          </FormControl>
        </form>
      </Stack>

    </Box>
  )
}

export default CreateServiceOffering

