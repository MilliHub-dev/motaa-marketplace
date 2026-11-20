// A business viewing its own public page (dealership, mechanic profile or parts shop) from its dashboard: a slim bar
// saying this is what customers see, with a way back, above the real public page.
import { Suspense, useContext } from 'react';
import { Link as RLink, Outlet } from 'react-router-dom';
import { Box, Button, Container, Flex, HStack, Text } from '@chakra-ui/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { GlobalStore } from '../App';
import { Brand } from './nav';
import { LoadingState } from './states';

export default function PublicPreview() {
  const { authUser } = useContext(GlobalStore);
  const home = authUser?.user_type === 'parts_dealer' ? '/parts-store' : '/dashboard';
  return (
    <Box minH="100vh" bg="white">
      <Box position="sticky" top={0} zIndex={30} bg="#0B1220" color="white" boxShadow="0 2px 10px rgba(0,0,0,0.15)">
        <Container maxW="container.xl">
          <Flex align="center" gap={3} py={2.5}>
            <Box display={{ base: 'none', sm: 'block' }} filter="brightness(0) invert(1)"><Brand to={home} /></Box>
            <HStack spacing={2} flex={1} minW={0} fontSize="sm">
              <Eye size={16} aria-hidden="true" />
              <Text noOfLines={1}><b>Preview:</b> this is how customers see your page.</Text>
            </HStack>
            <Button as={RLink} to={home} size="sm" leftIcon={<ArrowLeft size={14} />} bg="white" color="#0B1220" borderRadius="full" flexShrink={0}>
              Back to dashboard
            </Button>
          </Flex>
        </Container>
      </Box>
      <Suspense fallback={<LoadingState minH="60vh" label="Loading your public page…" />}>
        <Outlet />
      </Suspense>
    </Box>
  );
}
