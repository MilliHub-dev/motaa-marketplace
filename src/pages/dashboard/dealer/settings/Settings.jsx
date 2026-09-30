import { Box, Heading, Text } from '@chakra-ui/react';
import BusinessProfile from './BusinessProfile';

const DealershipSettings = () => (
  <Box pt={5} w="100%">
    <Heading as="h1" size="md">Dealership settings</Heading>
    <Text color="gray.600" fontSize="sm" mb={2}>This is how customers see your business on Motaa.</Text>
    <BusinessProfile />
  </Box>
);

export default DealershipSettings;
