import { useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, Text } from '@chakra-ui/react';
import { ArrowLeft, ArrowRight, Expand, Images, Trash2 } from 'lucide-react';

export default function WorkGallery({ photos = [], onDelete, deleting = false }) {
  const [selected, setSelected] = useState(null);
  const index = photos.findIndex(photo => photo.uuid === selected);
  const active = photos[index];
  const move = delta => setSelected(photos[(index + delta + photos.length) % photos.length].uuid);
  if (!photos.length) return <Flex direction="column" align="center" textAlign="center" py={12} px={6} bg="gray.50" borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="2xl">
    <Box p={4} bg="white" borderRadius="full" color="blue.600" mb={4}><Images size={28} /></Box>
    <Text fontWeight="semibold">Work photos are on the way</Text>
    <Text color="gray.500" fontSize="sm" mt={1}>{onDelete ? 'Upload your first photo to show customers what you do.' : 'This mechanic hasn’t shared any work photos yet.'}</Text>
  </Flex>;
  return <>
    <Flex justify="space-between" align="center" mb={4} gap={3}>
      <Text color="gray.500" fontSize="sm">A closer look at completed work</Text>
      <Badge bg="blue.50" color="blue.700" borderRadius="full" px={3} py={1} textTransform="none" whiteSpace="nowrap">{photos.length} photo{photos.length === 1 ? '' : 's'}</Badge>
    </Flex>
    <SimpleGrid columns={{ base: 1, sm: 2, lg: onDelete ? 3 : 2 }} spacing={4}>
      {photos.map((photo, i) => <Box key={photo.uuid} role="group" borderRadius="2xl" overflow="hidden" bg="gray.50" borderWidth="1px" borderColor="gray.100">
        <Box as="button" type="button" position="relative" display="block" w="full" textAlign="left" onClick={() => setSelected(photo.uuid)} aria-label={`Open photo ${i + 1}: ${photo.caption || 'Completed work'}`} _focusVisible={{ outline: '3px solid', outlineColor: 'blue.500', outlineOffset: '-3px' }}>
          <Image src={photo.image} alt={photo.caption || 'Completed mechanic work'} loading="lazy" w="full" aspectRatio={4 / 3} objectFit="cover" transition="transform .25s ease" _groupHover={{ transform: 'scale(1.03)' }} />
          <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.800, transparent 65%)" />
          <Flex position="absolute" top={3} right={3} p={2} bg="blackAlpha.500" color="white" borderRadius="full"><Expand size={16} /></Flex>
          <Box position="absolute" bottom={0} p={4} color="white" w="full">
            <Text fontSize="xs" fontWeight="medium" opacity={0.8} mb={1}>WORK / {String(i + 1).padStart(2, '0')}</Text>
            <Text fontWeight="semibold" noOfLines={2} overflowWrap="anywhere">{photo.caption || 'Completed work'}</Text>
          </Box>
        </Box>
        {onDelete && <Flex px={3} py={2} justify="flex-end"><Button leftIcon={<Trash2 size={14} />} size="sm" colorScheme="red" variant="ghost" isDisabled={deleting} onClick={() => onDelete(photo)}>Delete photo</Button></Flex>}
      </Box>)}
    </SimpleGrid>
    <Modal isOpen={Boolean(active)} onClose={() => setSelected(null)} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(6px)" />
      <ModalContent bg="#101828" color="white" borderRadius="2xl" overflow="hidden" mx={3} onKeyDown={event => {
        if (photos.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
      }}>
        <ModalHeader fontSize="md" pr={12}>Work gallery</ModalHeader><ModalCloseButton />
        <ModalBody p={0}>
          <Image src={active?.image} alt={active?.caption || 'Completed work'} w="full" h="60vh" objectFit="contain" bg="black" />
          <Flex p={5} align="center" justify="space-between" gap={4}>
            <Box minW={0} aria-live="polite"><Text fontWeight="medium" overflowWrap="anywhere">{active?.caption || 'Completed work'}</Text><Text fontSize="sm" color="gray.400" mt={1}>{index + 1} of {photos.length} photos</Text></Box>
            {photos.length > 1 && <Flex gap={2}><IconButton aria-label="Previous photo" icon={<ArrowLeft size={20} />} onClick={() => move(-1)} colorScheme="whiteAlpha" /><IconButton aria-label="Next photo" icon={<ArrowRight size={20} />} onClick={() => move(1)} colorScheme="whiteAlpha" /></Flex>}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  </>;
}
