import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Icon,
  Input,
  Link,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { AtSign, CheckCircle, LifeBuoy, Mail, MapPin, Phone } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { GlobalStore } from '../App';
import { useApiMutation, useApiQuery } from '../hooks/useApi';
import { EmptyState, ErrorState } from '../components/states';
import { asList } from '../utils';
import faqs from '../data/faqs.json';

const SUPPORT_EMAIL = 'support@motaa.net';
const SUPPORT_PHONE = '+234 810 448 4364';
const SUPPORT_PHONE_LINK = 'tel:+2348104484364';
const ADDRESS = 'Abuja, Nigeria';

const TICKET_STATUS = {
  open: { label: 'Open', color: 'blue' },
  'in-progress': { label: 'In progress', color: 'yellow' },
  'awaiting-user': { label: 'Waiting for you', color: 'orange' },
  resolved: { label: 'Resolved', color: 'green' },
};

const CONTACTS = [
  { icon: Mail, title: 'Email', value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}`, note: 'Best for account, payment and order questions.' },
  { icon: Phone, title: 'Phone', value: SUPPORT_PHONE, href: SUPPORT_PHONE_LINK, note: 'Call our support line.' },
  { icon: AtSign, title: 'Instagram / X', value: '@motaaltd', href: 'https://www.instagram.com/motaaltd', external: true, note: 'News, updates and quick questions.' },
  { icon: MapPin, title: 'Office', value: ADDRESS, },
];

function ContactCard({ icon, title, value, href, external, note }) {
  return (
    <Flex gap={4} p={5} borderWidth="1px" borderColor="gray.100" borderRadius="lg" bg="white" align="flex-start">
      <Flex w={10} h={10} rounded="full" bg="blue.50" color="primary" align="center" justify="center" flexShrink={0}>
        <Icon as={icon} boxSize={5} aria-hidden="true" />
      </Flex>
      <Box minW={0}>
        <Text fontSize="sm" color="gray.500">{title}</Text>
        {href ? (
          <Link
            href={href}
            fontWeight="600"
            color="secondary"
            overflowWrap="anywhere"
            {...(external ? { isExternal: true, rel: 'noopener noreferrer' } : {})}
          >
            {value}
          </Link>
        ) : (
          <Text fontWeight="600" color="secondary">{value}</Text>
        )}
        {note && <Text fontSize="sm" color="gray.600" mt={1}>{note}</Text>}
      </Box>
    </Flex>
  );
}

function SentNotice({ message, onReset, resetLabel }) {
  return (
    <Flex direction="column" align="center" textAlign="center" gap={3} py={8} role="status">
      <Flex w={14} h={14} rounded="full" bg="green.50" color="green.500" align="center" justify="center">
        <Icon as={CheckCircle} boxSize={7} aria-hidden="true" />
      </Flex>
      <Heading as="h3" size="sm">Request received</Heading>
      <Text color="gray.600" maxW="400px">{message}</Text>
      <Button variant="outline" borderColor="primary" color="primary" onClick={onReset}>{resetLabel}</Button>
    </Flex>
  );
}

function validate(form, { needsContact }) {
  const errors = {};
  if (needsContact) {
    if (!form.name.trim()) errors.name = 'Tell us your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address so we can reply.';
  }
  if (form.subject.trim().length < 3) errors.subject = 'Give your request a short subject.';
  if (form.message.trim().length < 10) errors.message = 'Tell us a bit more (at least 10 characters).';
  return errors;
}

const EMPTY_FORM = { name: '', email: '', subject: '', category: '', message: '' };

/** Logged in: files a ticket. Logged out: public contact form. */
function RequestForm({ loggedIn, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [sentMessage, setSentMessage] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  const categories = useApiQuery(
    (api, signal) => api.get('/support/categories/', { signal }),
    [],
    { enabled: loggedIn, select: (body) => asList(body?.data) }
  );

  const submit = useApiMutation(
    (api, payload) => api.post(loggedIn ? '/support/tickets/' : '/support/contact/', payload),
    {
      errorTitle: "Couldn't send your request",
      onSuccess: (body) => {
        setSentMessage(body?.message || "Thanks — our team will get back to you by email.");
        setForm(EMPTY_FORM);
        setSubmitted(false);
        onCreated?.(body?.data);
      },
      onError: (error) => {
        setServerErrors(error.fieldErrors || {});
        if (error.isNotFound || error.status === 405) setUnavailable(true);
      },
    }
  );

  const errors = { ...(submitted ? validate(form, { needsContact: !loggedIn }) : {}), ...serverErrors };
  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setServerErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (submit.loading) return;
    if (Object.keys(validate(form, { needsContact: !loggedIn })).length) return;
    const payload = { subject: form.subject.trim(), message: form.message.trim() };
    if (loggedIn) {
      if (form.category) payload.category = form.category;
    } else {
      payload.name = form.name.trim();
      payload.email = form.email.trim();
    }
    submit.mutate(payload);
  }

  if (sentMessage) {
    return <SentNotice message={sentMessage} onReset={() => setSentMessage(null)} resetLabel="Send another request" />;
  }

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(form.subject || 'Support request')}&body=${encodeURIComponent(form.message)}`;
  const categoryOptions = asList(categories.data);
  const has = (field) => Boolean(errors[field]);

  return (
    <Stack as="form" spacing={4} onSubmit={handleSubmit} noValidate>
      {!loggedIn && (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired isInvalid={has('name')}>
            <FormLabel>Your name</FormLabel>
            <Input value={form.name} onChange={set('name')} autoComplete="name" />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>
          <FormControl isRequired isInvalid={has('email')}>
            <FormLabel>Email</FormLabel>
            <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>
      )}

      <SimpleGrid columns={{ base: 1, md: loggedIn && categoryOptions.length ? 2 : 1 }} spacing={4}>
        <FormControl isRequired isInvalid={has('subject')}>
          <FormLabel>Subject</FormLabel>
          <Input value={form.subject} onChange={set('subject')} maxLength={200} placeholder="e.g. Wallet deposit not showing" />
          <FormErrorMessage>{errors.subject}</FormErrorMessage>
        </FormControl>
        {loggedIn && categoryOptions.length > 0 && (
          <FormControl isInvalid={has('category')}>
            <FormLabel>Category</FormLabel>
            <Select value={form.category} onChange={set('category')} placeholder="Choose a topic (optional)">
              {categoryOptions.map((c) => <option key={c?.uuid || c?.id} value={c?.uuid}>{c?.name}</option>)}
            </Select>
            <FormErrorMessage>{errors.category}</FormErrorMessage>
          </FormControl>
        )}
      </SimpleGrid>

      <FormControl isRequired isInvalid={has('message')}>
        <FormLabel>How can we help?</FormLabel>
        <Textarea
          value={form.message}
          onChange={set('message')}
          rows={6}
          maxLength={5000}
          placeholder="Include order, listing or booking details if it's about one."
        />
        <FormErrorMessage>{errors.message}</FormErrorMessage>
      </FormControl>

      {unavailable && (
        <Text fontSize="sm" color="gray.700" bg="yellow.50" p={3} borderRadius="md" role="alert">
          Our request form isn't available right now. Please <Link href={mailto} color="primary" textDecoration="underline">email {SUPPORT_EMAIL}</Link> instead.
        </Text>
      )}

      <Flex gap={3} align="center" wrap="wrap">
        <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={submit.loading} loadingText="Sending" w={{ base: '100%', sm: 'auto' }}>
          {loggedIn ? 'Submit request' : 'Send message'}
        </Button>
        <Text fontSize="sm" color="gray.500">Our team replies by email.</Text>
      </Flex>
    </Stack>
  );
}

function TicketList({ query }) {
  const { naturalDate } = useContext(GlobalStore);
  if (query.loading && query.data === undefined) {
    return <Stack spacing={3} role="status" aria-label="Loading your requests">{[0, 1].map((i) => <Skeleton key={i} h="72px" borderRadius="lg" />)}</Stack>;
  }
  if (query.error && query.data === undefined) {
    return <ErrorState error={query.error} onRetry={query.reload} minH="160px" />;
  }
  const tickets = asList(query.data);
  if (!tickets.length) {
    return <EmptyState icon={LifeBuoy} title="No requests yet" description="Requests you submit will appear here with their status." minH="160px" />;
  }
  return (
    <Stack as="ul" spacing={3} listStyleType="none">
      {tickets.map((ticket) => {
        const status = TICKET_STATUS[ticket?.status] || { label: ticket?.status_display || 'Open', color: 'gray' };
        const date = ticket?.date_created ? new Date(ticket.date_created) : null;
        return (
          <Box as="li" key={ticket?.uuid || ticket?.id} p={4} borderWidth="1px" borderColor="gray.100" borderRadius="lg" bg="white">
            <Flex justify="space-between" gap={3} align="flex-start">
              <Box minW={0}>
                <Text fontWeight="600" noOfLines={1}>{ticket?.subject || 'Support request'}</Text>
                <Text fontSize="sm" color="gray.500">
                  #{ticket?.id}
                  {ticket?.category ? ` · ${ticket.category}` : ''}
                  {date && !Number.isNaN(date.getTime()) ? ` · ${naturalDate(date)}` : ''}
                </Text>
              </Box>
              <Badge colorScheme={status.color} borderRadius="full" px={2} textTransform="none" flexShrink={0}>{status.label}</Badge>
            </Flex>
            {ticket?.message && <Text fontSize="sm" color="gray.600" mt={2} noOfLines={2}>{ticket.message}</Text>}
          </Box>
        );
      })}
    </Stack>
  );
}

export default function SupportPage() {
  const { authUser, isAuthenticated } = useContext(GlobalStore);
  const loggedIn = Boolean(isAuthenticated ?? authUser);

  useEffect(() => { document.title = 'Help & support | Motaa'; }, []);

  const tickets = useApiQuery(
    (api, signal) => api.get('/support/tickets/', { signal }),
    [loggedIn],
    { enabled: loggedIn, select: (body) => asList(body?.data) }
  );

  return (
    <Box bg="gray.50" py={{ base: 8, md: 12 }}>
      <Container maxW="container.lg">
        <Box mb={{ base: 8, md: 10 }}>
          <Heading as="h1" fontSize={{ base: '2xl', md: '4xl' }} color="secondary" mb={2}>How can we help?</Heading>
          <Text color="gray.600" maxW="640px">
            Questions about buying, renting, mechanics or your wallet? Check the answers below or reach our team directly.
          </Text>
        </Box>

        <SimpleGrid as="section" aria-label="Contact options" columns={{ base: 1, sm: 2 }} spacing={4} mb={{ base: 10, md: 12 }}>
          {CONTACTS.map((c) => <ContactCard key={c.title} {...c} />)}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: loggedIn ? 5 : 1 }} spacing={{ base: 10, lg: 8 }} mb={{ base: 10, md: 12 }}>
          <Box as="section" aria-labelledby="request-heading" gridColumn={{ lg: loggedIn ? 'span 3' : 'auto' }} bg="white" p={{ base: 5, md: 8 }} borderRadius="xl" borderWidth="1px" borderColor="gray.100">
            <Heading id="request-heading" as="h2" size="md" mb={1}>{loggedIn ? 'Submit a request' : 'Send us a message'}</Heading>
            <Text color="gray.600" fontSize="sm" mb={6}>
              {loggedIn ? "Tell us what's going on and we'll follow up by email." : "We'll reply to the email address you give us."}
            </Text>
            <RequestForm
              loggedIn={loggedIn}
              onCreated={(ticket) => { if (loggedIn && ticket) tickets.setData((list) => [ticket, ...asList(list)]); }}
            />
          </Box>

          {loggedIn && (
            <Box as="section" aria-labelledby="tickets-heading" gridColumn={{ lg: 'span 2' }}>
              <Heading id="tickets-heading" as="h2" size="md" mb={4}>Your requests</Heading>
              <TicketList query={tickets} />
            </Box>
          )}
        </SimpleGrid>

        <Box as="section" aria-labelledby="faq-heading">
          <Heading id="faq-heading" as="h2" size="md" mb={4}>Frequently asked questions</Heading>
          <Accordion allowToggle bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100" overflow="hidden">
            {asList(faqs).map((faq) => (
              <AccordionItem key={faq.id} borderColor="gray.100">
                <h3>
                  <AccordionButton py={4} px={5}>
                    <Box flex="1" textAlign="left" fontWeight="600">{faq.question}</Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h3>
                <AccordionPanel px={5} pb={5} color="gray.600">{faq.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </Container>
    </Box>
  );
}
