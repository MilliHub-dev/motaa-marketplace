import { Suspense, useContext, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import { BusinessShell } from '../../../components/dashboard/DealerShell';
import { VerificationNotice } from '../../../components';
import InstallAppNotice from '../../../components/InstallAppNotice';
import { useApiQuery } from '../../../hooks/useApi';
import { useVerificationUpdates } from '../../../hooks/useVerificationUpdates';
import { LoadingState, ErrorState } from '../../../components/states';

export const MechanicContext = createContext({
  mechanic: null,
  reload: () => {},
});

function MechanicDashboardLayout({ hideSidebar }) {
  const { notify, notifyError, authUser } = useContext(GlobalStore);
  const profile = useApiQuery((client, signal) => client.get('/admin/mechanics/', { signal }), [], {
    select: (body) => body?.data,
  });
  const mechanic = profile.data;

  useVerificationUpdates({ onUpdate: profile.reload, pending: mechanic?.verification_status === 'pending' });

  async function onVerification(type, data) {
    if (type === 'success') {
      notify({ title: 'Verification submitted', body: 'Your details were submitted. Your dashboard will update when the result is confirmed.' });
      profile.reload();
    } else if (type === 'documents') {
      profile.reload(); // an upload makes the verification "pending"
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
        <InstallAppNotice />
        {mechanic && !mechanic.verified_business && (
          <VerificationNotice user={authUser} onVerification={onVerification} businessType="mechanic" verificationStatus={mechanic?.verification_status} />
        )}
        <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>
      </>
    );
  }

  return (
    <MechanicContext.Provider value={{ mechanic, reload: profile.reload }}>
      <BusinessShell kind="mechanic" counts={mechanic}
        business={{ name: mechanic?.business_name, logo: mechanic?.logo, publicUrl: mechanic?.uuid ? `/mechanics/${mechanic.uuid}` : null }}>
        <Box maxW="1480px" mx="auto">{content}</Box>
      </BusinessShell>
    </MechanicContext.Provider>
  );
}

export default MechanicDashboardLayout;
