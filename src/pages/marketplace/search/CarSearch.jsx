import {
    Box, Heading, Button, Container, Flex, HStack, Input, InputGroup, InputLeftElement, SimpleGrid, Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RiFilterLine, RiSearch2Line } from 'react-icons/ri'
import { SearchX } from "lucide-react";
import { ListingItemCard, LocationBreadcrumb, PageControls } from "../../../components";
import { SearchCarsSkeleton } from "../../../components/loaders";
import { AsyncState, EmptyState } from "../../../components/states";
import { CarBrandFilter, TransmissionFilter } from "../../../components/filters";
import { useApiQuery } from "../../../hooks/useApi";
import { asList } from "../../../utils";

const PAGE_SIZE = 25;

/** "Showing 26–50 of 60 results" from the API pagination block. */
export function resultsSummary(pagination, shown, find) {
    const count = Number(pagination?.count ?? pagination?.results_count);
    const offset = Number(pagination?.offset) || 0;
    const quoted = find ? ` for “${find}”` : '';
    if (!Number.isFinite(count)) return `${shown} result${shown === 1 ? '' : 's'}${quoted}`;
    if (count === 0) return `No results${quoted}`;
    const first = Math.min(count, offset + 1);
    const last = Math.min(count, offset + shown);
    return `Showing ${first}–${last} of ${count} result${count === 1 ? '' : 's'}${quoted}`;
}

export const CarSearchPage = () => {
    const [params, setParams] = useSearchParams();
    const find = params.get('find') || '';
    const [query, setQuery] = useState(find);
    const navigate = useNavigate();

    // back/forward or the navbar search changes ?find= without remounting
    useEffect(() => { setQuery(find); }, [find]);

    const qs = new URLSearchParams();
    if (find) qs.set('find', find);
    for (const key of ['make', 'transmission', 'offset']) if (params.get(key)) qs.set(key, params.get(key));
    const apiQs = qs.toString();

    const results = useApiQuery(
        (api, signal, { useCache }) => api.get(`/listings/find/?summary=1&${apiQs}`, { signal, cacheTTL: useCache ? 30000 : 0 }),
        [apiQs],
        { select: (body) => body?.data }
    );

    function update(changes) {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (!value) next.delete(key); else next.set(key, String(value));
        }
        if (!('offset' in changes)) next.delete('offset');
        setParams(next);
    }

    function handleSearch(e) {
        e.preventDefault();
        const text = query.trim();
        if (!text) return;
        navigate(`/search/cars/?find=${encodeURIComponent(text)}`);
    }

    return (
        <Box py={4}>
            <Container maxW="container.xl" py={4}>
                <LocationBreadcrumb label={find ? `“${find}”` : 'Cars'} />

                <Heading as="h1" className="subtitle" size={'md'} mt={3} mb={5} role="status">
                    {results.data
                        ? resultsSummary(results.data?.pagination, asList(results.data?.results).length, find)
                        : find ? `Searching for “${find}”…` : 'Search cars'}
                </Heading>

                <Flex as="form" role="search" onSubmit={handleSearch} gap={3} mb={4}>
                    <InputGroup flex={1}>
                        <InputLeftElement pointerEvents="none"><RiSearch2Line aria-hidden="true" /></InputLeftElement>
                        <Input type="search" aria-label="Search cars" placeholder="Search by make or model" value={query} onChange={e => setQuery(e.target.value)} />
                    </InputGroup>
                    <Button type="submit" bg="primary" color="white" colorScheme="blue" isDisabled={!query.trim()}>Search</Button>
                </Flex>

                <Flex gap={3} mb={6} flexWrap="nowrap" overflowX="auto" className="hidden-scroll" alignItems="center">
                    <HStack spacing={1} color="gray.600" flexShrink={0} aria-hidden="true"><RiFilterLine /><Text>Filters</Text></HStack>
                    <CarBrandFilter param="make" value={params.get('make')} onChange={({ filter, value }) => update({ [filter]: value })} />
                    <TransmissionFilter value={params.get('transmission')} onChange={({ filter, value }) => update({ [filter]: value })} />
                </Flex>

                <AsyncState
                  query={results}
                  skeleton={<SearchCarsSkeleton />}
                  isEmpty={(data) => asList(data?.results).length === 0}
                  empty={
                    <EmptyState
                      icon={SearchX}
                      title={find ? `No cars match “${find}”` : 'Type a make or model to search'}
                      description="Try a different make or model, or browse every car on Motaa."
                      action={{ label: 'Browse cars for sale', to: '/buy' }}
                    />
                  }
                >
                    {(data) => (
                        <Box opacity={results.loading ? 0.6 : 1} aria-busy={results.loading}>
                            <SimpleGrid spacing={{ base: 6, md: 8 }} columns={{ base: 1, sm: 2, lg: 3 }} py={4}>
                                {asList(data?.results).map((listing) =>
                                    <ListingItemCard listing={listing} key={listing?.uuid || listing?.id} />
                                )}
                            </SimpleGrid>
                            <PageControls
                              offset={data?.pagination?.offset}
                              limit={data?.pagination?.limit || PAGE_SIZE}
                              count={data?.pagination?.count}
                              isLoading={results.loading}
                              onPage={(offset) => { update({ offset: offset || null }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            />
                        </Box>
                    )}
                </AsyncState>
            </Container>
        </Box>
    )
}

export default CarSearchPage;
