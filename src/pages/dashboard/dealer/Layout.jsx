import { Suspense, useContext, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import DealerShell from '../../../components/dashboard/DealerShell';
import { VerificationNotice } from '../../../components';
import InstallAppNotice from '../../../components/InstallAppNotice';
import { useApiQuery } from '../../../hooks/useApi';
import { useVerificationUpdates } from '../../../hooks/useVerificationUpdates';
import { LoadingState, ErrorState } from '../../../components/states';

export const DealershipContext = createContext({
  dealership: null,
  reloadDealership: () => {},
});

function DealerDashboardLayout({ hideSidebar }) {
  const { notify, authUser } = useContext(GlobalStore);

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
    } else if (type === 'documents') {
      dealershipQuery.reload(); // an upload makes the verification "pending"
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
        {!hideSidebar && <InstallAppNotice />}
        {!hideSidebar && dealership?.uuid && !dealership.verified_business && (
          <VerificationNotice user={authUser} onVerification={onVerification} businessType="dealership" verificationStatus={dealership?.verification_status_code} />
        )}
        <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>
      </>
    );
  }

  // wallet and chat pages (hideSidebar) share the frame but skip the dashboard notices
  return (
    <DealershipContext.Provider value={context}>
      <DealerShell dealership={dealership}>
        <Box maxW="1480px" mx="auto">{content}</Box>
      </DealerShell>
    </DealershipContext.Provider>
  );
}

export default DealerDashboardLayout;
