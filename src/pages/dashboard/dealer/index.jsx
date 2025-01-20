import {useState, useEffect, useContext} from 'react';
import {Link, Routes, Route, Outlet} from 'react-router-dom';
import {GlobalStore} from '../../../App';
import {objectifyJSON, jsonifyObject} from '../../../utils';
import {DealerDashboardSideBar} from '../../../components/nav';
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
  Badge,
} from '@chakra-ui/react'
import { LayoutDashboard, Wallet, Clock, PiggyBank, BarChart2, HelpCircle, Settings, Share2, MoreVertical, TrendingUp } from 'lucide-react'
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import { PiHandDepositBold, PiHandWithdrawBold } from "react-icons/pi";
import Dashboard from './Dashboard';

function DealerDashboard({children, ...props}) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(true);
  const [dealership, setDealership] = useState({});


  async function getWalletBalance(){
    const res = await axios.get('/wallet/balance/');
    const data = objectifyJSON(res.data);
    console.log("Wallet:", data)
  }

  function init(){
    getWalletBalance();
    // setTimeout(() => setLoadingState(false), 2000);
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <Flex minH="100vh" position="relative">
      <DealerDashboardSideBar
       authUser={authUser}
       dealership={dealership}
       sidebarOpen={sidebarOpen}
       onClose={() => setSidebarState(false)}
       setSidebarState={setSidebarState}
      />

      <Box flex={1} w={sidebarOpen ? "calc(100% - 280px)" : 'calc(100% - 70px)'} ml={sidebarOpen ? "280px" : '70px'}>
        <Container pb={10} maxW="container.xl">
          <Outlet />
        </Container>
      </Box>
    </Flex>
  )
}

export default DealerDashboard;

