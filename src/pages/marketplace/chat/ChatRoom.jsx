// import {
//     Avatar,
//     Box,
//     Button,
//     Divider,
//     Drawer,
//     DrawerBody,
//     DrawerCloseButton,
//     DrawerContent,
//     DrawerHeader,
//     Flex,
//     Heading,
//     HStack,
//     Input,
//     Text,
//     useMediaQuery,
//     VStack,
// } from "@chakra-ui/react";
// import { FiMenu, FiSend } from "react-icons/fi";
// import { useEffect, useState } from "react";
// import { ChatRoomSkeleton } from "../../../components/loaders";
  
// export const ChatRoom = () => {
//     const chats = [
//         { id: 1, name: "G-Motors", lastMessage: "Looking to buy a car?", type: "Dealer" },
//         { id: 2, name: "Toff Yansh", lastMessage: "Can you fix my brakes?", type: "Mechanic" },
//         { id: 3, name: "Motaa Support", lastMessage: "Help with my booking?", type: "Support" },
//     ];

//     const messages = {
//         '1': [
//             { sender: "Dealer", message: "Welcome! How can I assist you today?" },
//             { sender: "Buyer", message: "I’m looking for a Benz C63 AMG." },
//         ],
//         '2': [
//             { sender: "Mechanic", message: "Hello, what repairs do you need?" },
//             { sender: "Buyer", message: "I need brake maintenance." },
//         ],
//         '3': [
//             { sender: "Support", message: "Hi, how can we assist you?" },
//             { sender: "Buyer", message: "I’m having trouble with my appointment." },
//         ],
//     };

//     const [activeChat, setActiveChat] = useState(1);
//     const [showChats, setChatVisibility] = useState(false);
//     const [loading, setLoading] = useState(true);
//     const [currentMessages, setCurrentMessages] = useState(messages[activeChat]);
//     const [isMobile] = useMediaQuery('(max-width: 768px)');

//     useEffect(() => {
//         setTimeout(() => setLoading(false), 2500);
//     }, []);
  
  
//     const handleChatSelect = (chatId) => {
//       setActiveChat(chatId);
//       setCurrentMessages(messages[chatId]);
//     };
  
//     const renderMessage = (msg, idx) => (
//       <Flex
//         key={idx}
//         justify={msg.sender === "Buyer" ? "flex-end" : "flex-start"}
//         mb={3}
//       >
//         <Box
//           bg={msg.sender === "Buyer" ? "blue.500" : "gray.100"}
//           color={msg.sender === "Buyer" ? "white" : "black"}
//           px={4}
//           py={2}
//           borderRadius="lg"
//           maxW="70%"
//         >
//           <Text>{msg.message}</Text>
//         </Box>
//       </Flex>
//     );

    
//     if (loading){
//         return <ChatRoomSkeleton />
//     }
  
//     return (
//         <Flex h="100vh" bg="gray.50" position={'fixed'} left={'0px'} w={'100%'} zIndex={'1'}>
//             {/* Chat List */}
//             {isMobile ? 
//                 <Drawer placement="left" isOpen={showChats} onClose={() => setChatVisibility(false)}>
//                     <DrawerContent>
//                         <DrawerHeader py={7}>
//                             <DrawerCloseButton />
//                         </DrawerHeader>
//                         <DrawerBody>
//                             <VStack align="stretch" spacing={4}>
//                                 {
//                                     chats.map((chat) => 
//                                         <Flex
//                                         key={chat.id}
//                                         p={3}
//                                         bg={activeChat === chat.id ? "blue.200" : "gray.100"}
//                                         borderRadius="lg"
//                                         align="center"
//                                         cursor="pointer"
//                                         // onClick={() => {handleChatSelect(chat.id); setChatVisibility(false)}}
//                                         onClick={() => handleChatSelect(chat.id)}
//                                         _hover={{ bg: "blue.100" }}
//                                         >
//                                             <Avatar size="sm" mr={3} />
//                                             <Box>
//                                                 <Text fontWeight="bold"> {chat.name} </Text>
//                                                 <Text fontSize="sm" color="gray.500"> {chat.lastMessage} </Text>
//                                             </Box>
//                                         </Flex>
//                                     )
//                                 }
//                             </VStack>
//                         </DrawerBody>
//                     </DrawerContent>
//                 </Drawer>
//             :
//                 <Box w="30%" bg="white" p={4} shadow="md" borderRight={'1px solid #cbcbcb'}>
//                     <Heading size="md" mb={4}> Messages </Heading>
//                     <VStack align="stretch" spacing={4}>
//                         {
//                             chats.map((chat) => 
//                                 <Flex
//                                 key={chat.id}
//                                 p={3}
//                                 bg={activeChat === chat.id ? "blue.200" : "gray.100"}
//                                 borderRadius="lg"
//                                 align="center"
//                                 cursor="pointer"
//                                 onClick={() => handleChatSelect(chat.id)}
//                                 _hover={{ bg: "blue.100" }}
//                                 >
//                                     <Avatar size="sm" mr={3} />
//                                     <Box>
//                                         <Text fontWeight="bold"> {chat.name} </Text>
//                                         <Text fontSize="sm" color="gray.500"> {chat.lastMessage} </Text>
//                                     </Box>
//                                 </Flex>
//                             )
//                         }
//                     </VStack>
//                 </Box>
//             }

//             {/* Chat Window */}
//             <Flex flex={1} direction="column" bg="white" p={4}>
//                 {/* Chat Header */}
//                 <Flex align="center" mb={4} shadow="sm" p={3} bg="gray.50">
//                     <Button onClick={() => setChatVisibility(true)} variant={'unstyled'}><FiMenu className="icon" /></Button>
//                     <Avatar size="sm" mr={3} />
//                     <Box>
//                         <Heading size="sm"> {chats.find((chat) => chat.id === activeChat)?.name} </Heading>
//                         <Text fontSize="xs" color="gray.500"> {chats.find((chat) => chat.id === activeChat)?.type} </Text>
//                     </Box>
//                 </Flex>

//                 <Divider mb={4} />

//                 {/* Messages */}
//                 <Flex flex={1} direction="column" overflowY="auto">
//                     {currentMessages.map(renderMessage)}
//                 </Flex>

//                 {/* Input Area */}
//                 <HStack mt={4} position={'sticky'} bottom={'0px'} py={4}>
//                     <Input placeholder="Type your message here..." />
//                     <Button colorScheme="blue" rightIcon={<FiSend />}> Send </Button>
//                 </HStack>
//             </Flex>
//         </Flex>
//     );
//   };
  
// export default ChatRoom;


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
} from '@chakra-ui/react'
import { Search, Phone, Send, Smile, Mic, MoreVertical, Check, PlayCircle } from 'lucide-react'
import { useState } from 'react'

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
          <Badge colorScheme="blue">29</Badge>
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
            onClick={() => onSelect(conversation.id)}
          >
            <HStack spacing={3}>
              <Box position="relative">
                <Avatar
                  size="md"
                  name={conversation.name}
                  src={conversation.avatar}
                />
                {conversation.online && (
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
                  <Text fontWeight="medium">{conversation.name}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {conversation.time}
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  noOfLines={1}
                >
                  {conversation.lastMessage}
                </Text>
              </Box>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

function ChatMessages({ messages }) {
  return (
    <VStack
      flex={1}
      spacing={4}
      align="stretch"
      p={4}
      overflowY="auto"
      h="calc(100vh - 180px)"
    >
      {messages.map((message, index) => (
        <Box
          key={index}
          alignSelf={message.sent ? 'flex-end' : 'flex-start'}
          maxW="70%"
        >
          <Box
            bg={message.sent ? 'blue.500' : 'gray.100'}
            color={message.sent ? 'white' : 'black'}
            px={4}
            py={2}
            borderRadius="lg"
          >
            {message.content}
          </Box>
          <HStack
            spacing={1}
            justify={message.sent ? 'flex-end' : 'flex-start'}
            fontSize="xs"
            color="gray.500"
            mt={1}
          >
            <Text>{message.time}</Text>
            {message.sent && message.status === 'sent' && (
              <Check className="w-4 h-4" />
            )}
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}

function ChatRoom() {
  const [activeConversation, setActiveConversation] = useState(null)
  const bgColor = useColorModeValue('white', 'gray.800')

  const conversations = [
    {
      id: 1,
      name: 'Azunyan U. Wu',
      avatar: '/placeholder.svg?height=40&width=40',
      online: true,
      lastMessage: 'Hello my dear sir',
      time: '12:25',
    },
    // Add more conversations
  ]

  const messages = [
    {
      content: 'Hello my dear sir',
      time: '10:25',
      sent: false,
    },
    {
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labori',
      time: '11:25',
      sent: true,
      status: 'sent',
    },
    // Add more messages
  ]

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
            <VStack h="full" spacing={0}>
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
                    name="Azunyan U. Wu"
                    src="/placeholder.svg?height=32&width=32"
                  />
                  <Box>
                    <Text fontWeight="medium">Azunyan U. Wu</Text>
                    <Text fontSize="sm" color="green.500">
                      Online
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={4}>
                  <Button variant="ghost" leftIcon={<Phone size={20} />}>
                    Call
                  </Button>
                  <Button colorScheme="blue">View Profile</Button>
                  <IconButton
                    icon={<MoreVertical size={20} />}
                    variant="ghost"
                    aria-label="More options"
                  />
                </HStack>
              </HStack>

              <ChatMessages messages={messages} />

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

