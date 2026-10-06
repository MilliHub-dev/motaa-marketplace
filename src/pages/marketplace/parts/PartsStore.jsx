// /parts/stores/:storeId — a seller's parts shop and everything it has on sale.
import { useContext, useEffect } from 'react';
import { Link as RLink, useLocation, useParams } from 'react-router-dom';
import { Avatar, Box, Button, Container, Flex, Heading, HStack, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { MessageCircle, Package } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ChatPopup } from '../../../components/chat';
import { BackButton } from '../../../components/nav';
import { StoreDelivery, VerifiedSeller } from '../../../components/parts';
import { EmptyState, ErrorState } from '../../../components/states';
import { useApiQuery } from '../../../hooks/useApi';
import { profilePicture } from '../../../utils';
import { partsApiQuery, storePlace } from '../../../utils/parts';
import { PartsResults, PartsSearch, SortSelect, usePartsParams } from './PartsListing';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Most bought' },
];

export default function PartsStore() {
  const { storeId } = useParams();
  const { authUser } = useContext(GlobalStore);
  const location = useLocation();
  const chat = useDisclosure();
  const { params, update, gotoOffset } = usePartsParams();
  const isCustomer = authUser?.user_type === 'customer';

  const storeQuery = useApiQuery(
    (api, signal) => api.get(`/parts/stores/${storeId}/`, { signal }),
    [storeId],
    { select: (body) => body?.data }
  );
  const store = storeQuery.data?.store;

  // only the search box and sorting apply inside a shop
  const shopParams = new URLSearchParams();
  for (const key of ['q', 'sort', 'page']) if (params.get(key)) shopParams.set(key, params.get(key));
  const qs = partsApiQuery(shopParams, { store: storeId });
  const parts = useApiQuery(
    (api, signal) => api.get(`/parts/?${qs}`, { signal }),
    [qs],
    { enabled: Boolean(store), select: (body) => body?.data }
  );

  useEffect(() => { document.title = store?.name ? `${store.name} | Motaa spare parts` : 'Spare parts | Motaa'; }, [store?.name]);

  if (storeQuery.loading && !storeQuery.data) {
    return (
      <Container maxW="container.xl" py={6} role="status" aria-label="Loading this shop">
        <Skeleton h="140px" borderRadius="xl" mb={6} />
        <Skeleton h="300px" borderRadius="xl" />
      </Container>
    );
  }
  if (storeQuery.error && !storeQuery.data) {
    return (
      <Container maxW="container.md" py={10}>
        <ErrorState error={storeQuery.error} onRetry={storeQuery.reload} title={storeQuery.error.isNotFound ? 'This shop is not available' : undefined} />
        <Flex justify="center"><Button as={RLink} to="/parts" variant="link" color="primary">Browse spare parts</Button></Flex>
      </Container>
    );
  }
  if (!store) return null;

  const place = storePlace(store);
  const searching = Boolean(params.get('q'));

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
      <BackButton to="/parts" />

      <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 6 }} mb={6}>
        <Flex gap={4} align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
          <Flex gap={4} align="center" flex={1} minW={0}>
            <Avatar size="lg" src={profilePicture(store)} name={store.name} />
            <Box minW={0}>
              <HStack spacing={2} flexWrap="wrap">
                <Heading as="h1" size="md">{store.name}</Heading>
                {store.verified && <VerifiedSeller />}
              </HStack>
              <Text fontSize="sm" color="gray.600">{[store.kind_label, place].filter(Boolean).join(' · ')}</Text>
              {store.headline && <Text mt={1} color="gray.700">{store.headline}</Text>}
            </Box>
          </Flex>
          {authUser ? (
            isCustomer && <Button onClick={chat.onOpen} leftIcon={<MessageCircle size={16} />} variant="outline" borderColor="primary" color="primary" w={{ base: '100%', md: 'auto' }}>Message seller</Button>
          ) : (
            <Button as={RLink} to={`/login?next=${encodeURIComponent(location.pathname)}`} leftIcon={<MessageCircle size={16} />} variant="outline" borderColor="primary" color="primary" w={{ base: '100%', md: 'auto' }}>Message seller</Button>
          )}
        </Flex>
        {store.about && <Text mt={4} color="gray.700" whiteSpace="pre-wrap">{store.about}</Text>}
        <StoreDelivery store={store} mt={4} />
      </Box>

      <Stack direction={{ base: 'column', md: 'row' }} spacing={3} align={{ md: 'center' }} mb={4}>
        <PartsSearch value={params.get('q')} onSearch={(q) => update({ q })} placeholder={`Search ${store.name}`} />
        <SortSelect value={params.get('sort')} sorts={SORTS} onChange={(sort) => update({ sort })} id="shop-sort" />
      </Stack>

      <PartsResults
        query={parts}
        onPage={(offset) => gotoOffset(offset)}
        countLabel={searching ? 'found in this shop' : 'in this shop'}
        empty={
          <EmptyState
            icon={Package}
            title={searching ? 'No parts match your search' : 'Nothing on sale right now'}
            description={searching ? 'Try another name or part number.' : 'This shop has no parts listed at the moment.'}
            action={searching ? { label: 'Show all parts', onClick: () => update({ q: null }) } : { label: 'Browse all parts', to: '/parts' }}
          />
        }
      />

      <ChatPopup isOpen={chat.isOpen} onClose={chat.onClose} recipient={store.chat_recipient} recipient_name={store.name} placeholder="Hi, do you have this part in stock?" />
    </Container>
  );
}
