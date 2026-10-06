import { Suspense, useState, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Flex, Stack, useMediaQuery } from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import { PartsDealerDashboardSideBar, PartsDealerNavbar } from '../../../components/nav';
import { VerificationNotice } from '../../../components';
import { useVerificationUpdates } from '../../../hooks/useVerificationUpdates';
import { LoadingState, ErrorState } from '../../../components/states';
import { PartsShopContext, usePartsShopQuery } from './shop';

/** Dashboard shell for parts dealers (user_type `parts_dealer`), modelled on the dealer one. */
function PartsDealerDashboardLayout({ hideSidebar }) {
  const { notify, notifyError, authUser } = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(false);
  const [isMobile] = useMediaQuery('(max-width: 991px)');
  const value = usePartsShopQuery();
  const { shop, query } = value;
  const store = shop?.store;

  useVerificationUpdates({ onUpdate: query.reload, pending: shop?.verification_status === 'pending' });

  async function onVerification(type, data) {
    if (type === 'success') {
      notify({ title: 'Verification submitted', body: 'Your details were submitted. Your dashboard will update when the result is confirmed.' });
      query.reload();
    } else if (type === 'error') {
      notifyError(new Error(data?.message || 'The verification could not be completed. Please try again.'), 'Verification failed');
    }
  }

  let content;
  if (hideSidebar) {
    // shared pages (wallet, chat…) don't depend on the shop
    content = <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>;
  } else if (query.loading && shop === undefined) {
    content = <LoadingState label="Loading your dashboard…" minH="60vh" />;
  } else if (query.error && shop === undefined) {
    content = <ErrorState error={query.error} onRetry={query.reload} title="We couldn't load your parts shop" minH="60vh" />;
  } else {
    content = (
      <>
        {shop && !shop.verified && (
          <VerificationNotice user={authUser} onVerification={onVerification} businessType="parts_dealer" verificationStatus={shop.verification_status} />
        )}
        <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>
      </>
    );
  }

  return (
    <PartsShopContext.Provider value={value}>
      <Stack>
        <PartsDealerNavbar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} hideSidebar={hideSidebar} />

        <Flex minH="100vh" position="relative">
          <PartsDealerDashboardSideBar
            business={store ? { business_name: store.name, logo: store.logo } : null}
            sidebarOpen={sidebarOpen}
            onClose={() => setSidebarState(false)}
            setSidebarState={setSidebarState}
            mode={hideSidebar ? 'drawer' : 'block'}
          />

          <Box
            flex={{ md: 1 }}
            minW={0}
            w={isMobile || hideSidebar ? '100%' : 'calc(100% - 280px)'}
            ml={isMobile || hideSidebar ? '0px' : '280px'}
          >
            <Container pb={10} maxW="container.xl">
              {content}
            </Container>
          </Box>
        </Flex>
      </Stack>
    </PartsShopContext.Provider>
  );
}

export default PartsDealerDashboardLayout;
