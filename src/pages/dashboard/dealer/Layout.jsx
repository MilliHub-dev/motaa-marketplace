import { Suspense, useState, useContext, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Flex, Stack, useMediaQuery } from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import { DealerDashboardSideBar, DealerNavbar } from '../../../components/nav';
import { VerificationNotice } from '../../../components';
import { useApiQuery } from '../../../hooks/useApi';
import { useVerificationUpdates } from '../../../hooks/useVerificationUpdates';
import { LoadingState, ErrorState } from '../../../components/states';

export const DealershipContext = createContext({
  dealership: null,
  reloadDealership: () => {},
});

function DealerDashboardLayout({ hideSidebar }) {
  const { notify, authUser } = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(false);
  const [isMobile] = useMediaQuery('(max-width: 991px)');

  const dealershipQuery = useApiQuery(
    (client, signal) => client.get('/admin/dealership/', { signal }),
    [],
    { select: (body) => body?.data || null }
  );
  const dealership = dealershipQuery.data;

  useVerificationUpdates({ onUpdate: dealershipQuery.reload, pending: dealership?.verification_status_code === 'pending' });

  async function onVerification(type, data) {
    if (type === 'success') {
      notify({ title: 'Verification submitted', body: 'Your details were submitted. Your dashboard will update when the result is confirmed.' });
      dealershipQuery.reload();
    } else if (type === 'error') {
      notify({
        title: "Verification didn't complete",
        body: data?.message || 'Please try again, or contact Motaa support if it keeps failing.',
        color: 'red',
        duration: 5000,
      });
    }
  }

  const context = {
    dealership,
    reloadDealership: dealershipQuery.reload,
    onVerification,
  };

  let content;
  if (dealershipQuery.loading && dealership === undefined) {
    content = <LoadingState label="Loading your dashboard…" minH="60vh" />;
  } else if (dealershipQuery.error && !dealership) {
    content = <ErrorState error={dealershipQuery.error} onRetry={dealershipQuery.reload} title="We couldn't load your dealership" minH="60vh" />;
  } else {
    content = (
      <>
        {!hideSidebar && dealership?.uuid && !dealership.verified_business && (
          <VerificationNotice user={authUser} onVerification={onVerification} businessType="dealership" verificationStatus={dealership?.verification_status_code} />
        )}
        <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>
      </>
    );
  }

  return (
    <DealershipContext.Provider value={context}>
      <Stack>
        <DealerNavbar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} hideSidebar={hideSidebar} />

        <Flex minH="100vh" position="relative">
          <DealerDashboardSideBar
            dealership={dealership || {}}
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
    </DealershipContext.Provider>
  );
}

export default DealerDashboardLayout;
