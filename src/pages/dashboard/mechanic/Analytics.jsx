import { useContext } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber, Text } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { AsyncState } from '../../../components/states';
import { SafeChart } from '../../../components/charts';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function StatBox({ label, value, help }) {
  return (
    <Stat borderColor="gray.200" bg="white" px={5} py={4} borderRadius="lg" borderWidth="1px">
      <StatLabel color="gray.600">{label}</StatLabel>
      <StatNumber>{value}</StatNumber>
      {help && <StatHelpText mb={0}>{help}</StatHelpText>}
    </Stat>
  );
}

export default function MechanicAnalytics() {
  const { commaInt } = useContext(GlobalStore);
  const analytics = useApiQuery((api, signal) => api.get('/admin/mechanics/analytics/', { signal }), [], {
    select: (body) => body?.data || {},
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `₦${commaInt(ctx.parsed.y)}` } },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (value) => `₦${commaInt(value)}` } },
    },
    elements: { bar: { borderRadius: 8 } },
  };

  return (
    <Box py={4}>
      <Heading as="h1" size="lg" mb={1}>Analytics</Heading>
      <Text color="gray.600" mb={6}>Your earnings and job activity.</Text>

      <AsyncState query={analytics} loadingLabel="Loading analytics…">
        {(data) => {
          const chart = data?.revenue?.chart_data;
          const hasRevenue = (chart?.datasets?.[0]?.data || []).some((v) => Number(v) > 0);
          return (
            <>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={8}>
                <StatBox label="Total revenue" value={`₦${commaInt(data?.revenue?.amount)}`} help="From completed jobs" />
                <StatBox label="Hires" value={commaInt(data?.jobs?.hires)} help={`${commaInt(data?.jobs?.completed)} completed`} />
                <StatBox label="Pending requests" value={commaInt(data?.jobs?.pending)} />
                <StatBox label="Canceled / declined" value={commaInt(data?.jobs?.canceled)} />
              </SimpleGrid>

              <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                <Heading as="h2" size="sm" mb={4}>Revenue this year</Heading>
                <Box height="300px">
                  <SafeChart
                    as={Bar}
                    data={hasRevenue ? chart : null}
                    options={chartOptions}
                    emptyText="Revenue from completed jobs will be charted here."
                    aria-label="Monthly revenue chart"
                    role="img"
                  />
                </Box>
              </Box>
            </>
          );
        }}
      </AsyncState>
    </Box>
  );
}
