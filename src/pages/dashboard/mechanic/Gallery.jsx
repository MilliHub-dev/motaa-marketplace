import { useRef, useState } from 'react';
import { Box, Button, Flex, FormControl, FormLabel, Grid, Image, Input, Text } from '@chakra-ui/react';
import { ImagePlus } from 'lucide-react';
import { DASH, DashCard, PageHeader } from '../../../components/dashboard/ui';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { AsyncState } from '../../../components/states';
import WorkGallery from '../../../components/WorkGallery';

export default function Gallery() {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const query = useApiQuery((api, signal) => api.get('/admin/mechanics/gallery/', { signal }), [], { select: body => body.data });
  const upload = useApiMutation((api, data) => api.post('/admin/mechanics/gallery/', data), {
    successMessage: 'Photo added to your public gallery.',
    onSuccess: () => { setFile(null); setPreview(''); setCaption(''); if (input.current) input.current.value = ''; query.reload(); },
  });
  const remove = useApiMutation((api, photo) => api.delete(`/admin/mechanics/gallery/${photo.uuid}/`), {
    successMessage: 'Photo deleted.', onSuccess: () => query.reload(),
  });
  const choose = event => {
    const next = event.target.files?.[0];
    setFile(null); setPreview(''); setError('');
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type) || next.size > 5 * 1024 * 1024) {
      setError('Choose a JPEG, PNG or WebP photo up to 5 MB.'); event.target.value = ''; return;
    }
    setFile(next);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(next);
  };
  const submit = event => {
    event.preventDefault();
    if (!file) { setError('Choose a photo first.'); return; }
    const data = new FormData(); data.append('image', file); data.append('caption', caption.trim());
    upload.mutate(data);
  };
  return <Box>
    <PageHeader title="Gallery" subtitle="Show customers your past work. Photos appear on your public mechanic profile." />
    <Grid templateColumns={{ base: '1fr', xl: '360px minmax(0, 1fr)' }} gap={{ base: 4, md: 5 }} alignItems="start">
      <DashCard title="Add a photo" subtitle="JPEG, PNG or WebP, up to 5 MB." position={{ xl: 'sticky' }} top={{ xl: '112px' }}>
        <Box as="form" onSubmit={submit}>
          <FormControl>
            <FormLabel htmlFor="gallery-photo" m={0} cursor="pointer">
              <Flex direction="column" align="center" justify="center" gap={2} h="190px" borderRadius="18px" border="2px dashed" overflow="hidden"
                borderColor={preview ? 'transparent' : '#D6DBE3'} bg={DASH.page} color={DASH.muted} _hover={{ borderColor: DASH.blue, color: DASH.blue }}>
                {preview ? <Image src={preview} alt="Selected work photo preview" w="100%" h="100%" objectFit="cover" /> : (
                  <><ImagePlus size={28} /><Text fontWeight="600">Choose a photo</Text><Text fontSize="xs">Tap to browse</Text></>
                )}
              </Flex>
            </FormLabel>
            <Input ref={input} id="gallery-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} isDisabled={upload.loading}
              position="absolute" w="1px" h="1px" opacity={0} />
          </FormControl>
          <FormControl mt={4}><FormLabel htmlFor="gallery-caption">Caption (optional)</FormLabel>
            <Input id="gallery-caption" maxLength={200} value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Brake replacement on a Toyota Corolla"
              isDisabled={upload.loading} borderRadius="12px" />
          </FormControl>
          {error && <Text role="alert" color="red.600" mt={2} fontSize="sm">{error}</Text>}
          <Button type="submit" mt={4} w="100%" h="48px" borderRadius="full" bg={DASH.ink} color="white" _hover={{ bg: '#1F2937' }} isLoading={upload.loading}>Upload photo</Button>
        </Box>
      </DashCard>
      <DashCard title="Your work" subtitle="Customers see these on your profile.">
        <AsyncState query={query} loadingLabel="Loading your gallery…">{photos => <WorkGallery photos={photos} deleting={remove.loading} onDelete={photo => {
          if (window.confirm('Delete this photo from your public gallery?')) remove.mutate(photo);
        }} />}</AsyncState>
      </DashCard>
    </Grid>
  </Box>;
}
