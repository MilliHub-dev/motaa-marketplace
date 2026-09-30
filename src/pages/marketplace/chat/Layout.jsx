import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  SkeletonCircle,
  Text,
  VStack,
} from '@chakra-ui/react';
import { MessageCircle, Search } from 'lucide-react';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link as RLink, Outlet, useParams } from 'react-router-dom';
import { GlobalStore } from '../../../App';
import { useApiQuery } from '../../../hooks/useApi';
import { EmptyState, ErrorState } from '../../../components/states';
import { asList } from '../../../utils';

/** Height from the element's top to the bottom of the viewport (the navbar above varies by user type). */
function useFillViewport() {
  const ref = useRef(null);
  const [height, setHeight] = useState('calc(100dvh - 72px)');
  useLayoutEffect(() => {
    const measure = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top + window.scrollY;
      setHeight(`calc(100dvh - ${Math.max(0, Math.round(top))}px)`);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return [ref, height];
}

function lastMessageTime(conversation, naturalTime, naturalDate) {
  const raw = conversation?.last_message?.date_created;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString() ? naturalTime(date) : naturalDate(date);
}

function ListSkeleton() {
  return (
    <VStack align="stretch" spacing={0} role="status" aria-label="Loading conversations">
      {[0, 1, 2, 3].map((i) => (
        <HStack key={i} px={4} py={3} spacing={3}>
          <SkeletonCircle size="10" />
          <Box flex={1}>
            <Skeleton h="12px" w="60%" mb={2} />
            <Skeleton h="10px" w="85%" />
          </Box>
        </HStack>
      ))}
    </VStack>
  );
}

function ConversationList({ query, activeId, search, setSearch, userType }) {
  const { naturalTime, naturalDate } = useContext(GlobalStore);
  const conversations = asList(query.data);
  const term = search.trim().toLowerCase();
  const filtered = term
    ? conversations.filter((c) =>
        `${c?.recipient?.name || ''} ${c?.last_message?.message || ''}`.toLowerCase().includes(term))
    : conversations;

  let body;
  if (query.loading && query.data === undefined) {
    body = <ListSkeleton />;
  } else if (query.error && query.data === undefined) {
    body = <ErrorState error={query.error} onRetry={query.reload} minH="200px" />;
  } else if (conversations.length === 0) {
    const business = userType === 'dealer' || userType === 'mechanic';
    body = (
      <EmptyState
        icon={MessageCircle}
        title="No conversations yet"
        description={business
          ? 'When a customer messages you from one of your listings or your profile, the conversation will appear here.'
          : 'Chats start when you message a dealer from a car listing or a mechanic from their profile. Your conversations will appear here.'}
        action={business ? undefined : { label: 'Browse cars', to: '/buy' }}
        minH="280px"
      />
    );
  } else if (filtered.length === 0) {
    body = <Text px={4} py={6} fontSize="sm" color="gray.500">No conversations match “{search.trim()}”.</Text>;
  } else {
    body = (
      <Box as="ul" listStyleType="none" m={0} p={0}>
        {filtered.map((conversation) => {
          const active = String(conversation?.uuid) === String(activeId);
          const time = lastMessageTime(conversation, naturalTime, naturalDate);
          return (
            <Box as="li" key={conversation?.uuid || conversation?.id}>
              <HStack
                as={RLink}
                to={`/chat/${conversation?.uuid}`}
                aria-current={active ? 'page' : undefined}
                spacing={3}
                px={4}
                py={3}
                bg={active ? 'blue.50' : 'transparent'}
                borderLeftWidth="3px"
                borderLeftColor={active ? 'primary' : 'transparent'}
                _hover={{ bg: active ? 'blue.50' : 'gray.50' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'primary', outlineOffset: '-2px' }}
              >
                <Avatar size="md" name={conversation?.recipient?.name} src={conversation?.recipient?.image || undefined} />
                <Box flex={1} minW={0}>
                  <HStack justify="space-between" spacing={2}>
                    <Text fontWeight="600" noOfLines={1}>{conversation?.recipient?.name || 'Conversation'}</Text>
                    {time && <Text fontSize="xs" color="gray.500" flexShrink={0}>{time}</Text>}
                  </HStack>
                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                    {conversation?.last_message?.message || 'No messages yet'}
                  </Text>
                </Box>
              </HStack>
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Flex direction="column" h="100%" minH={0}>
      <VStack spacing={3} align="stretch" px={4} pt={4} pb={3} flexShrink={0}>
        <HStack justify="space-between">
          <Text as="h1" fontSize="xl" fontWeight="bold">Messages</Text>
          {conversations.length > 0 && <Badge colorScheme="blue" borderRadius="full" px={2}>{conversations.length}</Badge>}
        </HStack>
        {conversations.length > 0 && (
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none" color="gray.400">
              <Search size={16} aria-hidden="true" />
            </InputLeftElement>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
            />
          </InputGroup>
        )}
      </VStack>
      <Box flex={1} minH={0} overflowY="auto">{body}</Box>
    </Flex>
  );
}

function ChatLayout() {
  const { room } = useParams();
  const { authUser } = useContext(GlobalStore);
  const [containerRef, height] = useFillViewport();
  const [search, setSearch] = useState('');

  const query = useApiQuery(
    (api, signal) => api.get('/chat/chats/', { signal }),
    [],
    { select: (body) => asList(body?.data) }
  );
  const { setData, reload } = query;

  useEffect(() => { document.title = 'Messages | Motaa'; }, []);

  // a room we don't know yet (e.g. just started from a listing) → refresh the list
  const known = useMemo(() => asList(query.data).some((c) => String(c?.uuid) === String(room)), [query.data, room]);
  useEffect(() => {
    if (room && query.data !== undefined && !known) reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // live messages bump the conversation to the top with its new preview
  const onRoomActivity = useCallback((roomId, msg) => {
    setData((list) => {
      const items = asList(list);
      const index = items.findIndex((c) => String(c?.uuid) === String(roomId));
      if (index === -1) return list;
      const updated = {
        ...items[index],
        last_message: { message: msg?.text, date_created: msg?.date_created, sender_uuid: msg?.sender_uuid },
      };
      return [updated, ...items.slice(0, index), ...items.slice(index + 1)];
    });
  }, [setData]);

  return (
    <Flex ref={containerRef} h={height} minH="360px" w="100%" overflow="hidden" borderTopWidth={1} bg="white">
      <Box
        as="nav"
        aria-label="Conversations"
        w={{ base: '100%', md: '320px', lg: '360px' }}
        flexShrink={0}
        borderRightWidth={{ base: 0, md: 1 }}
        display={{ base: room ? 'none' : 'block', md: 'block' }}
        h="100%"
      >
        <ConversationList query={query} activeId={room} search={search} setSearch={setSearch} userType={authUser?.user_type} />
      </Box>

      <Box flex={1} minW={0} h="100%" display={{ base: room ? 'block' : 'none', md: 'block' }}>
        {room ? (
          <Outlet context={{ onRoomActivity }} />
        ) : (
          <Flex h="100%" direction="column" align="center" justify="center" color="gray.500" gap={3} bg="gray.50" px={6} textAlign="center">
            <MessageCircle size={40} aria-hidden="true" />
            <Text>Select a conversation to start chatting</Text>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

export default ChatLayout;
