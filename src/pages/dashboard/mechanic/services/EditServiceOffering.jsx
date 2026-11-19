import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useApiMutation, useApiQuery } from '../../../../hooks/useApi';
import { AsyncState } from '../../../../components/states';
import { asList } from '../../../../utils';
import { ServiceForm } from './ServiceForm';
import { BackButton } from '../../../../components/nav';
import { PageHeader } from '../../../../components/dashboard/ui';

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
    <Box>
      <BackButton to="/services" />
      <PageHeader title="Edit service" subtitle="Update the name, price or visibility of this service." />
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
