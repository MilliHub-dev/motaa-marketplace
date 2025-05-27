import {useState, useEffect, useContext, useRef} from 'react';
import {Link, NavLink, Outlet} from 'react-router-dom';
import {GlobalStore} from '../../../App';
import {objectifyJSON, jsonifyObject} from '../../../utils';
import {
  Box,
  Container,
  Flex,
  VStack,
  Alert,
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
  Checkbox,
  IconButton,
  Menu,
  MenuButton,
  SimpleGrid,
  MenuList,
  MenuItem,
  Badge,
} from '@chakra-ui/react'
import { LayoutDashboard, Wallet, Clock, PiggyBank, BarChart2, HelpCircle, Settings, Share2, MoreVertical, TrendingUp } from 'lucide-react'
import { RiCoinsFill, RiCoinsLine } from "react-icons/ri";
import { LuChartLine } from "react-icons/lu";
import { GiHomeGarage } from "react-icons/gi";
import { AiOutlineTransaction } from "react-icons/ai";
import { PiHandDepositBold, PiHandWithdrawBold } from "react-icons/pi";
import {FlutterwavePaymentModal} from '../../../components/wallet';
import { usePaystackPayment } from 'react-paystack';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import {CenteredLayout} from '../../../components';

function WalletDepositPage() {
  const {axios, notify, authUser, commaInt, redirect} = useContext(GlobalStore);
  const [minDeposit, setMinDeposit] = useState(500)
  const [currency, setCurrency] = useState({
      code: 'NGN',
      symbol: '₦'
  });
  const [showDepositModal, setDepositModalVisibility] = useState(false);
  const [loading, setLoadingState] = useState(true);
  const [amount, setAmount] = useState(0);
  const [accept, setAccept] = useState(true);
  const amountRef = useRef();

  const DEBUG = JSON.parse(import.meta.env.VITE_DEBUG);

  async function processDeposit(response){
    const res = await axios.post('/wallet/deposit/', jsonifyObject(response));
    const data = objectifyJSON(res.data);

    if (res.status === 200){
      redirect('/wallet/', 500);
      notify({
        title: 'Deposit received!',
        color: 'blue'
      })
    }else{
      notify({
        title: data.message,
        color: 'red'
      })
    }
  }

  async function init(){
    // get wallet deposit currency
    const res = await axios.get(`/wallet/`);
    const data = objectifyJSON(res.data);
    console.log("Wallet:", data.data);
    setTimeout(() => setLoadingState(false), 2000);
  }

  // const config = {
  //   public_key: "FLWPUBK_TEST-6d708e896eb3ba9f1ee4e1e73509e9e5-X",
  //   tx_ref: `${authUser?.token.substr(0, 7)}${Date.now()}${authUser?.token.substr(5, 3)}`,
  //   amount: DEBUG ? (amount > 500000 ? 500000 : amount) : amount,
  //   currency: currency?.code,
  //   payment_options: 'card,ussd,transfer',
  //   customer: {
  //     email: authUser?.email,
  //     phone_number: authUser?.phone_number,
  //     name: `${authUser?.first_name} ${authUser?.last_name}`,
  //   },
  //   customizations: {
  //     title: 'Motaa',
  //     description: 'Add funds to your wallet',
  //     logo: `${window.location.origin}/static/motaa/motaa-logo-1.png`,
  //   },
  //   meta: {
  //     transaction_type: 'wallet:deposit'
  //   }
  // };
  // const handleFlutterPayment = useFlutterwave(config);

  const getFinalAmount = (amt) => {
    return (amt * 100)
  }
  
  // const PAYSTACK_LIVE_KEY = import.meta.env.VITE_PAYSTACK_LIVE_PUBLIC_KEY;
  const PAYSTACK_LIVE_KEY = "pk_test_73e0d039b25449f1493d055ff5ed58a4b6c800f0";
  

  const config = {
    publicKey: PAYSTACK_LIVE_KEY,
    reference: (new Date()).getTime().toString(),
    amount: getFinalAmount(amount),
    email: authUser?.email,
  };

  const handlePayment = usePaystackPayment(config);

  function payUp(){
    try{
      handlePayment(onPaymentComplete, onModalClose);
    }catch(err){
      console.log("error paying up:", err)
    }
  }

  function onPaymentComplete(response){
    console.log(response);
    return processDeposit(response)
  }

  function onModalClose(){
  // user cancelled the payment flow
    console.log("User cancelled the transaction")
  }


  useEffect(() => {
    init();
  }, [])

  return (
    <Box>
      <CenteredLayout>
        <Box borderRadius="20px" w="90%" placeItems="center" maxW={'400px'} px={4} py={7} border="1px solid lavender">
          <Heading size="md" my={4}> Deposit </Heading>

          <Text my={10} size="md" fontWeight="600"> How much are you depositing? </Text>

          <Heading
           size="lg" w="100%"
           flex={1}
           color="primary"
           ref={amountRef} display={'flex'}
           px={3} py={2} border="1px solid lavender" textAlign="center"
           justifyContent="center" borderRadius="lg"
          >
            <Text as="span">{currency?.symbol}</Text>
            <Text
              contentEditable
              textAlign="left"
              outline="none"
              minW="max-content"
              as="span"
              style={{wordWrap: "normal"}}
              overflowX="auto"
              className="hidden-scroll"
              onBeforeInput={(e) => {
                if (e.data && /\D/.test(e.data)) {
                  e.preventDefault();
                }
              }}
              onInput={(e) => {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const cursorOffset = range.startOffset;

                // Get numeric value only
                const newValue = e.target.textContent.replace(/\D/g, '');
                setAmount(newValue);
                const formattedValue = commaInt(newValue);

                // Update content without losing focus
                e.target.textContent = formattedValue;

                // Restore cursor position
                const newCursorPos = cursorOffset + (formattedValue.length - newValue.length);
                range.setStart(e.target.childNodes[0] || e.target, Math.min(newCursorPos, formattedValue.length));
                range.setEnd(e.target.childNodes[0] || e.target, Math.min(newCursorPos, formattedValue.length));
                selection.removeAllRanges();
                selection.addRange(range);
              }}
              dangerouslySetInnerHTML={{ __html: `${commaInt(0)}` }}
            ></Text>
          </Heading>

          {amount < minDeposit && <Text my={2} size="xs" fontSize={'13px'} fontWeight="600" color="red"> minimum allowed amount {currency?.symbol}{minDeposit} </Text>}

          <Button onClick={payUp} isDisabled={amount < minDeposit || accept === false } display="block" bg="primary" colorScheme="blue" w="full" flex={1} mt="3rem" size="lg"> PROCEED </Button>
          
          <Alert fontSize={'14px'} mt={'2rem'} colorScheme="blue" color="primary" gap={2} textAlign="left" maxW="550px" borderRadius="lg" border="1px solid" borderColor="primary">
            <Checkbox borderColor="primary" value={accept} onInput={e => setAccept(!accept)} isChecked={accept} style={{accentColor: 'primary'}} type="checkbox" name="i_accept" />
            Motaa is not a bank, all banking services are provided by TAJ Bank.
          </Alert>
        </Box>

      </CenteredLayout>
    </Box>
  )
}

export default WalletDepositPage;
