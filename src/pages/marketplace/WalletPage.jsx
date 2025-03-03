import {useState, useEffect, useContext} from 'react';
import {Link} from 'react-router-dom';
import {GlobalStore} from '../../App';
import {objectifyJSON, jsonifyObject} from '../../utils';
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

function WalletPage() {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [wallet, setWallet] = useState({});
  const sidebarItems = [
    { icon: GiHomeGarage, label: 'Dashboard', active: true },
    { icon: Wallet, label: 'Deposit' },
    { icon: AiOutlineTransaction, label: 'Transactions' },
    { icon: RiCoinsLine, label: 'Savings' },
    { icon: LuChartLine, label: 'Analytics' },
    { icon: HelpCircle, label: 'Support' },
    { icon: Settings, label: 'Settings' },
  ]

  const transactions = [
    {
      id: 1,
      name: 'Sixt Rentals',
      type: 'Car rental payment',
      amount: '-₦216,000.00',
      date: 'Apr 12, 2023',
      time: '09:32AM',
      status: 'Successful',
    },
    {
      id: 2,
      name: 'Mukhtar Raqib',
      type: 'Wallet funding',
      amount: '+₦50,000.00',
      date: 'Apr 12, 2023',
      time: '09:30AM',
      status: 'Successful',
    },
  ]


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
    }catch(error){
      notify({
        title: "Oops! An error occurred.",
        body: error.message,
      })
    }
  }

  function init(){
    getWalletBalance();
    // setTimeout(() => setLoadingState(false), 2000);
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <Flex position="relative">
      {/* Sidebar */}
      <Box
        w="280px"
        position="fixed"
        left="0"
        h="100vh"
        bgColor="#fff"
        zIndex="200000"
        borderRightWidth={1}
        p={6}
      >
        <VStack align="stretch" spacing={6}>
          <HStack spacing={3}>
            <Avatar size="sm" name={`${authUser?.first_name} ${authUser?.last_name}`} />
            <Box flex={1}>
              <Text fontWeight="medium">{`${authUser?.first_name} ${authUser?.last_name}`}</Text>
              <Text fontSize="sm" color="gray.500">Pay ID: 4557321238</Text>
            </Box>
            <IconButton
              icon={<Share2 size={18} />}
              variant="ghost"
              size="sm"
              aria-label="Share"
            />
          </HStack>

          <VStack align="stretch" spacing={2}>
            {sidebarItems.map((item, index) => (
              <Button
                key={index}
                leftIcon={<item.icon size={20} />}
                variant={item.active ? 'solid' : 'ghost'}
                colorScheme={item.active ? 'blue' : 'gray'}
                justifyContent="start"
              >
                {item.label}
              </Button>
            ))}
          </VStack>

          <Box mt="auto" pt={6} borderTopWidth={1}>
            <Text fontSize="sm" color="gray.600">Used space</Text>
            <Text fontSize="sm" mb={2}>
              Your team has used 80% of your available space. Need more?
            </Text>
            <Progress value={80} size="sm" colorScheme="purple" mb={2} />
            <HStack justify="space-between">
              <Button variant="link" colorScheme="gray" size="sm">
                Dismiss
              </Button>
              <Button variant="link" colorScheme="purple" size="sm">
                Upgrade plan
              </Button>
            </HStack>
          </Box>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex={1} ml="280px">
        <Container maxW="container.xl">
          <Box py={6} borderBottom="2px solid lavender">
            <Text size="md" className="text" fontWeight="600">Dashboard</Text>
            <Text size="xs" className="small">Welcome back, {authUser?.first_name}👋</Text>
          </Box>

          <SimpleGrid gap={5} my={8} columns={{base: 1, md: 2}}>
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
              <HStack spacing={2}>
                <Button flex={1} leftIcon={<PiHandDepositBold />} colorScheme="blue" bgColor="primary">
                  Deposit
                </Button>
                <Button flex={1} leftIcon={<PiHandWithdrawBold />} colorScheme="blue" bgColor="primary">
                  Withdraw
                </Button>
                <Button flex={1} leftIcon={<RiCoinsFill />} colorScheme="blue" bgColor="primary">
                  Save
                </Button>
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
                <Avatar name="User 1" />
                <Avatar name="User 2" />
                <Avatar name="User 3" />
                <Avatar name="User 4" />
                <Avatar name="User 5" />
                <Avatar name="User 6" />
              </AvatarGroup>
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Invite your friends to Motaa and get up to 30% cashback on payments with wallet.
              </Text>
            </Box>
          </SimpleGrid>

          {/* Transactions */}
          <Box borderWidth={1} borderRadius="lg" overflow="hidden">
            <Table>
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
                {wallet?.transactions?.map((transaction) => (
                  <Tr key={transaction.id}>
                    <Td>
                      <HStack>
                        <Avatar size="sm" name={transaction.recipient || `${authUser?.first_name} ${authUser?.last_name}`} />
                        <Box>
                          <Text fontWeight="medium">
                            {transaction.recipient || `${authUser?.first_name} ${authUser?.last_name}`}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {transaction.type}
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      <Text
                        color={transaction.amount.startsWith('+') ? 'green.500' : 'red.500'}
                        fontWeight="medium"
                      >
                        {commaInt(transaction.amount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text>{transaction.date}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {transaction.date_created}
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
          </Box>
        </Container>
      </Box>
    </Flex>

  )
}

export default WalletPage;

