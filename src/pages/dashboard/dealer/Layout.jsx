import {useState, useEffect, useContext, createContext,} from 'react';
import {Link, Routes, Route, Outlet, useLocation} from 'react-router-dom';
import {GlobalStore} from '../../../App';
import {objectifyJSON, jsonifyObject} from '../../../utils';
import {DealerDashboardSideBar, DealerNavbar, UnauthenticatedNavbar} from '../../../components/nav';
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
  Stack,
  useMediaQuery,
} from '@chakra-ui/react'
import { LayoutDashboard, Wallet, Clock, PiggyBank, BarChart2, HelpCircle, Settings, Share2, MoreVertical, TrendingUp } from 'lucide-react'
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import { PiHandDepositBold, PiHandWithdrawBold } from "react-icons/pi";
import Dashboard from './Dashboard';


export const DealershipContext = createContext({
  dealership: null,
})

function DealerDashboardLayout({children, ...props}) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(true);
  const [loading, setLoadingState] = useState(true);
  const [dealership, setDealership] = useState({});
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  async function init(){
    // get the dealership
    try{
      const res = await axios.get(`/admin/dealership/`);
      const data = objectifyJSON(res.data);

      if (res?.status === 200){
        setDealership(data.data);
        console.log("Dealership:", data.data)
      }

      setTimeout(() => setLoadingState(false), 2000)

    }catch(error){
      console.log("error getting dealership:", error)
    }
  }

  useEffect(() => {
    init();

  }, [])

  if (loading){
    return null
  }

  const context = {
    dealership,
  }

  return (
    <DealershipContext.Provider value={context}>
    <Stack>
      <DealerNavbar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} />

      <Flex minH="100vh" position="relative">
        <DealerDashboardSideBar
         authUser={authUser}
         dealership={dealership}
         sidebarOpen={sidebarOpen}
         onClose={() => setSidebarState(false)}
         setSidebarState={setSidebarState}
        />

        <Box
         flex={{ md: 1 }}
         w={!isMobile ? '100%' : (sidebarOpen ? "calc(100% - 280px)" : 'calc(100% - 70px)')}
         ml={!isMobile ? '0px' : (sidebarOpen ? "280px" : '70px')}
        >
          <Container pb={10} maxW="container.xl">
            <Outlet />
          </Container>
        </Box>
      </Flex>
    </Stack>
    </DealershipContext.Provider>
  )
}

export default DealerDashboardLayout;

