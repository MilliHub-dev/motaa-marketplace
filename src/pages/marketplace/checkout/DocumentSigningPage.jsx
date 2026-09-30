import { Box, Container, Heading, Text } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PreviewWithSignature } from '../../../components/documents';

const TITLES = {
  'order-slip': 'Order agreement',
  'inspection-slip': 'Inspection agreement',
};

export const DocumentSigningPage = () => {
  const [params] = useSearchParams();
  const docType = TITLES[params.get('docType')] ? params.get('docType') : 'inspection-slip';
  // an order uuid (preferred) or, for older links, the listing uuid
  const orderId = params.get('orderId') || params.get('order') || params.get('listingId');
  const navigate = useNavigate();

  return (
    <Box minH="70vh">
      <Box bg="primary" py={{ base: 6, md: 8 }} mb={8}>
        <Container maxW="container.xl" textAlign="center">
          <Heading as="h1" color="white" size="lg" fontWeight="500">{TITLES[docType]}</Heading>
          <Text color="whiteAlpha.900" mt={2}>Review, sign and download your document</Text>
        </Container>
      </Box>

      <Box pb={12}>
        <PreviewWithSignature
          docType={docType}
          orderId={orderId}
          onSignatureComplete={(document) => navigate(document?.order_id ? `/checkout/status?order=${document.order_id}` : '/home')}
        />
      </Box>
    </Box>
  );
};

export default DocumentSigningPage;
