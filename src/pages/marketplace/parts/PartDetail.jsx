// /parts/:partId — one spare part: photos, price, what it fits, the seller, delivery and the return policy.
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useLocation, useParams } from 'react-router-dom';
import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Alert, AlertDescription, AlertIcon, Avatar,
  Badge, Box, Button, Container, Divider, Flex, Heading, HStack, Icon, ListItem, SimpleGrid, Skeleton, Stack, Text,
  UnorderedList, useDisclosure,
} from '@chakra-ui/react';
import { MessageCircle, ShieldCheck, ShoppingCart } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ImageCarousel } from '../../../components';
import { ChatPopup } from '../../../components/chat';
import { BackButton } from '../../../components/nav';
import { PartCard, QuantityInput, ReturnPolicy, StoreDelivery, VerifiedSeller, announcePartsCart } from '../../../components/parts';
import { ErrorState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList, profilePicture } from '../../../utils';
import { storePlace } from '../../../utils/parts';

function DetailSkeleton() {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} role="status" aria-label="Loading this part">
      <Skeleton h={{ base: '260px', md: '400px' }} borderRadius="10px" />
      <Stack spacing={4}>
        <Skeleton h="28px" w="80%" />
        <Skeleton h="32px" w="40%" />
        <Skeleton h="16px" w="60%" />
        <Skeleton h="120px" />
      </Stack>
    </SimpleGrid>
  );
}

function Fact({ label, children }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">{label}</Text>
      <Text fontWeight="600">{children}</Text>
    </Box>
  );
}

export default function PartDetail() {
  const { partId } = useParams();
  const { commaInt, authUser } = useContext(GlobalStore);
  const location = useLocation();
  const chat = useDisclosure();
  const [quantity, setQuantity] = useState(1);
  const [inCart, setInCart] = useState(0);
  const isCustomer = authUser?.user_type === 'customer';
  const loginPath = `/login?next=${encodeURIComponent(location.pathname)}`;

  const query = useApiQuery(
    (api, signal) => api.get(`/parts/${partId}/`, { signal }),
    [partId],
    { select: (body) => body?.data, keepAs: `part:${partId}` }
  );
  const part = query.data?.part;
  const store = part?.store;

  useEffect(() => { setQuantity(1); }, [partId]);
  useEffect(() => { setInCart(Number(query.data?.in_cart) || 0); }, [query.data]);
  useEffect(() => { document.title = part?.name ? `${part.name} | Motaa spare parts` : 'Spare parts | Motaa'; }, [part?.name]);

  const add = useApiMutation(
    (api) => api.post('/parts/cart/', { part: partId, quantity, add: true }),
    {
      errorTitle: "Couldn't add this to your cart",
      onSuccess: (body) => {
        const quote = body?.data;
        announcePartsCart(quote?.count);
        const line = asList(quote?.groups).flatMap((group) => asList(group.items)).find((item) => item?.part?.uuid === partId);
        setInCart(line?.quantity || quantity);
        setQuantity(1);
      },
    }
  );

  if (query.loading && !query.data) {
    return <Container maxW="container.xl" py={6}><DetailSkeleton /></Container>;
  }
  if (query.error && !query.data) {
    return (
      <Container maxW="container.md" py={10}>
        <ErrorState error={query.error} onRetry={query.reload} title={query.error.isNotFound ? 'This part is no longer available' : undefined} />
        <Flex justify="center"><Button as={RLink} to="/parts" variant="link" color="primary">Browse spare parts</Button></Flex>
      </Container>
    );
  }
  if (!part) return null;

  const left = Number(part.stock) || 0;
  const canAddMore = part.in_stock && inCart < left;
  const fitments = asList(part.fitments);
  const related = asList(query.data?.related);
  const place = storePlace(store);

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
      <BackButton to="/parts" />

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 10 }} alignItems="start">
        <Box minW={0}>
          <ImageCarousel images={asList(part.images)} alt={part.name} />
        </Box>

        <Stack spacing={5} minW={0}>
          <Box>
            <HStack spacing={2} flexWrap="wrap" mb={2}>
              {part.condition_label && <Badge textTransform="none" borderRadius="full" px={2} colorScheme="blue">{part.condition_label}</Badge>}
              {part.category?.name && (
                <Text as={RLink} to={`/parts?category=${part.category.slug}`} fontSize="sm" color="primary">{part.category.name}</Text>
              )}
            </HStack>
            <Heading as="h1" size="lg">{part.name}</Heading>
            <Text fontSize="3xl" fontWeight="700" color="secondary" mt={2}>₦{commaInt(part.price)}</Text>
            <Text mt={1} fontWeight="600" color={part.in_stock ? 'green.600' : 'red.600'} role="status">
              {part.in_stock ? `${commaInt(left)} in stock` : 'Out of stock'}
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={4}>
            <Fact label="Condition">{part.condition_label}</Fact>
            <Fact label="Brand">{part.brand}</Fact>
            <Fact label="Part number">{part.part_number}</Fact>
            <Fact label="Warranty">{part.warranty}</Fact>
          </SimpleGrid>

          {/* Add to cart */}
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4}>
            {!authUser ? (
              <Stack spacing={3}>
                <Button as={RLink} to={loginPath} size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<ShoppingCart size={18} />}>
                  Log in to buy
                </Button>
                <Text fontSize="sm" color="gray.600">New to Motaa? <Text as={RLink} to="/signup" color="primary" fontWeight="600">Create an account</Text></Text>
              </Stack>
            ) : !isCustomer ? (
              <Text fontSize="sm" color="gray.600">Only customer accounts can buy parts. Log in with a personal account to order.</Text>
            ) : (
              <Stack spacing={3}>
                {inCart > 0 && (
                  <Alert status="success" borderRadius="md" py={2}>
                    <AlertIcon />
                    <AlertDescription flex={1} fontSize="sm">{inCart} in your cart.</AlertDescription>
                    <Button as={RLink} to="/parts/cart" size="sm" variant="link" color="primary">View cart</Button>
                  </Alert>
                )}
                {canAddMore ? (
                  <Flex gap={3} align="center" flexWrap="wrap">
                    <QuantityInput value={quantity} max={left - inCart} onChange={setQuantity} isDisabled={add.loading} size="md" />
                    <Button flex={1} minW="180px" size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<ShoppingCart size={18} />}
                      onClick={() => add.mutate()} isLoading={add.loading} loadingText="Adding">
                      Add to cart
                    </Button>
                  </Flex>
                ) : (
                  <Button size="lg" isDisabled>{part.in_stock ? 'All available stock is in your cart' : 'Out of stock'}</Button>
                )}
                <HStack spacing={2} color="gray.600" fontSize="sm" align="start">
                  <Icon as={ShieldCheck} boxSize={4} mt={0.5} aria-hidden="true" />
                  <Text>Motaa holds your payment until you confirm the order arrived.</Text>
                </HStack>
              </Stack>
            )}
          </Box>

          {/* Seller */}
          {store && (
            <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4}>
              <Flex gap={3} align="center">
                <Avatar size="md" src={profilePicture(store)} name={store.name} />
                <Box flex={1} minW={0}>
                  <HStack spacing={2} flexWrap="wrap">
                    <Text as={RLink} to={`/parts/stores/${store.uuid}`} fontWeight="600" _hover={{ color: 'primary' }}>{store.name}</Text>
                    {store.verified && <VerifiedSeller />}
                  </HStack>
                  <Text fontSize="sm" color="gray.600">{[store.kind_label, place].filter(Boolean).join(' · ')}</Text>
                </Box>
              </Flex>
              <Flex gap={3} mt={4} flexWrap="wrap">
                <Button as={RLink} to={`/parts/stores/${store.uuid}`} variant="outline" borderColor="primary" color="primary" flex={1} minW="140px">Visit shop</Button>
                {authUser ? (
                  isCustomer && <Button onClick={chat.onOpen} leftIcon={<MessageCircle size={16} />} variant="outline" flex={1} minW="140px">Message seller</Button>
                ) : (
                  <Button as={RLink} to={loginPath} leftIcon={<MessageCircle size={16} />} variant="outline" flex={1} minW="140px">Message seller</Button>
                )}
              </Flex>
              <Divider my={4} />
              <Heading as="h2" size="sm" mb={2}>Delivery</Heading>
              <StoreDelivery store={store} />
            </Box>
          )}
        </Stack>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 10 }} mt={8} alignItems="start">
        <Box minW={0}>
          <Heading as="h2" size="md" mb={3}>Description</Heading>
          {part.description
            ? <Text whiteSpace="pre-wrap" color="gray.700">{part.description}</Text>
            : <Text color="gray.600">The seller has not added a description.</Text>}
        </Box>
        <Box minW={0}>
          <Heading as="h2" size="md" mb={3}>Cars this part fits</Heading>
          {part.universal ? (
            <Text color="gray.700">This part fits any car.</Text>
          ) : fitments.length ? (
            <UnorderedList spacing={1} color="gray.700">
              {fitments.map((fitment, index) => <ListItem key={`${fitment.label}-${index}`}>{fitment.label}</ListItem>)}
            </UnorderedList>
          ) : (
            <Text color="gray.600">Ask the seller whether this fits your car.</Text>
          )}
          {!part.universal && <Text fontSize="sm" color="gray.600" mt={2}>Not sure it fits? Message the seller with your car's make, model and year before you buy.</Text>}
        </Box>
      </SimpleGrid>

      <Accordion allowToggle mt={8} borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
        <AccordionItem border="none">
          <Heading as="h2">
            <AccordionButton py={4}>
              <Box flex={1} textAlign="left">
                <Text fontWeight="600">Return policy</Text>
                {query.data?.return_days ? <Text fontSize="sm" color="gray.600">Returns within {query.data.return_days} days of delivery</Text> : null}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </Heading>
          <AccordionPanel pb={5}><ReturnPolicy text={query.data?.return_policy} /></AccordionPanel>
        </AccordionItem>
      </Accordion>

      {related.length > 0 && (
        <Box mt={10}>
          <Heading as="h2" size="md" mb={4}>Related parts</Heading>
          <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} spacing={{ base: 3, md: 5 }}>
            {related.map((item) => <PartCard key={item.uuid} part={item} />)}
          </SimpleGrid>
        </Box>
      )}

      {store && (
        <ChatPopup
          isOpen={chat.isOpen}
          onClose={chat.onClose}
          recipient={store.chat_recipient}
          recipient_name={store.name}
          placeholder={`Hi, I'm interested in "${part.name}". Does it fit my car?`}
        />
      )}
    </Container>
  );
}
