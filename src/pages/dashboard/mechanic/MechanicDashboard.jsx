import {
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
} from "@chakra-ui/react"
import {
  FaChevronDown,
  FaChevronRight,

} from 'react-icons/fa6'
// import { ChevronDownIcon, ChevronRightIcon, ClockIcon, Filter, MapPin, MoreVertical, Search, Star, User, X } from "react-feather"
import {useState, useEffect, useContext} from 'react';
import {GlobalStore} from '../../../App';


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
        changeText &&
        <>
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
        </>
      }
    </Box>
  )
}

// Client Info Component
const ClientInfo = ({ name, location, hasAvatar }) => (
  <Flex align="center">
    <Box mr={3} w="40px" h="40px" borderRadius="full" overflow="hidden" bg={hasAvatar ? "transparent" : "gray.100"}>
      {hasAvatar ? (
        <Image src="https://via.placeholder.com/40" alt={name} w="100%" h="100%" objectFit="cover" />
      ) : (
        <Flex w="100%" h="100%" align="center" justify="center">
          {/*<User size={20} color="#667085" />*/}
        </Flex>
      )}
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

export const MechanicOverview = () => {
  const {authUser, axios} = useContext(GlobalStore);

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
            value="₦743,678.12"
            change={10}
            trend="M0,30 Q40,25 60,20 T100,15 T150,5 T200,0"
          />
        </Box>
        
        <Box flex={{ base: "1 1 100%", md: "1 1 calc(25% - 12px)" }}>
          <MetricCard title="Impressions" value="32.7M" change={-2} trend="M0,5 Q40,10 60,15 T100,20 T150,25 T200,30" />
        </Box>

        <Box flex={{ base: "1 1 100%", md: "1 1 calc(25% - 12px)" }}>
          <MetricCard title="Bookings" value="32" change={14} trend="M0,30 Q40,25 60,20 T100,15 T150,5 T200,0" />
        </Box>
        
      </Flex>

      {/* Profile Setup Notification */}
      <Box borderWidth="1px" borderColor="blue.100" borderRadius="md" p={4} mb={6} bg="white" position="relative">
        <Flex align="center" mb={2}>
          <Box
            w={4}
            h={4}
            borderRadius="full"
            bg="blue.500"
            mr={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box w={2} h={2} borderRadius="full" bg="white" />
          </Box>
          <Text fontWeight="medium">Complete your profile setup</Text>
          <dojah-button
            widgetId="68067151186873a0f4098161"
            text="Web"
            textColor="#FFFFFF"
            backgroundColor="#3977de">
          </dojah-button>
        </Flex>
        <Box px={6}>
          <Progress value={60} size="sm" colorScheme="blue" borderRadius="full" mb={1} />
          <Text fontSize="sm" color="gray.600" textAlign="right">
            3/5 steps completed.
          </Text>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Flex gap={4} mb={8} flexDir={{ base: "column", sm: "row" }}>
        <Button
         // leftIcon={<Icon as={Clock} />}
         colorScheme="blue" size="lg" flex={1}>
          View Bookings
        </Button>
        <Button
          leftIcon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          colorScheme="blue"
          variant="outline"
          size="lg"
          flex={1}
          bg="blue.50"
          color="blue.500"
          borderColor="blue.100"
          _hover={{ bg: "blue.100" }}
        >
          View Messages
        </Button>
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
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Date</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingRequests.map((request) => (
                <Tr key={request.id}>
                  <Td>
                    <ClientInfo name={request.client} location={request.location} hasAvatar={request.hasAvatar} />
                  </Td>
                  <Td>{request.service}</Td>
                  <Td>
                    <Text>{request.date}</Text>
                    <Text color="gray.500" fontSize="sm">
                      {request.time}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button colorScheme="blue" size="sm">
                        Accept
                      </Button>
                      <Button colorScheme="red" variant="outline" size="sm">
                        Reject
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
            {/*<Button leftIcon={<Filter size={16} />} variant="outline" size="sm">
              More filters
            </Button>*/}
          </HStack>
          <InputGroup maxW={{ base: "full", sm: "300px" }}>
            <InputLeftElement pointerEvents="none">
              {/*<Search size={18} color="#667085" />*/}
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
              {bookingHistory.map((booking) => (
                <Tr key={booking.id}>
                  <Td>
                    <ClientInfo name={booking.client} location={booking.location} hasAvatar={booking.hasAvatar} />
                  </Td>
                  <Td>{booking.service}</Td>
                  <Td>
                    <Text>{booking.date}</Text>
                    <Text color="gray.500" fontSize="sm">
                      {booking.time}
                    </Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={booking.status === "Completed" ? "green" : "red"}
                      px={2}
                      py={1}
                      borderRadius="full"
                      textTransform="none"
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

export default MechanicOverview

