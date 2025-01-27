import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Text,
  Button,
  IconButton,
  Divider,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { Search, Phone, Send, Smile, Mic, MoreVertical, Check, PlayCircle } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import {GlobalStore} from '../../../App';
import {objectifyJSON} from '../../../utils';



function ChatSidebar({ conversations, activeId, onSelect }) {

  return (
    <Box
      w="300px"
      borderRightWidth={1}
      h="calc(100vh - 64px)"
      overflow="auto"
      py={4}
    >
      <VStack spacing={4} align="stretch" px={4}>
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold">
            Messages
          </Text>
          <Badge colorScheme="blue">{conversations?.length}</Badge>
        </HStack>

        <InputGroup>
          <InputLeftElement>
            <Search className="w-4 h-4 text-gray-400" />
          </InputLeftElement>
          <Input placeholder="Search..." />
        </InputGroup>
      </VStack>

      <VStack spacing={0} align="stretch" mt={4}>
        {conversations.map((conversation) => (
          <Box
            key={conversation.id}
            px={4}
            py={3}
            cursor="pointer"
            bg={activeId === conversation.id ? 'blue.50' : 'transparent'}
            _hover={{ bg: 'gray.50' }}
            onClick={() => onSelect(conversation)}
          >
            <HStack spacing={3}>
              <Box position="relative">
                <Avatar
                  size="md"
                  name={conversation?.recipient?.name}
                  src={conversation?.recipient?.image}
                />
                {conversation?.online && (
                  <Badge
                    position="absolute"
                    bottom={0}
                    right={0}
                    colorScheme="green"
                    borderRadius="full"
                    boxSize="3"
                  />
                )}
              </Box>
              <Box flex={1}>
                <HStack justify="space-between">
                  <Text fontWeight="medium">{conversation?.recipient?.name}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {conversation?.last_message?.date}
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  noOfLines={1}
                >
                  {conversation?.last_message?.message}
                </Text>
              </Box>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}


function ChatMessages({ room }) {
  const [chatRoom, setChatRoom] = useState({});
  const {authUser, axios} = useContext(GlobalStore);

  async function getData(){
    const res = await axios.get(`/chat/chats/${room.uuid}/`);
    const data = objectifyJSON(res.data);

    setChatRoom(data?.data);
  }

  useEffect(() => {
    getData();
  }, [room])

  return (
    <VStack h="full" spacing={0} w="100%">
      <HStack
        w="full"
        px={6}
        py={4}
        borderBottomWidth={1}
        justify="space-between"
      >
        <HStack spacing={4}>
          <Avatar
            size="sm"
            name={room?.recipient?.name}
            src={room?.recipient?.image}
          />
          <Box>
            <Text fontWeight="medium">{room?.recipient?.name}</Text>
            <Text fontSize="sm" color="green.500">
              Online
            </Text>
          </Box>
        </HStack>

        <HStack spacing={4}>
          <Button variant="ghost" leftIcon={<Phone size={20} />}>
            Call
          </Button>
          
          
          <IconButton
            icon={<MoreVertical size={20} />}
            variant="ghost"
            aria-label="More options"
          />
        </HStack>
      </HStack>
      
      {/* Messages Here */}
      <VStack
        flex={1}
        spacing={4}
        align="stretch"
        p={4}
        w={'100%'}
        overflowY="auto"
        h="calc(100vh - 180px)"
      >
        {chatRoom?.messages?.map((message, index) => {

          const sent = Boolean((message?.sender === authUser?.email))
          return(
            <Box key={index} alignSelf={sent ? 'flex-end' : 'flex-start'}maxW="70%">
              <Box
                bg={sent ? 'blue.500' : 'gray.100'}
                color={sent ? 'white' : 'black'}
                px={2}
                py={2} fontSize="15px"
                borderRadius="lg"
              >
                {message.text}
              </Box>

              <HStack
                spacing={1}
                justify={sent ? 'flex-end' : 'flex-start'}
                fontSize="xs"
                color="gray.500"
                mt={1}
              >
                <Text>{message.date}</Text>
                {sent && <Check size="12px" className="w-4 h-4" />}
              </HStack>
            </Box>
          )}
        )}
      </VStack>

      <HStack w="full" p={4} borderTopWidth={1} spacing={4}>
        <IconButton
          icon={<Smile size={20} />}
          variant="ghost"
          aria-label="Add emoji"
        />
        <Input placeholder="Send a message..." />
        <IconButton
          icon={<Mic size={20} />}
          variant="ghost"
          aria-label="Record voice"
        />
        <Button
          colorScheme="blue"
          rightIcon={<Send size={16} />}
        >
          Send
        </Button>
      </HStack>
    </VStack>    
  )
}


function ChatRoom() {
  const [activeConversation, setActiveConversation] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const {authUser, axios, notify} = useContext(GlobalStore);
  const [conversations, setConversations] = useState([]);

  async function getData(){
    const res = await axios.get(`/chat/chats/`);
    const data = objectifyJSON(res.data);

    setConversations(data?.data);
    console.table(data?.data)
  }

  function init(){
    getData();
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <Box bg={bgColor} h="100vh">
      <HStack spacing={0} h="calc(100vh - 64px)">
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversation}
          onSelect={setActiveConversation}
        />

        <Box flex={1} h="full">
          {activeConversation ? (
            <ChatMessages room={activeConversation} />
          ) : (
            <VStack h="full" justify="center" spacing={4} color="gray.500">
              <Text>Select a conversation to start chatting</Text>
            </VStack>
          )}
        </Box>
      </HStack>
    </Box>
  )
}

export default ChatRoom

