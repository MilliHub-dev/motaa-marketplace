import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input, Textarea, useToast, IconButton, Flex, Box, Heading, Card, CardBody
} from "@chakra-ui/react";
import { useState, useContext } from "react";
import { GlobalStore } from "../App";
import { IoMdClose } from "react-icons/io";

export const ChatPopup = ({ isOpen, onClose, recipient_type, recipient_id }) => {
    const [message, setMessage] = useState("");
    const { axios, notify } = useContext(GlobalStore);
    const toast = useToast();

    async function sendMessage() {
        if (!message.trim()) return;

        try {
            const payload = {
                 message,
                 other_member: recipient_type,
            }
            switch(recipient_type){
                case "dealer": 
                    payload['dealer_id'] = recipient_id
                    break;
                case "mechanic": 
                    payload['mechanic_id'] = recipient_id
                    break;
                case "customer": 
                    payload['customer_id'] = recipient_id
                    break;
                default: 
                    payload['dealer_id'] = recipient_id
                    break;
            }

            const res = await axios.post(`/chat/message/`, JSON.stringify(payload));
            if (res.status === 200) {
                toast({
                    title: "Message sent!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                setMessage("");
                onClose();
            }
        } catch (error) {
            toast({
                title: "Failed to send message",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent borderRadius="md" boxShadow="lg">
                <Card>
                    <CardBody>
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md">Send Message</Heading>
                            <IconButton
                                icon={<IoMdClose />}
                                size="sm"
                                onClick={onClose}
                                variant="ghost"
                            />
                        </Flex>

                        <Textarea
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            mb={3}
                            resize="none"
                        />

                        <Button
                            colorScheme="blue"
                            w="full"
                            onClick={sendMessage}
                            isDisabled={!message.trim()}
                        >
                            Send
                        </Button>
                    </CardBody>
                </Card>
            </ModalContent>
        </Modal>
    );
};
