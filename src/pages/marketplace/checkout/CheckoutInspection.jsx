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
import {CalendarPicker, TimePicker} from '../../../components';
import {GlobalStore} from '../../../App';

function CheckoutInspection() {
  const [selectedDate, setSelectedDate] = useState()
  const [selectedTime, setSelectedTime] = useState()
  const {axios, notify} = useContext(GlobalStore);

  async function scheduleInspection(e){
    e.preventDefault();

    const date = selectedDate.toLocaleDateString();
    const time = selectedTime.toLocaleTimeString();
    console.log("Inspection scheduled for:", date, " at ", time);
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
        />
        <Button onClick={scheduleInspection} colorScheme="blue" size="lg" width="100%">
          Save & Apply
        </Button>
      </Container>
    </Box>
  )
}

export default CheckoutInspection



