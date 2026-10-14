// /transport in a mechanic's dashboard (towing vans) or a dealer's (car haulers): the business's listings
// with the "Available now" switch, hide/show and delete, and a Jobs tab (?tab=jobs).
import { useContext, useEffect, useState } from 'react';
import { Link as RLink, useSearchParams } from 'react-router-dom';
import {
  Alert, AlertDescription, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Heading, HStack, Skeleton, Stack, Switch,
  Tab, TabList, TabPanel, TabPanels, Tabs, Text,
} from '@chakra-ui/react';
import { Eye, EyeOff, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ActionDialog } from '../../../components/parts';
import { AsyncState, EmptyState } from '../../../components/states';
import { TransportJobList, TransportPhoto } from '../../../components/transport';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { canDelete } from '../../../utils/team';

const TABS = ['listings', 'jobs'];

function ListSkeleton() {
  return (
    <Stack spacing={3} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => <Skeleton key={i} h="120px" borderRadius="xl" />)}
    </Stack>
  );
}

export function useTransportWords(kind) {
  return kind === 'hauler'
    ? { plural: 'Car haulers', one: 'car hauler', add: 'Add a car hauler' }
    : { plural: 'Towing vans', one: 'towing van', add: 'Add a towing van' };
}

export default function MyTransport() {
  const { authUser, notify } = useContext(GlobalStore);
  const mayDelete = canDelete(authUser); // sales staff can add and edit, not delete
  const [params, setParams] = useSearchParams();
  const tabIndex = Math.max(0, TABS.indexOf(params.get('tab')));
  const [busy, setBusy] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const words = useTransportWords(authUser?.user_type === 'dealer' ? 'hauler' : 'towing');

  useEffect(() => { document.title = `${words.plural} | Motaa`; }, [words.plural]);

  const query = useApiQuery(
    (api, signal) => api.get('/transport/mine/', { signal }),
    [],
    { select: (body) => body?.data, keepAs: 'transport-mine' }
  );
  const kind = query.data?.kind || (authUser?.user_type === 'dealer' ? 'hauler' : 'towing');
  const towing = kind === 'towing';

  const patch = useApiMutation(
    (api, service, changes) => api.patch(`/transport/mine/${service.uuid}/`, changes),
    {
      errorTitle: "Couldn't save that change",
      onSuccess: (body, service, changes) => {
        const saved = body?.data;
        if (saved) query.setData((current) => ({ ...current, results: asList(current?.results).map((item) => (item.uuid === saved.uuid ? saved : item)) }));
        const text = 'available_now' in changes
          ? (changes.available_now ? `${service.title} shows as available now.` : `${service.title} is no longer shown to customers looking for a tow now.`)
          : (changes.active ? `${service.title} is shown to customers again.` : `${service.title} is hidden from customers.`);
        notify({ title: 'Saved', body: text });
      },
    }
  );
  const destroy = useApiMutation(
    (api, service) => api.delete(`/transport/mine/${service.uuid}/`),
    {
      errorTitle: "Couldn't delete it",
      onSuccess: (body) => { notify({ title: 'Done', body: body?.message || 'Deleted.' }); setToDelete(null); query.reload(); },
      onError: () => setToDelete(null),
    }
  );

  async function change(service, changes) {
    setBusy(service.uuid);
    await patch.mutate(service, changes);
    setBusy(null);
  }

  function selectTab(index) {
    const next = new URLSearchParams(params);
    next.set('tab', TABS[index]);
    setParams(next, { replace: true });
  }

  const results = asList(query.data?.results);

  return (
    <Box w="100%">
      <Flex py={6} borderBottom="2px solid lavender" justify="space-between" align="center" gap={3} flexWrap="wrap">
        <Box>
          <Heading as="h1" size="md">{words.plural}</Heading>
          <Text color="gray.600" fontSize="sm">
            {towing ? 'Customers near you find your tow trucks, request a tow and pay in the app.' : 'Customers request quotes for moving cars and pay in the app.'}
          </Text>
        </Box>
        <Button as={RLink} to="/transport/add" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<Plus size={16} />}>{words.add}</Button>
      </Flex>

      {query.data && query.data.verified === false && (
        <Alert status="info" borderRadius="md" mt={4}>
          <AlertIcon />
          <AlertDescription>You can add {towing ? 'towing vans' : 'car haulers'} now. Customers will see them once your business is verified.</AlertDescription>
        </Alert>
      )}

      <Tabs index={tabIndex} onChange={selectTab} isLazy colorScheme="blue" mt={4}>
        <TabList>
          <Tab fontWeight="600" _selected={{ color: 'primary', borderColor: 'primary' }}>{words.plural}</Tab>
          <Tab fontWeight="600" _selected={{ color: 'primary', borderColor: 'primary' }}>Jobs</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <AsyncState
              query={query}
              skeleton={<ListSkeleton />}
              isEmpty={(data) => asList(data?.results).length === 0}
              empty={
                <EmptyState icon={Truck} title={`No ${towing ? 'towing vans' : 'car haulers'} yet`}
                  description={towing ? 'Add your tow truck with photos and your call-out price so customers nearby can find you.' : 'Add your car carrier with photos, its price and the states it covers.'}
                  action={{ label: words.add, to: '/transport/add' }} />
              }
            >
              {() => (
                <Stack as="ul" listStyleType="none" spacing={3} opacity={query.loading ? 0.6 : 1} aria-busy={query.loading}>
                  {results.map((service) => {
                    const working = busy === service.uuid;
                    return (
                      <Box as="li" key={service.uuid} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="xl" bg="white" data-testid="my-transport">
                        <Flex gap={3} align="start">
                          <TransportPhoto src={service.image} alt={service.title} boxSize={{ base: '72px', md: '96px' }} borderRadius="md" iconSize={6} />
                          <Box flex={1} minW={0}>
                            <HStack spacing={2} mb={1} flexWrap="wrap">
                              {service.active
                                ? <Badge colorScheme="green" textTransform="none" borderRadius="full" px={2}>Live</Badge>
                                : <Badge colorScheme="gray" textTransform="none" borderRadius="full" px={2}>Hidden</Badge>}
                              {!towing && service.truck_type_label && <Badge textTransform="none" borderRadius="full" px={2}>{service.truck_type_label}</Badge>}
                            </HStack>
                            <Text as={RLink} to={`/transport/${service.uuid}`} fontWeight="600" noOfLines={2} _hover={{ color: 'primary' }}>{service.title}</Text>
                            <Text fontWeight="700" color="secondary">{service.price_line}</Text>
                            {service.base_address && <Text fontSize="sm" color="gray.600" noOfLines={1}>{service.base_address}</Text>}
                          </Box>
                        </Flex>

                        {towing && (
                          <FormControl display="flex" alignItems="center" gap={3} mt={4} p={3} borderRadius="lg" bg={service.available_now ? 'green.50' : 'gray.50'}
                            borderWidth="1px" borderColor={service.available_now ? 'green.200' : 'gray.200'}>
                            <Switch id={`available-${service.uuid}`} size="lg" colorScheme="green" isChecked={Boolean(service.available_now)} isDisabled={working}
                              onChange={(e) => change(service, { available_now: e.target.checked })} />
                            <Box>
                              <FormLabel htmlFor={`available-${service.uuid}`} mb={0} fontWeight="700">Available now</FormLabel>
                              <Text fontSize="sm" color="gray.600">
                                {service.available_now ? 'Customers looking for a tow right now can find and request it.' : 'Switch on when the truck is free to take a job.'}
                              </Text>
                            </Box>
                          </FormControl>
                        )}

                        <Flex gap={1} mt={3} justify="flex-end" flexWrap="wrap">
                          <Button as={RLink} to={`/transport/${service.uuid}`} size="sm" variant="ghost" leftIcon={<Pencil size={14} />}>Edit</Button>
                          <Button size="sm" variant="ghost" leftIcon={service.active ? <EyeOff size={14} /> : <Eye size={14} />} isDisabled={working}
                            onClick={() => change(service, { active: !service.active })} aria-label={service.active ? `Hide ${service.title} from customers` : `Show ${service.title} to customers`}>
                            {service.active ? 'Hide' : 'Show'}
                          </Button>
                          {mayDelete && (
                            <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={14} />} isDisabled={working}
                              onClick={() => setToDelete(service)} aria-label={`Delete ${service.title}`}>
                              Delete
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </AsyncState>
          </TabPanel>
          <TabPanel px={0}>
            <TransportJobList
              empty={<EmptyState icon={Truck} title="No jobs yet" description={`Requests for your ${towing ? 'towing vans' : 'car haulers'} arrive in your messages. You can also send an invoice from a chat with a customer.`} />}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ActionDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        isLoading={destroy.loading}
        onConfirm={() => destroy.mutate(toDelete)}
        config={toDelete ? {
          title: `Delete this ${words.one}?`,
          body: `"${toDelete.title}" is removed for good. If it has done jobs before, it is hidden instead so your records stay. To take it off for a while, hide it.`,
          confirmLabel: 'Delete', cancelLabel: 'Keep it', tone: 'danger',
        } : null}
      />
    </Box>
  );
}
