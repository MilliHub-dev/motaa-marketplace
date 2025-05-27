import {useState, useEffect, useContext, createContext, Fragment,} from 'react';
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
import {MdWarning,} from "react-icons/md";
import { PiHandDepositBold, PiHandWithdrawBold } from "react-icons/pi";
import {VerificationNotice} from '../../../components';
import Dashboard from './Dashboard';


export const DealershipContext = createContext({
  dealership: null,
})

function DealerDashboardLayout({children, hideSidebar, ...props}) {
  const {axios, notify, authUser, commaInt} = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(false);
  const [loading, setLoadingState] = useState(true);
  const [dealership, setDealership] = useState({
    uuid: '',

  });
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  async function init(){
    setLoadingState(true)
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


  async function onVerification(type, data){
    try{
      if(type === 'success'){
        const payload = {
          verification_ref: data?.referenceId,
          scope: [
            'verified_id',
            'verified_tin',
            'verified_business',
            'user.verified_email',
            'verified_phone_number',
          ],
          object: 'dealership',
          object_id: dealership.uuid,
        }

        const res = await axios.post(`/accounts/verify-business/`, jsonifyObject(payload));
        const data = objectifyJSON(res.data);
        if (res.status === 200){
          notify({
            title: data?.message || 'Verification success!',
            color: 'green',
            timeout: 2500,
          });

          return init();
        }else{
          notify({
            title: data?.message || 'An error occurred, we could not verify your business.',
            color: 'red',
            timeout: 5000,
          })
        }
      }else if(type === 'error'){
        notify({
          title: data?.message || 'An error occurred, we could not verify your business.',
          color: 'red',
          timeout: 5000,
        })
      }else if(type === 'begin'){
      }else if(type === 'close'){
        console.log("Verification Close")
        // close of the modal
      }else if(type === 'loading'){
      }
    }catch(error){
      notify({
        title: error?.message || 'An error occurred, we could not verify your business.',
        color: 'red',
        timeout: 5000,
      })
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
    onVerification,
  }

  return (
    <DealershipContext.Provider value={context}>
    <Stack>
      <DealerNavbar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} hideSidebar={hideSidebar} />

      <Flex minH="100vh" position="relative">
        <Fragment>
          <DealerDashboardSideBar
           dealership={dealership}
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
              {
                !hideSidebar && !dealership?.verified_business && 
                <VerificationNotice user={authUser} onVerification={onVerification} businessType={'dealer'} />
              }
              <Outlet />
            </Container>
          </Box>
        </Fragment>
      </Flex>
    </Stack>
    </DealershipContext.Provider>
  )
}





export default DealerDashboardLayout;

