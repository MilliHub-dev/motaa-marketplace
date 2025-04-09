import {useState, useEffect, useContext, createContext, Fragment,} from 'react';
import {Link, Routes, Route, Outlet, useLocation} from 'react-router-dom';
import {GlobalStore} from '../../../App';
import {objectifyJSON, jsonifyObject} from '../../../utils';
import {MechanicDashboardSideBar, MechanicNavbar, UnauthenticatedNavbar} from '../../../components/nav';
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
import Dashboard from './MechanicDashboard';


export const MechanicContext = createContext({
  mechanic: null,
})

function MechanicDashboardLayout({children, hideSidebar, ...props}) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(false);
  const [loading, setLoadingState] = useState(true);
  const [mechanic, setMechanic] = useState();
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  async function init(){
    // get the dealership
    try{
      const res = await axios.get(`/admin/mechanics/`);
      const data = objectifyJSON(res.data);

      if (res?.status === 200){
        setMechanic(data.data);
        console.log("Mechanic:", data.data)
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
    mechanic,
  }

  return (
    <MechanicContext.Provider value={context}>
    <Stack>
      <MechanicNavbar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} hideSidebar={hideSidebar} />

      <Flex minH="100vh" position="relative">
        <Fragment>
          <MechanicDashboardSideBar
           mechanic={mechanic}
           sidebarOpen={sidebarOpen}
           onClose={() => setSidebarState(false)}
           setSidebarState={setSidebarState}
           // display={hideSidebar && 'none'}
           mode={hideSidebar ? 'drawer' : 'block'}
          />

          <Box
           flex={{ md: 1 }}
           w={isMobile ? '100%' : hideSidebar ? '100%' : "calc(100% - 280px)"}
           ml={isMobile ? '0px' : hideSidebar ? '0px' : "280px"}
          >
            <Container pb={10} maxW="container.xl">
              <Outlet />
            </Container>
          </Box>
        </Fragment>
      </Flex>
    </Stack>
    </MechanicContext.Provider>
  )
}

export default MechanicDashboardLayout;

