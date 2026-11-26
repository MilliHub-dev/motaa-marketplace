// One support request's conversation in a drawer: the customer's messages and Motaa support's replies, and a box
// to answer. Support is emailed about each reply; the customer is emailed when support answers.
import {
  Badge, Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  Flex, Skeleton, Stack, Text, Textarea,
} from '@chakra-ui/react';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApiMutation, useApiQuery } from '../../hooks/useApi';
import { ErrorState } from '../states';

function stamp(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function Message({ item }) {
  const staff = item.from_staff;
  return (
    <Flex justify={staff ? 'flex-start' : 'flex-end'}>
      <Box maxW="88%">
        <Text fontSize="xs" color="gray.500" mb={1} textAlign={staff ? 'left' : 'right'}>
          {staff ? 'Motaa support' : 'You'} · {stamp(item.date)}
        </Text>
        <Box px={4} py={3} borderRadius="2xl" bg={staff ? 'gray.100' : 'primary'} color={staff ? 'gray.800' : 'white'}
          borderTopLeftRadius={staff ? 'md' : '2xl'} borderTopRightRadius={staff ? '2xl' : 'md'}>
          <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">{item.body}</Text>
        </Box>
      </Box>
    </Flex>
  );
}

export default function TicketThread({ ticket, statuses, onClose, onUpdated }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const uuid = ticket?.uuid;
  const query = useApiQuery((api, signal) => api.get(`/support/tickets/${uuid}/`, { signal }), [uuid], { enabled: Boolean(uuid), select: (body) => body?.data });
  const reply = useApiMutation((api, message) => api.post(`/support/tickets/${uuid}/reply/`, { message }), {
    errorTitle: "Couldn't send your message",
    onSuccess: (body) => { setText(''); query.setData(body?.data); onUpdated?.(body?.data); },
  });
  const data = query.data;
  const status = statuses[data?.status || ticket?.status] || { label: data?.status_display || 'Open', color: 'gray' };

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [data?.thread?.length]);

  const send = () => { if (text.trim().length >= 2 && !reply.loading) reply.mutate(text.trim()); };

  return (
    <Drawer isOpen={Boolean(ticket)} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent maxW={{ base: '100vw', md: '480px' }}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor="gray.100" pr={12}>
          <Text fontSize="md" noOfLines={2}>{ticket?.subject || 'Support request'}</Text>
          <Flex gap={2} align="center" mt={1}>
            <Text fontSize="sm" color="gray.500" fontWeight="normal">#{ticket?.id}</Text>
            <Badge colorScheme={status.color} borderRadius="full" px={2} textTransform="none">{status.label}</Badge>
          </Flex>
        </DrawerHeader>
        <DrawerBody py={5} bg="gray.50">
          {query.loading && !data ? (
            <Stack spacing={4}>{[0, 1].map((i) => <Skeleton key={i} h="64px" borderRadius="xl" />)}</Stack>
          ) : query.error && !data ? (
            <ErrorState error={query.error} onRetry={query.reload} minH="160px" />
          ) : (
            <Stack spacing={4}>
              {(data?.thread || []).map((item) => <Message key={item.id} item={item} />)}
              {data?.thread?.length === 1 && (
                <Text fontSize="sm" color="gray.500" textAlign="center">Our team will reply here, and we'll email you when they do.</Text>
              )}
              <Box ref={endRef} />
            </Stack>
          )}
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" borderColor="gray.100" display="block" pb="calc(16px + env(safe-area-inset-bottom))">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" rows={3} maxLength={5000}
            aria-label="Your reply" resize="none" borderRadius="xl"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} />
          <Flex justify="space-between" align="center" mt={3} gap={3}>
            <Text fontSize="xs" color="gray.500">{data?.status === 'resolved' ? 'Replying reopens this request.' : 'We’ll email you when support replies.'}</Text>
            <Button size="sm" colorScheme="blue" bg="primary" leftIcon={<Send size={14} />} onClick={send}
              isLoading={reply.loading} isDisabled={text.trim().length < 2}>Send</Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
