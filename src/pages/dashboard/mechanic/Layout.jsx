import { Suspense, useState, useContext, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Flex, Stack, useMediaQuery } from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import { MechanicDashboardSideBar, MechanicNavbar } from '../../../components/nav';
import { VerificationNotice } from '../../../components';
import { useApiQuery } from '../../../hooks/useApi';
import { LoadingState, ErrorState } from '../../../components/states';

export const MechanicContext = createContext({
  mechanic: null,
  reload: () => {},
});

function MechanicDashboardLayout({ hideSidebar }) {
  const { api, notify, notifyError, authUser } = useContext(GlobalStore);
  const [sidebarOpen, setSidebarState] = useState(false);
  const [isMobile] = useMediaQuery('(max-width: 991px)');
  const profile = useApiQuery((client, signal) => client.get('/admin/mechanics/', { signal }), [], {
    select: (body) => body?.data,
  });
  const mechanic = profile.data;

  async function onVerification(type, data) {
    if (type === 'success') {
      try {
        const body = await api.post('/accounts/verify-business/', {
          verification_ref: data?.referenceId,
          scope: ['verified_id', 'verified_tin', 'verified_business', 'user.verified_email', 'verified_phone_number'],
          object: 'mechanic',
          object_id: mechanic?.uuid,
        });
        notify({ title: 'Verification submitted', body: body?.message || 'Your business verification was received.' });
        profile.reload();
      } catch (error) {
        notifyError(error, "We couldn't verify your business");
      }
    } else if (type === 'error') {
      notifyError(new Error(data?.message || 'The verification could not be completed. Please try again.'), 'Verification failed');
    }
  }

  let content;
  if (hideSidebar) {
    // shared pages (wallet, chat…) don't depend on the mechanic profile
    content = <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>;
  } else if (profile.loading && mechanic === undefined) {
    content = <LoadingState label="Loading your dashboard…" minH="60vh" />;
  } else if (profile.error && mechanic === undefined) {
    content = <ErrorState error={profile.error} onRetry={profile.reload} minH="60vh" />;
  } else {
    content = (
      <>
        {mechanic && !mechanic.verified_business && (
          <VerificationNotice user={authUser} onVerification={onVerification} businessType="mechanic" />
        )}
        <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>
      </>
    );
  }

  return (
    <MechanicContext.Provider value={{ mechanic, reload: profile.reload }}>
      <Stack>
        <MechanicNavbar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} hideSidebar={hideSidebar} />

        <Flex minH="100vh" position="relative">
          <MechanicDashboardSideBar
            mechanic={mechanic}
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
    </MechanicContext.Provider>
  );
}

export default MechanicDashboardLayout;
