import { useState, useEffect, useContext } from "react"
import {GlobalStore} from '../../../../App';
import {objectifyJSON, jsonifyObject} from '../../../../utils';
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
  Switch,
} from "@chakra-ui/react"
import {MoreVertical, Plus} from 'lucide-react';
import {Link} from 'react-router-dom'

const BookingStatusColors = {
  'accepted': 'blue',
  'completed': 'green',
  'declined': 'red',
  'requested': 'yellow',
}


// Client Info Component
const PreviewCard = ({ service, charge, images, charge_rate, description }) => (
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

export const ServiceOfferings = () => {
  const [services, setServices] = useState([]);
  const [serviceOfferings, setServiceOfferings] = useState([]);
  const {axios, notify, authUser } = useContext(GlobalStore);

  async function init(){
    const res = await axios.get('/admin/mechanics/services/');
    const data = await objectifyJSON(res.data);

    if (res.status === 200){
      console.log("Bookings:", data);
      // setServices(data.data);
      setServiceOfferings(data.data);
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

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {/* Header */}
      <Heading as="h1" size="lg" mb={6}>
        My Services
      </Heading>

      <Flex justifyContent="flex-end" mb={6}>
        <Button colorScheme="blue" bg="primary" leftIcon={<Plus />} as={Link} to="/services/add/"> Add Service </Button>
      </Flex>

      {/* Booking History */}
      <Box>
        <TableContainer>
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Service</Th>
                <Th>Charge</Th>
                <Th>Hires</Th>
                <Th>Active</Th>
              </Tr>
            </Thead>
            <Tbody>
              {serviceOfferings.map((offering) => (
                <Tr key={offering?.uuid}>
                  <Td>{offering?.service} </Td>
                  <Td>
                    <Text>{parseInt(offering?.charge).toLocaleString()}</Text>
                    <Badge
                      colorScheme={'blue'}
                      px={2}
                      py={1}
                      borderRadius="full"
                      textTransform="Capitalize"
                    >
                      {offering?.charge_rate}
                    </Badge>
                  </Td>

                  <Td>
                    {offering?.hires}
                  </Td>
                  
                  <Td>
                    <Flex gap={4} alignItems="center">
                      <Switch onChange={(e) => {
                        notify({
                          color: 'blue',
                          level: 'info',
                          title: e.target.checked ? 'Service Activated' : `Service Deactivated`
                        })
                      }} />

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

export default ServiceOfferings

