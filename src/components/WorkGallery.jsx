import { useState } from 'react';
import { Box, Button, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, Text } from '@chakra-ui/react';

export default function WorkGallery({ photos = [], onDelete, deleting = false }) {
  const [selected, setSelected] = useState(null);
  if (!photos.length) return <Text color="gray.600">No work photos yet.</Text>;
  return <>
    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
      {photos.map(photo => <Box key={photo.uuid} borderWidth="1px" borderRadius="lg" overflow="hidden">
        <Box as="button" type="button" display="block" w="full" onClick={() => setSelected(photo)} aria-label={`View ${photo.caption || 'work photo'}`}>
          <Image src={photo.image} alt={photo.caption || 'Completed mechanic work'} loading="lazy" w="full" aspectRatio={1} objectFit="cover" />
        </Box>
        {(photo.caption || onDelete) && <Box p={3}>
          {photo.caption && <Text overflowWrap="anywhere" fontSize="sm">{photo.caption}</Text>}
          {onDelete && <Button mt={2} size="sm" colorScheme="red" variant="outline" isDisabled={deleting} onClick={() => onDelete(photo)}>Delete photo</Button>}
        </Box>}
      </Box>)}
    </SimpleGrid>
    <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} size="3xl" isCentered>
      <ModalOverlay /><ModalContent><ModalHeader pr={12}>{selected?.caption || 'Work photo'}</ModalHeader><ModalCloseButton />
        <ModalBody pb={6}><Image src={selected?.image} alt={selected?.caption || 'Completed mechanic work'} maxH="75vh" mx="auto" objectFit="contain" /></ModalBody>
      </ModalContent>
    </Modal>
  </>;
}
