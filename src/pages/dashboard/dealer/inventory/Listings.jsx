import { useContext, useRef, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Text,
  Heading,
  Button,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  SimpleGrid,
  IconButton,
  Image,
  Tooltip,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Badge,
} from '@chakra-ui/react';
import { Pencil, Trash2, Plus, Car, ImageOff, Eye, EyeOff, Info } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { asList } from '../../../../utils';
import { useApiQuery, useApiMutation } from '../../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../../components/states';
import { optionLabel } from '../../../../components/forms';
import { DealershipContext } from '../Layout';

/** One source of truth for a listing's lifecycle label. */
export function listingStatus(listing) {
  if (listing?.vehicle && listing.vehicle.available === false) {
    const rented = listing.listing_type === 'rental';
    return { key: 'sold', label: rented ? 'Rented out' : 'Sold', color: 'gray', hint: rented ? 'Currently rented by a customer.' : 'This car has been sold.' };
  }
  if (!listing?.verified) {
    return { key: 'draft', label: 'Draft', color: 'purple', hint: "Not published yet — only you can see it. Edit it and publish when it's ready." };
  }
  if (!listing?.approved) {
    return { key: 'review', label: 'Pending review', color: 'yellow', hint: 'Published and waiting for Motaa to check it (usually 2–24 hours). Customers will see it once approved.' };
  }
  return { key: 'live', label: 'Live', color: 'green', hint: 'Visible to customers on Motaa.' };
}

const FILTERS = [
  { key: 'all', label: 'All listings' },
  { key: 'live', label: 'Live' },
  { key: 'review', label: 'Pending review' },
  { key: 'draft', label: 'Drafts' },
  { key: 'sold', label: 'Sold / rented' },
];

function ListingsAdmin() {
  const { dealership } = useContext(DealershipContext);
  const verified = Boolean(dealership?.verified_business);
  const [filter, setFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);

  const listings = useApiQuery(
    (api, signal) => api.get('/admin/dealership/listings/', { signal }),
    [],
    { select: (body) => asList(body?.data) }
  );

  const counts = { all: 0, live: 0, review: 0, draft: 0, sold: 0 };
  for (const listing of listings.data || []) {
    counts.all += 1;
    counts[listingStatus(listing).key] += 1;
  }

  return (
    <Box minH="70vh" pt={5}>
      <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={3} mb={5} direction={{ base: 'column', sm: 'row' }}>
        <Box>
          <Heading as="h1" size="md">Inventory</Heading>
          <Text color="gray.600" fontSize="sm">Manage the cars you sell and rent on Motaa.</Text>
        </Box>
        <Box textAlign={{ base: 'left', sm: 'right' }}>
          {verified ? (
            <Button as={RLink} to="/inventory/add" leftIcon={<Plus size={18} />} bg="primary" color="white" _hover={{ bg: 'secondary' }}>
              Add a listing
            </Button>
          ) : (
            <>
              <Button leftIcon={<Plus size={18} />} isDisabled bg="primary" color="white" w={{ base: 'full', sm: 'auto' }} aria-describedby="add-listing-hint">
                Add a listing
              </Button>
              <Text id="add-listing-hint" fontSize="xs" color="gray.600" mt={1} maxW="260px" ml={{ sm: 'auto' }}>
                Complete your business verification to add listings.
              </Text>
            </>
          )}
        </Box>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3} mb={6} role="group" aria-label="Filter listings by status">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Button
              key={key}
              onClick={() => setFilter(key)}
              aria-pressed={active}
              h="auto"
              py={3}
              px={4}
              flexDirection="column"
              alignItems="flex-start"
              variant="outline"
              borderWidth="2px"
              borderColor={active ? 'primary' : 'gray.200'}
              bg={active ? 'blue.50' : 'white'}
              borderRadius="10px"
              whiteSpace="normal"
              gridColumn={key === 'all' ? { base: 'span 2', md: 'auto' } : undefined}
            >
              <Text color="gray.600" fontWeight="normal" fontSize="sm">{label}</Text>
              <Text fontSize="2xl" fontWeight="bold">{listings.data ? counts[key] : '–'}</Text>
            </Button>
          );
        })}
      </SimpleGrid>

      <AsyncState
        query={listings}
        loadingLabel="Loading your listings…"
        isEmpty={(items) => items.length === 0}
        empty={
          <EmptyState
            icon={Car}
            title="No listings yet"
            description={verified ? 'Add your first car to start selling or renting on Motaa.' : 'Once your business is verified you can add your first car.'}
            action={verified ? { label: 'Add a listing', to: '/inventory/add' } : undefined}
          />
        }
      >
        {(items) => {
          const visible = filter === 'all' ? items : items.filter((l) => listingStatus(l).key === filter);
          return visible.length ? (
            <ListingTable listings={visible} verified={verified} onDelete={setPendingDelete} onChanged={listings.reload} />
          ) : (
            <EmptyState icon={Car} title="Nothing here" description="No listings match this filter." action={{ label: 'Show all listings', onClick: () => setFilter('all') }} />
          );
        }}
      </AsyncState>

      <DeleteListingDialog
        listing={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDone={() => { setPendingDelete(null); listings.reload(); }}
      />
    </Box>
  );
}

function ListingTable({ listings, verified, onDelete, onChanged }) {
  const { commaInt } = useContext(GlobalStore);
  const [busyId, setBusyId] = useState(null);
  const toggle = useApiMutation(
    (api, listing, action) => api.post('/admin/dealership/listings/', { action, listing: listing.uuid }),
    {
      successMessage: (body) => body?.message || 'Listing updated',
      errorTitle: "Couldn't update the listing",
      onSuccess: () => onChanged(),
    }
  );

  async function run(listing, action) {
    setBusyId(listing.uuid);
    await toggle.mutate(listing, action);
    setBusyId(null);
  }

  return (
    <TableContainer borderWidth={1} borderColor="gray.200" borderRadius="lg" bg="white">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th py={3}>Car</Th>
            <Th>Status</Th>
            <Th isNumeric>Views</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {listings.map((listing) => {
            const status = listingStatus(listing);
            const cover = listing?.vehicle?.images?.[0]?.url;
            const isRental = listing?.listing_type === 'rental';
            const canToggle = status.key === 'draft' || status.key === 'review' || status.key === 'live';
            return (
              <Tr key={listing?.uuid || listing?.id}>
                <Td py={3}>
                  <Flex align="center" gap={3} minW="220px">
                    {cover ? (
                      <Image src={cover} alt="" objectFit="cover" boxSize="60px" borderRadius="md" flexShrink={0} />
                    ) : (
                      <Flex boxSize="60px" borderRadius="md" bg="gray.100" align="center" justify="center" color="gray.400" flexShrink={0}>
                        <ImageOff size={20} aria-hidden="true" />
                      </Flex>
                    )}
                    <Box minW={0}>
                      <Text fontWeight="600" noOfLines={1} maxW="260px" whiteSpace="normal">{listing?.title || listing?.vehicle?.name || 'Untitled listing'}</Text>
                      <Text fontSize="sm" color="gray.700">
                        ₦{commaInt(listing?.price)}
                        {isRental && <Text as="span" color="gray.500"> {optionLabel('payment_cycle', listing?.payment_cycle).toLowerCase()}</Text>}
                      </Text>
                      <Badge mt={1} colorScheme={isRental ? 'purple' : 'blue'} variant="subtle" fontSize="0.65rem">{isRental ? 'Rental' : 'Sale'}</Badge>
                    </Box>
                  </Flex>
                </Td>
                <Td>
                  <Tooltip label={status.hint} hasArrow placement="top">
                    <Tag size="md" colorScheme={status.color} tabIndex={0} cursor="help" gap={1}>
                      {status.label}
                      <Info size={12} aria-hidden="true" />
                    </Tag>
                  </Tooltip>
                </Td>
                <Td isNumeric>{Array.isArray(listing?.viewers) ? listing.viewers.length : 0}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Tooltip label="Edit listing" hasArrow>
                      <IconButton as={RLink} to={`/inventory/edit/${listing?.uuid}`} aria-label={`Edit ${listing?.title || 'listing'}`} icon={<Pencil size={16} />} size="sm" variant="outline" />
                    </Tooltip>
                    {canToggle && (
                      status.key === 'draft' ? (
                        <Tooltip
                          label={!verified ? 'Complete business verification to publish' : !listing?.vehicle?.images?.length ? 'Add a photo (Edit) before publishing' : 'Publish for review'}
                          hasArrow
                          shouldWrapChildren={!verified || !listing?.vehicle?.images?.length}
                        >
                          <IconButton
                            aria-label={`Publish ${listing?.title || 'listing'}`}
                            icon={<Eye size={16} />}
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            isDisabled={!verified || !listing?.vehicle?.images?.length}
                            isLoading={busyId === listing?.uuid}
                            onClick={() => run(listing, 'publish')}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip label="Unpublish (hide from customers)" hasArrow>
                          <IconButton
                            aria-label={`Unpublish ${listing?.title || 'listing'}`}
                            icon={<EyeOff size={16} />}
                            size="sm"
                            variant="outline"
                            isLoading={busyId === listing?.uuid}
                            onClick={() => run(listing, 'unpublish')}
                          />
                        </Tooltip>
                      )
                    )}
                    <Tooltip label="Delete listing" hasArrow>
                      <IconButton aria-label={`Delete ${listing?.title || 'listing'}`} icon={<Trash2 size={16} />} size="sm" variant="outline" colorScheme="red" onClick={() => onDelete(listing)} />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function DeleteListingDialog({ listing, onClose, onDone }) {
  const cancelRef = useRef();
  const remove = useApiMutation(
    (api, uuid) => api.delete(`/admin/dealership/listings/${uuid}/`),
    {
      successMessage: (body) => body?.message || 'Listing deleted',
      errorTitle: "Couldn't delete the listing",
      onSuccess: onDone,
    }
  );
  const title = listing?.title || 'this listing';

  return (
    <AlertDialog isOpen={Boolean(listing)} leastDestructiveRef={cancelRef} onClose={remove.loading ? () => {} : onClose} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent mx={4}>
          <AlertDialogHeader fontSize="lg">Delete {title}?</AlertDialogHeader>
          <AlertDialogBody>
            {listing?.has_orders
              ? 'This listing already has orders, so it will be unpublished (hidden from customers) instead of deleted. Your order history is kept.'
              : 'This permanently removes the listing and its photos. Customers will no longer see it. This cannot be undone.'}
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
            <Button ref={cancelRef} onClick={onClose} isDisabled={remove.loading}>Keep listing</Button>
            <Button colorScheme="red" onClick={() => remove.mutate(listing.uuid)} isLoading={remove.loading}>
              {listing?.has_orders ? 'Unpublish' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default ListingsAdmin;
