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
  Flex,
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
import {useParams, Link} from 'react-router-dom';
import {ChevronLeftIcon, CloseIcon} from '@chakra-ui/icons';


function ChatRoom() {
  const DEBUG = JSON.parse(import.meta.env.VITE_DEBUG) || false;
  const [chatRoom, setChatRoom] = useState({});
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const {authUser, axios} = useContext(GlobalStore);
  const [socket, setSocket] = useState(null);
  const {room} = useParams();
  const socketUrl = DEBUG ? 'ws://localhost:8000' : 'wss://server.motaa.net'

  async function getData(){
    const res = await axios.get(`/chat/chats/${room}/`);
    const data = objectifyJSON(res.data);

    setChatRoom(data?.data);
    setMessages(data?.data?.messages);
    setMembers(data?.data?.members);
  }

  
  useEffect(() => {
    getData();
    if (!room) return;

    const chatSocket = new WebSocket(`${socketUrl}/chat/${room}/?token=${authUser?.token}`);
    setSocket(chatSocket);

    chatSocket.onmessage = function (ev) {
      const data = JSON.parse(ev.data);
      setMessages((prevMessages) => [...prevMessages, data]);
    };

    chatSocket.onclose = function () {
      console.error('Chat socket closed unexpectedly');
    };

    return () => {
      chatSocket.close();
    };
  }, [room]);

  function sendMessage() {
    if (!message.trim()) return;
    if (!socket) return;

    socket.send(
      JSON.stringify({
        message_type: 'text', // text | image | document
        message,
        attachments
      })
    );
    setMessage('');
    setAttachments([])
  }

  const otherPerson = members?.find(mem => mem.email !== authUser.email)

  return (
    <VStack position="absolute" h={"calc(100vh - 70px)"} left={"0px"} spacing={0} w="100%">
      <HStack
        w="full"
        px={6}
        py={3}
        borderBottomWidth={1}
        justify="space-between"
      >
        <HStack spacing={4}>
          <Button as={Link} to='/chat/' variant="ghost"> <CloseIcon size="30px" /> </Button>
          <Avatar
            size="sm"
            name={otherPerson?.name}
            src={otherPerson?.image}
          />
          <Box>
            <Text textTransform="capitalize" fontWeight="600">{otherPerson?.name}</Text>
            <Text fontSize="sm" color="green.500">
              Online
            </Text>
          </Box>
        </HStack>

        <HStack spacing={4}>          
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
        {messages?.map((msg, index) => {
          const sent = Boolean((msg?.sender === authUser?.email))
          return(
            <Box key={index} alignSelf={sent ? 'flex-end' : 'flex-start'} maxW="70%">
              <Box
                bg={sent ? 'secondary' : 'accent'}
                color={sent ? 'white' : 'black'}
                px={2}
                py={2} fontSize="15px"
                borderRadius="lg"
              >
                {msg.text}
              </Box>

              <HStack
                spacing={1}
                justify={sent ? 'flex-end' : 'flex-start'}
                fontSize="xs"
                color="black"
                mt={1}
              >
                {sent && <Check size="12px" className="w-4 h-4" />}
              </HStack>
            </Box>
          )}
        )}
      </VStack>

      <HStack as={Flex} w="full" p={4} borderTopWidth={1} spacing={4}>
        <IconButton
          icon={<Smile size={20} />}
          variant="ghost"
          aria-label="Add emoji"
        />
        <Input onInput={(e) => setMessage(e.target.value)} value={message} placeholder="Send a message..." />
        <Button
          colorScheme="blue"
          rightIcon={<Send size={16} />}
          onClick={sendMessage}
          width={'100px'}
        >
          Send
        </Button>
      </HStack>
    </VStack>    
  )
}


export default ChatRoom

