import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useApiMutation, useApiQuery } from '../../../../hooks/useApi';
import { AsyncState } from '../../../../components/states';
import { asList } from '../../../../utils';
import { ServiceForm } from './ServiceForm';

export default function EditServiceOffering() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState(null);
  const offering = useApiQuery(
    (api, signal) => api.get(`/admin/mechanics/services/${encodeURIComponent(serviceId)}/`, { signal }),
    [serviceId],
    { select: (body) => body?.data }
  );
  const catalogue = useApiQuery((api, signal) => api.get('/admin/mechanics/services/add/', { signal }), [], {
    select: (body) => asList(body?.data),
  });
  const save = useApiMutation((api, payload) => api.post(`/admin/mechanics/services/${encodeURIComponent(serviceId)}/`, payload), {
    successMessage: 'Service updated',
    errorTitle: "Couldn't save the service",
    onSuccess: () => navigate('/services'),
    onError: (error) => setServerErrors(error.fieldErrors),
  });

  return (
    <Box py={4} maxW="1200px" mx="auto">
      <Heading as="h1" size="lg" mb={1}>Edit service</Heading>
      <Text color="gray.600" mb={6}>Update the name, price or visibility of this service.</Text>
      <AsyncState query={offering} loadingLabel="Loading service…" errorTitle="We couldn't load this service">
        {(data) => (
          <ServiceForm
            key={data?.uuid}
            initialValues={{
              title: data?.service || '',
              charge: data?.charge ?? '',
              charge_rate: data?.charge_rate === 'hourly' ? 'hourly' : 'flat',
              is_active: !!data?.is_active,
            }}
            catalogue={catalogue.data}
            submitLabel="Save changes"
            onSubmit={(payload) => save.mutate(payload)}
            serverErrors={serverErrors}
            isSubmitting={save.loading}
          />
        )}
      </AsyncState>
    </Box>
  );
}
