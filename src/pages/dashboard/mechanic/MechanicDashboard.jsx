import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Progress,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  Tag,
} from "@chakra-ui/react"
import {
  FaChevronDown,
  FaChevronRight,

} from 'react-icons/fa6'
// import { ChevronDownIcon, ChevronRightIcon, ClockIcon, Filter, MapPin, MoreVertical, Search, Star, User, X } from "react-feather"
import {useState, useEffect, useContext, Fragment} from 'react';
import {GlobalStore} from '../../../App';
import { Link } from 'react-router-dom';
import {objectifyJSON, jsonifyObject} from '../../../utils';
import {MapPin, Search, MoreVertical} from 'lucide-react'

// Metric Card Component
const MetricCard = ({ title, value, change, trend, icon, suffix }) => {
  const isPositive = change > 0
  const trendColor = isPositive ? "green.500" : "red.500"
  const changeText = `${isPositive ? "+" : ""}${change}% ${isPositive ? "increase" : "decrease"} this month`

  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4} position="relative" bg="white">
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="sm" fontWeight="medium" color="gray.600">
          {title}
        </Text>
      </Flex>
      <Flex align="center" mb={2}>
        <Text fontSize="2xl" fontWeight="bold">
          {value}
        </Text>
        {suffix && <Box ml={1}>{suffix}</Box>}
      </Flex>

      {
        change &&
        <Fragment>
        <Flex align="center">
          <Text fontSize="sm" color={trendColor} fontWeight="medium">
            {changeText}
          </Text>
        </Flex>
        <Box position="absolute" bottom="0" left="0" right="0" h="40px" overflow="hidden">
          <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d={trend} fill="none" stroke={isPositive ? "green" : "red"} strokeWidth="1.5" opacity="0.5" />
          </svg>
        </Box>
        </Fragment>
      }
    </Box>
  )
}

// Client Info Component
const ClientInfo = ({ customer, location, }) => (
  <Flex align="center">
    <Box mr={3} w="40px" h="40px" borderRadius="full" overflow="hidden">
      <Avatar src={customer?.image} name={customer?.name} w="100%" h="100%" objectFit="cover" />
    </Box>
    <Box>
      <Text fontWeight="medium">{customer?.name}</Text>
      <Flex align="center" color="gray.500" fontSize="xs">
        <MapPin size={12} style={{ marginRight: "4px" }} />
        {location}
      </Flex>
    </Box>
  </Flex>
)


const StatusColor = {
  'accepted': 'blue',
  'working': 'purple',
  'requested': 'cyan',
  'completed': 'green',
  'declined': 'yellow',
  'expired': 'red',
  'canceled': 'red',
}


export const MechanicOverview = () => {
  const {authUser, axios, notify, naturalDate, naturalTime} = useContext(GlobalStore);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);

  async function getData(){
    const res = await axios.get('/admin/mechanics/dashboard/');
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      // console.log("Dashboard Data:", data.data)
      setDashboardData(data.data)
      setPendingRequests(data.data.pending_requests)
      setBookingHistory(data.data.booking_history)
    }
  }

  function init(){
    setLoading(true);
    getData();
    setTimeout(() => setLoading(false), 2000);
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
    init()
  }, []);

  if (loading){
    return null
  }

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {/* Header */}
      <Box mb={6}>
        <Heading as="h1" size="lg" mb={1}>
          Welcome back, {authUser?.first_name}
          <span role="img" aria-label="wave">
            👋
          </span>
        </Heading>
        <Text color="gray.600">Track, manage and forecast your customers and orders.</Text>
      </Box>

      {/* Metrics */}
      <Flex flexWrap="wrap" gap={4} mb={6}>
        <Box flex={{ base: "1 1 100%", md: "1 1 calc(25% - 12px)" }}>
          <MetricCard
            title="Total Revenue"
            value={`₦${parseInt(dashboardData?.total_revenue).toFixed(2)}`}
            // change={10}
            // trend="M0,30 Q40,25 60,20 T100,15 T150,5 T200,0"
          />
        </Box>
        
        <Box flex={{ base: "1 1 100%", md: "1 1 calc(25% - 12px)" }}>
          <MetricCard
           title="Total Hires"
           value={parseInt(dashboardData?.total_hires)}
           // change={-2} 
           // trend="M0,5 Q40,10 60,15 T100,20 T150,25 T200,30"
          />
        </Box>

        <Box flex={{ base: "1 1 100%", md: "1 1 calc(25% - 12px)" }}>
          <MetricCard
           title="Bookings"
           value={`${parseInt(dashboardData?.total_bookings)}`}
           // change={14}
           // trend="M0,30 Q40,25 60,20 T100,15 T150,5 T200,0"
          />
        </Box>
        
      </Flex>

      {/* Pending Requests */}
      <Box mb={8}>
        <Heading as="h2" size="md" mb={4}>
          Pending Requests
        </Heading>
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>ID</Th>
                <Th>Client</Th>
                <Th>Services</Th>
                <Th>Date</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingRequests.map((request, idx) => (
                <Tr key={request?.id}>
                  <Td>{idx+1}</Td>
                  <Td>
                    <Avatar name={request?.customer?.name} src={request?.customer?.image} size="md" />
                    {/*<ClientInfo name={request?.client} location={request.location} hasAvatar={request.hasAvatar} />*/}
                  </Td>
                  <Td>{request?.services?.map((service, idx) => <Tag> {service} </Tag> )}</Td>
                  <Td>
                    <Text>{naturalDate(new Date(request?.date_created))} | 
                       {naturalTime(new Date(request?.date_created))}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button onClick={(e) => handleAcceptRequest(request?.uuid)} colorScheme="blue" size="sm">
                        Accept
                      </Button>
                      <Button onClick={(e) => handleDeclineRequest(request?.uuid)} colorScheme="red" size="sm">
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
          <HStack>
            <Menu>
              <MenuButton as={Button} rightIcon={<FaChevronDown size={16} />} variant="outline" size="sm">
                Recents
              </MenuButton>
              <MenuList>
                <MenuItem>Last 7 days</MenuItem>
                <MenuItem>Last 30 days</MenuItem>
                <MenuItem>Last 90 days</MenuItem>
              </MenuList>
            </Menu>
          </HStack>

          <InputGroup maxW={{ base: "full", sm: "300px" }}>
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="#667085" />
            </InputLeftElement>
            <Input placeholder="Search" />
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
              {bookingHistory?.map((booking) => (
                <Tr key={booking.id}>
                  <Td>
                    <ClientInfo customer={booking?.customer} location={booking?.location} />
                  </Td>
                  <Td>{booking?.services[0]} {booking?.services?.length > 1 && `+ ${booking?.services?.length - 1} other services`}</Td>
                  <Td>
                    <Text>{naturalDate(new Date(booking?.date_created))} | 
                       {naturalTime(new Date(booking?.date_created))}
                    </Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={StatusColor[booking?.status?.toLowerCase()]}
                      px={2}
                      py={1}
                      borderRadius="full"
                      textTransform="capitalize"
                    >
                      {booking?.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Flex gap={3}>
                      {
                        booking?.status === 'accepted' ?
                        <Button size="sm" colorScheme="blue"> Start Job </Button>
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
        </Box>
      </Box>
    </Box>
  )
}

export default MechanicOverview

