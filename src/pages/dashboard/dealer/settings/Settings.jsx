import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { DashCard, PageHeader } from '../../../../components/dashboard/ui';
import BusinessProfile from './BusinessProfile';

const DealershipSettings = () => {
  const { hash } = useLocation();
  // the Overview's "Set a monthly goal" link opens #goals
  useEffect(() => {
    if (!hash) return undefined;
    const timer = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    return () => clearTimeout(timer);
  }, [hash]);
  return (
    <Box w="100%">
      <PageHeader title="Settings" subtitle="How customers see your business on Motaa, and your monthly goals." />
      <DashCard><BusinessProfile /></DashCard>
    </Box>
  );
};

export default DealershipSettings;
