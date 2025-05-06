import {useState, useEffect, useContext} from 'react'
import {
	Box,
	Container,
	Heading,
	Text,
} from '@chakra-ui/react'
import { PreviewWithSignature } from "../../../components/documents";
import { GlobalStore } from "../../../App";
import {useSearchParams} from 'react-router-dom'

export const DocumentSigningPage = ({ ...props }) => {
	const {authUser, } = useContext(GlobalStore);
	const [params] = useSearchParams();
	const docType = params.get('docType');
	


	return(
		<Box>
			<Box bg="blue.600" py={8} mb={8}>
		        <Container maxW="container.xl" textAlign="center">
		          <Heading color="white" size="lg" className="subtitle" fontWeight="400">Checkout</Heading>
		          <Text color="whiteAlpha.900" mt={2}>Download your Docs!</Text>
		        </Container>
	      	</Box>

			<Box py={10}>
	            <PreviewWithSignature docType={docType || "inspection-slip"} params={{
	              client_name: `${authUser?.first_name} ${authUser?.last_name}`,
	              vehicle_id: '21ei7dst7t73iorgjdifyu89',
	              inspector: 'Joel Tanko',
	              date: 'Today'
	            }} />
	        </Box>
        </Box>
	)
}


export default DocumentSigningPage;