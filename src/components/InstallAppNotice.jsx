// A banner inviting a business to install the Motaa web app on the device they are using,
// so their orders and customer messages are one tap away. Shown in the business dashboards.
import { useEffect, useState } from 'react';
import {
  Box, Button, Flex, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  OrderedList, Text, useDisclosure,
} from '@chakra-ui/react';
import { Download, Share } from 'lucide-react';
import { INSTALL_CHANGE_EVENT, dismissInstall, installMethod, promptInstall, wasDismissed } from '../utils/installApp';

export default function InstallAppNotice() {
  const [method, setMethod] = useState(() => (wasDismissed() ? null : installMethod()));
  const steps = useDisclosure();

  useEffect(() => {
    const update = () => setMethod(wasDismissed() ? null : installMethod());
    update();
    window.addEventListener(INSTALL_CHANGE_EVENT, update);
    return () => window.removeEventListener(INSTALL_CHANGE_EVENT, update);
  }, []);

  if (!method) return null;

  const notNow = () => { dismissInstall(); steps.onClose(); setMethod(null); };
  const install = async () => {
    if (method === 'ios') return steps.onOpen();
    const accepted = await promptInstall();
    if (!accepted) dismissInstall(); // they said no to the browser: don't nag
    setMethod(null);
    return undefined;
  };

  return (
    <>
      <Flex role="region" aria-label="Install the Motaa app" align="center" gap={3} wrap="wrap" bg="blue.50" borderWidth="1px" borderColor="blue.100"
        rounded="lg" px={4} py={3} mb={4}>
        <Flex w="36px" h="36px" rounded="full" bg="primary" color="white" align="center" justify="center" flexShrink={0} aria-hidden="true">
          <Download size={18} />
        </Flex>
        <Box flex={1} minW="200px">
          <Text fontWeight="600">Install Motaa on this device</Text>
          <Text fontSize="sm" color="gray.700">Open your orders and customer messages in one tap, like any other app. It takes a few seconds and uses almost no space.</Text>
        </Box>
        <Flex gap={2} flexShrink={0}>
          <Button size="sm" variant="ghost" onClick={notNow}>Not now</Button>
          <Button size="sm" colorScheme="blue" onClick={install}>{method === 'ios' ? 'Show me how' : 'Install'}</Button>
        </Flex>
      </Flex>

      <Modal isOpen={steps.isOpen} onClose={steps.onClose} isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>Add Motaa to your home screen</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <OrderedList spacing={3}>
              <ListItem>Open www.motaa.net in <strong>Safari</strong> (it doesn't work from inside other apps).</ListItem>
              <ListItem>
                Tap the <strong>Share</strong> button <Box as="span" display="inline-flex" verticalAlign="middle" color="primary"><Share size={16} aria-hidden="true" /></Box> at the bottom of the screen.
              </ListItem>
              <ListItem>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</ListItem>
            </OrderedList>
            <Text fontSize="sm" color="gray.600" mt={4}>Motaa will then open from its own icon, without the browser bars.</Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={notNow}>Don't show again for now</Button>
            <Button colorScheme="blue" onClick={steps.onClose}>Got it</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
