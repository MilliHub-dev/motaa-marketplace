import {
    Box, Heading, Button, Container, Flex, HStack, Input, InputGroup, InputLeftElement, Stack, Text,
    Avatar, Badge, Card, CardBody, Wrap, WrapItem, Switch, FormControl, FormLabel,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { RiFilterLine, RiMessage2Line, RiSearch2Line } from 'react-icons/ri'
import { SearchX } from "lucide-react";
import { MechanicListSkeleton } from "../../../components/loaders";
import { LocationBreadcrumb, PageControls } from "../../../components";
import { AsyncState, EmptyState } from "../../../components/states";
import { ServiceFilter } from "../../../components/filters";
import { ChatPopup } from "../../../components/chat";
import { useApiQuery } from "../../../hooks/useApi";
import { asList } from "../../../utils";
import { resultsSummary } from "./CarSearch";

const PAGE_SIZE = 25;

export function mechanicName(mech) {
    return mech?.business_name || mech?.user?.name || 'Mechanic';
}

export const MechanicSearchPage = () => {
    const [params, setParams] = useSearchParams();
    const find = params.get('find') || '';
    const [query, setQuery] = useState(find);
    const [chatWith, setChatWith] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { setQuery(find); }, [find]);

    const qs = new URLSearchParams();
    if (find) qs.set('find', find);
    for (const key of ['services', 'available', 'offset']) if (params.get(key)) qs.set(key, params.get(key));
    const apiQs = qs.toString();

    const results = useApiQuery(
        (api, signal) => api.get(`/mechanics/find/?${apiQs}`, { signal }),
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
        navigate(`/search/mechanics/?find=${encodeURIComponent(text)}`);
    }

    return (
        <Box py={4}>
            <Container maxW="container.lg" py={4}>
                <LocationBreadcrumb label={find ? `“${find}”` : 'Mechanics'} />

                <Heading as="h1" className="subtitle" size={'md'} mt={3} mb={5} role="status">
                    {results.data
                        ? resultsSummary(results.data?.pagination, asList(results.data?.results).length, find)
                        : find ? `Searching for “${find}”…` : 'Search mechanics'}
                </Heading>

                <Flex as="form" role="search" onSubmit={handleSearch} gap={3} mb={4}>
                    <InputGroup flex={1}>
                        <InputLeftElement pointerEvents="none"><RiSearch2Line aria-hidden="true" /></InputLeftElement>
                        <Input type="search" aria-label="Search mechanics" placeholder="Name or service, e.g. oil change" value={query} onChange={e => setQuery(e.target.value)} />
                    </InputGroup>
                    <Button type="submit" bg="primary" color="white" colorScheme="blue" isDisabled={!query.trim()}>Search</Button>
                </Flex>

                <Flex gap={4} mb={6} flexWrap="wrap" alignItems="center">
                    <HStack spacing={1} color="gray.600" aria-hidden="true"><RiFilterLine /><Text>Filters</Text></HStack>
                    <ServiceFilter value={params.get('services')} onChange={({ value }) => update({ services: value })} />
                    <FormControl display="flex" alignItems="center" w="auto">
                        <Switch id="available-only" colorScheme="blue" isChecked={params.get('available') === 'true'} onChange={(e) => update({ available: e.target.checked ? 'true' : null })} />
                        <FormLabel htmlFor="available-only" mb={0} ml={2}>Available now</FormLabel>
                    </FormControl>
                </Flex>

                <AsyncState
                  query={results}
                  skeleton={<MechanicListSkeleton />}
                  isEmpty={(data) => asList(data?.results).length === 0}
                  empty={
                    <EmptyState
                      icon={SearchX}
                      title={find ? `No mechanics match “${find}”` : 'No mechanics found'}
                      description="Try another name or service, or see mechanics near you."
                      action={{ label: 'Find mechanics near me', to: '/mechanics' }}
                    />
                  }
                >
                    {(data) => (
                        <Box opacity={results.loading ? 0.6 : 1} aria-busy={results.loading}>
                            <Stack spacing={4}>
                                {asList(data?.results).map((mech) => {
                                    const name = mechanicName(mech);
                                    const jobs = asList(mech?.job_history).length;
                                    return (
                                        <Card key={mech?.uuid || mech?.id} shadow={'lg'} my={1}>
                                            <CardBody>
                                                <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
                                                    <Avatar size="lg" name={name} src={mech?.logo || undefined} />
                                                    <Box flex={1} minW={0}>
                                                        <Flex justify="space-between" alignItems={'flex-start'} gap={2} mb={2} flexWrap="wrap">
                                                            <Box minW={0}>
                                                                <Heading as="h2" size="sm"><Link to={`/mechanics/${mech?.uuid}`}>{name}</Link></Heading>
                                                                {mech?.headline && <Text fontSize="sm" color="gray.700">{mech.headline}</Text>}
                                                                {mech?.location && <Text fontSize="sm" color="gray.500">{mech.location}</Text>}
                                                            </Box>
                                                            <Badge textTransform={'capitalize'} fontSize={'13px'} rounded={'lg'} colorScheme={mech?.available ? 'green' : 'gray'}>
                                                                {mech?.available ? "Available" : "Not available"}
                                                            </Badge>
                                                        </Flex>

                                                        {asList(mech?.services).length > 0 && (
                                                            <Wrap spacing={2} mb={3}>
                                                                {asList(mech.services).map((service) =>
                                                                    <WrapItem key={service?.uuid || service?.service}><Badge>{service?.service}</Badge></WrapItem>
                                                                )}
                                                            </Wrap>
                                                        )}

                                                        <Text fontSize="sm" color="gray.600" mb={2} noOfLines={3}>
                                                            {mech?.about || "No description available."}
                                                        </Text>

                                                        {jobs > 0 && (
                                                            <Text fontSize="sm" color="green.600">{jobs} job{jobs === 1 ? '' : 's'} completed on Motaa</Text>
                                                        )}

                                                        <Flex gap={3} mt={3} flexWrap="wrap">
                                                            <Button flex={{ base: 1, md: 'none' }} variant={'outline'} colorScheme={'blue'} leftIcon={<RiMessage2Line />} onClick={() => setChatWith(mech)}>
                                                                Message
                                                            </Button>
                                                            <Button flex={{ base: 1, md: 'none' }} as={Link} to={`/mechanics/${mech?.uuid}`} colorScheme="blue" bg={'primary'} aria-label={`View ${name} and book`}>
                                                                View &amp; book
                                                            </Button>
                                                        </Flex>
                                                    </Box>
                                                </Flex>
                                            </CardBody>
                                        </Card>
                                    );
                                })}
                            </Stack>
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

            {chatWith?.uuid && (
                <ChatPopup isOpen onClose={() => setChatWith(null)} recipient_type="mechanic" recipient_id={chatWith.uuid} />
            )}
        </Box>
    )
}

export default MechanicSearchPage;
