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
  const [matches, setMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchValue, setSearchValue] = useState("");
  const {axios} = useContext(GlobalStore);

  async function getData(){
    const res = await axios.get('/admin/dealership/orders/');
    const data = objectifyJSON(res.data)
    if (res.status === 200){
      setOrderList(data.data);
      setMatches(data.data);
    }
    console.log("Got orders:", data)
  }

  function handleSearch(e){
    const value = e.target.value;
    setSearchValue(value);

    if (value.trim() !== ''){
      const found = orderList.filter(elem => elem.order_item.vehicle.name.toLowerCase().includes(value));
      setMatches([...found])
    }else{
      setMatches([...orderList])
    }
  }

  function filterMatches(filter){
    setActiveFilter(filter);

    if(filter === 'All'){
      return setMatches([ ...orderList ])
    }
    const filteredMatches = orderList.filter(item => item.order_status.toLowerCase() === filter.toLowerCase())
    setMatches([...filteredMatches]);
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
            size="md"
            variant={activeFilter === "All" ? "solid" : "outline"}
            bg={activeFilter === "All" ? "blue.50" : "white"}
            color={activeFilter === "All" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => filterMatches("All")}
          >
            All
          </Button>
          <Button
            size="md"
            variant={activeFilter === "Pending" ? "solid" : "outline"}
            bg={activeFilter === "Pending" ? "blue.50" : "white"}
            color={activeFilter === "Pending" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => filterMatches("Pending")}
          >
            Pending
          </Button>
          <Button
            size="md"
            variant={activeFilter === "awaiting-inspection" ? "solid" : "outline"}
            bg={activeFilter === "awaiting-inspection" ? "blue.50" : "white"}
            color={activeFilter === "awaiting-inspection" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => filterMatches("awaiting-inspection")}
          >
            Locked (Inspection)
          </Button>
          <Button
            size="md"
            variant={activeFilter === "completed" ? "solid" : "outline"}
            bg={activeFilter === "completed" ? "blue.50" : "white"}
            color={activeFilter === "completed" ? "blue.500" : "gray.700"}
            borderColor="gray.200"
            onClick={() => filterMatches("completed")}
          >
            Sold
          </Button>
        </HStack>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <MdSearch size={18} color="#667085" />
          </InputLeftElement>
          <Input onInput={handleSearch} value={searchValue} placeholder="Search" borderColor="gray.200" />
        </InputGroup>
      </Flex>

      {/* Transactions Table */}
      <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="auto" pb={10} minH={400}>
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr columns={9}>
              <Th columns={3}>Car Listings</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Client</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {matches?.map((order) => (
              <Tr key={order?.uuid}>
                <Td columnSpan={4}>
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
                      <Text fontWeight="medium" textOverflow="ellipsis">{order?.order_item.vehicle.name}</Text>
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

