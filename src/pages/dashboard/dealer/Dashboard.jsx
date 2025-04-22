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
} from "react-icons/md"
import { BsWallet2 } from "react-icons/bs"
import {StatusBadge} from '../../../components'



ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);




function Dashboard({ }) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [wallet, setWallet] = useState({});
  const [recentOrders, setRecentOrders] = useState([])
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

        {/*<Button as="dojah-button"
          widgetId="67d7e86d69ff1ab7238494d8"
          text="Verify your business now!"
          colorScheme="blue"
          backgroundColor="primary"></Button>*/}
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
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Box>

      {/* Transactions */}
      <Heading size="sm" my={3} fontWeight="500"> Recent Orders </Heading>
      <TableContainer borderWidth={1} borderRadius="lg" overflow="auto">
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
            {recentOrders?.map((order) => (
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

