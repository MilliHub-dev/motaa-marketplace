import { useParams } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { useApiQuery } from '../../../../hooks/useApi';
import { AsyncState } from '../../../../components/states';
import { BackButton } from '../../../../components/nav';
import { ListingWizard } from './CreateListing';

export default function EditListing() {
  const { listingId } = useParams();
  const listing = useApiQuery(
    (api, signal) => api.get(`/admin/dealership/listings/${listingId}/`, { signal }),
    [listingId],
    { select: (body) => body?.data }
  );

  if (listing.data) return <ListingWizard key={listing.data.uuid} listing={listing.data} />;

  return (
    <Box pt={4}>
      <BackButton to="/inventory" />
      <AsyncState query={listing} loadingLabel="Loading listing…" errorTitle={listing.error?.isNotFound ? 'Listing not found' : undefined}>
        {() => null}
      </AsyncState>
    </Box>
  );
}
