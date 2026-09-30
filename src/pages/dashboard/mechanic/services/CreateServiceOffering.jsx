import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useApiMutation, useApiQuery } from '../../../../hooks/useApi';
import { asList } from '../../../../utils';
import { ServiceForm } from './ServiceForm';

export const CreateServiceOffering = () => {
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState(null);
  // suggestions only: the form still works if the catalogue fails to load
  const catalogue = useApiQuery((api, signal) => api.get('/admin/mechanics/services/add/', { signal }), [], {
    select: (body) => asList(body?.data),
  });
  const create = useApiMutation((api, payload) => api.post('/admin/mechanics/services/add/', payload), {
    successMessage: (body) => body?.message || 'Service added',
    errorTitle: "Couldn't add the service",
    onSuccess: () => navigate('/services'),
    onError: (error) => setServerErrors(error.fieldErrors),
  });

  return (
    <Box py={4} maxW="1200px" mx="auto">
      <Heading as="h1" size="lg" mb={1}>Add a service</Heading>
      <Text color="gray.600" mb={6}>Customers see your active services and prices when they book you.</Text>
      <ServiceForm
        catalogue={catalogue.data}
        submitLabel="Add service"
        onSubmit={(payload) => create.mutate(payload)}
        serverErrors={serverErrors}
        isSubmitting={create.loading}
      />
    </Box>
  );
};

export default CreateServiceOffering;
