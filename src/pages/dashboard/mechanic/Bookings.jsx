"use client"

import { useState, useEffect, useContext } from "react"
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
  Badge,
} from "@chakra-ui/react"


const BookingStatusColors = {
  'accepted': 'blue',
  'completed': 'green',
  'declined': 'red',
  'requested': 'yellow',
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
        {/*<MapPin size={12} style={{ marginRight: "4px" }} />*/}
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
  const {axios, notify, authUser } = useContext(GlobalStore);

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

  useEffect(() => {
    init();
  }, [])

  // Filter bookings based on selected filter
  const handleFilterChange = (filter) => {
    setActiveFilter(filter)

    if (filter === "All") {
      setFilteredBookings(bookingHistory)
    } else {
      setFilteredBookings(bookingHistory.filter((booking) => booking.status === filter))
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
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Date</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingRequests.map((request) => (
                <Tr key={request?.uuid}>
                  <Td>
                    <ClientInfo name={request?.customer?.name} location={request?.location} image={request?.customer?.image} />
                  </Td>
                  <Td>{request?.services[0]} {request?.services?.length > 1 && `+ ${request?.services?.length - 1} services`}</Td>
                  <Td>
                    <Text>{request?.date_created}</Text>
                    <Text color="gray.500" fontSize="sm">
                      {request.time}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button onClick={() => handleAcceptRequest(request?.uuid)} colorScheme="blue" size="sm">
                        Accept
                      </Button>
                      <Button onClick={() => handleDeclineRequest(request?.uuid)} colorScheme="red" variant="outline" size="sm">
                        Decline
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      {/* Booking History */}
      <Box>
        <Heading as="h2" size="md" mb={4}>
          Booking History
        </Heading>
        <Flex justify="space-between" mb={4} flexDir={{ base: "column", sm: "row" }} gap={3}>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant={activeFilter === "All" ? "solid" : "outline"}
              bg={activeFilter === "All" ? "blue.50" : "white"}
              color={activeFilter === "All" ? "blue.500" : "gray.700"}
              borderColor="gray.200"
              onClick={() => handleFilterChange("All")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "Recents" ? "solid" : "outline"}
              bg={activeFilter === "Recents" ? "blue.50" : "white"}
              color={activeFilter === "Recents" ? "blue.500" : "gray.700"}
              borderColor="gray.200"
              onClick={() => handleFilterChange("Recents")}
            >
              Recents
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "Rejected" ? "solid" : "outline"}
              bg={activeFilter === "Rejected" ? "blue.50" : "white"}
              color={activeFilter === "Rejected" ? "blue.500" : "gray.700"}
              borderColor="gray.200"
              onClick={() => handleFilterChange("Rejected")}
            >
              Rejected
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "Completed" ? "solid" : "outline"}
              bg={activeFilter === "Completed" ? "blue.50" : "white"}
              color={activeFilter === "Completed" ? "blue.500" : "gray.700"}
              borderColor="gray.200"
              onClick={() => handleFilterChange("Completed")}
            >
              Completed
            </Button>
            <Button
             // leftIcon={<Filter size={16} />} 
             variant="outline" size="sm" borderColor="gray.200">
              More filters
            </Button>
          </HStack>
          <InputGroup maxW={{ base: "full", sm: "300px" }}>
            <InputLeftElement pointerEvents="none">
              {/*<Search size={18} color="#667085" />*/}
            </InputLeftElement>
            <Input placeholder="Search" borderColor="gray.200" />
          </InputGroup>
        </Flex>
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
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
                    <Text>{booking?.date_created}</Text>
                    <Text color="gray.500" fontSize="sm">
                      {booking?.time}
                    </Text>
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
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        aria-label="Options"
                        // icon={<MoreVertical size={16} />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem>View details</MenuItem>
                        <MenuItem>Contact client</MenuItem>
                        <MenuItem>Download invoice</MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  )
}

export default Bookings

