import { Suspense, useState, useContext, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Flex, Stack, useMediaQuery } from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import { DealerDashboardSideBar, DealerNavbar } from '../../../components/nav';
import { VerificationNotice } from '../../../components';
import { useApiQuery } from '../../../hooks/useApi';
import { LoadingState, ErrorState } from '../../../components/states';
import { toApiError } from '../../../api/client';

export const DealershipContext = createContext({
  dealership: null,
  reloadDealership: () => {},
});

// What a successful Dojah business verification covers.
const VERIFICATION_SCOPE = [
  'verified_id',
  'verified_tin',
  'verified_business',
  'user.verified_email',
  'verified_phone_number',
];

function DealerDashboardLayout({ hideSidebar }) {
  const { api, notify, notifyError, authUser } = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(false);
  const [isMobile] = useMediaQuery('(max-width: 991px)');

  const dealershipQuery = useApiQuery(
    (client, signal) => client.get('/admin/dealership/', { signal }),
    [],
    { select: (body) => body?.data || null }
  );
  const dealership = dealershipQuery.data;

  async function onVerification(type, data) {
    if (type === 'success') {
      try {
        const body = await api.post('/accounts/verify-business/', {
          verification_ref: data?.referenceId,
          scope: VERIFICATION_SCOPE,
          object: 'dealership',
          object_id: dealership?.uuid,
        });
        notify({ title: 'Verification complete', body: body?.message || 'Your business is now verified.' });
      } catch (error) {
        const apiError = toApiError(error);
        if (!apiError.isNetworkError && !(apiError.status >= 500)) {
          notifyError(apiError, "We couldn't confirm your verification");
        }
      } finally {
        dealershipQuery.reload();
      }
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
          <VerificationNotice user={authUser} onVerification={onVerification} businessType="dealership" />
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
