

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

function WalletTransactionsPage() {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [transactions, setTransactions] = useState([]);

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
    getWalletTransactions();
    // setTimeout(() => setLoadingState(false), 2000);
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <Box>
      <Box py={6} mb={3} borderBottom="2px solid lavender">
        <Heading size="md" className="text" fontWeight="600">Transactions</Heading>
      </Box>

      {/* Transactions */}
      <TableContainer borderRadius="lg">
        <Table variant="striped">
          <Thead bg="gray.50">
            <Tr>
              <Th>Sender</Th>
              <Th>Type</Th>
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
                    </Box>
                  </HStack>
                </Td>
                <Td>
                  <Tag fontSize="sm" textTransform={'capitalize'} colorScheme={transaction?.type === 'deposit' ? 'green' : "red"}>
                    {transaction.type}
                  </Tag>
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

export default WalletTransactionsPage;
