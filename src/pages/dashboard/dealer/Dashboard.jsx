import {useState, useEffect, useContext} from 'react';
import {Link} from 'react-router-dom';
import {GlobalStore} from '../../../App';
import {objectifyJSON, jsonifyObject} from '../../../utils';
import {DealerDashboardSideBar} from '../../../components/nav';
import {StatCard} from '../../../components/charts';
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
  MenuList,
  MenuItem,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react'
import { LayoutDashboard, Wallet, Clock, PiggyBank, BarChart2, HelpCircle, Settings, Share2, MoreVertical, TrendingUp } from 'lucide-react'
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import { PiHandDepositBold, PiHandWithdrawBold } from "react-icons/pi";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);






function Dashboard({ }) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [wallet, setWallet] = useState({});
  const [transactions, setTransactions] = useState([])
  const [dashboardData, setDashboardData] = useState({})
  const formatCurrency = (value) => {
    return `₦${parseInt(value).toLocaleString()}`;
  };

  const formatNumber = (value) => {
    return parseFloat(value).toLocaleString();
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June'],
    datasets: [
      {
        data: [30, 20, 10, 30, 45, 25],
        borderColor: '#E53E3E',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        data: [10, 20, 30, 50, 45, 58],
        borderColor: '#38A169',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: { display: true },
      y: { display: true },
    },
  };

  async function getWalletBalance(){
    const res = await axios.get('/wallet/balance/');
    const data = objectifyJSON(res.data);
    console.log("Wallet:", data)
    setWallet(data?.data)
  }
  
  async function getDashboardData(){
    const res = await axios.get('/admin/dealership/dashboard/');
    const data = objectifyJSON(res.data);
    setDashboardData(data.data)
    // setWallet(data?.data)
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
    getWalletTransactions();
    getDashboardData();
    // setTimeout(() => setLoadingState(false), 2000);
  }

  useEffect(() => {
    init();
    
  }, [])

  return (
    <Box w={'100%'}>
      <Box py={6} borderBottom="2px solid lavender">
        <Text size="md" className="text" fontWeight="600">Dashboard</Text>
        <Text size="xs" className="small">Welcome back, {authUser?.first_name}👋</Text>

       {/* <Button as="dojah-button"
          widgetId="67d7e86d69ff1ab7238494d8"
          // text="Web"
          // textColor="#FFFFFF"
          colorScheme="blue"
          backgroundColor="primary"> Verify your account now!
        </Button>*/}
      </Box>

      <SimpleGrid gap={4} direction={'row'} flexWrap={'wrap'} my={5} minChildWidth={'250px'}>
        
        <StatCard
          title={"Revenue"}
          value={dashboardData?.total_revenue}
          // change={10}
          // data={sparklineData.revenue}
          format={formatCurrency}
        />
        <StatCard
          title={"Impressions"}
          value={dashboardData?.impressions}
          // change={-2}
          // data={sparklineData.impressions}
          format={(v) => `${(parseInt(v) / 1000).toFixed(1)}K`}
        />
        <StatCard
          title={"Total Deals"}
          value={dashboardData?.total_deals}
          // change={14}
          // data={sparklineData.deals}
          format={formatNumber}
        />
      </SimpleGrid>

      <Box py={4} my={5}>
        <Heading size={'sm'} fontWeight="500" my={3}> Revenue Earnings </Heading>
        <Box h={'300px'}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Box>

      {/* Transactions */}
      <Heading size="sm" my={3} fontWeight="500"> Transactions </Heading>
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
                    <Avatar size="sm" name={transaction.recipient || `${authUser?.first_name} ${authUser?.last_name}` } />
                    <Box>
                      <Text fontWeight="medium">{transaction.recipient || `${authUser?.first_name} ${authUser?.last_name}`}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {transaction.type}
                      </Text>
                    </Box>
                  </HStack>
                </Td>
                <Td>
                  <Text
                    color={
                      transaction.amount.startsWith('+')
                        ? 'green.500'
                        : 'red.500'
                    }
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
                    <MenuButton
                      as={IconButton}
                      icon={<MoreVertical size={16} />}
                      variant="ghost"
                      size="sm"
                    />
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
    </Box>
  )
}

export default Dashboard;

