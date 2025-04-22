

import {useState, useEffect, useContext} from 'react';
import {Link, NavLink, Outlet} from 'react-router-dom';
import {GlobalStore} from '../../../App';
import {objectifyJSON, jsonifyObject} from '../../../utils';
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
  Tag,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Menu,
  MenuButton,
  SimpleGrid,
  MenuList,
  MenuItem,
  Badge,
} from '@chakra-ui/react'
import { LayoutDashboard, Wallet, Clock, PiggyBank, BarChart2, HelpCircle, Settings, Share2, MoreVertical, TrendingUp } from 'lucide-react'
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import { LuChartLine } from "react-icons/lu";
import { GiHomeGarage } from "react-icons/gi";
import { AiOutlineTransaction } from "react-icons/ai";
import { PiHandDepositBold, PiHandWithdrawBold } from "react-icons/pi";
import {FlutterwavePaymentModal} from '../../../components/wallet';

function WalletHomePage() {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [wallet, setWallet] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [showDepositModal, setDepositModalVisibility] = useState(false);

  async function getWalletBalance(){
    const res = await axios.get('/wallet/balance/');
    const data = objectifyJSON(res.data);
    console.log("Wallet:", data)
    setWallet(data?.data)
  }

  async function getWalletTransactions(){
    try{
      const res = await axios.get('/wallet/transactions/');
      const data = objectifyJSON(res.data);
      setTransactions(data?.transactions);
    }catch(error){
      notify({
        title: "Oops! An error occurred.",
        body: error.message,
      })
    }
  }

  function init(){
    getWalletBalance();
    getWalletTransactions();
    // setTimeout(() => setLoadingState(false), 2000);
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <Box>
      <SimpleGrid gap={5} my={8} columns={{base: 1, lg: 2}}>
        {/* Wallet Balance */}
        <Box
          flex="1"
          minW="280px"
          p={3}
          borderWidth={1}
          borderRadius="15px"
          position="relative"
        >
          <Text mb={2}>Wallet balance</Text>
          <Heading size="2xl" fontWeight="600" className="title" mb={2}>
            ₦{commaInt(wallet?.balance)}
          </Heading>
          <HStack color="green.500" mb={6}>
            <TrendingUp size={16} />
            <Text>+26% vs last month</Text>
          </HStack>
          <HStack as={Flex} flexDirection={{ base: 'column', sm: 'row'}} flexWrap={'wrap'} spacing={2}>
            
            <Box as={Link} to='/wallet/deposit/' w={{base: '100%', sm: 'max-content'}}>
              <Button
               w={'100%'}
               leftIcon={<PiHandDepositBold />}
               colorScheme="blue"
               bgColor="primary"
              >
                Deposit
              </Button>
            </Box>

            <Box as={Link} to='/wallet/withdraw/' w={{base: '100%', sm: 'max-content'}}>
              <Button
               w={'100%'}
               leftIcon={<PiHandWithdrawBold />}
               colorScheme="blue"
               bgColor="primary"
              >
                  Withdraw
                </Button>
              </Box>

            <Box as={Link} to='/wallet/savings/' w={{base: '100%', sm: 'max-content'}}>
              <Button
               w={'100%'}
               leftIcon={<RiCoinsFill />}
               colorScheme="blue"
               bgColor="primary"
              >
                  Save
                </Button>
              </Box>
          </HStack>
        </Box>

        {/* Referral Card */}
        <Box
          w={{ base: "100%" }}
          px={6}
          py={2}
          minH={'200px'}
          pt="40px"
          bg="primary"
          color="white"
          borderRadius="15px"
          backgroundImage={`url('/assets/images/wallet-invite-background.png')`}
          backgroundRepeat={'no-repeat'}
          backgroundSize="contain"
          backgroundPosition="bottom"
        >
          <AvatarGroup size="sm" max={5} mb={2}>
          {[1, 2, 3, 4, 5, 6].map((id) => 
            <Avatar name={`User ${id}`} key={id} />
            )
          }
            
          </AvatarGroup>
          <Text fontSize="lg" fontWeight="medium" mb={2}>
            Invite your friends to Motaa and get up to 30% cashback on payments with wallet.
          </Text>
        </Box>
      </SimpleGrid>

      <Heading my={3} size="sm" > Recent Transactions </Heading>

      {/* Transactions */}
      <TableContainer borderWidth={1} borderRadius="lg">
        <Table variant="striped">
          <Thead bg="gray.50">
            <Tr>
              <Th>Name</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {transactions?.map((transaction) => (
              <Tr key={transaction.id}>
                <Td>
                  <HStack>
                    <Avatar size="sm" name={transaction.sender} />
                    <Box>
                      <Text fontWeight="medium">
                        {transaction.sender}
                      </Text>
                      <Tag fontSize="sm" textTransform={'capitalize'} colorScheme={transaction?.type === 'deposit' ? 'green' : "red"}>
                        {transaction.type}
                      </Tag>
                    </Box>
                  </HStack>
                </Td>
                <Td>
                  <Text
                    color={transaction?.type === 'deposit' ? 'green.500' : 'red.500'}
                    fontWeight="medium"
                  >
                    {commaInt(transaction.amount)}
                  </Text>
                </Td>
                <Td>
                  <Text>{transaction.date}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(transaction.date_created).toLocaleDateString()}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme="green">{transaction.status}</Badge>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton as={IconButton} icon={<MoreVertical size={16} />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem>View details</MenuItem>
                      <MenuItem>Download receipt</MenuItem>
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

export default WalletHomePage;
