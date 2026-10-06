// /parts/cart — the parts cart, grouped by seller. Quantities, totals and problems come from the API.
import { useContext, useEffect, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import { Alert, AlertDescription, AlertIcon, Box, Button, Container, Divider, Flex, Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react';
import { ShoppingCart, Store, Trash2 } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ActionDialog, PartPhoto, QuantityInput, StoreDelivery, SummaryRow, announcePartsCart } from '../../../components/parts';
import { EmptyState, ErrorState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';

function CartSkeleton() {
  return (
    <Stack spacing={4} role="status" aria-label="Loading your parts cart">
      {[0, 1].map((i) => <Skeleton key={i} h="150px" borderRadius="xl" />)}
    </Stack>
  );
}

export default function PartsCart() {
  const { commaInt } = useContext(GlobalStore);
  const [busyPart, setBusyPart] = useState(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  useEffect(() => { document.title = 'Parts cart | Motaa'; }, []);

  const query = useApiQuery((api, signal) => api.get('/parts/cart/', { signal }), [], { select: (body) => body?.data });
  const cart = query.data;
  const groups = asList(cart?.groups);

  function applyQuote(body) {
    if (body?.data) {
      query.setData(body.data);
      announcePartsCart(body.data.count);
    }
  }

  const setQuantity = useApiMutation(
    (api, part, quantity) => api.post('/parts/cart/', { part: part.uuid, quantity }),
    { errorTitle: "Couldn't change the quantity", onSuccess: applyQuote }
  );
  const remove = useApiMutation(
    (api, part) => api.delete(`/parts/cart/?part=${part.uuid}`),
    { errorTitle: "Couldn't remove that part", onSuccess: applyQuote }
  );
  const empty = useApiMutation((api) => api.delete('/parts/cart/'), { errorTitle: "Couldn't empty your cart", onSuccess: applyQuote });

  async function change(mutation, part, ...args) {
    setBusyPart(part.uuid);
    await mutation.mutate(part, ...args);
    setBusyPart(null);
  }

  const blocked = groups.some((group) => asList(group.items).some((line) => line.problem));

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="start" gap={3} flexWrap="wrap" mb={4}>
        <Box>
          <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }}>Parts cart</Heading>
          <Text color="gray.600" mt={1}>Spare parts you're about to buy. Each seller sends their own order.</Text>
        </Box>
        <Button as={RLink} to="/parts/orders" variant="link" color="primary">My parts orders</Button>
      </Flex>

      {query.loading && !cart ? (
        <CartSkeleton />
      ) : query.error && !cart ? (
        <ErrorState error={query.error} onRetry={query.reload} />
      ) : groups.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your parts cart is empty" description="Find the part you need and add it here to check out." action={{ label: 'Browse spare parts', to: '/parts' }} />
      ) : (
        <Flex gap={8} direction={{ base: 'column', lg: 'row' }} align="start">
          <Stack spacing={5} flex={1} minW={0} w="100%">
            {blocked && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>Some items need your attention before you can check out. See the notes in red below.</AlertDescription>
              </Alert>
            )}

            {groups.map((group) => (
              <Box as="section" key={group.store?.uuid} aria-label={`Parts from ${group.store?.name}`} borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
                <Flex align="center" gap={2} px={4} py={3} bg="gray.50" borderBottomWidth="1px">
                  <Store size={16} aria-hidden="true" />
                  <Text as={RLink} to={`/parts/stores/${group.store?.uuid}`} fontWeight="600" _hover={{ color: 'primary' }} noOfLines={1}>{group.store?.name}</Text>
                </Flex>

                <Stack as="ul" listStyleType="none" spacing={0} divider={<Divider />}>
                  {asList(group.items).map((line) => {
                    const part = line.part || {};
                    const busy = busyPart === part.uuid;
                    return (
                      <Box as="li" key={part.uuid} p={4} opacity={busy ? 0.6 : 1}>
                        <Flex gap={3} align="start">
                          <PartPhoto src={part.image} alt={part.name || 'Part'} boxSize={{ base: '64px', md: '80px' }} borderRadius="md" iconSize={6} />
                          <Box flex={1} minW={0}>
                            <Text as={RLink} to={`/parts/${part.uuid}`} fontWeight="600" noOfLines={2} _hover={{ color: 'primary' }}>{part.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {[part.condition_label, part.brand].filter(Boolean).join(' · ')}
                            </Text>
                            <Text fontSize="sm" color="gray.600">₦{commaInt(part.price)} each</Text>
                            {line.problem && <Text fontSize="sm" color="red.600" fontWeight="600" mt={1} role="alert">{line.problem}</Text>}
                          </Box>
                          <Text fontWeight="700" whiteSpace="nowrap">₦{commaInt(line.line_total)}</Text>
                        </Flex>
                        <Flex justify="space-between" align="center" mt={3} gap={3}>
                          <QuantityInput value={line.quantity} max={part.stock} isDisabled={busy} label={`Quantity of ${part.name}`}
                            onChange={(quantity) => change(setQuantity, part, quantity)} />
                          <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={14} />} isDisabled={busy}
                            onClick={() => change(remove, part)} aria-label={`Remove ${part.name} from your cart`}>
                            Remove
                          </Button>
                        </Flex>
                      </Box>
                    );
                  })}
                </Stack>

                <Box px={4} py={3} borderTopWidth="1px" bg="gray.50">
                  <SummaryRow label={`Parts from ${group.store?.name}`} value={`₦${commaInt(group.items_total)}`} bold />
                  <StoreDelivery store={group.store} mt={3} />
                </Box>
              </Box>
            ))}

            <HStack justify="space-between" flexWrap="wrap">
              <Button as={RLink} to="/parts" variant="link" color="primary">Add more parts</Button>
              <Button variant="link" colorScheme="red" onClick={() => setConfirmEmpty(true)}>Empty cart</Button>
            </HStack>
          </Stack>

          <Box w="100%" maxW={{ lg: '340px' }} position={{ lg: 'sticky' }} top={{ lg: '90px' }} borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5}>
            <Heading as="h2" size="sm" mb={4}>Summary</Heading>
            <Stack spacing={2}>
              <SummaryRow label={`Parts (${cart.count})`} value={`₦${commaInt(cart.items_total)}`} />
              <SummaryRow muted label="Delivery" value="Worked out at checkout" />
            </Stack>
            <Text fontSize="sm" color="gray.600" mt={3}>Each seller charges their own delivery fee. You'll see it once you choose where to deliver.</Text>
            {blocked ? (
              <Button mt={4} w="100%" size="lg" isDisabled>Checkout</Button>
            ) : (
              <Button as={RLink} to="/parts/checkout" mt={4} w="100%" size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }}>Checkout</Button>
            )}
            {blocked && <Text fontSize="sm" color="red.600" mt={2}>Fix the items marked in red to continue.</Text>}
          </Box>
        </Flex>
      )}

      <ActionDialog
        isOpen={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        isLoading={empty.loading}
        onConfirm={async () => { await empty.mutate(); setConfirmEmpty(false); }}
        config={{ title: 'Empty your parts cart?', body: 'Every part will be removed from your cart.', confirmLabel: 'Empty cart', cancelLabel: 'Keep them', tone: 'danger' }}
      />
    </Container>
  );
}
