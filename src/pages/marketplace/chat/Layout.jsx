import {
  Avatar,
  Badge,
  Box,
  Button,
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
import { CHAT_REFRESH_MS, useVisibleInterval } from '../../../hooks/useChatUnread';
import { EmptyState, ErrorState } from '../../../components/states';
import { asList, BUSINESS_USER_TYPES } from '../../../utils';
import { profilePicture } from '../../../utils';
import { assignmentLabel, chatFilters, filterConversations, hasTeam, teamRole } from '../../../utils/team';

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

/** Who in the business's team has the conversation. Customers never get one. */
export function AssignmentTag({ assignedTo, ...props }) {
  return (
    <Badge colorScheme={!assignedTo ? 'orange' : assignedTo.mine ? 'green' : 'gray'} variant="subtle" textTransform="none" fontWeight="600"
      borderRadius="full" px={2} maxW="160px" display="inline-block" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" verticalAlign="middle" {...props}>
      {assignmentLabel(assignedTo)}
    </Badge>
  );
}

function ConversationList({ query, activeId, search, setSearch, userType, filters, filter, setFilter }) {
  const { naturalTime, naturalDate } = useContext(GlobalStore);
  const conversations = asList(query.data);
  const showTeam = filters.length > 0;
  const term = search.trim().toLowerCase();
  const inFilter = showTeam ? filterConversations(conversations, filter) : conversations;
  const filtered = term
    ? inFilter.filter((c) =>
        `${c?.recipient?.name || ''} ${c?.last_message?.message || ''}`.toLowerCase().includes(term))
    : inFilter;

  let body;
  if (query.loading && query.data === undefined) {
    body = <ListSkeleton />;
  } else if (query.error && query.data === undefined) {
    body = <ErrorState error={query.error} onRetry={query.reload} minH="200px" />;
  } else if (conversations.length === 0) {
    const business = BUSINESS_USER_TYPES.includes(userType);
    body = (
      <EmptyState
        icon={MessageCircle}
        title="No conversations yet"
        description={business
          ? 'When a customer messages you from one of your listings, parts or your profile, the conversation will appear here.'
          : 'Chats start when you message a dealer from a car listing, a mechanic from their profile or a seller from a spare part. Your conversations will appear here.'}
        action={business ? undefined : { label: 'Browse cars', to: '/buy' }}
        minH="280px"
      />
    );
  } else if (filtered.length === 0) {
    body = (
      <Text px={4} py={6} fontSize="sm" color="gray.600">
        {term ? `No conversations match “${search.trim()}”.`
          : filter === 'mine' ? "You haven't picked up any conversations yet. Reply to an unassigned one to make it yours."
          : filter === 'unassigned' ? 'Every conversation has someone looking after it.'
          : 'No conversations have been picked up yet.'}
      </Text>
    );
  } else {
    body = (
      <Box as="ul" listStyleType="none" m={0} p={0}>
        {filtered.map((conversation) => {
          const active = String(conversation?.uuid) === String(activeId);
          const time = lastMessageTime(conversation, naturalTime, naturalDate);
          const unread = active ? 0 : Number(conversation?.unread) || 0;
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
                <Avatar size="md" name={conversation?.recipient?.name} src={profilePicture(conversation?.recipient)} />
                <Box flex={1} minW={0}>
                  <HStack justify="space-between" spacing={2}>
                    <Text fontWeight="600" noOfLines={1}>{conversation?.recipient?.name || 'Conversation'}</Text>
                    {time && <Text fontSize="xs" color="gray.500" flexShrink={0}>{time}</Text>}
                  </HStack>
                  {showTeam && <AssignmentTag assignedTo={conversation?.assigned_to} fontSize="11px" mb={0.5} />}
                  <HStack justify="space-between" spacing={2}>
                    <Text fontSize="sm" color={unread ? 'gray.800' : 'gray.500'} fontWeight={unread ? '600' : 'normal'} noOfLines={1}>
                      {conversation?.last_message?.message || 'No messages yet'}
                    </Text>
                    {unread > 0 && (
                      <Flex minW="20px" h="20px" px={1.5} rounded="full" bg="red.500" color="white" fontSize="11px" fontWeight="700"
                        align="center" justify="center" flexShrink={0} aria-label={`${unread} unread`}>
                        {unread > 99 ? '99+' : unread}
                      </Flex>
                    )}
                  </HStack>
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
        {showTeam && conversations.length > 0 && (
          <HStack spacing={2} role="group" aria-label="Filter conversations by who has them">
            {filters.map((option) => (
              <Button key={option.value} size="xs" borderRadius="full" aria-pressed={filter === option.value}
                variant={filter === option.value ? 'solid' : 'outline'}
                {...(filter === option.value ? { bg: 'primary', color: 'white', _hover: { bg: 'secondary' } } : {})}
                onClick={() => setFilter(option.value)}>
                {option.label}
              </Button>
            ))}
          </HStack>
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
  const [filter, setFilter] = useState('all');
  const role = teamRole(authUser);

  const query = useApiQuery(
    (api, signal) => api.get('/chat/chats/', { signal }),
    [],
    { select: (body) => asList(body?.data) }
  );
  const { setData, reload } = query;

  // An owner working alone has no use for "Unassigned" tags: the login says whether there is a team
  // (`has_team`), and so does an open conversation, in case the team started since.
  const [roomHasTeam, setRoomHasTeam] = useState(false);
  const showTeam = hasTeam(authUser) || roomHasTeam || asList(query.data).some((c) => c?.assigned_to);
  const filters = useMemo(() => (showTeam ? chatFilters(role) : []), [showTeam, role]);

  // keep the list fresh while the page is open
  const refreshList = useCallback(() => { reload(); }, [reload]);
  useVisibleInterval(refreshList, CHAT_REFRESH_MS);

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
        unread: 0, // it arrived in the conversation they have open
        last_message: { message: msg?.text, date_created: msg?.date_created, sender_uuid: msg?.sender_uuid },
      };
      return [updated, ...items.slice(0, index), ...items.slice(index + 1)];
    });
  }, [setData]);

  // the open conversation was picked up, handed back or given to someone
  const onRoomAssigned = useCallback((roomId, assignedTo, team) => {
    if (team?.has_team) setRoomHasTeam(true);
    setData((list) => asList(list).map((c) => (String(c?.uuid) === String(roomId) ? { ...c, assigned_to: assignedTo || null } : c)));
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
        <ConversationList query={query} activeId={room} search={search} setSearch={setSearch} userType={authUser?.user_type}
          filters={filters} filter={filter} setFilter={setFilter} />
      </Box>

      <Box flex={1} minW={0} h="100%" display={{ base: room ? 'block' : 'none', md: 'block' }}>
        {room ? (
          <Outlet context={{ onRoomActivity, onRoomAssigned }} />
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
