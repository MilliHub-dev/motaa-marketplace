import { Box, Flex, Text, Stack, Icon } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';

/** Chart.js throws on missing/partial data; only render when real datasets arrive. */
export const hasChartData = (data) => Array.isArray(data?.datasets) && data.datasets.length > 0 && Array.isArray(data?.labels);

/** True when every point of every dataset is 0/empty (nothing worth plotting). */
export const isFlatChart = (data) => !hasChartData(data)
  || data.datasets.every((set) => !Array.isArray(set?.data) || set.data.every((v) => !Number(v)));

export const SafeChart = ({ as: ChartComponent, data, options, emptyText = 'No data to show yet', hideWhenFlat = false, ...props }) => {
  if (!hasChartData(data) || (hideWhenFlat && isFlatChart(data))) {
    return (
      <Flex h="100%" minH="120px" align="center" justify="center" textAlign="center" px={4} borderWidth={1} borderStyle="dashed" borderColor="gray.200" borderRadius="lg" color="gray.500" fontSize="sm" {...props}>
        {emptyText}
      </Flex>
    );
  }
  return <ChartComponent data={data} options={options} {...props} />;
};

/**
 * A single KPI tile. `change` is a month-over-month % from the API; the change row
 * only renders when it's a real number.
 */
export const StatCard = ({ title, value, change, changeLabel = 'vs last month', format = (v) => v, ...props }) => {
  const hasChange = change !== null && change !== undefined && change !== '' && Number.isFinite(Number(change));
  const up = Number(change) >= 0;
  const flat = hasChange && Number(change) === 0;

  return (
    <Box bg="white" px={5} py={4} borderRadius="lg" borderWidth={1} borderColor="gray.100" boxShadow="sm" flex={1} {...props}>
      <Stack spacing={1}>
        <Text fontSize="sm" color="gray.600">{title}</Text>
        <Text fontSize="2xl" fontWeight="bold" wordBreak="break-word">{format(value)}</Text>
        {flat && <Text fontSize="sm" color="gray.500">No change {changeLabel}</Text>}
        {hasChange && !flat && (
          <Flex align="center" color={up ? 'green.600' : 'red.600'} fontSize="sm">
            <Icon as={up ? ArrowUpIcon : ArrowDownIcon} w={3} h={3} mr={1} aria-hidden="true" />
            <Text fontWeight="medium">
              {Math.abs(Number(change))}% {up ? 'up' : 'down'} <Text as="span" color="gray.500" fontWeight="normal">{changeLabel}</Text>
            </Text>
          </Flex>
        )}
      </Stack>
    </Box>
  );
};
