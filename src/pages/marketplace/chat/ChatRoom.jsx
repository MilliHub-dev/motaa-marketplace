import {
  Avatar,
  Box,
  Button,
  Skeleton,
  SkeletonCircle,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft, Check, ChevronDown, Send, WifiOff } from 'lucide-react';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link as RLink, useOutletContext, useParams } from 'react-router-dom';
import { GlobalStore } from '../../../App';
import { WS_URL } from '../../../config';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { CHAT_REFRESH_MS, announceChatChanged, useVisibleInterval } from '../../../hooks/useChatUnread';
import { ErrorState } from '../../../components/states';
import { ListingChatCard } from '../../../components/chat';
import { OfferCard, useOfferCheckout } from '../../../components/offers';
import { ChatInvoiceButton, TransportJobCard } from '../../../components/transport';
import { asList } from '../../../utils';
import { profilePicture } from '../../../utils';
import { assignmentActions, assignmentLabel } from '../../../utils/team';
import { latestOfferSteps } from '../../../utils/offers';
import { latestJobSteps } from '../../../utils/transport';
import { AssignmentTag } from './Layout';

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
      {msg?.listing && (
        <ListingChatCard listing={msg.listing} label={mine ? 'You asked about' : 'Asking about'} compact mb={1} />
      )}
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
      {(date || (mine && msg?.sent_by_name)) && (
        <Text fontSize="xs" color="gray.500" mt={1} textAlign={mine ? 'right' : 'left'}>
          {/* only a business sees which of its team members wrote a message */}
          {mine && msg?.sent_by_name && <>Sent by {msg.sent_by_name}{date ? ' · ' : ''}</>}
          {date && <time dateTime={date.toISOString()}>{naturalTime(date)}</time>}
        </Text>
      )}
    </Box>
  );
}

/**
 * Who in the business's team has this conversation, and the ways to change it: sales staff pick up
 * an unassigned conversation or hand back their own; the owner and managers give it to anyone.
 * Customers (room.team is null) see nothing.
 */
function RoomAssignment({ room, onAssign, isLoading }) {
  const actions = assignmentActions(room);
  if (!actions.show) return null;
  const assigned = room?.assigned_to || null;
  return (
    <HStack spacing={2} ml="auto" flexShrink={0} data-testid="room-assignment">
      {actions.canReassign ? (
        <Menu placement="bottom-end">
          <MenuButton as={Button} size="sm" variant="outline" rightIcon={<ChevronDown size={14} />} isLoading={isLoading} maxW="220px"
            aria-label={`Handled by ${assignmentLabel(assigned)}. Change who has this conversation`}>
            <Text as="span" noOfLines={1} display="block">{assignmentLabel(assigned)}</Text>
          </MenuButton>
          <MenuList zIndex={30} maxH="320px" overflowY="auto">
            <Text px={3} pb={1} fontSize="xs" color="gray.600">Give this conversation to</Text>
            {actions.members.map((member) => {
              const current = Boolean(assigned?.uuid) && assigned.uuid === member.uuid;
              return (
                <MenuItem key={member.uuid} onClick={() => { if (!current) onAssign(member.uuid); }}
                  icon={current ? <Check size={14} aria-label="Current" /> : <Box w="14px" />}>
                  <Text as="span">{member.name}</Text>
                  <Text as="span" fontSize="xs" color="gray.600" ml={2}>{member.role_label}</Text>
                </MenuItem>
              );
            })}
            {actions.members.length > 0 && <MenuDivider />}
            <MenuItem onClick={() => { if (assigned) onAssign(null); }} icon={!assigned ? <Check size={14} aria-label="Current" /> : <Box w="14px" />}>
              Unassigned
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <>
          <AssignmentTag assignedTo={assigned} />
          {actions.canPickUp && <Button size="sm" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={isLoading} onClick={() => onAssign('me')}>Pick up</Button>}
          {actions.canHandBack && <Button size="sm" variant="outline" isLoading={isLoading} onClick={() => onAssign(null)}>Hand back to team</Button>}
        </>
      )}
    </HStack>
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
  const { authUser, naturalTime, naturalDate, notify } = useContext(GlobalStore);
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
    { select: (body) => body?.data || {}, keepAs: `chat-room:${room}` }
  );

  // new room → start from its own history
  useEffect(() => { setMessages([]); setDraft(''); }, [room]);

  // ignore the previous room's data while switching rooms
  const roomData = query.data && (!query.data.uuid || String(query.data.uuid) === String(room)) ? query.data : undefined;

  useEffect(() => {
    if (!roomData) return;
    setMessages((current) => mergeMessages(current, asList(roomData.messages)));
    announceChatChanged(); // loading a conversation reads it: update the badge on the chat icon
  }, [roomData]);

  const addMessage = useCallback((msg) => {
    setMessages((current) => mergeMessages(current, [msg]));
    onRoomActivityRef.current?.(room, msg);
  }, [room]);

  // A live copy of an offer or towing/hauling job step is the same for everyone in the room: it has no
  // buttons for the person looking at it. Show the step, then load the room so the buttons and states are theirs.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const onLiveMessage = useCallback((msg) => {
    if (!msg?.offer && !msg?.transport_job) { addMessage(msg); return; }
    const known = messagesRef.current.some((item) => messageKey(item) === messageKey(msg));
    if (known) onRoomActivityRef.current?.(room, msg);
    else addMessage(msg);
    query.reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, addMessage, query.reload]);

  const socketStatus = useRoomSocket({
    room,
    token: authUser?.token,
    enabled: Boolean(roomData),
    onMessage: onLiveMessage,
    onReconnected: query.reload,
  });

  // Check for new messages in the background: every 30 seconds, or every 10 while the live
  // connection is down, so a message is never stuck until the page is refreshed.
  const { reload: reloadRoom } = query;
  const refreshRoom = useCallback(() => { reloadRoom(); }, [reloadRoom]);
  useVisibleInterval(refreshRoom, socketStatus === 'open' ? CHAT_REFRESH_MS : 10000, Boolean(roomData));

  const send = useApiMutation(
    (api, text) => api.post('/chat/message/', { room, message: text }),
    {
      errorTitle: "Couldn't send your message",
      onSuccess: (body) => {
        if (body?.data?.message) addMessage(body.data.message);
        // the first team member to reply picks an unassigned conversation up
        if (body?.data && 'assigned_to' in body.data) {
          query.setData((current) => (current ? { ...current, assigned_to: body.data.assigned_to ?? null } : current));
        }
      },
    }
  );

  // Accept, counter, decline or withdraw an offer. The owner and every team member can answer for the business.
  const [offerBusy, setOfferBusy] = useState(null); // uuid of the offer being answered
  const [offerError, setOfferError] = useState(null); // { uuid, message }: the server's refusal
  const answering = useRef(null);
  useEffect(() => { setOfferBusy(null); setOfferError(null); }, [room]);
  const offerAction = useApiMutation(
    (api, offer, action, amount) => api.post(`/chat/offers/${encodeURIComponent(offer.uuid)}/`, action === 'counter' ? { action, amount } : { action }),
    {
      notifyOnError: false, // shown on the offer card
      onSuccess: (body) => {
        if (body?.data?.message) addMessage(body.data.message);
        if (body?.data && 'assigned_to' in body.data) {
          query.setData((current) => (current ? { ...current, assigned_to: body.data.assigned_to ?? null } : current));
        }
      },
      onError: (error) => setOfferError({ uuid: answering.current, message: error.message }),
    }
  );
  async function respondToOffer(offer, action, amount) {
    if (offerBusy) return false;
    answering.current = offer.uuid;
    setOfferBusy(offer.uuid);
    setOfferError(null);
    const body = await offerAction.mutate(offer, action, amount);
    setOfferBusy(null);
    reloadRoom(); // every step of this negotiation now has a new state (and a refusal usually means it moved on)
    return Boolean(body);
  }
  const offerCheckout = useOfferCheckout();

  // After any step of a towing / hauling job (or a refusal), load the room again: every step of that
  // job now has a new state, and only the newest one has this viewer's buttons.
  const onJobChanged = useCallback((body) => {
    if (body?.data?.message) addMessage(body.data.message);
    if (body?.data && 'assigned_to' in body.data) {
      query.setData((current) => (current ? { ...current, assigned_to: body.data.assigned_to ?? null } : current));
    }
    reloadRoom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMessage, reloadRoom]);

  // keep the tag in the conversation list in step with this conversation
  const onRoomAssigned = outlet.onRoomAssigned;
  const inTeam = Boolean(roomData?.team);
  const assignedId = roomData?.assigned_to ? (roomData.assigned_to.uuid || roomData.assigned_to.name) : null;
  useEffect(() => {
    if (inTeam) onRoomAssigned?.(room, roomData?.assigned_to || null, roomData?.team);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, inTeam, assignedId, onRoomAssigned]);

  const assign = useApiMutation(
    (api, member) => api.post(`/chat/chats/${encodeURIComponent(room)}/assign/`, { member }),
    {
      errorTitle: "Couldn't change who has this conversation",
      onSuccess: (body) => {
        const updated = body?.data;
        if (updated) query.setData((current) => ({ ...current, assigned_to: updated.assigned_to ?? null, team: updated.team ?? current?.team }));
        else reloadRoom();
        if (body?.message) notify({ title: 'Done', body: body.message });
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

  // only the newest step of a negotiation has buttons
  const latestSteps = useMemo(() => latestOfferSteps(messages, messageKey), [messages]);
  const latestJobs = useMemo(() => latestJobSteps(messages, messageKey), [messages]);

  if (query.loading && roomData === undefined) return <RoomSkeleton />;
  // a 404 is final even with an earlier copy on screen (e.g. the conversation was given to someone else)
  if (query.error && (roomData === undefined || query.error.isNotFound)) {
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
      <HStack as="header" w="full" px={{ base: 2, md: 5 }} py={3} borderBottomWidth={1} spacing={3} flexShrink={0} flexWrap="wrap" rowGap={2}>
        <IconButton
          as={RLink}
          to="/chat"
          icon={<ArrowLeft size={20} />}
          variant="ghost"
          aria-label="Back to all messages"
          display={{ base: 'inline-flex', md: 'none' }}
        />
        <Avatar size="sm" name={recipient?.name} src={profilePicture(recipient)} />
        <Box minW={0} flex={1}>
          <Text as="h2" fontWeight="600" noOfLines={1}>{recipient?.name || 'Conversation'}</Text>
          {recipient?.user_type && recipient.user_type !== 'customer' && (
            <Text fontSize="xs" color="gray.500" textTransform="capitalize">{{ dealer: 'Dealership', parts_dealer: 'Parts dealer' }[recipient.user_type] || recipient.user_type}</Text>
          )}
        </Box>
        <ChatInvoiceButton room={room} recipient={recipient} onSent={onJobChanged} />
        <RoomAssignment room={roomData} onAssign={(member) => assign.mutate(member)} isLoading={assign.loading} />
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
              {group.items.map((msg) => (msg?.transport_job ? (
                <TransportJobCard
                  key={messageKey(msg)}
                  msg={msg}
                  mine={isMine(msg)}
                  latest={Boolean(msg.transport_latest) && latestJobs[msg.transport_job.uuid] === messageKey(msg)}
                  naturalTime={naturalTime}
                  onChanged={onJobChanged}
                />
              ) : msg?.offer ? (
                <OfferCard
                  key={messageKey(msg)}
                  msg={msg}
                  mine={isMine(msg)}
                  latest={Boolean(msg.offer_latest) && latestSteps[msg.offer.uuid] === messageKey(msg)}
                  naturalTime={naturalTime}
                  onAction={respondToOffer}
                  isBusy={offerBusy === msg.offer.uuid}
                  error={offerError?.uuid === msg.offer.uuid ? offerError.message : ''}
                  onCheckout={offerCheckout.go}
                  isCheckingOut={offerCheckout.loading}
                />
              ) : (
                <MessageBubble key={messageKey(msg)} msg={msg} mine={isMine(msg)} naturalTime={naturalTime} />
              )))}
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
