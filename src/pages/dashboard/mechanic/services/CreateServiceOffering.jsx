import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { BackButton } from '../../../../components/nav';
import { PageHeader } from '../../../../components/dashboard/ui';
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
    <Box>
      <BackButton to="/services" />
      <PageHeader title="Add a service" subtitle="Customers see your active services and prices when they book you." />
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
