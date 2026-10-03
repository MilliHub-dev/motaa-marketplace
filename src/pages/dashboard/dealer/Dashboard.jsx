import { useContext, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
} from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
import { ShoppingBag } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { asList } from '../../../utils';
import { StatCard, SafeChart } from '../../../components/charts';
import { useApiQuery } from '../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../components/states';
import { OrderCarCell, OrderDate, OrderStatusBadge, OrderDetailsDrawer, ContactCustomerModal } from './orders/OrderList';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

function Dashboard() {
  const { authUser, commaInt } = useContext(GlobalStore);
  const [selected, setSelected] = useState(null);
  const [contact, setContact] = useState(null);
  const dashboard = useApiQuery(
    (api, signal) => api.get('/admin/dealership/dashboard/', { signal }),
    [],
    { select: (body) => body?.data || {} }
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true, callbacks: { label: (ctx) => `₦${commaInt(ctx.parsed.y)}` } },
    },
    scales: {
      x: { display: true, grid: { display: false } },
      y: { display: true, beginAtZero: true, ticks: { callback: (v) => `₦${compact(v)}` } },
    },
  };

  return (
    <Box w="100%">
      <Box py={6} borderBottom="2px solid lavender">
        <Heading as="h1" size="md">Dashboard</Heading>
        <Text color="gray.600" fontSize="sm">Welcome back{authUser?.first_name ? `, ${authUser.first_name}` : ''} 👋</Text>
      </Box>

      <AsyncState query={dashboard} loadingLabel="Loading your dashboard…">
        {(data) => {
          const recentOrders = asList(data?.recent_orders);
          return (
            <>
              <SimpleGrid gap={4} my={5} columns={{ base: 1, sm: 2, xl: 4 }}>
                <StatCard title="Revenue (paid orders)" value={data?.total_revenue} change={data?.revenue_change} format={(v) => `₦${commaInt(v)}`} />
                <StatCard title="Deals closed" value={data?.total_deals} change={data?.deals_change} format={(v) => commaInt(v)} />
                <StatCard title="Listing views" value={data?.impressions} format={(v) => compact(v)} />
                <StatCard title="Live listings" value={data?.active_listings} format={(v) => commaInt(v)} />
              </SimpleGrid>

              <Box py={4} my={5}>
                <Heading as="h2" size="sm" fontWeight="600" mb={3}>Revenue, last 6 months</Heading>
                <Box h={{ base: '220px', md: '300px' }}>
                  <SafeChart as={Line} data={data?.chart_data} options={chartOptions} hideWhenFlat emptyText="No paid orders in the last 6 months yet." />
                </Box>
              </Box>

              <Flex justify="space-between" align="center" mb={3} gap={3}>
                <Heading as="h2" size="sm" fontWeight="600">Recent orders</Heading>
                {recentOrders.length > 0 && <Button as={RLink} to="/orders" size="sm" variant="link" color="primary">View all orders</Button>}
              </Flex>
              {recentOrders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" description="When customers buy or rent your cars, their orders will appear here." action={{ label: 'Manage inventory', to: '/inventory' }} minH="180px" />
              ) : (
                <TableContainer w="100%" borderWidth={1} borderRadius="lg" bg="white">
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th py={3}>Car</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                        <Th>Customer</Th>
                        <Th><VisuallyHidden>Details</VisuallyHidden></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {recentOrders.map((order) => (
                        <Tr key={order?.uuid || order?.id}>
                          <Td py={3}><OrderCarCell order={order} /></Td>
                          <Td isNumeric><Text color="green.600" fontWeight="600">₦{commaInt(order?.sub_total ?? order?.order_item?.price)}</Text></Td>
                          <Td><OrderDate value={order?.date_created || order?.last_updated} /></Td>
                          <Td><OrderStatusBadge status={order?.order_status} /></Td>
                          <Td>
                            <HStack spacing={2}>
                              <Avatar size="xs" name={order?.customer_info?.name || order?.customer || 'Customer'} />
                              <Text fontSize="sm" noOfLines={1} maxW="140px">{order?.customer_info?.name || order?.customer || 'Customer'}</Text>
                            </HStack>
                          </Td>
                          <Td><Button size="xs" variant="outline" onClick={() => setSelected(order)}>Details</Button></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </>
          );
        }}
      </AsyncState>

      <OrderDetailsDrawer order={selected} onClose={() => setSelected(null)} onContact={(order) => { setSelected(null); setContact(order); }} />
      <ContactCustomerModal order={contact} onClose={() => setContact(null)} />
    </Box>
  );
}

// 1520 -> "1.5K", 2300000 -> "2.3M"
function compact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1e9) return `${+(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

export default Dashboard;
