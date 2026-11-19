import { useContext, useRef, useState } from 'react';
import { Link as RLink } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  SimpleGrid,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { MoreVertical, Pencil, Plus, Trash2, Wrench } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { useApiMutation, useApiQuery } from '../../../../hooks/useApi';
import { AsyncState, EmptyState } from '../../../../components/states';
import { asList } from '../../../../utils';
import { canDelete } from '../../../../utils/team';
import { CardEmpty, DASH, DashCard, IconBubble, PageHeader, PillButton, StatusPill } from '../../../../components/dashboard/ui';

const RATE_LABELS = { flat: 'Flat rate', hourly: 'Per hour' };

export const ServiceOfferings = () => {
  const { commaInt, authUser } = useContext(GlobalStore);
  const mayDelete = canDelete(authUser); // sales staff can add and edit services, not delete them
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const cancelRef = useRef();

  const offerings = useApiQuery((api, signal) => api.get('/admin/mechanics/services/', { signal }), [], {
    select: (body) => asList(body?.data),
  });

  const replaceOffering = (updated) => {
    if (!updated?.uuid) return;
    offerings.setData((list) => asList(list).map((o) => (o.uuid === updated.uuid ? { ...o, ...updated } : o)));
  };

  const toggle = useApiMutation(
    (api, offering, isActive) => api.post(`/admin/mechanics/services/${offering.uuid}/`, { is_active: isActive }),
    {
      successMessage: (body) => (body?.data?.is_active ? 'Service is now visible to customers' : 'Service hidden from customers'),
      errorTitle: "Couldn't update the service",
      onSuccess: (body) => replaceOffering(body?.data),
    }
  );

  const remove = useApiMutation((api, offering) => api.delete(`/admin/mechanics/services/${offering.uuid}/`), {
    successMessage: (body) => body?.message || 'Service deleted',
    errorTitle: "Couldn't delete the service",
    onSuccess: (body, offering) => {
      if (body?.data?.deleted) offerings.setData((list) => asList(list).filter((o) => o.uuid !== offering.uuid));
      else replaceOffering({ uuid: offering.uuid, is_active: false });
    },
  });

  async function handleToggle(offering, isActive) {
    setToggling(offering.uuid);
    await toggle.mutate(offering, isActive);
    setToggling(null);
  }

  async function confirmDelete() {
    await remove.mutate(deleting);
    setDeleting(null);
  }

  return (
    <Box>
      <PageHeader title="Services" subtitle="What you offer and your prices. Active services show on your public profile."
        actions={<PillButton dark icon={Plus} as={RLink} to="/services/add">Add a service</PillButton>} />

      <AsyncState
        query={offerings}
        loadingLabel="Loading your services…"
        isEmpty={(list) => !list?.length}
        empty={
          <DashCard>
            <CardEmpty icon={Wrench} title="You haven't added any services" body="Add the services you offer with your prices so customers can book you."
              action={{ label: 'Add your first service', to: '/services/add' }} />
          </DashCard>
        }
      >
        {(list) => (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 5 }}>
            {list.map((offering) => (
              <DashCard key={offering?.uuid} p={{ base: 4, md: 5 }} opacity={offering?.is_active ? 1 : 0.7}>
                <Flex justify="space-between" align="flex-start" gap={3}>
                  <HStack spacing={3} minW={0}>
                    <IconBubble icon={Wrench} color={offering?.is_active ? DASH.blue : '#9CA3AF'} size={12} />
                    <Box minW={0}>
                      <Text fontWeight="600" fontSize="lg" noOfLines={2}>{offering?.service || 'Untitled service'}</Text>
                      <Text fontSize="sm" color={DASH.muted}>{commaInt(offering?.hires)} hire{Number(offering?.hires) === 1 ? '' : 's'}</Text>
                    </Box>
                  </HStack>
                  <Menu placement="bottom-end">
                    <MenuButton as={IconButton} aria-label={`Options for ${offering?.service}`} icon={<MoreVertical size={16} />} isRound size="sm" bg={DASH.page} />
                    <MenuList>
                      <MenuItem as={RLink} to={`/services/edit/${offering?.uuid}`} icon={<Pencil size={14} />}>Edit</MenuItem>
                      {mayDelete && <MenuItem color="red.600" icon={<Trash2 size={14} />} onClick={() => setDeleting(offering)}>Delete</MenuItem>}
                    </MenuList>
                  </Menu>
                </Flex>
                <Flex align="flex-end" justify="space-between" mt={5} gap={3}>
                  <Box>
                    <Text fontSize="2xl" fontWeight="600">₦{commaInt(offering?.charge)}</Text>
                    <StatusPill tone="blue">{RATE_LABELS[offering?.charge_rate] || offering?.charge_rate || 'Flat rate'}</StatusPill>
                  </Box>
                  <HStack as="label" spacing={2} cursor="pointer">
                    <Text fontSize="sm" color={DASH.muted}>{offering?.is_active ? 'Visible' : 'Hidden'}</Text>
                    <Switch colorScheme="blue" isChecked={!!offering?.is_active} isDisabled={toggling === offering?.uuid}
                      onChange={(e) => handleToggle(offering, e.target.checked)} aria-label={`Show ${offering?.service} to customers`} />
                  </HStack>
                </Flex>
              </DashCard>
            ))}
            <Flex as={RLink} to="/services/add" borderRadius={DASH.radius} border="2px dashed" borderColor="#D6DBE3" minH="170px" align="center" justify="center"
              direction="column" gap={2} color={DASH.muted} _hover={{ borderColor: DASH.blue, color: DASH.blue, bg: 'white' }} transition="all .15s">
              <Plus size={26} />
              <Text fontWeight="600">Add a service</Text>
            </Flex>
          </SimpleGrid>
        )}
      </AsyncState>

      <AlertDialog isOpen={!!deleting} leastDestructiveRef={cancelRef} onClose={() => !remove.loading && setDeleting(null)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete {deleting?.service}?</AlertDialogHeader>
            <AlertDialogBody>
              Customers will no longer be able to book this service. If it has any bookings, it will be
              hidden instead of deleted so your booking history stays intact.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={() => setDeleting(null)} isDisabled={remove.loading}>Keep service</Button>
              <Button colorScheme="red" onClick={confirmDelete} isLoading={remove.loading}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ServiceOfferings;
