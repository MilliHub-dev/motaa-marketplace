import { useState, useEffect, useContext, Fragment } from "react"
import {GlobalStore} from '../../../App';
import {objectifyJSON, jsonifyObject} from '../../../utils';
import {
  Box,
  Button,
  Flex,
  Heading,
  Avatar,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  TableContainer,
  Badge,
} from "@chakra-ui/react"
import {MoreVertical, MapPin, Search} from 'lucide-react';

const BookingStatusColors = {
  'accepted': 'blue',
  'working': 'purple',
  'requested': 'cyan',
  'completed': 'green',
  'declined': 'yellow',
  'expired': 'red',
  'canceled': 'red',
}


// Client Info Component
const ClientInfo = ({ name, location, image }) => (
  <Flex align="center">
    <Box mr={3} w="40px" h="40px" borderRadius="full" overflow="hidden">
      <Avatar src={image} name={name} w="100%" h="100%" objectFit="cover" />
    </Box>
    
    <Box>
      <Text fontWeight="medium">{name}</Text>
      <Flex align="center" color="gray.500" fontSize="xs">
        <MapPin size={12} style={{ marginRight: "4px" }} />
        {location}
      </Flex>
    </Box>
  </Flex>
)

const Bookings = () => {
  const [activeFilter, setActiveFilter] = useState("All")
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const {axios, notify, authUser, naturalDate, naturalTime } = useContext(GlobalStore);

  const filters = [
    'All',
    'Accepted',
    'Completed',
    'Declined',
    'Working',
  ]

  async function init(){
    const res = await axios.get('/admin/mechanics/bookings/');
    const data = await objectifyJSON(res.data);

    if (res.status === 200){
      console.log("Bookings:", data.bookings);
      setPendingRequests(data.bookings.requests);
      setBookingHistory(data.bookings.history);
      setFilteredBookings(data.bookings.history);
    }
  }


  async function handleStartJob(requestId){
    const res = await axios.post(`/admin/mechanics/bookings/${requestId}/`, jsonifyObject({
      action: 'start-job'
    }));
    const data = await objectifyJSON(res.data);
    if (res.status === 200){
      notify({
        title: 'Success',
        body: 'Job Started!',
        level: 'info'
      });

      init();

    }
  }
  

  // Filter bookings based on selected filter
  const handleFilterChange = (filter) => {
    setActiveFilter(filter)

    if (filter === "All") {
      setFilteredBookings(bookingHistory)
    } else {
      setFilteredBookings(bookingHistory.filter((booking) => booking.status.toLowerCase() === filter.toLowerCase()))
    }
  }


  async function handleAcceptRequest(requestId){
    const res = await axios.post(`/admin/mechanics/bookings/${requestId}/`, jsonifyObject({
      action: 'accept'
    }));
    const data = await objectifyJSON(res.data);
    if (res.status === 200){
      notify({
        title: 'Success',
        body: 'Request Accepted!',
        level: 'info'
      });

      init();

    }
  }
  
  async function handleDeclineRequest(requestId){
    const res = await axios.post(`/admin/mechanics/bookings/${requestId}/`, jsonifyObject({
      action: 'decline'
    }));
    const data = await objectifyJSON(res.data);
    if (res.status === 200){
      notify({
        title: 'Success',
        body: 'Request Declined!',
        level: 'info'
      });

      init();

    }
  }


  useEffect(() => {
    init();
  }, [])

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {/* Header */}
      <Box mb={6}>
        <Heading as="h1" size="lg" mb={6}>
          Bookings
        </Heading>
      </Box>

      {/* Pending Requests */}
      <Box mb={8}>
        <Heading as="h2" size="md" mb={4}>
          Pending Requests
        </Heading>
        <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="auto">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Date</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingRequests.map((request, idx) => (
                <Tr key={idx}>
                  <Td>
                    <ClientInfo name={request?.customer?.name} location={request?.location} image={request?.customer?.image} />
                  </Td>
                  <Td>{request?.services[0]} {request?.services?.length > 1 && `+ ${request?.services?.length - 1} services`}</Td>
                  <Td>
                    <Text>{naturalDate(new Date(request?.date_created))} | {naturalTime(new Date(request?.date_created))}</Text>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button onClick={() => handleAcceptRequest(request?.uuid)} colorScheme="blue" bg="primary" size="sm">
                        Accept
                      </Button>
                      <Button onClick={() => handleDeclineRequest(request?.uuid)} colorScheme="red" size="sm">
                        Decline
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Booking History */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Booking History
        </Heading>
        <Flex justify="space-between" mb={4} flexDir={{ base: "column", sm: "row" }} gap={3}>
          <HStack spacing={2}>
            {
              filters.map(filter => 
                <Button
                  size="sm"
                  key={filter}
                  variant={activeFilter === filter ? "solid" : "outline"}
                  bg={activeFilter === filter ? "blue.50" : "white"}
                  color={activeFilter === filter ? "blue.500" : "gray.700"}
                  borderColor="gray.200"
                  onClick={() => handleFilterChange(filter)}
                >
                  {filter}
                </Button>
              )
            }

          </HStack>
          <InputGroup maxW={{ base: "full", sm: "300px" }}>
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="#667085" />
            </InputLeftElement>
            <Input placeholder="Search" borderColor="gray.200" />
          </InputGroup>
        </Flex>

        <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="auto">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredBookings.map((booking) => (
                <Tr key={booking?.uuid}>
                  <Td>
                    <ClientInfo name={booking?.customer?.name} location={booking?.location} image={booking?.customer?.image} />
                  </Td>
                  <Td>{booking?.services[0]} {booking?.services?.length > 1 && `+ ${booking?.services?.length - 1} services`}</Td>
                  <Td>
                    <Text>{naturalDate(new Date(booking?.date_created))} | {naturalTime(new Date(booking?.date_created))}</Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={BookingStatusColors[booking?.status]}
                      px={2}
                      py={1}
                      borderRadius="full"
                      textTransform="Capitalize"
                    >
                      {booking.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Flex gap={3}>
                      {
                        booking?.status === 'accepted' ?
                        <Button size="sm" colorScheme="blue" onClick={() => handleStartJob(booking?.uuid)}> Start Job </Button>
                        : booking?.status === 'working' ?
                        <Fragment>
                          <Button size="sm" colorScheme="blue"> Finish Job </Button>
                          <Button size="sm" colorScheme="red"> Cancel Job </Button>
                        </Fragment>
                        : null
                      }

                      {
                        !['expired', 'canceled', 'declined'].includes(booking?.status) &&
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="Options"
                            icon={<MoreVertical size={16} />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem>View details</MenuItem>
                            <MenuItem>Contact client</MenuItem>
                            <MenuItem>Download invoice</MenuItem>
                          </MenuList>
                        </Menu>
                      }
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}

export default Bookings

