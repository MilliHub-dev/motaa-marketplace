import {
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    Flex,
    Heading,
    HStack,
    Input,
    Text,
    useMediaQuery,
    VStack,
} from "@chakra-ui/react";
import { FiMenu, FiSend } from "react-icons/fi";
import { useEffect, useState } from "react";
import { ChatRoomSkeleton } from "../../../components/loaders";
  
export const ChatRoom = () => {
    const chats = [
        { id: 1, name: "G-Motors", lastMessage: "Looking to buy a car?", type: "Dealer" },
        { id: 2, name: "Toff Yansh", lastMessage: "Can you fix my brakes?", type: "Mechanic" },
        { id: 3, name: "Motaa Support", lastMessage: "Help with my booking?", type: "Support" },
    ];

    const messages = {
        '1': [
            { sender: "Dealer", message: "Welcome! How can I assist you today?" },
            { sender: "Buyer", message: "I’m looking for a Benz C63 AMG." },
        ],
        '2': [
            { sender: "Mechanic", message: "Hello, what repairs do you need?" },
            { sender: "Buyer", message: "I need brake maintenance." },
        ],
        '3': [
            { sender: "Support", message: "Hi, how can we assist you?" },
            { sender: "Buyer", message: "I’m having trouble with my appointment." },
        ],
    };

    const [activeChat, setActiveChat] = useState(1);
    const [showChats, setChatVisibility] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentMessages, setCurrentMessages] = useState(messages[activeChat]);
    const [isMobile] = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        setTimeout(() => setLoading(false), 2500);
    }, []);
  
  
    const handleChatSelect = (chatId) => {
      setActiveChat(chatId);
      setCurrentMessages(messages[chatId]);
    };
  
    const renderMessage = (msg, idx) => (
      <Flex
        key={idx}
        justify={msg.sender === "Buyer" ? "flex-end" : "flex-start"}
        mb={3}
      >
        <Box
          bg={msg.sender === "Buyer" ? "blue.500" : "gray.100"}
          color={msg.sender === "Buyer" ? "white" : "black"}
          px={4}
          py={2}
          borderRadius="lg"
          maxW="70%"
        >
          <Text>{msg.message}</Text>
        </Box>
      </Flex>
    );

    
    if (loading){
        return <ChatRoomSkeleton />
    }
  
    return (
        <Flex h="100vh" bg="gray.50" position={'fixed'} left={'0px'} w={'100%'} zIndex={'1'}>
            {/* Chat List */}
            {isMobile ? 
                <Drawer placement="left" isOpen={showChats} onClose={() => setChatVisibility(false)}>
                    <DrawerContent>
                        <DrawerHeader py={7}>
                            <DrawerCloseButton />
                        </DrawerHeader>
                        <DrawerBody>
                            <VStack align="stretch" spacing={4}>
                                {
                                    chats.map((chat) => 
                                        <Flex
                                        key={chat.id}
                                        p={3}
                                        bg={activeChat === chat.id ? "blue.200" : "gray.100"}
                                        borderRadius="lg"
                                        align="center"
                                        cursor="pointer"
                                        // onClick={() => {handleChatSelect(chat.id); setChatVisibility(false)}}
                                        onClick={() => handleChatSelect(chat.id)}
                                        _hover={{ bg: "blue.100" }}
                                        >
                                            <Avatar size="sm" mr={3} />
                                            <Box>
                                                <Text fontWeight="bold"> {chat.name} </Text>
                                                <Text fontSize="sm" color="gray.500"> {chat.lastMessage} </Text>
                                            </Box>
                                        </Flex>
                                    )
                                }
                            </VStack>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            :
                <Box w="30%" bg="white" p={4} shadow="md" borderRight={'1px solid #cbcbcb'}>
                    <Heading size="md" mb={4}> Messages </Heading>
                    <VStack align="stretch" spacing={4}>
                        {
                            chats.map((chat) => 
                                <Flex
                                key={chat.id}
                                p={3}
                                bg={activeChat === chat.id ? "blue.200" : "gray.100"}
                                borderRadius="lg"
                                align="center"
                                cursor="pointer"
                                onClick={() => handleChatSelect(chat.id)}
                                _hover={{ bg: "blue.100" }}
                                >
                                    <Avatar size="sm" mr={3} />
                                    <Box>
                                        <Text fontWeight="bold"> {chat.name} </Text>
                                        <Text fontSize="sm" color="gray.500"> {chat.lastMessage} </Text>
                                    </Box>
                                </Flex>
                            )
                        }
                    </VStack>
                </Box>
            }

            {/* Chat Window */}
            <Flex flex={1} direction="column" bg="white" p={4}>
                {/* Chat Header */}
                <Flex align="center" mb={4} shadow="sm" p={3} bg="gray.50">
                    <Button onClick={() => setChatVisibility(true)} variant={'unstyled'}><FiMenu className="icon" /></Button>
                    <Avatar size="sm" mr={3} />
                    <Box>
                        <Heading size="sm"> {chats.find((chat) => chat.id === activeChat)?.name} </Heading>
                        <Text fontSize="xs" color="gray.500"> {chats.find((chat) => chat.id === activeChat)?.type} </Text>
                    </Box>
                </Flex>

                <Divider mb={4} />

                {/* Messages */}
                <Flex flex={1} direction="column" overflowY="auto">
                    {currentMessages.map(renderMessage)}
                </Flex>

                {/* Input Area */}
                <HStack mt={4} position={'sticky'} bottom={'0px'} py={4}>
                    <Input placeholder="Type your message here..." />
                    <Button colorScheme="blue" rightIcon={<FiSend />}> Send </Button>
                </HStack>
            </Flex>
        </Flex>
    );
  };
  
export default ChatRoom;
