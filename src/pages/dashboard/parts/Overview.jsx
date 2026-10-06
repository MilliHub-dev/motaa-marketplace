// /parts-store — the seller's parts shop at a glance (numbers from GET /parts/seller/store/).
import { useContext, useEffect } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Flex, Heading, LinkBox, LinkOverlay, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { OrderListSkeleton, PartsOrderRow } from '../../../components/parts';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { percent, usePartsShop } from './shop';

function Stat({ label, value, hint, to, tone }) {
  return (
    <LinkBox bg="white" px={5} py={4} borderRadius="lg" borderWidth={1} borderColor={tone ? `${tone}.200` : 'gray.100'} boxShadow="sm" _hover={to ? { borderColor: 'primary' } : undefined}>
      <Text fontSize="sm" color="gray.600">{to ? <LinkOverlay as={RLink} to={to}>{label}</LinkOverlay> : label}</Text>
      <Text fontSize="2xl" fontWeight="bold" wordBreak="break-word" color={tone ? `${tone}.600` : undefined}>{value}</Text>
      {hint && <Text fontSize="xs" color="gray.500">{hint}</Text>}
    </LinkBox>
  );
}

export default function PartsShopOverview() {
  const { commaInt, authUser } = useContext(GlobalStore);
  const { shop } = usePartsShop();
  const stats = shop?.stats || {};
  const store = shop?.store;

  useEffect(() => { document.title = 'Parts shop | Motaa'; }, []);

  const newOrders = useApiQuery(
    (api, signal) => api.get('/parts/seller/orders/?status=new&per_page=5', { signal }),
    [],
    { select: (body) => asList(body?.data?.results) }
  );

  return (
    <Box w="100%">
      <Flex py={6} borderBottom="2px solid lavender" justify="space-between" align="center" gap={3} flexWrap="wrap">
        <Box>
          <Heading as="h1" size="md">{authUser?.user_type === 'parts_dealer' ? 'Overview' : 'Parts shop'}</Heading>
          <Text color="gray.600" fontSize="sm">{store?.name}</Text>
        </Box>
        <Button as={RLink} to="/parts-store/parts/add" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<Plus size={16} />}>Add a part</Button>
      </Flex>

      <Stack spacing={3} mt={5}>
        {shop && !shop.verified && (
          <Alert status="warning" borderRadius="md" alignItems="start">
            <AlertIcon />
            <Box>
              <AlertTitle>Customers can't see your parts yet</AlertTitle>
              <AlertDescription display="block" fontSize="sm">
                {shop.verification_status === 'pending'
                  ? 'Your business verification is in progress. Your parts go on sale as soon as it is confirmed.'
                  : 'Your parts go on sale once your business is verified. You can add parts in the meantime.'}
              </AlertDescription>
            </Box>
          </Alert>
        )}
        {store && !store.active && (
          <Alert status="info" borderRadius="md" alignItems="start">
            <AlertIcon />
            <Box flex={1}>
              <AlertTitle>Your shop is closed</AlertTitle>
              <AlertDescription display="block" fontSize="sm">Customers can't see or buy your parts while it is closed.</AlertDescription>
            </Box>
            <Button as={RLink} to="/parts-store/settings" size="sm" variant="outline" flexShrink={0}>Open shop</Button>
          </Alert>
        )}
      </Stack>

      <Heading as="h2" size="sm" fontWeight="600" mt={6} mb={3}>Orders</Heading>
      <SimpleGrid gap={4} columns={{ base: 2, xl: 4 }}>
        <Stat label="New orders" value={commaInt(stats.new_orders)} hint="Waiting for you to accept" to="/parts-store/orders?status=new" tone={Number(stats.new_orders) > 0 ? 'orange' : undefined} />
        <Stat label="To send" value={commaInt(stats.to_send)} hint="Accepted, not sent yet" to="/parts-store/orders?status=to-send" />
        <Stat label="On the way" value={commaInt(stats.on_the_way)} hint="Sent or delivered" to="/parts-store/orders?status=sent" />
        <Stat label="Returns" value={commaInt(stats.returns)} hint="Need your attention" to="/parts-store/orders?status=returns" tone={Number(stats.returns) > 0 ? 'red' : undefined} />
      </SimpleGrid>

      <Heading as="h2" size="sm" fontWeight="600" mt={6} mb={3}>Money</Heading>
      <SimpleGrid gap={4} columns={{ base: 1, sm: 2 }}>
        <Stat label="Earned" value={`₦${commaInt(stats.earned)}`} hint={`From ${commaInt(stats.completed)} completed ${Number(stats.completed) === 1 ? 'order' : 'orders'}, paid to your wallet`} />
        <Stat label="On hold" value={`₦${commaInt(stats.on_hold)}`} hint="Held by Motaa until your open orders are completed" />
      </SimpleGrid>
      <Text fontSize="sm" color="gray.600" mt={3}>
        Motaa keeps {percent(shop?.commission_percent)}% of the price of the parts you sell (never the delivery fee). You are paid when the customer
        confirms they have the order, or automatically {shop?.release_days} days after you mark it delivered.
      </Text>

      <Heading as="h2" size="sm" fontWeight="600" mt={6} mb={3}>Parts</Heading>
      <SimpleGrid gap={4} columns={{ base: 1, sm: 3 }}>
        <Stat label="All parts" value={commaInt(stats.parts)} to="/parts-store/parts" />
        <Stat label="Live" value={commaInt(stats.live_parts)} to="/parts-store/parts?status=live" />
        <Stat label="Out of stock" value={commaInt(stats.out_of_stock)} to="/parts-store/parts?status=out" tone={Number(stats.out_of_stock) > 0 ? 'orange' : undefined} />
      </SimpleGrid>

      <Flex justify="space-between" align="center" mt={8} mb={3} gap={3}>
        <Heading as="h2" size="sm" fontWeight="600">New orders waiting for you</Heading>
        <Button as={RLink} to="/parts-store/orders" size="sm" variant="link" color="primary">View all orders</Button>
      </Flex>
      {newOrders.loading && newOrders.data === undefined ? (
        <OrderListSkeleton />
      ) : newOrders.error && newOrders.data === undefined ? (
        <Text fontSize="sm" color="red.600" role="alert">{newOrders.error.message} <Button variant="link" size="sm" onClick={() => newOrders.reload()}>Try again</Button></Text>
      ) : asList(newOrders.data).length === 0 ? (
        <Text color="gray.600" fontSize="sm" p={4} borderWidth="1px" borderStyle="dashed" borderRadius="lg">No new orders right now. New orders show up here and in your notifications.</Text>
      ) : (
        <Stack as="ul" listStyleType="none" spacing={3}>
          {newOrders.data.map((order) => <PartsOrderRow key={order.uuid} order={order} to={`/parts-store/orders/${order.uuid}`} seller />)}
        </Stack>
      )}
    </Box>
  );
}
