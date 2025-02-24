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
} from '@chakra-ui/react';


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
    </Box>
  )
}

export default ListingsAdmin;

