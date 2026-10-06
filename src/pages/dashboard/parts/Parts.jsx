// /parts-store/parts — the seller's parts (?q=&status=live|hidden|out&page=): search, hide/show, stock, delete.
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useSearchParams } from 'react-router-dom';
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, Heading, HStack, Input, InputGroup, InputLeftElement, Skeleton, Stack, Text,
} from '@chakra-ui/react';
import { Eye, EyeOff, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { PageControls } from '../../../components';
import { ActionDialog, PartPhoto } from '../../../components/parts';
import { AsyncState, EmptyState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { usePartsShop } from './shop';

const PAGE_SIZE = 25;
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'out', label: 'Out of stock' },
];

function ListSkeleton() {
  return (
    <Stack spacing={3} role="status" aria-label="Loading your parts">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} h="104px" borderRadius="xl" />)}
    </Stack>
  );
}

/** Stock box with a Save button that appears once the number is changed. */
function StockEditor({ part, onSave, isSaving }) {
  const [value, setValue] = useState(String(part.stock ?? 0));
  useEffect(() => { setValue(String(part.stock ?? 0)); }, [part.stock]);
  const dirty = value !== String(part.stock ?? 0);
  const valid = /^\d+$/.test(value) && Number(value) <= 1000000;
  return (
    <FormControl as="form" w="auto" onSubmit={(e) => { e.preventDefault(); if (dirty && valid) onSave(Number(value)); }}>
      <HStack spacing={2}>
        <FormLabel htmlFor={`stock-${part.uuid}`} m={0} fontSize="sm" color="gray.600">In stock</FormLabel>
        <Input id={`stock-${part.uuid}`} size="sm" w="80px" borderRadius="md" type="number" inputMode="numeric" min="0"
          value={value} isInvalid={dirty && !valid} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} />
        {dirty && <Button type="submit" size="sm" bg="primary" color="white" _hover={{ bg: 'secondary' }} isDisabled={!valid} isLoading={isSaving}>Save</Button>}
      </HStack>
    </FormControl>
  );
}

export default function PartsShopParts() {
  const { commaInt, notify } = useContext(GlobalStore);
  const { shop, reload: reloadShop } = usePartsShop();
  const [params, setParams] = useSearchParams();
  const status = FILTERS.some((filter) => filter.value === params.get('status')) ? params.get('status') : '';
  const q = params.get('q') || '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const [search, setSearch] = useState(q);
  const [busy, setBusy] = useState(null); // uuid of the part being changed
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => { document.title = 'Parts | Motaa parts shop'; }, []);
  useEffect(() => { setSearch(q); }, [q]);

  const qs = new URLSearchParams({ per_page: String(PAGE_SIZE) });
  if (q) qs.set('q', q);
  if (status) qs.set('status', status);
  if (page > 1) qs.set('offset', String((page - 1) * PAGE_SIZE));
  const query = useApiQuery(
    (api, signal) => api.get(`/parts/seller/parts/?${qs.toString()}`, { signal }),
    [q, status, page],
    { select: (body) => body?.data }
  );

  function go(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key); else next.set(key, String(value));
    }
    setParams(next);
  }

  const patch = useApiMutation(
    (api, part, changes) => api.patch(`/parts/seller/parts/${part.uuid}/`, changes),
    {
      errorTitle: "Couldn't save that change",
      onSuccess: (body, part, changes) => {
        const saved = body?.data;
        // a part that no longer matches the filter (e.g. hidden while viewing "Live") drops out on reload
        if (saved) query.setData((current) => ({ ...current, results: asList(current?.results).map((item) => (item.uuid === saved.uuid ? saved : item)) }));
        notify({ title: 'Saved', body: 'active' in changes ? (changes.active ? `${part.name} is on sale again.` : `${part.name} is hidden from customers.`) : `Stock updated for ${part.name}.` });
        reloadShop();
      },
    }
  );
  const destroy = useApiMutation(
    (api, part) => api.delete(`/parts/seller/parts/${part.uuid}/`),
    {
      errorTitle: "Couldn't delete that part",
      successMessage: 'Part deleted.',
      onSuccess: () => { setToDelete(null); query.reload(); reloadShop(); },
    }
  );

  async function change(part, changes) {
    setBusy(part.uuid);
    await patch.mutate(part, changes);
    setBusy(null);
  }

  const filtered = Boolean(q || status);

  return (
    <Box w="100%">
      <Flex py={6} borderBottom="2px solid lavender" justify="space-between" align="center" gap={3} flexWrap="wrap">
        <Box>
          <Heading as="h1" size="md">Parts</Heading>
          <Text color="gray.600" fontSize="sm">The spare parts in your shop.</Text>
        </Box>
        <Button as={RLink} to="/parts-store/parts/add" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<Plus size={16} />}>Add a part</Button>
      </Flex>

      <Flex gap={3} my={4} flexWrap="wrap" align="center">
        <HStack as="form" role="search" flex="1 1 260px" onSubmit={(e) => { e.preventDefault(); go({ q: search.trim(), page: null }); }}>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="gray.500"><Search size={18} aria-hidden="true" /></InputLeftElement>
            <Input type="search" aria-label="Search your parts" placeholder="Search by name, part number or brand" value={search} onChange={(e) => setSearch(e.target.value)} />
          </InputGroup>
          <Button type="submit" variant="outline" flexShrink={0}>Search</Button>
        </HStack>
        <HStack role="group" aria-label="Show" spacing={2} overflowX="auto" className="hidden-scroll">
          {FILTERS.map((filter) => {
            const selected = filter.value === status;
            return (
              <Button key={filter.value || 'all'} size="sm" flexShrink={0} aria-pressed={selected} onClick={() => go({ status: filter.value, page: null })}
                variant={selected ? 'solid' : 'outline'} bg={selected ? 'primary' : 'white'} color={selected ? 'white' : 'gray.700'} _hover={{ bg: selected ? 'primary' : 'gray.50' }}>
                {filter.label}
              </Button>
            );
          })}
        </HStack>
      </Flex>

      <AsyncState
        query={query}
        skeleton={<ListSkeleton />}
        isEmpty={(data) => asList(data?.results).length === 0}
        empty={
          <EmptyState
            icon={Package}
            title={filtered ? 'No parts match' : 'No parts yet'}
            description={filtered ? 'Try another search or filter.' : `Add your first part with photos, a price and the cars it fits.${shop && !shop.verified ? ' Customers will see it once your business is verified.' : ''}`}
            action={filtered ? { label: 'Show all parts', onClick: () => setParams(new URLSearchParams()) } : { label: 'Add a part', to: '/parts-store/parts/add' }}
          />
        }
      >
        {(data) => (
          <Box opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
            <Text color="gray.600" fontSize="sm" mb={3} role="status">
              {Number(data?.pagination?.count) === 1 ? '1 part' : `${commaInt(data?.pagination?.count)} parts`}
            </Text>
            <Stack as="ul" listStyleType="none" spacing={3}>
              {asList(data?.results).map((part) => {
                const working = busy === part.uuid;
                return (
                  <Box as="li" key={part.uuid} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="xl" bg="white" opacity={working ? 0.7 : 1}>
                    <Flex gap={3} align="start">
                      <PartPhoto src={part.image} alt={part.name} boxSize={{ base: '64px', md: '80px' }} borderRadius="md" iconSize={6} />
                      <Box flex={1} minW={0}>
                        <HStack spacing={2} flexWrap="wrap" mb={1}>
                          {!part.active
                            ? <Badge colorScheme="gray" textTransform="none" borderRadius="full" px={2}>Hidden</Badge>
                            : !part.in_stock
                              ? <Badge colorScheme="orange" textTransform="none" borderRadius="full" px={2}>Out of stock</Badge>
                              : <Badge colorScheme="green" textTransform="none" borderRadius="full" px={2}>Live</Badge>}
                          {!part.active && !part.in_stock && <Badge colorScheme="orange" textTransform="none" borderRadius="full" px={2}>Out of stock</Badge>}
                          {part.condition_label && <Badge textTransform="none" borderRadius="full" px={2}>{part.condition_label}</Badge>}
                        </HStack>
                        <Text as={RLink} to={`/parts-store/parts/${part.uuid}`} fontWeight="600" noOfLines={2} _hover={{ color: 'primary' }}>{part.name}</Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          {[part.category?.name, part.brand, part.part_number && `Part no. ${part.part_number}`, `${commaInt(part.sold)} sold`].filter(Boolean).join(' · ')}
                        </Text>
                        <Text fontWeight="700" color="secondary" mt={1}>₦{commaInt(part.price)}</Text>
                      </Box>
                    </Flex>
                    <Flex gap={3} mt={3} justify="space-between" align="center" flexWrap="wrap">
                      <StockEditor part={part} isSaving={working && patch.loading} onSave={(stock) => change(part, { stock })} />
                      <HStack spacing={1} flexWrap="wrap">
                        <Button as={RLink} to={`/parts-store/parts/${part.uuid}`} size="sm" variant="ghost" leftIcon={<Pencil size={14} />}>Edit</Button>
                        <Button size="sm" variant="ghost" leftIcon={part.active ? <EyeOff size={14} /> : <Eye size={14} />} isDisabled={working}
                          onClick={() => change(part, { active: !part.active })} aria-label={part.active ? `Hide ${part.name} from customers` : `Show ${part.name} to customers`}>
                          {part.active ? 'Hide' : 'Show'}
                        </Button>
                        <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={14} />} isDisabled={working}
                          onClick={() => setToDelete(part)} aria-label={`Delete ${part.name}`}>
                          Delete
                        </Button>
                      </HStack>
                    </Flex>
                  </Box>
                );
              })}
            </Stack>
            <PageControls
              offset={data?.pagination?.offset}
              limit={data?.pagination?.limit || PAGE_SIZE}
              count={data?.pagination?.count}
              isLoading={query.loading}
              onPage={(offset) => { go({ page: offset > 0 ? Math.floor(offset / PAGE_SIZE) + 1 : null }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </Box>
        )}
      </AsyncState>

      <ActionDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        isLoading={destroy.loading}
        onConfirm={() => destroy.mutate(toDelete)}
        config={toDelete ? {
          title: 'Delete this part?',
          body: `"${toDelete.name}" is removed from your shop for good. Orders already placed for it are not affected. To take it off sale for a while, hide it instead.`,
          confirmLabel: 'Delete part', cancelLabel: 'Keep it', tone: 'danger',
        } : null}
      />
    </Box>
  );
}
