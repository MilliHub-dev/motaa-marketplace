import {useState, useEffect, useContext} from 'react';
import {Link,} from 'react-router-dom';
import {GlobalStore} from '../../../../App';
import {objectifyJSON, jsonifyObject} from '../../../../utils';
import {
  Box,
  Container,
  Flex,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Avatar,
  AvatarGroup,
  Progress,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  IconButton,
  Menu,
  MenuButton,
  Card, CardBody,
  MenuList,
  MenuItem,
  Badge,
  Image,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { FaEye } from "react-icons/fa";


function ListingsAdmin({children, ...props}) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [loading, setLoadingState] = useState(false);
  const [listings, setListings] = useState([]);
  const [activeListings, setActiveListings] = useState([]);
  const [draftListings, setDraftListings] = useState([]);

  async function init(){
    // get the dealership
    try{
      const res = await axios.get(`/admin/dealership/listings/`);
      const data = objectifyJSON(res.data);

      if (res?.status === 200){
        const items = data.data;
        console.log("Listings:", items)
        setListings(items);
        setActiveListings(items.filter(item => item.approved === true));
        setDraftListings(items.filter(item => item.approved === false));
      }

      setTimeout(() => setLoadingState(false), 2000);

    }catch(error){
      console.log("error getting dealership:", error)
    }
  }

  useEffect(() => {
    init();

  }, [])

  if (loading){
    return null
  }

  return (
    <Box minH="100vh" position="relative">
      <Heading my={5} size="md"> Inventory </Heading>
      
      <SimpleGrid minChildWidth={'200px'} maxChildWidth={'350px'} columns={{ base: 1, md: 3}} spacing={4}>
        <VStack rowGap={8} w="100%">
          <Card borderWidth="2px" w="100%" borderColor="gray.200" borderRadius="10px" shadow="none">
            <CardBody>
              <Text color="gray.500" fontWeight="thin"> Total Listings </Text>
              <Heading> {listings?.length} </Heading>
            </CardBody>
          </Card>

          <Button as={Link} to="add" size="lg" fontSize="sm" w="full" bg="primary" color="white" colorScheme="blue"> Add a Listing </Button>
        </VStack>

        <VStack rowGap={8} w="100%">
          <Card borderWidth="2px" w="100%" borderColor="gray.200" borderRadius="10px" shadow="none">
            <CardBody>
              <Text color="gray.500" fontWeight="thin"> Active Listings </Text>
              <Heading> {activeListings?.length} </Heading>
            </CardBody>
          </Card>

          <Button size="lg" fontSize="sm" w="full" bg="limegreen" color="white" colorScheme="green"> Boost a Listing </Button>
        </VStack>

        <VStack rowGap={8} w="100%">
          <Card borderWidth="2px" w="100%" borderColor="gray.200" borderRadius="10px" shadow="none">
            <CardBody>
              <Text color="gray.500" fontWeight="thin"> Drafts </Text>
              <Heading> {draftListings?.length} </Heading>
            </CardBody>
          </Card>

          <Button size="lg" fontSize="sm" w="full" bg="gray.200" color="primary" colorScheme="gray"> Manage Listings </Button>
        </VStack>
      </SimpleGrid>

      <ListingTable listings={listings} />
    </Box>
  )
}



function ListingTable({ listings }) {
  return (
    <TableContainer my={5} w={'100%'}>
      <Table variant="simple" overflowX={'scroll'} className="hidden-scroll">
        <Thead>
          <Tr>
            <Th>Car Listing</Th>
            <Th>Status</Th>
            <Th>Views</Th>
            <Th>CTR</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {listings?.map((listing, index) => (
            <Tr key={index}>
              <Td>
                <Flex align="center">
                  <Image src={listing?.vehicle?.images[0]?.url} boxSize="50px" mr={3} borderRadius="md" />
                  <Box>
                    <Text fontWeight="bold">{listing?.title}</Text>
                    <Text fontSize="sm">{listing?.price}</Text>
                    <Text fontSize="xs" color="gray.500">{listing?.vehicle?.dealership?.location}</Text>
                  </Box>
                </Flex>
              </Td>
              <Td>
                <Text color={listing?.approved ? "green.500" : "gray.500"}>
                  {listing?.approved ? 'Active' : 'Draft'}
                </Text>
              </Td>
              <Td>{listing?.impressions}</Td>
              <Td>{listing?.ctr || 0}</Td>
              <Td>
                <Flex gap={2}>
                  <Button size="sm" colorScheme="green">Boost</Button>
                  <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" />
                  <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" />
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}


export default ListingsAdmin;

