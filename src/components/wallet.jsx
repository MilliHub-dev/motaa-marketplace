import {useState, useEfect, useContext} from 'react';
import {
	Box,
	Modal,
	ModalBody,
	ModalHeader,
	ModalCloseButton,
	ModalContent,
	ModalOverlay,
	Button,
	Alert,
	AlertIcon,
	Text,
	Image,
	Divider,
	Heading,
} from '@chakra-ui/react';
// import {Zap} from '@chakra-ui/icons'
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { usePaystackPayment } from 'react-paystack';
import {PinField, CenteredLayout} from '.';
import {EmptyWalletIcon,} from './icons';
import {GlobalStore} from '../App';
import {objectifyJSON, jsonifyObject} from '../utils';


export const PaystackPaymentModal = ({
	isOpen, onClose,
	onSuccess, payload,
	customizations,
	...props
}) => {
	const {
	   	amount,
	    email
	} = payload;

	const {title, logo, description} = customizations;
	const DEBUG = JSON.parse(import.meta.env.VITE_DEBUG);
	// const PAYSTACK_LIVE_KEY = import.meta.env.VITE_PAYSTACK_LIVE_PUBLIC_KEY;
	const PAYSTACK_LIVE_KEY = "pk_test_73e0d039b25449f1493d055ff5ed58a4b6c800f0";

	const config = {
		publicKey: PAYSTACK_LIVE_KEY,
		reference: (new Date()).getTime().toString(),
		amount: amount * 100,
		email: email,
	};

	const handlePayment = usePaystackPayment(config);

	function payUp(){
		try{
			console.log("Paying Up...");
		  	handlePayment((res) => onPaymentComplete(res), onModalClose);
		}catch(err){
		  	console.log("error paying up:", err)
		}
	}

	function onPaymentComplete(response){
		console.log("Paystack", response);
		return onSuccess(response)
	}

	function onModalClose(){
	// user cancelled the payment flow
		console.log("User cancelled the transaction")
	}


	return(
	  <Modal isCentered isOpen={isOpen} onClose={onClose}>
	    <ModalOverlay px={4} />
	    <ModalContent w={'90%'} maxW={'700px'}>
	      <ModalHeader>
	        <Heading size="md"> {title} </Heading>
	        <ModalCloseButton />
	      </ModalHeader>

	      <ModalBody py={3}>
	        <Box w={'100%'}>
	          <Image w={'100%'} src={'/assets/images/paystack-banner.png'} />

	          <Alert colorScheme="yellow" borderRadius="lg" my={3}>
	          	{/*<AlertIcon as={<ZapIcon />} />*/}
	          	<Text fontSize="sm"> Motaa does not handle any payment processing or save your card. <br />
	          	All payments are done via Paystack
	          	</Text>
	          </Alert>
	        </Box>
	        <Button w="100%" bg="primary" colorScheme="blue" onClick={payUp}> Continue </Button>
	      </ModalBody>
	    </ModalContent>
	  </Modal>
	)
}


export const FlutterwavePaymentModal = ({
	isOpen, onClose,
	onSuccess, payload,
	customizations,
	...props
}) => {
	const {
	    currency, amount, payment_option,
	    email, phone_number, first_name, last_name,
	} = payload;

	const {title, logo, description} = customizations;
	const DEBUG = JSON.parse(import.meta.env.VITE_DEBUG);
	console.log("Amount", payment_option, amount)

	const config = {
		public_key: "FLWPUBK_TEST-6d708e896eb3ba9f1ee4e1e73509e9e5-X",
		tx_ref: Date.now(),
		amount: DEBUG ? (amount > 500000 ? 500000 : amount) : amount,
		currency: currency,
		payment_options: payment_option,
		customer: {
		  email: email,
		  phone_number: phone_number,
		  name: `${first_name} ${last_name}`,
		},
		customizations: {
		  title: "Motaa",
		  description: description,
		  logo: logo,
		},
		meta: {...props?.meta}
	};
	const handleFlutterPayment = useFlutterwave(config);

	function payUp(){
		try{
		  handleFlutterPayment({
		    callback: (response) => {
		      console.log(response);
		      onPaymentComplete(response);
		      closePaymentModal(); // this will close the modal programmatically
		    },
		    onClose: () => {
		      onModalClose();
		    },
		  });
		}catch(err){
		  console.log("error paying up:", err)
		}
	}

	function onPaymentComplete(response){
		return onSuccess(response)
	}

	function onModalClose(){
	// user cancelled the payment flow
		console.log("User cancelled the transaction")
	}


	return(
	  <Modal isCentered isOpen={isOpen} onClose={onClose}>
	    <ModalOverlay px={4} />
	    <ModalContent w={'90%'} maxW={'700px'}>
	      <ModalHeader>
	        <Heading size="md"> {title} </Heading>
	        <ModalCloseButton />
	      </ModalHeader>

	      <ModalBody py={3}>
	        <Box w={'100%'}>
	          <Image w={'100%'} src={'/assets/images/flutterwave-banner.png'} />

	          <Alert colorScheme="yellow" borderRadius="lg" my={3}>
	          	{/*<AlertIcon as={<ZapIcon />} />*/}
	          	<Text fontSize="sm"> Motaa does not handle any payment processing or save your card. <br />
	          	All payments are done via Flutterwave
	          	</Text>
	          </Alert>
	        </Box>
	        <Button w="100%" bg="primary" colorScheme="blue" onClick={payUp}> Continue </Button>
	      </ModalBody>
	    </ModalContent>
	  </Modal>
	)
}


export const WalletPaymentModal = ({
	isOpen, onClose,
	onSuccess, payload,
	...props
}) => {
	const {
	    amount,
	    recipient,
	} = payload;

	const [pin, setPin] = useState('');
	const {axios, notify, authUser} = useContext(GlobalStore);

	async function payUp(){
		try{
			const res = await axios.post('/wallet/pay');
			const data = objectifyJSON(res.data);

			if (res.status === 200){
				onSuccess({

				})	
			}else{
				// insufficient funds / wrong pin
				notify({
					title: 'Error',
					body: data?.message,
					color: 'red'
				})
			}

		}catch(err){
			console.log("error paying up:", err)
		}
		onSuccess(response)
	}

	return(
	  <Modal isCentered isOpen={true} onClose={onClose}>
	    <ModalOverlay px={4} />
	    <ModalContent w={'90%'} maxW={'500px'}>
	      <ModalBody
	       width="100%"
	       as={Box}
	       borderRadius="20px"
	       w="100%"
	       placeItems="center"
	       px={4}
	       py={7}
	       border="1px solid lavender"
	       bg="white.100"
	       >
		        
				<Box bg={'blue.100'} rounded="full" p={4}> <EmptyWalletIcon width="40px" height="40px" /> </Box>

				<Heading size="md" my={2}> Wallet Payment </Heading>

				<Box gap={2}>
				  <Text> Sender: {authUser?.email} </Text>
				  <Text> Receiver: {recipient?.owner?.email}</Text>
				</Box>

					<Divider borderColor="gray" my={2} />

				<Text> Amount: {parseInt(amount).toLocaleString()} </Text>

				<Text fontSize="md" fontWeight="600"> Wallet Authorization Pin </Text>
				<PinField onChange={val => setPin(val)} value={pin} />

				<Box>
					<Button onClick={payUp} isDisabled={amount < 5} bg="primary" colorScheme="blue" w="100%" my={4} size="lg"> PROCEED </Button>
					<Button position="static" as={ModalCloseButton} bg="tertiary" colorScheme="yellow" w="100%" size="lg"> CANCEL </Button>
		        </Box>
	      </ModalBody>
	    </ModalContent>
	  </Modal>
	)
}


