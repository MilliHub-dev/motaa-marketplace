import {
  Avatar,
  Box,
  Button,
  Skeleton,
  SkeletonCircle,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft, Send, WifiOff } from 'lucide-react';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link as RLink, useOutletContext, useParams } from 'react-router-dom';
import { GlobalStore } from '../../../App';
import { WS_URL } from '../../../config';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { ErrorState } from '../../../components/states';
import { asList } from '../../../utils';

const MAX_LENGTH = 4000;
const MAX_BACKOFF = 30000;

const messageKey = (msg) => String(msg?.uuid || msg?.id || '');

/** Merge messages by id (history and live messages can arrive in any order), oldest first. */
function mergeMessages(current, incoming) {
  const byKey = new Map();
  for (const msg of [...current, ...incoming]) {
    const key = messageKey(msg);
    if (!key) continue;
    byKey.set(key, { ...byKey.get(key), ...msg });
  }
  return [...byKey.values()].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
}

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function dayLabel(date, naturalDate) {
  if (!date) return '';
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(new Date()) - startOf(date)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return naturalDate(date);
}

/**
 * Live connection to the room. Receives new messages; reconnects with backoff.
 * status: connecting | open | reconnecting
 */
function useRoomSocket({ room, token, enabled, onMessage, onReconnected }) {
  const [status, setStatus] = useState('connecting');
  const handlers = useRef({ onMessage, onReconnected });
  handlers.current = { onMessage, onReconnected };

  useEffect(() => {
    if (!enabled || !room || !token) return undefined;
    let socket = null;
    let retryTimer = null;
    let attempts = 0;
    let stopped = false;
    let everOpened = false;

    const connect = () => {
      if (stopped) return;
      clearTimeout(retryTimer);
      setStatus(everOpened || attempts > 0 ? 'reconnecting' : 'connecting');
      socket = new WebSocket(`${WS_URL}/chat/${encodeURIComponent(room)}/?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        const wasReconnect = everOpened;
        everOpened = true;
        attempts = 0;
        setStatus('open');
        // pick up anything sent while we were disconnected
        if (wasReconnect) handlers.current.onReconnected?.();
      };
      socket.onmessage = (event) => {
        let data = null;
        try { data = JSON.parse(event.data); } catch { return; }
        if (data && !data.type && (data.uuid || data.id)) handlers.current.onMessage?.(data);
      };
      socket.onclose = () => {
        if (stopped) return;
        attempts += 1;
        setStatus('reconnecting');
        const delay = Math.min(MAX_BACKOFF, 1000 * 2 ** Math.min(attempts - 1, 5));
        retryTimer = setTimeout(connect, delay);
      };
    };

    const reconnectNow = () => {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
      attempts = 0;
      connect();
    };

    connect();
    window.addEventListener('online', reconnectNow);
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      window.removeEventListener('online', reconnectNow);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [room, token, enabled]);

  return status;
}

function MessageBubble({ msg, mine, naturalTime }) {
  const date = toDate(msg?.date_created);
  return (
    <Box alignSelf={mine ? 'flex-end' : 'flex-start'} maxW={{ base: '85%', md: '70%' }}>
      <Box
        bg={mine ? 'secondary' : 'accent'}
        color={mine ? 'white' : 'gray.800'}
        px={3}
        py={2}
        fontSize="15px"
        borderRadius="lg"
        borderBottomRightRadius={mine ? 'sm' : 'lg'}
        borderBottomLeftRadius={mine ? 'lg' : 'sm'}
        whiteSpace="pre-wrap"
        overflowWrap="anywhere"
      >
        {msg?.text}
      </Box>
      {date && (
        <Text fontSize="xs" color="gray.500" mt={1} textAlign={mine ? 'right' : 'left'}>
          <time dateTime={date.toISOString()}>{naturalTime(date)}</time>
        </Text>
      )}
    </Box>
  );
}

function RoomSkeleton() {
  return (
    <Flex direction="column" h="100%" role="status" aria-label="Loading conversation">
      <HStack px={5} py={3} borderBottomWidth={1} spacing={3}>
        <SkeletonCircle size="8" />
        <Skeleton h="14px" w="160px" />
      </HStack>
      <VStack flex={1} align="stretch" spacing={4} p={6}>
        {[60, 40, 70, 35].map((w, i) => (
          <Skeleton key={i} h="38px" w={`${w}%`} alignSelf={i % 2 ? 'flex-end' : 'flex-start'} borderRadius="lg" />
        ))}
      </VStack>
    </Flex>
  );
}

function ChatRoom() {
  const { room } = useParams();
  const { authUser, naturalTime, naturalDate } = useContext(GlobalStore);
  const outlet = useOutletContext() || {};
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const onRoomActivityRef = useRef(outlet.onRoomActivity);
  onRoomActivityRef.current = outlet.onRoomActivity;

  const query = useApiQuery(
    (api, signal) => api.get(`/chat/chats/${encodeURIComponent(room)}/`, { signal }),
    [room],
    { select: (body) => body?.data || {} }
  );

  // new room → start from its own history
  useEffect(() => { setMessages([]); setDraft(''); }, [room]);

  // ignore the previous room's data while switching rooms
  const roomData = query.data && (!query.data.uuid || String(query.data.uuid) === String(room)) ? query.data : undefined;

  useEffect(() => {
    if (roomData) setMessages((current) => mergeMessages(current, asList(roomData.messages)));
  }, [roomData]);

  const addMessage = useCallback((msg) => {
    setMessages((current) => mergeMessages(current, [msg]));
    onRoomActivityRef.current?.(room, msg);
  }, [room]);

  const socketStatus = useRoomSocket({
    room,
    token: authUser?.token,
    enabled: Boolean(roomData),
    onMessage: addMessage,
    onReconnected: query.reload,
  });

  const send = useApiMutation(
    (api, text) => api.post('/chat/message/', { room, message: text }),
    {
      errorTitle: "Couldn't send your message",
      onSuccess: (body) => {
        if (body?.data?.message) addMessage(body.data.message);
      },
    }
  );

  const recipient = roomData?.recipient || {};
  const isMine = useCallback((msg) => {
    if (msg?.sender_uuid && recipient?.uuid) return msg.sender_uuid !== recipient.uuid;
    return Boolean(authUser?.email) && String(msg?.sender || '').toLowerCase() === authUser.email.toLowerCase();
  }, [recipient?.uuid, authUser?.email]);

  // keep the newest message in view
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSubmit(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || text.length > MAX_LENGTH || send.loading) return;
    const result = await send.mutate(text);
    if (result) {
      setDraft('');
      if (inputRef.current) inputRef.current.style.height = '';
    }
  }

  const grouped = useMemo(() => {
    const groups = [];
    for (const msg of messages) {
      const label = dayLabel(toDate(msg?.date_created), naturalDate) || 'Earlier';
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(msg);
      else groups.push({ label, items: [msg] });
    }
    return groups;
  }, [messages, naturalDate]);

  if (query.loading && roomData === undefined) return <RoomSkeleton />;
  if (query.error && roomData === undefined) {
    return (
      <Flex direction="column" h="100%" align="center" justify="center" p={4}>
        <ErrorState
          error={query.error}
          onRetry={query.reload}
          title={query.error.isNotFound ? 'Conversation not found' : undefined}
        />
        <Button as={RLink} to="/chat" variant="link" color="primary">Back to messages</Button>
      </Flex>
    );
  }

  const tooLong = draft.trim().length > MAX_LENGTH;
  const statusText = socketStatus === 'open' ? null : socketStatus === 'connecting' ? 'Connecting…' : 'Reconnecting…';

  return (
    <Flex direction="column" h="100%" minH={0} bg="white">
      {/* Header */}
      <HStack as="header" w="full" px={{ base: 2, md: 5 }} py={3} borderBottomWidth={1} spacing={3} flexShrink={0}>
        <IconButton
          as={RLink}
          to="/chat"
          icon={<ArrowLeft size={20} />}
          variant="ghost"
          aria-label="Back to all messages"
          display={{ base: 'inline-flex', md: 'none' }}
        />
        <Avatar size="sm" name={recipient?.name} src={recipient?.image || undefined} />
        <Box minW={0} flex={1}>
          <Text as="h2" fontWeight="600" noOfLines={1}>{recipient?.name || 'Conversation'}</Text>
          {recipient?.user_type && recipient.user_type !== 'customer' && (
            <Text fontSize="xs" color="gray.500" textTransform="capitalize">{recipient.user_type === 'dealer' ? 'Dealership' : recipient.user_type}</Text>
          )}
        </Box>
      </HStack>

      {statusText && (
        <HStack role="status" aria-live="polite" px={4} py={1.5} bg="yellow.50" color="yellow.800" fontSize="sm" spacing={2} flexShrink={0}>
          <WifiOff size={14} aria-hidden="true" />
          <Text>{statusText} New messages may be delayed, but you can still send.</Text>
        </HStack>
      )}

      {/* Messages */}
      <Box flex={1} minH={0} overflowY="auto" px={{ base: 3, md: 6 }} py={4} role="log" aria-live="polite" aria-label={`Messages with ${recipient?.name || 'this contact'}`}>
        {messages.length === 0 ? (
          <Flex h="100%" align="center" justify="center" textAlign="center" color="gray.500" px={6}>
            <Text fontSize="sm">No messages yet. Say hello to {recipient?.name || 'start the conversation'}.</Text>
          </Flex>
        ) : (
          grouped.map((group) => (
            <VStack key={group.label} spacing={3} align="stretch" mb={4}>
              <Text alignSelf="center" fontSize="xs" color="gray.500" bg="gray.50" px={3} py={1} rounded="full">{group.label}</Text>
              {group.items.map((msg) => (
                <MessageBubble key={messageKey(msg)} msg={msg} mine={isMine(msg)} naturalTime={naturalTime} />
              ))}
            </VStack>
          ))
        )}
        <Box ref={bottomRef} />
      </Box>

      {/* Composer */}
      <Box as="form" onSubmit={handleSubmit} borderTopWidth={1} px={{ base: 2, md: 4 }} py={3} flexShrink={0} bg="white">
        <HStack align="flex-end" spacing={2}>
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Write a message…"
            aria-label="Message"
            aria-invalid={tooLong || undefined}
            rows={1}
            minH="42px"
            maxH="140px"
            resize="none"
            overflowY="auto"
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
          />
          <IconButton
            type="submit"
            icon={<Send size={18} />}
            aria-label="Send message"
            bg="primary"
            color="white"
            _hover={{ bg: 'secondary' }}
            isLoading={send.loading}
            isDisabled={!draft.trim() || tooLong}
            h="42px"
            minW="42px"
          />
        </HStack>
        <Text fontSize="xs" color={tooLong ? 'red.500' : 'gray.500'} mt={1} display={{ base: tooLong ? 'block' : 'none', md: 'block' }}>
          {tooLong ? `Messages can be at most ${MAX_LENGTH} characters.` : 'Enter to send, Shift + Enter for a new line'}
        </Text>
      </Box>
    </Flex>
  );
}

export default ChatRoom;
