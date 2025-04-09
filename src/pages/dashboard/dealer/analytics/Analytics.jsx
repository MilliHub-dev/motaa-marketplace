import {
  Box, Text, Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, Select,
  Flex,
} from "@chakra-ui/react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

// **Register the required components**
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);



// import "chart.js/auto";

const salesData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [{
    label: "Revenue",
    data: [80, 60, 90, 75, 100, 95, 85, null, null, null, null, null],
    backgroundColor: "#3182CE",
  }],
};

const dealsData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [{
    label: "Deals",
    data: [400, 380, 420, 390, 410, 395, 380, null, null, null, null, null],
    borderColor: "#E53E3E",
    fill: false,
  }],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    x: { display: true, grid: { display: false } },
    y: { display: true },
  },
  elements: {
    bar: {
      borderRadius: 8, // Makes the bars rounded
    }
  }
};


const transactions = [
  { car: "2021 Toyota Corolla XLE", amount: "+₦21,600,000.00", date: "Apr 12, 2023", status: "Successful" },
  { car: "2008 Honda Accord", amount: "+₦21,600,000.00", date: "Apr 12, 2023", status: "Locked" },
  { car: "2023 Tesla Model Y", amount: "+₦21,600,000.00", date: "Apr 12, 2023", status: "Pending" },
];



export default function AnalyticsDashboard() {
  return (
    <Box p={5}>
      <Text fontSize="2xl" fontWeight="bold">Analytics Dashboard</Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} my={5}>
        <Stat>
          <StatLabel>Total Revenue</StatLabel>
          <StatNumber>₦135,329,574.46</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" /> 10% increase this month
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      <Box my={5} height="300px">
        <Bar data={salesData} options={chartOptions} />
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} my={5}>
        <Stat borderColor="gray.200" px={5} py={5} borderRadius="lg" borderWidth={2}>
          <StatLabel>Abandoned Carts</StatLabel>
          <StatNumber>48</StatNumber>
        </Stat>
        <Stat borderColor="gray.200" px={5} py={5} borderRadius="lg" borderWidth={2}>
          <StatLabel>Pending Orders </StatLabel>
          <StatNumber>14</StatNumber>
        </Stat>
        <Stat borderColor="gray.200" px={5} py={5} borderRadius="lg" borderWidth={2}>
          <StatLabel>Canceled Orders</StatLabel>
          <StatNumber>14</StatNumber>
        </Stat>
      </SimpleGrid>

      <Stat>
        <StatLabel>Total Deals</StatLabel>
        <StatNumber>546</StatNumber>
        <StatHelpText>
          <StatArrow type="decrease" /> 13% decrease this month
        </StatHelpText>
      </Stat>

      <Box my={5} height="300px">
        <Line data={dealsData} options={chartOptions} />
      </Box>

      <Text fontSize="xl" fontWeight="bold" my={3}>Transactions</Text>
      
      <Box as={Flex} alignItems="center" gap={3}>
        <Select defaultValue={"Recents"} placeholder="Filter by status" w="max-content" my={3}>
          <option> Recents </option>
        </Select>

        <Button> More filters </Button>
      </Box>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Car Listings</Th>
            <Th>Amount</Th>
            <Th>Date</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {transactions.map((txn, index) => (
            <Tr key={index}>
              <Td>{txn.car}</Td>
              <Td>{txn.amount}</Td>
              <Td>{txn.date}</Td>
              <Td>
                <Badge colorScheme={txn.status === "Successful" ? "green" : txn.status === "Pending" ? "yellow" : "blue"}>
                  {txn.status}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

