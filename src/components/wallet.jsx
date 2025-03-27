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
import {PinField, CenteredLayout} from '.';


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
		onSuccess(response)
	}

	return(
	  <Modal isCentered isOpen={isOpen} onClose={onClose}>
	    <ModalOverlay px={4} />
	    <ModalContent w={'90%'} maxW={'700px'}>
	      <ModalHeader>
	        <Heading size="md"> Checkout </Heading>
	        <ModalCloseButton />
	      </ModalHeader>

	      <ModalBody py={3}>
	        <Box>
		      <CenteredLayout>
		        <Box borderRadius="20px" w="90%" placeItems="center" maxW={'400px'} px={4} py={7} border="1px solid lavender">
		          <Heading size="md" my={4}> Wallet Payment </Heading>
		          <Text> Sender ID: </Text>
		          <Text> Receiver ID: </Text>

		          	<Divider />
					<Text> Amount: </Text>
			        <Text> Transaction fee: </Text>

			        <Text fontSize="md" fontWeight="600"> Insert Pin </Text>
			        <PinField onChange={val => setPin(val)} value={pin} />
		          <Button onClick={payUp} isDisabled={amount < 5} display="block" bg="primary" colorScheme="blue" w="full" flex={1} mt="3rem" size="lg"> PROCEED </Button>
		        </Box>
		      </CenteredLayout>
		    </Box>
	      </ModalBody>
	    </ModalContent>
	  </Modal>
	)
}


