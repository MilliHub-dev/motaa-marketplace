import { useContext } from 'react';
import { Box, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
} from 'chart.js';
import { GlobalStore } from '../../../../App';
import { useApiQuery } from '../../../../hooks/useApi';
import { AsyncState } from '../../../../components/states';
import { SafeChart, StatCard } from '../../../../components/charts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip);

function baseOptions(formatValue, formatTick = formatValue) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true, callbacks: { label: (ctx) => formatValue(ctx.parsed.y) } },
    },
    scales: {
      x: { display: true, grid: { display: false } },
      y: { display: true, beginAtZero: true, ticks: { precision: 0, callback: (v) => formatTick(v) } },
    },
    elements: { bar: { borderRadius: 8 } },
  };
}

export default function AnalyticsDashboard() {
  const { commaInt } = useContext(GlobalStore);
  const analytics = useApiQuery(
    (api, signal) => api.get('/admin/dealership/analytics/', { signal }),
    [],
    { select: (body) => body?.data || {} }
  );

  const money = (v) => `₦${commaInt(v)}`;
  const count = (v) => commaInt(v);

  return (
    <Box pt={5}>
      <Heading as="h1" size="md">Analytics</Heading>
      <Text color="gray.600" fontSize="sm" mb={5}>Revenue and deals from paid orders over the last 12 months.</Text>

      <AsyncState query={analytics} loadingLabel="Loading analytics…">
        {(data) => (
          <>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
              <StatCard title="Total revenue" value={data?.revenue?.amount} change={data?.revenue?.change} format={money} />
              <StatCard title="Deals closed" value={data?.sales?.amount} change={data?.sales?.change} format={count} />
            </SimpleGrid>

            <Heading as="h2" size="sm" fontWeight="600" mb={3}>Monthly revenue</Heading>
            <Box mb={8} h={{ base: '220px', md: '300px' }}>
              <SafeChart as={Bar} data={data?.revenue?.chart_data} options={baseOptions(money, (v) => `₦${compact(v)}`)} hideWhenFlat emptyText="No paid orders in the last 12 months yet." />
            </Box>

            <Heading as="h2" size="sm" fontWeight="600" mb={3}>Orders</Heading>
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={8}>
              <StatCard title="Completed" value={data?.orders?.fulfilled} format={count} />
              <StatCard title="In progress" value={data?.orders?.pending} format={count} />
              <StatCard title="Cancelled" value={data?.orders?.cancelled} format={count} />
            </SimpleGrid>

            <Heading as="h2" size="sm" fontWeight="600" mb={3}>Deals per month</Heading>
            <Box mb={5} h={{ base: '220px', md: '300px' }}>
              <SafeChart as={Line} data={data?.sales?.chart_data} options={baseOptions(count)} hideWhenFlat emptyText="No deals closed in the last 12 months yet." />
            </Box>
          </>
        )}
      </AsyncState>
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
