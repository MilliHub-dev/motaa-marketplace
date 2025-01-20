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
import { useState } from 'react'

function CheckoutInspection() {
  const [selectedDate, setSelectedDate] = useState('Jan 6, 2024')
  const [selectedTime, setSelectedTime] = useState('14:00')

  const times = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00'
  ]

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sat', 'Su']

  return (
    <Box bg="white" minH="100vh">
      <Box bg="blue.600" py={8} mb={8}>
        <Container maxW="container.md">
          <Heading color="white" size="lg">Checkout</Heading>
          <Text color="whiteAlpha.900" mt={2}>Get Ready to own a Car!</Text>
        </Container>
      </Box>

      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={8}>Schedule Inspection</Heading>
            
            <Text mb={4}>Time</Text>
            <Select 
              value={selectedTime} 
              onChange={(e) => setSelectedTime(e.target.value)}
              mb={8}
            >
              {times.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </Select>

            <Box borderWidth={1} borderRadius="lg" p={6}>
              <HStack justify="space-between" mb={6}>
                <IconButton
                  icon={<ChevronLeftIcon />}
                  variant="ghost"
                  aria-label="Previous month"
                />
                <Text fontWeight="medium">January 2024</Text>
                <IconButton
                  icon={<ChevronRightIcon />}
                  variant="ghost"
                  aria-label="Next month"
                />
              </HStack>

              <Text textAlign="center" mb={4}>{selectedDate}</Text>

              <Grid templateColumns="repeat(7, 1fr)" gap={2} mb={4}>
                {weekDays.map(day => (
                  <Center key={day} py={2} fontWeight="medium">
                    {day}
                  </Center>
                ))}
                {days.map(day => (
                  <Button
                    key={day}
                    variant={day === 6 ? 'solid' : 'ghost'}
                    colorScheme={day === 6 ? 'blue' : 'gray'}
                    onClick={() => setSelectedDate(`Jan ${day}, 2024`)}
                    size="sm"
                  >
                    {day}
                  </Button>
                ))}
              </Grid>

              <Button colorScheme="blue" width="100%">
                Save & Apply
              </Button>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default CheckoutInspection

