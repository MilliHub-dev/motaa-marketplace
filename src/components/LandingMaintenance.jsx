import {
  Box, Button, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, Text, useDisclosure,
} from '@chakra-ui/react';

// Keep landing-page navigation and informational pages available while
// platform actions share one accessible maintenance dialog.
export default function LandingMaintenance({ enabled, children }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  function interceptAction(event) {
    if (!enabled) return;
    const action = event.target.closest('[data-maintenance], a[href]');
    if (!action) return;

    if (!action.hasAttribute('data-maintenance')) {
      const url = new URL(action.href, window.location.origin);
      if (url.origin !== window.location.origin || url.hash ||
          ['/', '/privacy-policy', '/terms-of-service'].includes(url.pathname)) return;
    }

    event.preventDefault();
    event.stopPropagation();
    onOpen();
  }

  function interceptSubmit(event) {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    onOpen();
  }

  return (
    <>
      <Box onClickCapture={interceptAction} onSubmitCapture={interceptSubmit}>
        {children}
      </Box>
      <Modal isOpen={enabled && isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
          <Box h={2} bg="tertiary" />
          <ModalCloseButton top={4} />
          <ModalHeader pt={8} px={8} color="primary">
            <Text fontSize="4xl" mb={3} aria-hidden="true">🚗 🔧</Text>
            A quick pit stop!
          </ModalHeader>
          <ModalBody px={8}>
            <Text color="gray.600" lineHeight="tall">
              Motaa is in the garage for a little tune-up. We’re giving the
              platform some extra polish so your next ride is even smoother.
            </Text>
            <Text mt={4} fontWeight="semibold" color="secondary">
              We’re under maintenance — check back later. We’ll save you a seat!
            </Text>
          </ModalBody>
          <ModalFooter px={8} pb={8} pt={6}>
            <Button w="full" bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={onClose}>
              Got it — see you soon!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
