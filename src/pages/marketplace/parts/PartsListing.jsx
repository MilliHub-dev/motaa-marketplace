// /parts — every spare part on sale, with filters kept in the URL
// (?q=&category=&make=&model=&year=&condition=&brand=&price_min=&price_max=&state=&in_stock=1&sort=&page=).
import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Button, Checkbox, CheckboxGroup, Container, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter,
  DrawerHeader, DrawerOverlay, Flex, FormControl, FormErrorMessage, FormLabel, Heading, HStack, Input, InputGroup,
  InputLeftElement, Select, SimpleGrid, Skeleton, Stack, Switch, Tag, TagCloseButton, TagLabel, Text, useDisclosure,
} from '@chakra-ui/react';
import { Package, Search, SlidersHorizontal } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { PageControls } from '../../../components';
import { PartCard } from '../../../components/parts';
import { AsyncState, EmptyState } from '../../../components/states';
import { useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { NIGERIAN_STATES } from '../../../data/nigeria';
import { FIRST_FITMENT_YEAR, PARTS_PAGE_SIZE, hasPartsFilters, partsApiQuery, partsFilterChips } from '../../../utils/parts';

export function PartsGridSkeleton({ count = 8 }) {
  return (
    <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} spacing={{ base: 3, md: 5 }} role="status" aria-label="Loading parts">
      {Array.from({ length: count }, (_, index) => (
        <Box key={index} borderWidth="1px" borderColor="gray.100" borderRadius="xl" overflow="hidden">
          <Skeleton h={{ base: '150px', md: '180px' }} />
          <Box p={3}>
            <Skeleton h="14px" w="80%" mb={3} />
            <Skeleton h="16px" w="45%" mb={3} />
            <Skeleton h="12px" w="65%" />
          </Box>
        </Box>
      ))}
    </SimpleGrid>
  );
}

/** URL params + setter shared by the parts list pages: any filter change goes back to page 1. */
export function usePartsParams() {
  const [params, setParams] = useSearchParams();

  function update(changes, { keepPage = false } = {}) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined || value === '' || value === false) next.delete(key);
      else next.set(key, String(value));
    }
    if (!keepPage) next.delete('page');
    setParams(next);
  }

  function gotoOffset(offset, pageSize = PARTS_PAGE_SIZE) {
    update({ page: offset > 0 ? Math.floor(offset / pageSize) + 1 : null }, { keepPage: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return { params, setParams, update, gotoOffset };
}

/** The grid of parts for a GET /parts/ query, with its count, empty state and page buttons. */
export function PartsResults({ query, onPage, empty, countLabel = 'on sale' }) {
  const { commaInt } = useContext(GlobalStore);
  return (
    <AsyncState query={query} skeleton={<PartsGridSkeleton />} isEmpty={(data) => asList(data?.results).length === 0} empty={empty}>
      {(data) => {
        const pagination = data?.pagination || {};
        const total = Number(pagination.count);
        return (
          <Box opacity={query.loading ? 0.6 : 1} transition="opacity .2s" aria-busy={query.loading}>
            {Number.isFinite(total) && (
              <Text color="gray.600" mb={4} role="status">{total === 1 ? '1 part' : `${commaInt(total)} parts`} {countLabel}</Text>
            )}
            <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} spacing={{ base: 3, md: 5 }}>
              {asList(data?.results).map((part) => <PartCard key={part?.uuid} part={part} />)}
            </SimpleGrid>
            <PageControls offset={pagination.offset} limit={pagination.limit || PARTS_PAGE_SIZE} count={total} isLoading={query.loading} onPage={onPage} />
          </Box>
        );
      }}
    </AsyncState>
  );
}

function Fieldset({ legend, children }) {
  return (
    <Box as="fieldset" minW={0}>
      <Text as="legend" fontWeight="600" mb={2}>{legend}</Text>
      {children}
    </Box>
  );
}

/** The filter fields: used in the left column on wide screens and in a drawer on phones. */
function FilterFields({ params, update, filters, idPrefix }) {
  const get = (key) => params.get(key) || '';
  const makes = asList(filters?.makes);
  const models = asList(makes.find((make) => make.name === get('make'))?.models);
  const [year, setYear] = useState(get('year'));
  const [price, setPrice] = useState({ min: get('price_min'), max: get('price_max') });
  const urlYear = get('year');
  const urlMin = get('price_min');
  const urlMax = get('price_max');
  // chips removed elsewhere (or back/forward) reset the typed values
  useEffect(() => { setYear(urlYear); }, [urlYear]);
  useEffect(() => { setPrice({ min: urlMin, max: urlMax }); }, [urlMin, urlMax]);

  const thisYear = new Date().getFullYear() + 1;
  const yearProblem = year && !(Number(year) >= FIRST_FITMENT_YEAR && Number(year) <= thisYear) ? `Enter a year from ${FIRST_FITMENT_YEAR} to ${thisYear}.` : '';
  const priceProblem = price.min && price.max && Number(price.min) > Number(price.max) ? 'The maximum must be more than the minimum.' : '';

  function applyPrice(e) {
    e.preventDefault();
    if (priceProblem) return;
    update({ price_min: price.min, price_max: price.max });
  }

  return (
    <Stack spacing={6}>
      <FormControl>
        <FormLabel htmlFor={`${idPrefix}-category`} fontWeight="600">Category</FormLabel>
        <Select id={`${idPrefix}-category`} value={get('category')} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All categories</option>
          {asList(filters?.categories).map((category) => (
            <option key={category.slug} value={category.slug}>{category.name}{Number.isFinite(Number(category.count)) ? ` (${category.count})` : ''}</option>
          ))}
        </Select>
      </FormControl>

      <Fieldset legend="Fits my car">
        <Stack spacing={3}>
          <FormControl>
            <FormLabel htmlFor={`${idPrefix}-make`} fontSize="sm" mb={1}>Make</FormLabel>
            <Select id={`${idPrefix}-make`} value={get('make')} onChange={(e) => update({ make: e.target.value, model: null })}>
              <option value="">Any make</option>
              {/* keep a make from a shared link selectable even if nothing on sale lists it now */}
              {get('make') && !makes.some((make) => make.name === get('make')) && <option value={get('make')}>{get('make')}</option>}
              {makes.map((make) => <option key={make.name} value={make.name}>{make.name}</option>)}
            </Select>
          </FormControl>
          <FormControl isDisabled={!get('make')}>
            <FormLabel htmlFor={`${idPrefix}-model`} fontSize="sm" mb={1}>Model</FormLabel>
            <Select id={`${idPrefix}-model`} value={get('model')} onChange={(e) => update({ model: e.target.value })}>
              <option value="">Any model</option>
              {get('model') && !models.includes(get('model')) && <option value={get('model')}>{get('model')}</option>}
              {models.map((model) => <option key={model} value={model}>{model}</option>)}
            </Select>
          </FormControl>
          <FormControl isInvalid={Boolean(yearProblem)} as="form" noValidate onSubmit={(e) => { e.preventDefault(); if (!yearProblem) update({ year }); }}>
            <FormLabel htmlFor={`${idPrefix}-year`} fontSize="sm" mb={1}>Year</FormLabel>
            <HStack>
              <Input id={`${idPrefix}-year`} type="number" inputMode="numeric" min={FIRST_FITMENT_YEAR} max={thisYear} placeholder="e.g. 2015"
                value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <Button type="submit" variant="outline" flexShrink={0} isDisabled={Boolean(yearProblem) || year === urlYear}>Apply</Button>
            </HStack>
            <FormErrorMessage>{yearProblem}</FormErrorMessage>
          </FormControl>
        </Stack>
      </Fieldset>

      <Fieldset legend="Condition">
        <CheckboxGroup value={get('condition').split(',').filter(Boolean)} onChange={(values) => update({ condition: values.join(',') })}>
          <Stack spacing={2}>
            {asList(filters?.conditions).map((condition) => <Checkbox key={condition.value} value={condition.value}>{condition.label}</Checkbox>)}
          </Stack>
        </CheckboxGroup>
      </Fieldset>

      {asList(filters?.brands).length > 0 && (
        <FormControl>
          <FormLabel htmlFor={`${idPrefix}-brand`} fontWeight="600">Brand</FormLabel>
          <Select id={`${idPrefix}-brand`} value={get('brand')} onChange={(e) => update({ brand: e.target.value })}>
            <option value="">Any brand</option>
            {asList(filters.brands).map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </Select>
        </FormControl>
      )}

      <Box as="form" noValidate onSubmit={applyPrice}>
        <Fieldset legend="Price (₦)">
          <FormControl isInvalid={Boolean(priceProblem)}>
            <HStack align="end">
              <Box flex={1}>
                <FormLabel htmlFor={`${idPrefix}-min`} fontSize="sm" mb={1}>From</FormLabel>
                <Input id={`${idPrefix}-min`} type="number" inputMode="numeric" min="0" placeholder="Any"
                  value={price.min} onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value.replace(/\D/g, '') }))} />
              </Box>
              <Box flex={1}>
                <Text as="label" htmlFor={`${idPrefix}-max`} fontSize="sm" mb={1} display="block">To</Text>
                <Input id={`${idPrefix}-max`} type="number" inputMode="numeric" min="0" placeholder="Any"
                  value={price.max} onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value.replace(/\D/g, '') }))} />
              </Box>
              <Button type="submit" variant="outline" flexShrink={0} isDisabled={Boolean(priceProblem) || (price.min === urlMin && price.max === urlMax)}>Apply</Button>
            </HStack>
            <FormErrorMessage>{priceProblem}</FormErrorMessage>
          </FormControl>
        </Fieldset>
      </Box>

      <FormControl>
        <FormLabel htmlFor={`${idPrefix}-state`} fontWeight="600">Seller's state</FormLabel>
        <Select id={`${idPrefix}-state`} value={get('state')} onChange={(e) => update({ state: e.target.value })}>
          <option value="">Anywhere in Nigeria</option>
          {NIGERIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
        </Select>
      </FormControl>

      <FormControl display="flex" alignItems="center" justifyContent="space-between">
        <FormLabel htmlFor={`${idPrefix}-stock`} mb={0} fontWeight="600">In stock only</FormLabel>
        <Switch id={`${idPrefix}-stock`} isChecked={get('in_stock') === '1'} onChange={(e) => update({ in_stock: e.target.checked ? '1' : null })} />
      </FormControl>
    </Stack>
  );
}

/** Search box that applies on submit. */
export function PartsSearch({ value, onSearch, placeholder = 'Search by part name, part number or car' }) {
  const [text, setText] = useState(value || '');
  useEffect(() => { setText(value || ''); }, [value]);
  return (
    <HStack as="form" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(text.trim()); }} flex={{ base: '1 1 100%', sm: 1 }} minW={0}>
      <InputGroup>
        <InputLeftElement pointerEvents="none" color="gray.500"><Search size={18} aria-hidden="true" /></InputLeftElement>
        <Input type="search" aria-label="Search spare parts" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} bg="white" />
      </InputGroup>
      <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} flexShrink={0}>Search</Button>
    </HStack>
  );
}

export function SortSelect({ value, sorts, onChange, id = 'parts-sort' }) {
  const options = asList(sorts).length ? sorts : [{ value: 'newest', label: 'Newest' }];
  return (
    <HStack flexShrink={0}>
      <Text as="label" htmlFor={id} fontSize="sm" color="gray.600" whiteSpace="nowrap">Sort by</Text>
      <Select id={id} size="sm" borderRadius="md" w="auto" value={value || 'newest'} onChange={(e) => onChange(e.target.value === 'newest' ? null : e.target.value)}>
        {options.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
      </Select>
    </HStack>
  );
}

export default function PartsListing() {
  const { commaInt } = useContext(GlobalStore);
  const { params, setParams, update, gotoOffset } = usePartsParams();
  const drawer = useDisclosure();
  const qs = partsApiQuery(params);

  useEffect(() => { document.title = 'Spare parts | Motaa'; }, []);

  const filtersQuery = useApiQuery(
    (api, signal, { useCache }) => api.get('/parts/filters/', { signal, cacheTTL: useCache ? 60000 : 0 }),
    [],
    { select: (body) => body?.data || {} }
  );
  const filters = filtersQuery.data || {};
  const parts = useApiQuery(
    (api, signal, { useCache }) => api.get(`/parts/?${qs}`, { signal, cacheTTL: useCache ? 30000 : 0 }),
    [qs],
    { select: (body) => body?.data }
  );

  const filtered = hasPartsFilters(params);
  const chips = partsFilterChips(params, filters, commaInt);
  const clearAll = () => setParams(new URLSearchParams(params.get('sort') ? { sort: params.get('sort') } : {}));

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
      <Heading as="h1" size="lg" className="subtitle">Spare parts</Heading>
      <Text color="gray.600" mt={1} mb={4}>Genuine and used parts from verified sellers. Your payment is held by Motaa until your order arrives.</Text>

      <Flex gap={3} align="center" flexWrap="wrap" mb={3}>
        <PartsSearch value={params.get('q')} onSearch={(q) => update({ q })} />
        <Button display={{ base: 'inline-flex', lg: 'none' }} w={{ base: '100%', sm: 'auto' }} variant="outline" leftIcon={<SlidersHorizontal size={16} />} onClick={drawer.onOpen}>
          Filters{chips.length ? ` (${chips.length})` : ''}
        </Button>
      </Flex>

      <Flex gap={8} align="start">
        <Box as="aside" aria-label="Filters" display={{ base: 'none', lg: 'block' }} w="260px" flexShrink={0} borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4}>
          <FilterFields params={params} update={update} filters={filters} idPrefix="side" />
        </Box>

        <Box flex={1} minW={0}>
          <Flex justify="space-between" align="center" gap={3} flexWrap="wrap" mb={3}>
            <Flex gap={2} flexWrap="wrap" align="center" flex={1} minW={0}>
              {chips.map((chip) => (
                <Tag key={chip.keys[0]} variant="outline" colorScheme="blue" borderColor="primary" maxW="100%">
                  <TagLabel>{chip.label}</TagLabel>
                  <TagCloseButton aria-label={`Remove filter: ${chip.label}`} onClick={() => update(Object.fromEntries(chip.keys.map((key) => [key, null])))} />
                </Tag>
              ))}
              {chips.length > 0 && <Button size="sm" variant="link" color="primary" onClick={clearAll}>Clear all</Button>}
            </Flex>
            <SortSelect value={params.get('sort')} sorts={filters.sorts} onChange={(sort) => update({ sort })} />
          </Flex>

          <PartsResults
            query={parts}
            onPage={(offset) => gotoOffset(offset)}
            empty={
              <EmptyState
                icon={Package}
                title={filtered ? 'No parts match these filters' : 'No parts on sale yet'}
                description={filtered ? 'Try removing a filter, or search for the part by another name.' : 'Verified sellers add parts every week. Check back soon.'}
                action={filtered ? { label: 'Clear filters', onClick: clearAll } : undefined}
              />
            }
          />
        </Box>
      </Flex>

      <Drawer isOpen={drawer.isOpen} onClose={drawer.onClose} placement="right" size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>
          <DrawerBody>
            <FilterFields params={params} update={update} filters={filters} idPrefix="drawer" />
          </DrawerBody>
          <DrawerFooter gap={3} borderTopWidth="1px">
            <Button variant="ghost" onClick={clearAll} isDisabled={!filtered}>Clear all</Button>
            <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={drawer.onClose}>Show parts</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Container>
  );
}
