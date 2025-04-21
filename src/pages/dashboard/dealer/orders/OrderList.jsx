import {GlobalStore} from '../../../../App'
import {objectifyJSON, jsonifyObject} from '../../../../utils'
import {StatusBadge} from '../../../../components'
import { useState, useEffect, useContext } from "react"
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
  TableContainer,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  Avatar,
} from "@chakra-ui/react"
import {
  MdSearch,
  MdHome,
  MdBarChart,
  MdPeople,
  MdSettings,
  MdMoreVert,
  MdFilterList,
  MdShare,
  MdMessage,
  MdNotifications,
  MdBolt,
  MdLock,
  MdLocationOn,
  MdKeyboardArrowDown,
  MdInventory,
  MdCalendarMonth,
} from "react-icons/md"
import { BsWallet2 } from "react-icons/bs"


const OrderListAdmin = () => {
  const [orderList, setOrderList] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const {axios} = useContext(GlobalStore);

  async function getData(){
    const res = await axios.get('/admin/dealership/orders/');
    const data = objectifyJSON(res.data)
    if (res.status === 200){
      setOrderList(data.data)
    }
    console.log("Got orders:", data)
  }

  useEffect(() => {
    getData();
  }, [])

  return (
    <Box flex={1} p={6}>
      <Box py={5} borderBottom={'1px solid lavendar'}> <Heading size="lg"> Orders </Heading> </Box>

      {/* Filter Tabs */}
      <Flex justify="space-between" mb={6}>
        <HStack spacing={2}>
          <Button
            size="sm"
            variant={activeFilter === "All" ? "solid" : "outline"}
            bg={activeFilter === "All" ? "blue.50" : "white"}
            color={activeFilter === "All" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => setActiveFilter("All")}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "Recents" ? "solid" : "outline"}
            bg={activeFilter === "Recents" ? "blue.50" : "white"}
            color={activeFilter === "Recents" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => setActiveFilter("Recents")}
          >
            Recents
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "Pending" ? "solid" : "outline"}
            bg={activeFilter === "Pending" ? "blue.50" : "white"}
            color={activeFilter === "Pending" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => setActiveFilter("Pending")}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "Locked" ? "solid" : "outline"}
            bg={activeFilter === "Locked" ? "blue.50" : "white"}
            color={activeFilter === "Locked" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => setActiveFilter("Locked")}
          >
            Locked (escrow)
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "Sold" ? "solid" : "outline"}
            bg={activeFilter === "Sold" ? "blue.50" : "white"}
            color={activeFilter === "Sold" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => setActiveFilter("Sold")}
          >
            Sold
          </Button>
          <Button
            leftIcon={<MdFilterList size={16} />}
            variant="outline"
            size="sm"
            borderColor="gray.200"
            color="gray.700"
          >
            More filters
          </Button>
        </HStack>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <MdSearch size={18} color="#667085" />
          </InputLeftElement>
          <Input placeholder="Search" borderColor="gray.200" />
        </InputGroup>
      </Flex>

      {/* Transactions Table */}
      <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="auto">
        <Table variant="simple" textWrap="nowrap">
          <Thead bg="gray.50">
            <Tr>
              <Th>Car Listings</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Client</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {orderList?.map((order) => (
              <Tr key={order?.uuid}>
                <Td>
                  <Flex align="center">
                    <Image
                      src={order?.order_item?.vehicle?.images[0]?.url}
                      alt={order?.order_item?.vehicle.name}
                      w="80px"
                      h="50px"
                      objectFit="cover"
                      borderRadius="md"
                      mr={3}
                    />
                    <Box>
                      <Text fontWeight="medium">{order?.order_item.vehicle.name}</Text>
                      <Text color="gray.700" fontWeight="medium">
                        {order?.order_type}
                      </Text>
                      <Flex align="center" color="gray.500" fontSize="xs">
                        <MdLocationOn size={12} style={{ marginRight: "4px" }} />
                        {order?.order_item?.vehicle?.dealer?.location}
                      </Flex>
                    </Box>
                  </Flex>
                </Td>
                <Td>
                  <Text color="green.500" fontWeight="medium">
                    {parseInt(order?.order_item?.price).toLocaleString()}
                  </Text>
                </Td>
                <Td>
                  <Text>{new Date(order?.last_updated).toLocaleDateString()}</Text>
                  <Text color="gray.500" fontSize="sm">
                    {new Date(order?.last_updated).toLocaleTimeString()}
                  </Text>
                </Td>
                <Td>
                  <StatusBadge status={order?.order_status} />
                </Td>
                <Td>
                  <Avatar size="sm" name={order?.customer} />
                </Td>
                <Td>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<MdMoreVert size={16} />}
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
      </TableContainer>
    </Box>
  )
}

export default OrderListAdmin

