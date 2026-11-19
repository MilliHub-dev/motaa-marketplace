import { Suspense, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { GlobalStore } from '../../../App';
import { BusinessShell } from '../../../components/dashboard/DealerShell';
import { VerificationNotice } from '../../../components';
import InstallAppNotice from '../../../components/InstallAppNotice';
import { useVerificationUpdates } from '../../../hooks/useVerificationUpdates';
import { LoadingState, ErrorState } from '../../../components/states';
import { PartsShopContext, usePartsShopQuery } from './shop';

/** Dashboard shell for parts dealers (user_type `parts_dealer`), modelled on the dealer one. */
function PartsDealerDashboardLayout({ hideSidebar }) {
  const { notify, notifyError, authUser } = useContext(GlobalStore);
  const value = usePartsShopQuery();
  const { shop, query } = value;
  const store = shop?.store;

  useVerificationUpdates({ onUpdate: query.reload, pending: shop?.verification_status === 'pending' });

  async function onVerification(type, data) {
    if (type === 'success') {
      notify({ title: 'Verification submitted', body: 'Your details were submitted. Your dashboard will update when the result is confirmed.' });
      query.reload();
    } else if (type === 'documents') {
      query.reload(); // an upload makes the verification "pending"
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
        <InstallAppNotice />
        {shop && !shop.verified && (
          <VerificationNotice user={authUser} onVerification={onVerification} businessType="parts_dealer" verificationStatus={shop.verification_status} />
        )}
        <Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense>
      </>
    );
  }

  return (
    <PartsShopContext.Provider value={value}>
      <BusinessShell kind="parts" counts={shop?.stats}
        business={{ name: store?.name || shop?.business?.business_name, logo: store?.logo || shop?.business?.logo, publicUrl: store?.uuid ? `/parts/stores/${store.uuid}` : null }}>
        <Box maxW="1480px" mx="auto">{content}</Box>
      </BusinessShell>
    </PartsShopContext.Provider>
  );
}

export default PartsDealerDashboardLayout;
