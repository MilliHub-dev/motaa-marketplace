import {
  Box,
  Container,
  Heading,
  VStack,
  Select,
  Button,
  Text,
  Grid,
  Center,
  HStack,
  IconButton,
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {CalendarPicker, TimePicker} from '../../../components';
import {jsonifyObject, objectifyJSON} from '../../../utils';
import {GlobalStore} from '../../../App';

function CheckoutInspection() {
  const [selectedDate, setSelectedDate] = useState();
  const [selectedTime, setSelectedTime] = useState();
  const {axios, notify} = useContext(GlobalStore);
  const redirect = useNavigate();
  const [params] = useSearchParams();
  const listing_id = params.get('listingId');


  async function scheduleInspection(e){
    e.preventDefault();

    const date = selectedDate.toLocaleDateString();
    const time = selectedTime.toLocaleTimeString();
    console.log("Inspection scheduled for:", date, " at ", time);

    const res = await axios.post(`/listings/checkout/inspection/`, jsonifyObject({
      listing_id,
      date,
      time,
    }));

    const data = objectifyJSON(res.data)

    if (res.status === 200){
      setTimeout(() => notify({
        title: 'Success',
        body: `Inspection scheduled for ${date}`,
        level: 'green'
      }), 1000)
      return redirect('/checkout/docs/?docType=inspection-slip')
    }

    notify({
      title: 'Error',
      body: data.message,
      color: 'red',
    })

  }

  return (
    <Box bg="white" minH="100vh">
      <Box bg="blue.600" py={8} mb={8}>
        <Container maxW="container.xl" textAlign="center">
          <Heading color="white" size="lg" className="subtitle" fontWeight="400">Checkout</Heading>
          <Text color="whiteAlpha.900" mt={2}>Get Ready to own a Car!</Text>
        </Container>
      </Box>

      <Container maxW="container.md" pb={10}>
        
          {/*<Box>*/}
        <Heading size="lg" mb={8}>Schedule Inspection</Heading>
        
        <TimePicker mb={3} value={selectedTime} onChange={setSelectedTime} as={Button} w="full" px={0} />

        <CalendarPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => setSelectedDate(date)}
          borderWidth="1px"
          borderRadius="md"
          my={3}
        />
        <Button onClick={scheduleInspection} colorScheme="blue" size="lg" width="100%">
          Save & Apply
        </Button>
      </Container>
    </Box>
  )
}

export default CheckoutInspection



