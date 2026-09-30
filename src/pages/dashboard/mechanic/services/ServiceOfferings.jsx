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

const RATE_LABELS = { flat: 'Flat rate', hourly: 'Per hour' };

export const ServiceOfferings = () => {
  const { commaInt } = useContext(GlobalStore);
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
    <Box py={4} maxW="1200px" mx="auto">
      <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={4} mb={6}>
        <Box>
          <Heading as="h1" size="lg" mb={1}>My services</Heading>
          <Text color="gray.600">Active services and prices are shown on your public profile.</Text>
        </Box>
        <Button as={RLink} to="/services/add" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<Plus size={18} />} flexShrink={0}>
          Add service
        </Button>
      </Flex>

      <AsyncState
        query={offerings}
        loadingLabel="Loading your services…"
        isEmpty={(list) => !list?.length}
        empty={
          <EmptyState
            icon={Wrench}
            title="You haven't added any services"
            description="Add the services you offer with your prices so customers can book you."
            action={{ label: 'Add your first service', to: '/services/add' }}
          />
        }
      >
        {(list) => (
          <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th py={3} px={{ base: 3, md: 4 }}>Service</Th>
                  <Th isNumeric>Charge</Th>
                  <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>Hires</Th>
                  <Th>Visible</Th>
                  <Th><Box as="span" srOnly>Options</Box></Th>
                </Tr>
              </Thead>
              <Tbody>
                {list.map((offering) => (
                  <Tr key={offering?.uuid}>
                    <Td py={3} whiteSpace="normal" minW="120px">
                      <Text fontWeight="medium">{offering?.service || 'Untitled service'}</Text>
                      <Text fontSize="xs" color="gray.500" display={{ base: 'block', md: 'none' }}>
                        {commaInt(offering?.hires)} hire{Number(offering?.hires) === 1 ? '' : 's'}
                      </Text>
                    </Td>
                    <Td isNumeric>
                      <Text>₦{commaInt(offering?.charge)}</Text>
                      <Badge colorScheme="blue" borderRadius="full" px={2} textTransform="none">
                        {RATE_LABELS[offering?.charge_rate] || offering?.charge_rate || 'Flat rate'}
                      </Badge>
                    </Td>
                    <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>{commaInt(offering?.hires)}</Td>
                    <Td>
                      <HStack>
                        <Switch
                          isChecked={!!offering?.is_active}
                          isDisabled={toggling === offering?.uuid}
                          onChange={(e) => handleToggle(offering, e.target.checked)}
                          aria-label={`Show ${offering?.service} to customers`}
                        />
                        <Text fontSize="xs" color="gray.500" display={{ base: 'none', md: 'block' }}>{offering?.is_active ? 'Active' : 'Hidden'}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Menu placement="bottom-end">
                        <MenuButton
                          as={IconButton}
                          aria-label={`Options for ${offering?.service}`}
                          icon={<MoreVertical size={16} />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem as={RLink} to={`/services/edit/${offering?.uuid}`} icon={<Pencil size={14} />}>
                            Edit
                          </MenuItem>
                          <MenuItem color="red.600" icon={<Trash2 size={14} />} onClick={() => setDeleting(offering)}>
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
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
