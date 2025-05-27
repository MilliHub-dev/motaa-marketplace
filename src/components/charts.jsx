import React from 'react';
import { Box, Flex, Text, Stack, Icon, SimpleGrid } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);


export const StatCard = ({ title, value, change, data, format = (v) => v }, ...props) => {
  const chartData = {
    labels: ['', '', '', '', '', '', ''],
    datasets: [
      {
        data: data,
        borderColor: change >= 0 ? '#38A169' : '#E53E3E',
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
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <Box bg="white" px={6} py={4} borderRadius="lg" boxShadow="lg" flex={1} {...props}>
      <Stack spacing={2}>
        <Text fontSize="sm" color="gray.500">
          {title}
        </Text>
        <Flex align="baseline" justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            {format(value)}
          </Text>
        </Flex>

        <Flex justify="space-between" align="baseline">
          <Flex align="center" color={change >= 0 ? 'green.500' : 'red.500'}>
            <Icon
              as={change >= 0 ? ArrowUpIcon : ArrowDownIcon}
              w={3}
              h={3}
              mr={1}
            />
            <Text fontSize="sm" fontWeight="medium">
              {Math.abs(change)}% {change >= 0 ? 'increase' : 'decrease'}
            </Text>
          </Flex>
{/*
          <Box h="50px" w={"50px"}>
            <Line data={chartData} options={chartOptions} />
          </Box>*/}
        </Flex>
      </Stack>
    </Box>
  );
};

export const StatsCards = ({ title, value }) => {
  const formatCurrency = (value) => {
    return `₦${parseInt(value).toLocaleString()}`;
  };

  const formatNumber = (value) => {
    return parseFloat(value).toLocaleString();
  };

  return (
    <SimpleGrid gap={4} direction={'row'} flexWrap={'wrap'} my={5} minChildWidth={'250px'}>
      <StatCard
        title={title}
        value={value}
        // change={10}
        // data={sparklineData.revenue}
        format={formatCurrency}
      />
      <StatCard
        title={title}
        value={value}
        // change={-2}
        // data={sparklineData.impressions}
        format={(v) => `${(parseInt(v) / 1000).toFixed(1)}K`}
      />
      <StatCard
        title={title}
        value={value}
        // change={14}
        // data={sparklineData.deals}
        format={formatNumber}
      />
    </SimpleGrid>
  );
};

