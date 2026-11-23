// The Motaa AI chat: a floating panel on desktop, full screen on phones. It recommends, searches Motaa (results come
// back as cards that open the listing), explains how Motaa works and teaches car basics. The conversation is kept for
// this browser tab only.
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, Flex, Grid, HStack, IconButton, Image, Portal, Text, Textarea, Tooltip } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { ArrowUp, Car, GraduationCap, Info, Package, RotateCcw, Search, Sparkles, Truck, Wrench, X } from 'lucide-react';
import { GlobalStore } from '../../App';
import Markdown from './Markdown';

const STORE_KEY = 'motaa-ai-chat';
const BUSINESS = ['dealer', 'mechanic', 'parts_dealer'];
const bounce = keyframes`0%, 80%, 100% { transform: translateY(0); opacity: .4 } 40% { transform: translateY(-4px); opacity: 1 }`;
const rise = keyframes`from { opacity: 0; transform: translateY(16px) scale(.98) } to { opacity: 1; transform: none }`;

const CAPABILITIES = [
  { icon: Sparkles, title: 'Recommend', text: 'The right car for your budget and needs', prompt: 'Recommend a reliable car for me. My budget is ₦15 million and I drive mostly in the city.' },
  { icon: Search, title: 'Search Motaa', text: 'Cars, parts, mechanics and towing', prompt: 'Find me a Toyota Corolla for sale in Lagos.' },
  { icon: Info, title: 'Motaa help', text: 'Escrow, inspection, wallet and returns', prompt: 'How does paying safely on Motaa work?' },
  { icon: GraduationCap, title: 'Learn', text: 'Car tips, maintenance and warning signs', prompt: 'What should I check before buying a tokunbo car?' },
];

function suggestionsFor(pathname) {
  if (pathname.startsWith('/parts')) return ['Brake pads for a 2015 Corolla', 'How do parts returns work?', 'Which engine oil should I use?'];
  if (pathname.startsWith('/rent')) return ['SUV to rent in Abuja this weekend', 'Can I rent with a driver?', 'What do I need to rent a car?'];
  if (pathname.startsWith('/mechanics')) return ['AC repair mechanic in Lagos', 'Why is my car overheating?', 'How does booking a mechanic work?'];
  if (pathname.startsWith('/towing') || pathname.startsWith('/car-haulers')) return ['Tow truck near Lekki', 'Move my car from Lagos to Abuja', 'How much does towing cost?'];
  return ['Best family SUV under ₦20M', 'Is pay after inspection safe?', 'Petrol or hybrid for Lagos traffic?'];
}

const CARD_PATHS = {
  car: (uuid) => `/buy/${uuid}`, rental: (uuid) => `/rent/${uuid}`, part: (uuid) => `/parts/${uuid}`,
  mechanic: (uuid) => `/mechanics/${uuid}`, towing: (uuid) => `/towing/${uuid}`, hauler: (uuid) => `/car-haulers/${uuid}`,
};
const CARD_ICONS = { car: Car, rental: Car, part: Package, mechanic: Wrench, towing: Truck, hauler: Truck };
const CARD_LABELS = { car: 'For sale', rental: 'For rent', part: 'Spare part', mechanic: 'Mechanic', towing: 'Towing', hauler: 'Car hauler' };

function readChat() {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}

function ResultCard({ card, linkable, onOpen }) {
  const Icon = CARD_ICONS[card.kind] || Sparkles;
  const body = (
    <Box w="200px" flexShrink={0} bg="white" borderRadius="16px" overflow="hidden" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 2px 10px rgba(16,24,40,0.05)" transition="transform .15s, box-shadow .15s"
      _hover={linkable ? { transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(16,24,40,0.10)' } : undefined}>
      <Box h="112px" bg="#EEF3F9" position="relative">
        {card.image ? <Image src={card.image} alt="" w="100%" h="100%" objectFit="cover" loading="lazy" />
          : <Flex h="100%" align="center" justify="center" color="#9CB3CF"><Icon size={30} /></Flex>}
        <Box position="absolute" top={2} left={2} px={2} py={0.5} borderRadius="full" bg="rgba(11,18,32,0.75)" color="white" fontSize="10px" fontWeight="700">
          {CARD_LABELS[card.kind] || 'Motaa'}
        </Box>
      </Box>
      <Box p={3}>
        <Text fontWeight="700" fontSize="sm" noOfLines={1}>{card.title}</Text>
        {card.price && <Text color="primary" fontWeight="800" fontSize="sm" noOfLines={1}>{card.price}</Text>}
        {card.subtitle && <Text fontSize="xs" color="gray.500" noOfLines={1}>{card.subtitle}</Text>}
      </Box>
    </Box>
  );
  return linkable ? <Box as={RLink} to={CARD_PATHS[card.kind](card.uuid)} onClick={onOpen} display="block">{body}</Box> : body;
}

function Typing() {
  return (
    <HStack spacing={1} px={4} py={3} bg="white" borderRadius="18px" borderTopLeftRadius="6px" w="fit-content" boxShadow="0 1px 3px rgba(16,24,40,0.06)" aria-label="Motaa AI is typing">
      {[0, 1, 2].map((i) => <Box key={i} w="7px" h="7px" borderRadius="full" bg="primary" sx={{ animation: `${bounce} 1.2s ${i * 0.15}s infinite ease-in-out` }} />)}
    </HStack>
  );
}

export default function AssistantPanel({ isOpen, onClose }) {
  const { api, authUser } = useContext(GlobalStore);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(readChat);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const business = BUSINESS.includes(authUser?.user_type);
  const suggestions = useMemo(() => suggestionsFor(pathname), [pathname]);

  useEffect(() => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40))); } catch { /* private mode */ } }, [messages]);
  useEffect(() => { if (isOpen) setTimeout(() => endRef.current?.scrollIntoView({ block: 'end' }), 30); }, [messages, busy, isOpen]);
  // desktops only: on phones focusing opens the keyboard at once, and iOS then shifts the page and cuts off the header
  useEffect(() => {
    let fine = false;
    try { fine = window.matchMedia('(pointer: fine)').matches; } catch { /* old browser */ }
    if (isOpen && fine) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  // phones: fit the panel to the part of the screen that is visible (above the keyboard) and stop the page scrolling behind it
  const [viewport, setViewport] = useState(null);
  useEffect(() => {
    if (!isOpen || window.innerWidth >= 768) return undefined;
    const vv = window.visualViewport;
    const update = () => setViewport(vv ? { top: vv.offsetTop, height: vv.height } : null);
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  async function send(question) {
    const message = (question ?? text).trim();
    if (!message || busy) return;
    setText('');
    const history = messages.filter((m) => !m.error).slice(-10).map(({ role, content }) => ({ role, content }));
    setMessages((list) => [...list, { role: 'user', content: message }]);
    setBusy(true);
    try {
      // the AI can take a while (searching, then answering): wait up to 3 minutes, not the usual 30 seconds
      const body = await api.post('/assistant/chat/', { message, history, page: pathname }, { timeout: 180000 });
      const data = body?.data || {};
      setRemaining(data.remaining ?? null);
      setMessages((list) => [...list, { role: 'assistant', content: data.answer || 'Sorry, I have no answer for that.', cards: data.cards || [] }]);
    } catch (error) {
      setMessages((list) => [...list, { role: 'assistant', error: true, limit: error?.status === 429, content: error?.message || 'Something went wrong. Please try again.' }]);
    }
    setBusy(false);
  }

  if (!isOpen) return null;
  const firstName = authUser?.first_name;
  return (
    <Portal>
      <Flex role="dialog" aria-modal="false" aria-label="Motaa AI assistant" direction="column" position="fixed" zIndex={1450}
        top={{ base: viewport ? `${viewport.top}px` : 0, md: 'auto' }} left={{ base: 0, md: 'auto' }} right={{ base: 0, md: 6 }} bottom={{ base: 'auto', md: '100px' }}
        w={{ base: '100%', md: '410px' }}
        h={{ base: viewport ? `${viewport.height}px` : '100dvh', md: 'min(680px, calc(100vh - 130px))' }} bg="#F4F7FB" borderRadius={{ base: 0, md: '26px' }} overflow="hidden"
        boxShadow={{ md: '0 24px 70px rgba(11,18,32,0.28)' }} borderWidth={{ md: '1px' }} borderColor="rgba(11,18,32,0.06)"
        sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: `${rise} .22s ease-out` } }}>

        <Box position="relative" color="white" px={4} pt={{ base: 'calc(14px + env(safe-area-inset-top))', md: 4 }} pb={4}
          bg="linear-gradient(135deg, #0B1220 0%, #0B2D55 55%, #0065B5 100%)" overflow="hidden" flexShrink={0}>
          <Box position="absolute" w="200px" h="200px" borderRadius="full" bg="#4C9BE0" opacity={0.35} filter="blur(50px)" right="-60px" top="-90px" aria-hidden="true" />
          <Flex position="relative" align="center" gap={3}>
            <Flex w="42px" h="42px" borderRadius="14px" bg="rgba(255,255,255,0.14)" border="1px solid rgba(255,255,255,0.2)" align="center" justify="center"><Sparkles size={20} /></Flex>
            <Box flex={1} minW={0}>
              <Text fontWeight="800" fontSize="lg" lineHeight={1.1}>Motaa AI</Text>
              <HStack spacing={1.5} fontSize="xs" color="whiteAlpha.800"><Box w="7px" h="7px" borderRadius="full" bg="#34D399" /><Text>Cars, parts, services and help</Text></HStack>
            </Box>
            {messages.length > 0 && (
              <Tooltip label="New chat"><IconButton aria-label="Start a new chat" icon={<RotateCcw size={17} />} size="sm" isRound variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} onClick={() => setMessages([])} /></Tooltip>
            )}
            <IconButton aria-label="Close Motaa AI" icon={<X size={20} />} size="sm" isRound variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} onClick={onClose} />
          </Flex>
        </Box>

        <Box flex={1} overflowY="auto" px={4} py={4} className="hidden-scroll" aria-live="polite">
          {!messages.length ? (
            <Box>
              <Text fontSize="2xl" fontWeight="800" lineHeight={1.2} letterSpacing="-0.01em">Hi{firstName ? ` ${firstName}` : ''} 👋</Text>
              <Text color="gray.600" mt={1} mb={4}>I’m Motaa AI. Ask me about cars, parts, mechanics, towing, or how Motaa works.</Text>
              <Grid templateColumns="1fr 1fr" gap={2.5}>
                {CAPABILITIES.map((item) => (
                  <Box key={item.title} as="button" type="button" textAlign="left" onClick={() => send(item.prompt)} bg="white" borderRadius="18px" p={3.5}
                    borderWidth="1px" borderColor="transparent" boxShadow="0 1px 3px rgba(16,24,40,0.05)" transition="all .15s"
                    _hover={{ borderColor: 'primary', transform: 'translateY(-1px)' }}>
                    <Flex w="34px" h="34px" borderRadius="12px" bg="#EAF3FC" color="primary" align="center" justify="center" mb={2}><item.icon size={17} /></Flex>
                    <Text fontWeight="700" fontSize="sm">{item.title}</Text>
                    <Text fontSize="xs" color="gray.500" lineHeight={1.4}>{item.text}</Text>
                  </Box>
                ))}
              </Grid>
              <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider" mt={5} mb={2}>Try asking</Text>
              <Flex direction="column" gap={2}>
                {suggestions.map((s) => (
                  <Box key={s} as="button" type="button" onClick={() => send(s)} textAlign="left" px={3.5} py={2.5} bg="white" borderRadius="14px" fontSize="sm"
                    _hover={{ bg: '#EAF3FC', color: 'primary' }}>{s}</Box>
                ))}
              </Flex>
            </Box>
          ) : (
            <Flex direction="column" gap={4}>
              {messages.map((m, i) => (m.role === 'user' ? (
                <Flex key={i} justify="flex-end">
                  <Box maxW="85%" bg="primary" color="white" px={4} py={2.5} borderRadius="18px" borderTopRightRadius="6px" fontSize="sm" whiteSpace="pre-wrap">{m.content}</Box>
                </Flex>
              ) : (
                <Box key={i}>
                  <Flex gap={2} align="flex-start">
                    <Avatar size="xs" icon={<Sparkles size={12} />} bg="#0B1220" color="white" mt={1} />
                    <Box maxW="88%" bg={m.error ? '#FDECEC' : 'white'} color={m.error ? '#991B1B' : 'gray.800'} px={4} py={3} borderRadius="18px" borderTopLeftRadius="6px"
                      boxShadow="0 1px 3px rgba(16,24,40,0.06)">
                      {m.error ? <Text fontSize="sm">{m.content}</Text> : <Markdown>{m.content}</Markdown>}
                      {m.limit && !authUser && <Button size="sm" mt={3} bg="primary" color="white" onClick={() => { onClose(); navigate('/login'); }}>Sign in</Button>}
                    </Box>
                  </Flex>
                  {m.cards?.length > 0 && (
                    <Flex gap={3} overflowX="auto" mt={3} ml={8} pb={2} className="hidden-scroll">
                      {m.cards.map((card) => (
                        <ResultCard key={`${card.kind}-${card.uuid}`} card={card} linkable={Boolean(CARD_PATHS[card.kind]) && (!business || card.kind === 'part')}
                          onOpen={() => { if (window.innerWidth < 768) onClose(); }} />
                      ))}
                    </Flex>
                  )}
                </Box>
              )))}
              {busy && <Flex gap={2} align="flex-start"><Avatar size="xs" icon={<Sparkles size={12} />} bg="#0B1220" color="white" mt={1} /><Typing /></Flex>}
              <div ref={endRef} />
            </Flex>
          )}
        </Box>

        <Box as="form" px={3} pt={2} pb={{ base: 'calc(10px + env(safe-area-inset-bottom))', md: 3 }} bg="#F4F7FB" flexShrink={0}
          onSubmit={(e) => { e.preventDefault(); send(); }}>
          <Flex align="flex-end" gap={2} bg="white" borderRadius="22px" p={1.5} pl={4} boxShadow="0 2px 12px rgba(16,24,40,0.08)" borderWidth="1px" borderColor="gray.100"
            _focusWithin={{ borderColor: 'primary' }}>
            <Textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={1} resize="none" border="none" px={0} py={2.5} minH="40px" maxH="120px"
              placeholder="Ask about cars, parts, prices…" aria-label="Message Motaa AI" _focusVisible={{ boxShadow: 'none' }}
              fontSize={{ base: '16px', md: 'sm' }} /* under 16px, iPhones zoom the page in when you tap the box */
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <IconButton type="submit" aria-label="Send" icon={<ArrowUp size={18} />} isRound bg="primary" color="white" _hover={{ bg: 'secondary' }}
              isDisabled={!text.trim()} isLoading={busy} />
          </Flex>
          <Text fontSize="10px" color="gray.400" textAlign="center" mt={1.5}>
            Motaa AI can make mistakes. Check details on the listing.{remaining !== null && remaining <= 5 ? ` ${remaining} questions left today.` : ''}
          </Text>
        </Box>
      </Flex>
    </Portal>
  );
}
