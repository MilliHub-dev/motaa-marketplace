// The seller's parts shop, shared by every /parts-store page.
//
// Parts dealers get it from their dashboard layout. Car dealers and mechanics reach the same
// pages from "Parts shop" in their own dashboard: PartsShopGate loads the shop for them and,
// until they have opened one (store: null), shows the "Open your parts shop" screen instead.
import { createContext, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Heading, HStack, Icon, ListItem, Stack, Text, UnorderedList } from '@chakra-ui/react';
import { Package } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ErrorState, LoadingState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';

/** { shop, reload, setShop }: `shop` is the body of GET /parts/seller/store/. */
export const PartsShopContext = createContext(null);

export function usePartsShop() {
  return useContext(PartsShopContext) || { shop: undefined, reload: () => {}, setShop: () => {} };
}

/** Loads GET /parts/seller/store/ → { shop, reload, setShop, query }. */
export function usePartsShopQuery() {
  const query = useApiQuery((api, signal) => api.get('/parts/seller/store/', { signal }), [], { select: (body) => body?.data });
  return { shop: query.data, reload: query.reload, setShop: query.setData, query };
}

/** "10.00" → "10", "7.50" → "7.5" */
export function percent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : String(value ?? '');
}

const TABS = [
  { label: 'Overview', to: '/parts-store', end: true },
  { label: 'Parts', to: '/parts-store/parts' },
  { label: 'Orders', to: '/parts-store/orders' },
  { label: 'Shop settings', to: '/parts-store/settings' },
];

/** Section links for car dealers and mechanics (parts dealers have these in their sidebar). */
function ShopTabs() {
  return (
    <HStack as="nav" aria-label="Parts shop" spacing={2} py={3} overflowX="auto" className="hidden-scroll" borderBottomWidth="1px" mb={2}>
      {TABS.map((tab) => (
        <Button key={tab.to} as={NavLink} to={tab.to} end={tab.end} size="sm" variant="ghost" flexShrink={0}
          _activeLink={{ bg: 'primary', color: 'white' }}>
          {tab.label}
        </Button>
      ))}
    </HStack>
  );
}

function OpenShop({ shop, onOpened }) {
  const navigate = useNavigate();
  const open = useApiMutation(
    (api) => api.put('/parts/seller/store/', {}),
    {
      errorTitle: "Couldn't open your parts shop",
      successMessage: 'Your parts shop is open. Set how you deliver, then add your first part.',
      onSuccess: (body) => { onOpened(body?.data); navigate('/parts-store/settings'); },
    }
  );
  return (
    <Flex justify="center" py={{ base: 8, md: 14 }}>
      <Box maxW="560px" w="100%" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" p={{ base: 5, md: 8 }} textAlign="center">
        <Flex w={16} h={16} rounded="full" bg="blue.50" color="primary" align="center" justify="center" mx="auto" mb={4}>
          <Icon as={Package} boxSize={8} aria-hidden="true" />
        </Flex>
        <Heading as="h1" size="lg">Open your parts shop</Heading>
        <Text color="gray.600" mt={3}>
          Sell car spare parts on Motaa alongside your business. Customers across Nigeria can find your parts, pay online and have them delivered or pick them up.
        </Text>
        <UnorderedList textAlign="left" spacing={2} mt={5} color="gray.700" fontSize="sm">
          <ListItem>You set your own prices, stock and delivery fees.</ListItem>
          <ListItem>Motaa holds each payment and pays you when the customer confirms delivery, or automatically {shop?.release_days ?? 7} days after you mark it delivered.</ListItem>
          <ListItem>Motaa keeps {percent(shop?.commission_percent ?? 10)}% of the price of the parts you sell. There is no charge on your delivery fee.</ListItem>
        </UnorderedList>
        {shop && !shop.verified && (
          <Text fontSize="sm" color="orange.700" mt={4}>Customers will see your parts once your business is verified.</Text>
        )}
        <Button mt={6} size="lg" bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={() => open.mutate()} isLoading={open.loading} loadingText="Opening your shop">
          Open my parts shop
        </Button>
      </Box>
    </Flex>
  );
}

function LoadedShop() {
  const value = usePartsShopQuery();
  const { shop, query } = value;
  if (query.loading && shop === undefined) return <LoadingState label="Loading your parts shop…" minH="50vh" />;
  if (query.error && shop === undefined) return <ErrorState error={query.error} onRetry={query.reload} title="We couldn't load your parts shop" minH="50vh" />;
  return (
    <PartsShopContext.Provider value={value}>
      {shop?.store ? (
        <Stack spacing={0}>
          <ShopTabs />
          <Outlet />
        </Stack>
      ) : (
        <OpenShop shop={shop} onOpened={(next) => (next ? value.setShop(next) : value.reload())} />
      )}
    </PartsShopContext.Provider>
  );
}

/** Route element for /parts-store/*. */
export function PartsShopGate() {
  const { authUser } = useContext(GlobalStore);
  const provided = useContext(PartsShopContext);
  // the parts dealer dashboard has already loaded the shop (a parts dealer always has one)
  if (provided && authUser?.user_type === 'parts_dealer') return <Outlet />;
  return <LoadedShop />;
}

export default PartsShopGate;
