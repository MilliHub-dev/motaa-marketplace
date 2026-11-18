import { useContext, useEffect, useRef, useState } from 'react';
import { Link as RLink, useSearchParams } from 'react-router-dom';
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
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
} from '@chakra-ui/react';
import { Pencil, Trash2, Plus, Car, ImageOff, Eye, EyeOff, Info, Search } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { asList } from '../../../../utils';
import { canDelete, isOwner } from '../../../../utils/team';
import { PageControls } from '../../../../components';
import { useApiQuery, useApiMutation } from '../../../../hooks/useApi';
import { AsyncState } from '../../../../components/states';
import { CardEmpty, DASH, DashCard, PageHeader, PillButton, StatusPill } from '../../../../components/dashboard/ui';
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
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'review', label: 'In review' },
  { key: 'draft', label: 'Drafts' },
  { key: 'sold', label: 'Sold / rented' },
];

const STATUS_TONES = { live: 'green', review: 'amber', draft: 'violet', sold: 'grey' };

function ListingsAdmin() {
  const { dealership } = useContext(DealershipContext);
  const verified = Boolean(dealership?.verified_business);
  const { authUser } = useContext(GlobalStore);
  const owner = isOwner(authUser);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [text, setText] = useState(q);
  const [filter, setFilter] = useState('all');
  const [offset, setOffset] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);
  useEffect(() => { setText(q); setOffset(0); }, [q]);

  const listings = useApiQuery(
    (api, signal) => api.get('/admin/dealership/listings/', { params: { paginated: 1, status: filter, offset, ...(q ? { q } : {}) }, signal }),
    [filter, offset, q],
    { select: (body) => ({ ...body?.data, requestedOffset: offset }) }
  );
  const counts = listings.data?.counts || {};
  const pagination = listings.data?.pagination;
  useEffect(() => {
    if (!listings.loading && listings.data?.requestedOffset === offset && pagination && pagination.offset !== offset) {
      setOffset(pagination.offset);
    }
  }, [listings.loading, listings.data?.requestedOffset, pagination, offset]);
  function chooseFilter(value) { setFilter(value); setOffset(0); }
  function search(event) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (text.trim()) next.set('q', text.trim()); else next.delete('q');
    setParams(next);
  }

  const addButton = verified ? (
    <PillButton dark icon={Plus} as={RLink} to="/inventory/add">Add a car</PillButton>
  ) : (
    <Tooltip label={owner ? 'Complete your business verification to add listings.' : 'Ask the owner to complete business verification to add listings.'} hasArrow shouldWrapChildren>
      <PillButton dark icon={Plus} isDisabled>Add a car</PillButton>
    </Tooltip>
  );

  return (
    <Box minH="70vh">
      <PageHeader title="Inventory" subtitle="The cars you sell and rent on Motaa." actions={addButton} />

      <DashCard>
        <Flex gap={3} justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} mb={5}>
          <HStack spacing={2} overflowX="auto" className="hidden-scroll" role="group" aria-label="Filter listings by status" pb={1}>
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <Button key={key} onClick={() => chooseFilter(key)} aria-pressed={active} flexShrink={0} h="40px" px={4} borderRadius="full"
                  bg={active ? DASH.ink : DASH.page} color={active ? 'white' : DASH.ink} fontWeight="500" _hover={{ bg: active ? DASH.ink : '#E7EAF0' }}
                  rightIcon={<Box as="span" minW="24px" px={1.5} py={0.5} borderRadius="full" fontSize="xs" bg={active ? 'whiteAlpha.300' : 'white'}>
                    {listings.data ? counts[key] ?? 0 : '–'}</Box>}>
                  {label}
                </Button>
              );
            })}
          </HStack>
          <Box as="form" role="search" onSubmit={search} w={{ base: '100%', md: '300px' }}>
            <InputGroup>
              <InputLeftElement h="44px" pointerEvents="none" color={DASH.muted}><Search size={18} /></InputLeftElement>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search make, model or VIN" aria-label="Search your cars"
                h="44px" borderRadius="full" bg={DASH.page} border="none" />
            </InputGroup>
          </Box>
        </Flex>

        <AsyncState
          query={listings}
          loadingLabel="Loading your listings…"
          isEmpty={(data) => data.counts.all === 0 && !q}
          empty={
            <CardEmpty
              icon={Car}
              title="No cars yet"
              body={verified ? 'Add your first car to start selling or renting on Motaa.' : 'Once your business is verified you can add your first car.'}
              action={verified ? { label: 'Add a car', to: '/inventory/add' } : undefined}
            />
          }
        >
          {(data) => {
            const visible = asList(data.results);
            return <>
              {visible.length ? (
                <ListingTable listings={visible} verified={verified} onDelete={canDelete(authUser) ? setPendingDelete : null} onChanged={listings.reload} />
              ) : (
                <Stack align="center" py={10} spacing={3}>
                  <Text fontWeight="600">{q ? `No cars match “${q}”` : 'No cars here'}</Text>
                  <Button size="sm" borderRadius="full" onClick={() => { chooseFilter('all'); if (q) setParams(new URLSearchParams()); }}>Show all cars</Button>
                </Stack>
              )}
              <PageControls offset={pagination?.offset} limit={pagination?.limit} count={pagination?.count}
                isLoading={listings.loading} onPage={setOffset} />
            </>;
          }}
        </AsyncState>
      </DashCard>

      <DeleteListingDialog
        listing={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDone={() => { setPendingDelete(null); listings.reload(); }}
      />
    </Box>
  );
}

function ListingActions({ listing, status, verified, busy, onRun, onDelete }) {
  const canToggle = status.key === 'draft' || status.key === 'review' || status.key === 'live';
  const round = { size: 'sm', isRound: true, bg: DASH.page, _hover: { bg: '#E7EAF0' } };
  return (
    <HStack spacing={2}>
      <Tooltip label="Edit" hasArrow>
        <IconButton as={RLink} to={`/inventory/edit/${listing?.uuid}`} aria-label={`Edit ${listing?.title || 'listing'}`} icon={<Pencil size={16} />} {...round} />
      </Tooltip>
      {canToggle && (status.key === 'draft' ? (
        <Tooltip label={!verified ? 'Complete business verification to publish' : !listing?.vehicle?.images?.length ? 'Add a photo (Edit) before publishing' : 'Publish for review'}
          hasArrow shouldWrapChildren={!verified || !listing?.vehicle?.images?.length}>
          <IconButton aria-label={`Publish ${listing?.title || 'listing'}`} icon={<Eye size={16} />} {...round} color="#047857"
            isDisabled={!verified || !listing?.vehicle?.images?.length} isLoading={busy} onClick={() => onRun(listing, 'publish')} />
        </Tooltip>
      ) : (
        <Tooltip label="Unpublish (hide from customers)" hasArrow>
          <IconButton aria-label={`Unpublish ${listing?.title || 'listing'}`} icon={<EyeOff size={16} />} {...round} isLoading={busy} onClick={() => onRun(listing, 'unpublish')} />
        </Tooltip>
      ))}
      {/* sales staff can add and edit listings but not delete them */}
      {onDelete && (
        <Tooltip label="Delete" hasArrow>
          <IconButton aria-label={`Delete ${listing?.title || 'listing'}`} icon={<Trash2 size={16} />} {...round} color="#B91C1C" onClick={() => onDelete(listing)} />
        </Tooltip>
      )}
    </HStack>
  );
}

function Cover({ listing, size = '64px' }) {
  const cover = listing?.vehicle?.images?.[0]?.url;
  return cover ? (
    <Image src={cover} alt="" objectFit="cover" boxSize={size} borderRadius="14px" flexShrink={0} />
  ) : (
    <Flex boxSize={size} borderRadius="14px" bg={DASH.page} align="center" justify="center" color="#9CA3AF" flexShrink={0}>
      <ImageOff size={20} aria-hidden="true" />
    </Flex>
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

  const price = (listing) => (
    <>
      ₦{commaInt(listing?.price)}
      {listing?.listing_type === 'rental' && <Text as="span" color={DASH.muted} fontWeight="400"> {optionLabel('payment_cycle', listing?.payment_cycle).toLowerCase()}</Text>}
    </>
  );
  const views = (listing) => listing?.views_count ?? (Array.isArray(listing?.viewers) ? listing.viewers.length : 0);

  return (
    <>
      {/* phones: one card per car */}
      <Stack spacing={3} display={{ base: 'flex', md: 'none' }}>
        {listings.map((listing) => {
          const status = listingStatus(listing);
          return (
            <Box key={listing?.uuid} borderWidth="1px" borderColor={DASH.line} borderRadius="18px" p={3}>
              <Flex gap={3}>
                <Cover listing={listing} size="72px" />
                <Box flex={1} minW={0}>
                  <Text fontWeight="600" noOfLines={2}>{listing?.title || listing?.vehicle?.name || 'Untitled listing'}</Text>
                  <Text fontSize="sm" fontWeight="600" mt={0.5}>{price(listing)}</Text>
                  <HStack spacing={2} mt={2} flexWrap="wrap">
                    <StatusPill tone={STATUS_TONES[status.key]}>{status.label}</StatusPill>
                    <StatusPill tone={listing?.listing_type === 'rental' ? 'violet' : 'blue'}>{listing?.listing_type === 'rental' ? 'Rental' : 'Sale'}</StatusPill>
                  </HStack>
                </Box>
              </Flex>
              <Flex justify="space-between" align="center" mt={3} pt={3} borderTopWidth="1px" borderColor={DASH.line}>
                <HStack spacing={1} fontSize="sm" color={DASH.muted}><Eye size={14} /><Text>{views(listing)} views</Text></HStack>
                <ListingActions listing={listing} status={status} verified={verified} busy={busyId === listing?.uuid} onRun={run} onDelete={onDelete} />
              </Flex>
            </Box>
          );
        })}
      </Stack>

      {/* larger screens: a table */}
      <TableContainer display={{ base: 'none', md: 'block' }}>
        <Table variant="unstyled" size="md">
          <Thead>
            <Tr color={DASH.muted} fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
              <Th py={2} color="inherit">Car</Th>
              <Th color="inherit">Type</Th>
              <Th color="inherit">Status</Th>
              <Th color="inherit" isNumeric>Views</Th>
              <Th color="inherit" textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {listings.map((listing) => {
              const status = listingStatus(listing);
              return (
                <Tr key={listing?.uuid || listing?.id} borderTopWidth="1px" borderColor={DASH.line} _hover={{ bg: '#FAFBFC' }}>
                  <Td py={3}>
                    <Flex align="center" gap={3} minW="260px">
                      <Cover listing={listing} />
                      <Box minW={0}>
                        <Text fontWeight="600" noOfLines={1} maxW="320px" whiteSpace="normal">{listing?.title || listing?.vehicle?.name || 'Untitled listing'}</Text>
                        <Text fontSize="sm" fontWeight="600" color={DASH.ink}>{price(listing)}</Text>
                      </Box>
                    </Flex>
                  </Td>
                  <Td><StatusPill tone={listing?.listing_type === 'rental' ? 'violet' : 'blue'}>{listing?.listing_type === 'rental' ? 'Rental' : 'Sale'}</StatusPill></Td>
                  <Td>
                    <Tooltip label={status.hint} hasArrow placement="top">
                      <Box as="span" tabIndex={0} cursor="help" display="inline-flex" alignItems="center" gap={1}>
                        <StatusPill tone={STATUS_TONES[status.key]}>{status.label}<Info size={11} aria-hidden="true" /></StatusPill>
                      </Box>
                    </Tooltip>
                  </Td>
                  <Td isNumeric><HStack justify="flex-end" spacing={1} color={DASH.muted}><Eye size={14} /><Text color={DASH.ink} fontWeight="600">{views(listing)}</Text></HStack></Td>
                  <Td><Flex justify="flex-end"><ListingActions listing={listing} status={status} verified={verified} busy={busyId === listing?.uuid} onRun={run} onDelete={onDelete} /></Flex></Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
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
