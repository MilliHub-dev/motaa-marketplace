import { useRef, useState } from 'react';
import { Box, Button, FormControl, FormLabel, Heading, Image, Input, Text } from '@chakra-ui/react';
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
  return <Box py={4} maxW="1100px" mx="auto">
    <Heading as="h1" size="lg">Gallery</Heading>
    <Text mt={2} color="gray.600">Show customers your past work. Uploaded photos appear on your public mechanic profile.</Text>
    <Box as="form" onSubmit={submit} my={6} p={5} borderWidth="1px" borderRadius="lg" bg="white">
      <FormControl><FormLabel htmlFor="gallery-photo">Work photo</FormLabel>
        <Input ref={input} id="gallery-photo" type="file" accept="image/jpeg,image/png,image/webp" p={1} onChange={choose} isDisabled={upload.loading} />
        <Text fontSize="sm" color="gray.600" mt={1}>JPEG, PNG or WebP, up to 5 MB.</Text>
      </FormControl>
      {preview && <Image src={preview} alt="Selected work photo preview" maxH="200px" mt={3} borderRadius="md" />}
      <FormControl mt={4}><FormLabel htmlFor="gallery-caption">Caption (optional)</FormLabel>
        <Input id="gallery-caption" maxLength={200} value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Brake replacement on a Toyota Corolla" isDisabled={upload.loading} />
      </FormControl>
      {error && <Text role="alert" color="red.600" mt={2}>{error}</Text>}
      <Button type="submit" mt={4} colorScheme="blue" isLoading={upload.loading}>Upload photo</Button>
    </Box>
    <AsyncState query={query} loadingLabel="Loading your gallery…">{photos => <WorkGallery photos={photos} deleting={remove.loading} onDelete={photo => {
      if (window.confirm('Delete this photo from your public gallery?')) remove.mutate(photo);
    }} />}</AsyncState>
  </Box>;
}
