import {useState, useEffect, useContext} from 'react';
import {Link, useNavigate} from 'react-router-dom';
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
  Checkbox,
  Avatar,
  AvatarGroup,
  Progress,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tag,
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
import {DealershipContext} from '../Layout';


function ListingsAdmin({children, ...props}) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const {dealership, } = useContext(DealershipContext);
  const [loading, setLoadingState] = useState(false);
  const [listings, setListings] = useState([]);
  const [activeListings, setActiveListings] = useState([]);
  const [draftListings, setDraftListings] = useState([]);
  const navigate = useNavigate();

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
        </VStack>

        <VStack rowGap={8} w="100%">
          <Card borderWidth="2px" w="100%" borderColor="gray.200" borderRadius="10px" shadow="none">
            <CardBody>
              <Text color="gray.500" fontWeight="thin"> Active Listings </Text>
              <Heading> {activeListings?.length} </Heading>
            </CardBody>
          </Card>
        </VStack>

        <VStack rowGap={8} w="100%">
          <Card borderWidth="2px" w="100%" borderColor="gray.200" borderRadius="10px" shadow="none">
            <CardBody>
              <Text color="gray.500" fontWeight="thin"> Drafts </Text>
              <Heading> {draftListings?.length} </Heading>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>


      <SimpleGrid mb={5} minChildWidth={'200px'} columns={3} my={3} spacing={4}>
        <Button isDisabled={!dealership?.verified_business} onClick={() => navigate('/inventory/add/')} size="lg" fontSize="sm" w="full" bg="primary" color="white" colorScheme="blue"> Add a Listing </Button>
        <Button isDisabled={!dealership?.verified_business} onClick={() => navigate('/inventory/boost/')} size="lg" fontSize="sm" w="full" bg="limegreen" color="white" colorScheme="green"> Boost a Listing </Button>
        <Button isDisabled={!dealership?.verified_business} size="lg" fontSize="sm" w="full" bg="gray.200" color="primary" colorScheme="gray"> Manage Listings </Button>
      </SimpleGrid>

      <Heading my={3} size="md"> Car Listings </Heading>
      <ListingTable listings={listings} />
    </Box>
  )
}



function ListingTable({ listings }) {
  const {axios, notify, commaInt} = useContext(GlobalStore);
  const [selected, setSelected] = useState([])
  
  function toggleSelectAll(e){
    const _selected = []

    if (selected.length === listings.length){
      return setSelected([..._selected])
    }

    for(let item of listings){
      _selected.push(item.uuid)
    }
    setSelected([..._selected])
  }

  function toggleSelect(uuid){
    const _selected = selected

    if(_selected.includes(uuid)){
      _selected.splice(_selected.indexOf(uuid), 1);
      return setSelected([..._selected]);
    }

    _selected.push(uuid);
    setSelected([..._selected]);

  }

  return (
    <TableContainer my={5} w={'100%'}>
      <Table variant="simple" overflowX={'scroll'} className="hidden-scroll">
        <Thead>
          <Tr>
            <Th gap={2} alignItems="center"> # - <Checkbox isChecked={selected?.length === listings?.length} onChange={toggleSelectAll} /> </Th>
            <Th columns={3}>Car Listing</Th>
            <Th>Status</Th>
            <Th>Views</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {listings?.map((listing, index) => (
            <Tr key={index}>
              <Td placeItems="center" placeContent="center" alignItems="center"> {index+1} - <Checkbox onChange={e => toggleSelect(listing?.uuid)} isChecked={selected.includes(listing?.uuid)} /> </Td>
              <Td columns={3}>
                <Flex align="center" gap={2}>
                  <Image src={listing?.vehicle?.images[0]?.url} objectFit="cover" boxSize="70px" borderRadius="md" />
                  <Box>
                    <Text fontWeight="bold">{listing?.title}</Text>
                    <Text fontSize="sm">{commaInt(listing?.price)} {listing?.listing_type === 'rental' && `/${listing.payment_cycle}`}</Text>
                    <Text fontSize="xs" color="gray.500">{listing?.vehicle?.dealership?.location}</Text>
                  </Box>
                </Flex>
              </Td>
              <Td>
                <Tag size="lg" colorScheme={(listing?.approved && listing?.verified) ? "green" : !listing?.verified ? "purple" : "yellow"}>
                  {(listing?.approved && listing?.verified) ? 'Active' : !listing?.verified ? 'Draft' : 'Requires approval'}
                </Tag>
              </Td>
              <Td>{listing?.viewers?.length}</Td>
              <Td>
                {!listing?.vehicle?.available && 
                  <Flex gap={2}>
                    <Button size="sm" colorScheme="green">Boost</Button>
                    <IconButton as={Link} to={`edit/${listing?.uuid}`} aria-label="Edit" icon={<EditIcon />} size="sm" />
                    <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" />
                  </Flex>
                }
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}


export default ListingsAdmin;

