import {useState, useEfect, useContext} from 'react';
import {
	Box,
} from '@chakra-ui/react';
import { useFlutterwave } from 'flutterwave-react-v3';



export const PaymentModal = ({
 amount, title, description, logo,
 payment_options, currency, tx_ref,
 person
}) => {

const config = {
	public_key: `${process.env.REACT_APP_FLW_TEST_PUBLIC_KEY}`,
	tx_ref: tx_ref ||  Date.now(),
	amount,
	currency: currency || 'NGN',
	payment_options: payment_options || 'card,mobilemoney,ussd',
	customer: {
	  email: person?.user?.email,
	  phone_number: person?.phone_number,
	  name: person?.user?.name,
	},
	customizations: {
	  title,
	  description,
	  logo
	},
};

	return(
		<Box>

		</Box>
	)
}
