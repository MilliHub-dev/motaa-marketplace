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
  useMediaQuery,
  useColorModeValue,
} from '@chakra-ui/react';
import { Search, Phone, Send, Smile, Mic, MoreVertical, Check, PlayCircle } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import {GlobalStore} from '../../../App';
import {objectifyJSON} from '../../../utils';
import {useParams, Outlet, Link} from 'react-router-dom';


function ChatSidebar({ conversations, activeId, onSelect, ...props }) {

  return (
    <Box
      w="300px"
      borderRightWidth={1}
      position="relative"
      h="calc(100vh - 65px)"
      overflow="auto"
      py={4}
      {...props}
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
          <Input onInput={console.log} placeholder="Search..." />
        </InputGroup>
      </VStack>

      <VStack spacing={0} align="stretch" mt={4}>
        {conversations.map((conversation) => (
          <Box
            key={conversation.id}
            px={4}
            py={3}
            cursor="pointer"
            as={Link}
            to={`${conversation.uuid}`}
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

function ChatLayout() {
  const {room} = useParams();
  const bgColor = useColorModeValue('white', 'gray.800');
  const [isMobile] = useMediaQuery('(max-width: 568px)')
  const {authUser, axios, apiUrl, notify} = useContext(GlobalStore);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoadingState] = useState(true);


  async function getData(){
    const res = await axios.get(`/chat/chats/`);
    const data = objectifyJSON(res.data);
    setConversations(data?.data);
  }

  function init(){
    getData();
  }

  useEffect(() => {
    setLoadingState(true);
    init();
    setTimeout(()=> setLoadingState(false), 500)
  }, [])

  if (loading){
    return null
  }

  return (
    <Box position="fixed" left={'0px'} width={'100%'} height="100%">
      <HStack spacing={0}>
      {room && isMobile ? null :
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversation}
          onSelect={setActiveConversation}
          width={isMobile ? '100%' : '300px'}
        />
      }

        <Box w={room && "calc(100vw - 300px)"} h="calc(100vh - 75px)" position="relative">
          {
            room &&
            <Outlet />
          }
        </Box>

        {(!room && !isMobile) && 
          <Box flex={1} h="full">
            <VStack h="full" justify="center" spacing={4} color="gray.500">
              <Text>Select a conversation to start chatting</Text>
            </VStack>
          </Box>
        }
      </HStack>
    </Box>
  )
}

export default ChatLayout

