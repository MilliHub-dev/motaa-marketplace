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
  Image,
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
  TableContainer,
  Stack,
} from '@chakra-ui/react'
import { LayoutDashboard, Wallet, Clock, PiggyBank, BarChart2, HelpCircle, Settings, Share2, MoreVertical, TrendingUp } from 'lucide-react'
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import { PiHandDepositBold, PiHandWithdrawBold } from "react-icons/pi";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
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
  MdWarning,
} from "react-icons/md"
import { BsWallet2 } from "react-icons/bs"
import {StatusBadge} from '../../../components'
import {DealershipContext} from './Layout'



ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);



function Dashboard({ }) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const {dealership} = useContext(DealershipContext);
  const [wallet, setWallet] = useState({});
  const [loading, setLoadingState] = useState(true);
  const [recentOrders, setRecentOrders] = useState([])
  const [dashboardData, setDashboardData] = useState({})
  const [chartData, setChartData] = useState({})
  const formatCurrency = (value) => {
    return `₦${parseInt(value).toLocaleString()}`;
  };

  const formatNumber = (value) => {
    return parseFloat(value).toLocaleString();
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
    setChartData(data.data.chart_data)
    console.log("Chart Data:", data.data.chart_data)
    setRecentOrders(data.data.recent_orders)
  }

  async function getWalletTransactions(){
    try{
      const res = await axios.get('/wallet/transactions/');
      const data = objectifyJSON(res.data);
    }catch(error){
      notify({
        title: "Oops! An error occurred.",
        body: error.message,
        color: 'red',
      })
    }
  }

  function init(){
    getWalletBalance();
    getWalletTransactions();
    getDashboardData();
    setTimeout(() => setLoadingState(false), 2000);
  }

  useEffect(() => {
    init();
    
  }, [])

  if (loading){
    return null
  }

  return (
    <Box w={'100%'}>
      <Box py={6} borderBottom="2px solid lavender">
        <Text size="md" className="text" fontWeight="600">Dashboard</Text>
        <Text size="xs" className="small">Welcome back, {authUser?.first_name}👋</Text>
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
          format={(v) => {
            if (v > 1000){
              return `${(parseInt(v) / 1000).toFixed(3)}K`
            }else{
              return `${(parseInt(v))}`
            }
          }}
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
          {chartData && <Line data={{...chartData, pointRadius: 20}} options={chartOptions} />}
        </Box>
      </Box>

      {/* Transactions */}
      <Heading size="sm" my={3} fontWeight="500"> Recent Orders </Heading>
      <TableContainer w={'100%'} variant="simple" borderWidth={1} borderRadius="lg">
        <Table variant="simple" textWrap="nowrap" overflow="auto">
          <Thead bg="gray.50">
            <Tr>
              <Th columns={5}>Car Listings</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Client</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {recentOrders?.map((order) => (
              <Tr key={order?.uuid}>
                <Td columns={5}>
                  <Flex gap={1} align="center">
                    <Image
                      src={order?.order_item?.vehicle?.images[0]?.url}
                      alt={order?.order_item?.vehicle.name}
                      boxSize="70px"
                      objectFit="cover"
                      borderRadius="md"
                      mr={3}
                    />
                    <Box>
                      <Text fontWeight="medium">{order?.order_item.vehicle.name}</Text>
                      <Text color="gray.700" fontWeight="medium">
                        {order?.order_type}
                      </Text>
                    </Box>
                  </Flex>
                </Td>
                <Td>
                  <Text color="green.500" fontWeight="medium">
                    {parseInt(order?.order_item?.price/10**6).toFixed('2')}M
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

                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default Dashboard;

