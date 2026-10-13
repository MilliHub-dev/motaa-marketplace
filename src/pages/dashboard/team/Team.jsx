// /team — the business owner's team: invite people, set their role, remove them, and see who did what.
// Roles and what they allow come from GET /team/ (`roles`, `owner_can`); every change answers with the whole team again.
import { useContext, useEffect, useState } from 'react';
import {
  Alert, AlertIcon, Avatar, Badge, Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, HStack, Input,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  Radio, RadioGroup, Select, SimpleGrid, Skeleton, Stack, Text,
} from '@chakra-ui/react';
import { History, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { ActionDialog } from '../../../components/parts';
import { AsyncState, EmptyState } from '../../../components/states';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { asList } from '../../../utils';
import { lastSeenText, memberStatus, whenText } from '../../../utils/team';
import { EMAIL_RE } from '../../auth/shared';

const card = { borderWidth: '1px', borderColor: 'gray.200', borderRadius: 'xl', bg: 'white' };

function TeamSkeleton() {
  return (
    <Stack spacing={3} role="status" aria-label="Loading your team">
      {[0, 1, 2].map((i) => <Skeleton key={i} h="76px" borderRadius="xl" />)}
    </Stack>
  );
}

/** One person: who they are on the left; role, status and actions on the right (stacked on phones). */
function PersonRow({ name, email, children }) {
  return (
    <Flex as="li" px={{ base: 3, md: 4 }} py={3} gap={3} direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }}
      borderTopWidth="1px" borderColor="gray.100" _first={{ borderTopWidth: 0 }}>
      <HStack spacing={3} flex={1} minW={0}>
        <Avatar size="sm" name={name || email} />
        <Box minW={0}>
          <Text fontWeight="600" noOfLines={1}>{name || email}</Text>
          <Text fontSize="sm" color="gray.600" overflowWrap="anywhere">{email}</Text>
        </Box>
      </HStack>
      {children}
    </Flex>
  );
}

function MemberRow({ member, roles, busy, onRole, onResend, onRemove }) {
  const status = memberStatus(member);
  return (
    <PersonRow name={member.name} email={member.email}>
      <Flex gap={3} align="center" flexWrap="wrap" justify={{ md: 'flex-end' }}>
        <Box minW="150px">
          <Badge colorScheme={status.color} textTransform="none" borderRadius="full" px={2}>{status.label}</Badge>
          <Text fontSize="xs" color="gray.600" mt={1}>
            {member.status === 'active' ? `Last seen: ${lastSeenText(member)}` : lastSeenText(member)}
          </Text>
        </Box>
        <Select size="sm" w="150px" borderRadius="md" value={member.role} isDisabled={busy}
          aria-label={`Role for ${member.name || member.email}`} onChange={(e) => onRole(member, e.target.value)}>
          {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
        </Select>
        <HStack spacing={1}>
          {member.status === 'invited' && (
            <Button size="sm" variant="ghost" leftIcon={<Send size={14} />} isDisabled={busy} onClick={() => onResend(member)}
              aria-label={`Resend invitation to ${member.name || member.email}`}>
              Resend invitation
            </Button>
          )}
          <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={14} />} isDisabled={busy} onClick={() => onRemove(member)}
            aria-label={`Remove ${member.name || member.email}`}>
            Remove
          </Button>
        </HStack>
      </Flex>
    </PersonRow>
  );
}

const EMPTY_INVITE = { first_name: '', last_name: '', email: '', role: '' };

function InviteModal({ isOpen, onClose, roles, onInvited }) {
  const [form, setForm] = useState(EMPTY_INVITE);
  const [errors, setErrors] = useState({});
  const [problem, setProblem] = useState('');
  useEffect(() => { if (isOpen) { setForm(EMPTY_INVITE); setErrors({}); setProblem(''); } }, [isOpen]);

  const invite = useApiMutation(
    (api, payload) => api.post('/team/', payload),
    {
      notifyOnError: false,
      successMessage: (body) => body?.message || 'Invitation sent.',
      onSuccess: (body) => onInvited(body?.data),
      onError: (error) => {
        const fields = error.fieldErrors;
        setErrors(fields);
        // connection problems already show a toast
        setProblem(Object.keys(fields).length || error.isNetworkError || error.status >= 500 ? '' : error.message);
      },
    }
  );

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setProblem('');
  }

  function submit(e) {
    e.preventDefault();
    if (invite.loading) return;
    const email = form.email.trim();
    const next = {
      first_name: form.first_name.trim() ? '' : 'Enter their first name.',
      email: !email ? 'Enter their email address.' : EMAIL_RE.test(email) ? '' : 'Enter a valid email address.',
      role: form.role ? '' : 'Choose a role.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    invite.mutate({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), email, role: form.role });
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!invite.loading) onClose(); }} size={{ base: 'full', sm: 'lg' }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={submit} noValidate>
        <ModalHeader>Invite a team member</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text color="gray.600" fontSize="sm" mb={4}>
            We email them a link to set their own password. They sign in with this email address.
          </Text>
          <Stack spacing={4}>
            {problem && <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{problem}</Alert>}
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isRequired isInvalid={Boolean(errors.first_name)}>
                <FormLabel>First name</FormLabel>
                <Input name="first_name" autoComplete="off" maxLength={150} value={form.first_name} onChange={(e) => change('first_name', e.target.value)} />
                <FormErrorMessage>{errors.first_name}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.last_name)}>
                <FormLabel>Last name</FormLabel>
                <Input name="last_name" autoComplete="off" maxLength={150} value={form.last_name} onChange={(e) => change('last_name', e.target.value)} />
                <FormErrorMessage>{errors.last_name}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
            <FormControl isRequired isInvalid={Boolean(errors.email)}>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="email" inputMode="email" autoComplete="off" placeholder="name@example.com" value={form.email} onChange={(e) => change('email', e.target.value)} />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            <FormControl as="fieldset" isRequired isInvalid={Boolean(errors.role)}>
              <FormLabel as="legend">Role</FormLabel>
              <RadioGroup value={form.role} onChange={(value) => change('role', value)}>
                <Stack spacing={2}>
                  {roles.map((role) => (
                    <Box key={role.value} as="label" display="block" cursor="pointer" borderWidth="1px" borderRadius="lg" p={3}
                      borderColor={form.role === role.value ? 'primary' : errors.role ? 'red.300' : 'gray.200'}
                      bg={form.role === role.value ? 'blue.50' : 'white'}>
                      <Radio value={role.value} alignItems="flex-start">
                        <Text fontWeight="600" lineHeight="1.2">{role.label}</Text>
                        <Text fontSize="sm" color="gray.600" mt={1}>{role.can}</Text>
                      </Radio>
                    </Box>
                  ))}
                </Stack>
              </RadioGroup>
              <FormErrorMessage>{errors.role}</FormErrorMessage>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={invite.loading}>Cancel</Button>
          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} isLoading={invite.loading} loadingText="Sending">
            Send invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function TeamPage() {
  const { notify, setHasTeam } = useContext(GlobalStore);
  const [inviting, setInviting] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [busy, setBusy] = useState(null); // uuid of the member being changed

  const team = useApiQuery((api, signal) => api.get('/team/', { signal }), [], { select: (body) => body?.data });
  useEffect(() => { document.title = 'Team | Motaa'; }, []);
  // the rest of the dashboard (e.g. Messages) needs to know once there is a team
  const memberCount = team.data ? asList(team.data.members).length : null;
  useEffect(() => { if (memberCount !== null) setHasTeam?.(memberCount > 0); }, [memberCount, setHasTeam]);

  // every change answers with the updated team and a sentence saying what happened
  const options = (errorTitle, extra) => ({
    errorTitle,
    onSuccess: (body) => {
      if (body?.data) team.setData(body.data); else team.reload();
      if (body?.message) notify({ title: 'Done', body: body.message });
      extra?.();
    },
  });
  const changeRole = useApiMutation((api, member, role) => api.patch(`/team/${member.uuid}/`, { role }), options("Couldn't change their role"));
  const resend = useApiMutation((api, member) => api.post(`/team/${member.uuid}/`, { action: 'resend' }), options("Couldn't send the invitation"));
  const remove = useApiMutation((api, member) => api.delete(`/team/${member.uuid}/`), options("Couldn't remove them", () => setToRemove(null)));

  async function run(mutation, member, ...args) {
    setBusy(member.uuid);
    await mutation.mutate(member, ...args);
    setBusy(null);
  }

  return (
    <Box minH="70vh" pt={5} maxW="1000px">
      <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={3} mb={5} direction={{ base: 'column', sm: 'row' }}>
        <Box>
          <Heading as="h1" size="md">Team</Heading>
          <Text color="gray.600" fontSize="sm">Give the people who work with you their own login to your dashboard.</Text>
        </Box>
        {team.data && (
          <Button leftIcon={<UserPlus size={18} />} bg="primary" color="white" _hover={{ bg: 'secondary' }} flexShrink={0} onClick={() => setInviting(true)}>
            Invite a team member
          </Button>
        )}
      </Flex>

      <AsyncState query={team} skeleton={<TeamSkeleton />} errorTitle="We couldn't load your team">
        {(data) => {
          const members = asList(data?.members);
          const roles = asList(data?.roles);
          const activity = asList(data?.activity);
          return (
            <Stack spacing={6}>
              <Box as="section" aria-label="People">
                <Box as="ul" listStyleType="none" m={0} p={0} {...card}>
                  {data?.owner && (
                    <PersonRow name={data.owner.name ? `${data.owner.name} (you)` : 'You'} email={data.owner.email}>
                      <Badge colorScheme="blue" textTransform="none" borderRadius="full" px={2} alignSelf={{ base: 'flex-start', md: 'center' }}>{data.owner.role_label || 'Owner'}</Badge>
                    </PersonRow>
                  )}
                  {members.map((member) => (
                    <MemberRow key={member.uuid} member={member} roles={roles} busy={busy === member.uuid}
                      onRole={(m, role) => { if (role !== m.role) run(changeRole, m, role); }}
                      onResend={(m) => run(resend, m)}
                      onRemove={setToRemove} />
                  ))}
                </Box>
                {members.length === 0 && (
                  <EmptyState icon={Users} title="It's just you for now" minH="200px"
                    description="Invite a manager or sales staff. Each person gets their own login, and you choose what they can do."
                    action={{ label: 'Invite a team member', onClick: () => setInviting(true) }} />
                )}
              </Box>

              <Box as="section" {...card} p={{ base: 4, md: 5 }}>
                <Heading as="h2" size="sm" mb={3}>What each role can do</Heading>
                <Stack as="dl" spacing={3}>
                  {[{ value: 'owner', label: data?.owner?.role_label || 'Owner', can: data?.owner_can }, ...roles].filter((role) => role.can).map((role) => (
                    <Flex key={role.value} direction={{ base: 'column', sm: 'row' }} gap={{ base: 0, sm: 4 }}>
                      <Text as="dt" fontWeight="600" w={{ sm: '120px' }} flexShrink={0}>{role.label}</Text>
                      <Text as="dd" color="gray.700" fontSize="sm" m={0}>{role.can}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>

              <Box as="section" {...card} p={{ base: 4, md: 5 }}>
                <Heading as="h2" size="sm" mb={1}>Recent activity</Heading>
                {activity.length === 0 ? (
                  <EmptyState icon={History} title="No activity yet" minH="160px"
                    description="Once you have a team, changes to listings, orders and settings are listed here with who made them." />
                ) : (
                  <Box as="ul" listStyleType="none" m={0} p={0}>
                    {activity.map((item, index) => (
                      <Flex as="li" key={`${item.date}-${index}`} py={2.5} gap={{ base: 0, sm: 3 }} direction={{ base: 'column', sm: 'row' }} justify="space-between"
                        borderTopWidth="1px" borderColor="gray.100" _first={{ borderTopWidth: 0 }}>
                        <Text fontSize="sm"><Text as="span" fontWeight="600">{item.who}</Text> · {item.action}</Text>
                        <Text fontSize="xs" color="gray.600" flexShrink={0}>{whenText(item.date)}</Text>
                      </Flex>
                    ))}
                  </Box>
                )}
              </Box>

              <InviteModal isOpen={inviting} onClose={() => setInviting(false)} roles={roles}
                onInvited={(next) => { if (next) team.setData(next); else team.reload(); setInviting(false); }} />
            </Stack>
          );
        }}
      </AsyncState>

      <ActionDialog
        isOpen={Boolean(toRemove)}
        onClose={() => setToRemove(null)}
        isLoading={remove.loading}
        onConfirm={() => run(remove, toRemove)}
        config={toRemove ? {
          title: `Remove ${toRemove.name || toRemove.email}?`,
          body: toRemove.status === 'active'
            ? 'Their login stops working immediately and they are signed out everywhere. Conversations they were handling go back to the whole team.'
            : 'Their invitation stops working immediately. You can invite them again later.',
          confirmLabel: 'Remove', cancelLabel: 'Keep them', tone: 'danger',
        } : null}
      />
    </Box>
  );
}
