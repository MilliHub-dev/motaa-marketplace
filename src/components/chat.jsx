import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    Button, Textarea, FormControl, FormLabel, FormHelperText, Text, VStack, Flex, Icon, Box, Image, LinkBox, LinkOverlay,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Link as RLink } from "react-router-dom";
import { Car, CheckCircle } from "lucide-react";
import { GlobalStore } from "../App";
import { useApiMutation } from "../hooks/useApi";

const CYCLE_LABEL = { day: 'day', week: 'week', month: 'month', year: 'year' };

/**
 * The car a chat is about: photo, title and price, linking to the listing.
 * `listing`: { uuid, title, price, listing_type, payment_cycle, image, path } (the chat API's
 * message.listing) or a listing object from the listings API.
 */
export function ListingChatCard({ listing, label = 'Enquiry about', compact = false, ...props }) {
    const { commaInt } = useContext(GlobalStore);
    if (!listing) return null;
    const isRental = listing.listing_type === 'rental';
    const path = listing.path || `/${isRental ? 'rent' : 'buy'}/${listing.uuid}`;
    const image = listing.image ?? listing.vehicle?.images?.[0]?.url ?? listing.vehicle?.images?.[0]?.image;
    const title = listing.title || listing.vehicle?.name || 'Car';
    const cycle = CYCLE_LABEL[listing.payment_cycle];
    return (
        <LinkBox as="article" display="flex" gap={3} alignItems="center" p={2} pr={3} bg="white" color="gray.800"
            borderWidth="1px" borderColor="gray.200" borderRadius="lg" _hover={{ borderColor: 'primary' }} {...props}>
            {image
                ? <Image src={image} alt="" boxSize={compact ? '48px' : '64px'} objectFit="cover" borderRadius="md" flexShrink={0} />
                : <Flex boxSize={compact ? '48px' : '64px'} bg="gray.100" borderRadius="md" align="center" justify="center" color="gray.400" flexShrink={0}><Car size={22} aria-hidden="true" /></Flex>}
            <Box minW={0}>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">{label}</Text>
                <LinkOverlay as={RLink} to={path} fontWeight="600" noOfLines={1} display="block">{title}</LinkOverlay>
                {listing.price != null && (
                    <Text fontSize="sm" color="primary" fontWeight="600">
                        ₦{commaInt(listing.price)}{isRental && cycle ? ` / ${cycle}` : ''}
                    </Text>
                )}
            </Box>
        </LinkBox>
    );
}

const MAX_LENGTH = 4000;
const PROFILE_ID_FIELD = { dealer: 'dealer_id', mechanic: 'mechanic_id', customer: 'customer_id' };

/**
 * "Send a message" modal used on listing, dealer and mechanic pages.
 *
 *   <ChatPopup isOpen onClose={...} recipient_type="dealer" recipient_id={dealership.uuid} recipient_name="Kawo Motors" />
 *
 * recipient_type: dealer | mechanic | customer, recipient_id: that profile's uuid.
 * Alternatively pass `recipient` (an account uuid). Messages go into the existing
 * conversation with that business when there is one.
 * `listing`: the car being asked about. It's attached to the message (shown as a card
 * in the chat) the first time that car comes up in the conversation.
 */
export const ChatPopup = ({ isOpen, onClose, recipient_type = 'dealer', recipient_id, recipient, recipient_name, placeholder, listing }) => {
    const [message, setMessage] = useState("");
    const [sentRoom, setSentRoom] = useState(null);

    const send = useApiMutation((api, text) => {
        const about = listing?.uuid ? { listing_id: listing.uuid } : {};
        if (recipient) return api.post('/chat/new/', { recipient, message: text, ...about });
        const type = PROFILE_ID_FIELD[recipient_type] ? recipient_type : 'dealer';
        return api.post('/chat/message/', { message: text, other_member: type, [PROFILE_ID_FIELD[type]]: recipient_id, ...about });
    }, {
        errorTitle: "Couldn't send your message",
        onSuccess: (body) => {
            setMessage("");
            setSentRoom(body?.data?.room || '');
        },
    });

    const trimmed = message.trim();
    const canSend = Boolean(trimmed) && trimmed.length <= MAX_LENGTH && Boolean(recipient || recipient_id) && !send.loading;

    function handleClose() {
        if (send.loading) return;
        setSentRoom(null);
        onClose?.();
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (canSend) send.mutate(trimmed);
    }

    const title = recipient_name ? `Message ${recipient_name}` : 'Send a message';

    return (
        <Modal isOpen={isOpen} onClose={handleClose} isCentered size={{ base: 'full', sm: 'md' }}>
            <ModalOverlay />
            <ModalContent borderRadius={{ base: 0, sm: 'lg' }} mx={{ base: 0, sm: 4 }}>
                <ModalHeader pr={12}>{sentRoom !== null ? 'Message sent' : title}</ModalHeader>
                <ModalCloseButton aria-label="Close" isDisabled={send.loading} />

                {sentRoom !== null ? (
                    <>
                        <ModalBody>
                            <VStack spacing={3} textAlign="center" py={4}>
                                <Flex w={14} h={14} rounded="full" bg="green.50" align="center" justify="center" color="green.500">
                                    <Icon as={CheckCircle} boxSize={7} aria-hidden="true" />
                                </Flex>
                                <Text color="gray.600">
                                    Your message was delivered. You'll find the reply in your messages.
                                </Text>
                            </VStack>
                        </ModalBody>
                        <ModalFooter gap={3}>
                            <Button variant="ghost" onClick={handleClose}>Close</Button>
                            <Button
                                as={RLink}
                                to={sentRoom ? `/chat/${sentRoom}` : '/chat'}
                                bg="primary"
                                color="white"
                                _hover={{ bg: 'secondary' }}
                            >
                                Open chat
                            </Button>
                        </ModalFooter>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>
                        <ModalBody>
                            {listing && <ListingChatCard listing={listing} label="Asking about" mb={4} />}
                            <FormControl isInvalid={trimmed.length > MAX_LENGTH}>
                                <FormLabel srOnly>Message</FormLabel>
                                <Textarea
                                    placeholder={placeholder || "Hi, is this still available?"}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
                                    }}
                                    rows={5}
                                    resize="vertical"
                                    autoFocus
                                />
                                <FormHelperText>
                                    {trimmed.length > MAX_LENGTH
                                        ? `Keep it under ${MAX_LENGTH} characters.`
                                        : 'Keep payments and conversations on Motaa so you stay protected.'}
                                </FormHelperText>
                            </FormControl>
                        </ModalBody>
                        <ModalFooter gap={3}>
                            <Button variant="ghost" onClick={handleClose} isDisabled={send.loading}>Cancel</Button>
                            <Button
                                type="submit"
                                bg="primary"
                                color="white"
                                _hover={{ bg: 'secondary' }}
                                isLoading={send.loading}
                                loadingText="Sending"
                                isDisabled={!canSend}
                            >
                                Send
                            </Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
};
