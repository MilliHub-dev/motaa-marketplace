// /parts/checkout/placed — "your order was placed", shown straight after a parts checkout.
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, Navigate, useLocation } from 'react-router-dom';
import { Box, Button, Container, Flex, Heading, Icon, Stack, Text } from '@chakra-ui/react';
import { CheckCircle } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { PartsOrderBadge } from '../../../components/parts';
import { asList } from '../../../utils';
import { PLACED_ORDERS_KEY } from '../../../utils/parts';

function readPlaced() {
  try { return asList(JSON.parse(window.sessionStorage.getItem(PLACED_ORDERS_KEY) || '[]')); } catch { return []; }
}

export default function PartsOrderPlaced() {
  const { commaInt } = useContext(GlobalStore);
  const location = useLocation();
  // the orders come with the navigation; a reload falls back to what checkout saved for this tab
  const [orders] = useState(() => (asList(location.state?.orders).length ? location.state.orders : readPlaced()));

  useEffect(() => { document.title = 'Order placed | Motaa spare parts'; }, []);

  if (!orders.length) return <Navigate to="/parts/orders" replace />;
  const many = orders.length > 1;

  return (
    <Container maxW="container.md" py={{ base: 8, md: 14 }}>
      <Stack spacing={3} align="center" textAlign="center">
        <Flex w={16} h={16} rounded="full" bg="green.50" align="center" justify="center" color="green.500">
          <Icon as={CheckCircle} boxSize={9} aria-hidden="true" />
        </Flex>
        <Heading as="h1" size="lg">{many ? 'Your orders were placed' : 'Your order was placed'}</Heading>
        <Text color="gray.600" maxW="520px">
          Your payment is held safely by Motaa. {many ? 'Each seller sends their own order, so you have one order per seller.' : 'The seller has been told and will get it ready.'}{' '}
          Confirm the order once it arrives and the seller is paid.
        </Text>
      </Stack>

      <Stack as="ul" listStyleType="none" spacing={3} mt={8}>
        {orders.map((order) => (
          <Flex as="li" key={order.uuid} gap={3} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="xl" align="center" flexWrap="wrap">
            <Box flex={1} minW="180px">
              <Flex gap={2} align="center" flexWrap="wrap">
                <Text fontWeight="600">Order {order.number}</Text>
                <PartsOrderBadge order={order} />
              </Flex>
              <Text fontSize="sm" color="gray.600">
                {order.store?.name} · {order.items_count} {Number(order.items_count) === 1 ? 'item' : 'items'} · {order.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}
              </Text>
            </Box>
            <Text fontWeight="700">₦{commaInt(order.total)}</Text>
            <Button as={RLink} to={`/parts/orders/${order.uuid}`} size="sm" variant="outline" borderColor="primary" color="primary">Track order</Button>
          </Flex>
        ))}
      </Stack>

      <Flex gap={3} mt={8} justify="center" flexWrap="wrap">
        <Button as={RLink} to="/parts/orders" bg="primary" color="white" _hover={{ bg: 'secondary' }}>My parts orders</Button>
        <Button as={RLink} to="/parts" variant="ghost" color="primary">Keep shopping</Button>
      </Flex>
    </Container>
  );
}
