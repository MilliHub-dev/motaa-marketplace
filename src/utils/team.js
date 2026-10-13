// Business teams: who is signed in (the owner or a team member) and what the dashboard shows them.
// The server decides what each role may actually do; these helpers only keep the
// interface from offering things it will refuse.
import { isBusinessUser } from './index';

/** 'owner' | 'manager' | 'sales' for someone in a business dashboard, '' for everyone else. */
export function teamRole(user) {
  if (!isBusinessUser(user)) return '';
  // sessions saved before teams existed have no role: only owners could sign in then
  return user.team_role || 'owner';
}

export const isOwner = (user) => teamRole(user) === 'owner';
export const isTeamMember = (user) => ['manager', 'sales'].includes(teamRole(user));
export const isSalesStaff = (user) => teamRole(user) === 'sales';

/** Wallet, withdrawals, the team and business verification belong to the owner. */
export const canUseWallet = isOwner;
export const canManageTeam = isOwner;
/** Business profile and shop settings. */
export const canChangeSettings = (user) => ['owner', 'manager'].includes(teamRole(user));
export const canDelete = (user) => ['owner', 'manager'].includes(teamRole(user));

/** Does this business have a team (so conversations show who has them)? Team members always do. */
export function hasTeam(user) {
  const role = teamRole(user);
  return role === 'owner' ? Boolean(user.has_team) : Boolean(role);
}

/** Sidebar links this person should see. Links are marked `ownerOnly` or `settings`. */
export function visibleLinks(links, user) {
  return links.filter((link) => {
    if (link.ownerOnly) return isOwner(user);
    if (link.settings) return canChangeSettings(user);
    return true;
  });
}

/** "Sales staff at Ade Motors" for a team member, "Owner" for the owner, '' for customers. */
export function roleLine(user, businessName) {
  const role = teamRole(user);
  if (!role) return '';
  if (role === 'owner') return 'Owner';
  const label = user.team_role_label || (role === 'manager' ? 'Manager' : 'Sales staff');
  const business = user.business_name || businessName;
  return business ? `${label} at ${business}` : label;
}

/** Colour and words for a team member's status badge. */
export function memberStatus(member) {
  if (member?.status === 'active') return { label: member.status_label || 'Active', color: 'green', expired: false };
  const expired = Boolean(member?.invite_expired);
  return { label: member?.status_label || (expired ? 'Invitation expired' : 'Invited'), color: expired ? 'red' : 'yellow', expired };
}

function validDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function clock(date) {
  const hours = date.getHours();
  return `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`;
}

/** "Today, 2:05 pm" / "Yesterday, 9:00 am" / "Oct 3, 2026" ('' when there is no date). */
export function whenText(value, now = new Date()) {
  const date = validDate(value);
  if (!date) return '';
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (days === 0) return `Today, ${clock(date)}`;
  if (days === 1) return `Yesterday, ${clock(date)}`;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** What to show under "Last seen" for a team member. */
export function lastSeenText(member, now = new Date()) {
  if (member?.status !== 'active') {
    const invited = whenText(member?.invited_at, now);
    return invited ? `Invited ${invited.replace(/^Today/, 'today').replace(/^Yesterday/, 'yesterday')}` : 'Not joined yet';
  }
  return whenText(member?.last_seen, now) || 'Not signed in yet';
}

// ---------------------------------------------------------------- conversations

/** Who has a conversation: "Unassigned", "You" or the team member's name. */
export function assignmentLabel(assignedTo) {
  if (!assignedTo) return 'Unassigned';
  return assignedTo.mine ? 'You' : (assignedTo.name || 'A team member');
}

/** The filters a business user gets on the conversation list. An owner is never given a conversation, so has no "Mine". */
export function chatFilters(role) {
  if (!role) return [];
  return role === 'owner'
    ? [{ value: 'all', label: 'All' }, { value: 'unassigned', label: 'Unassigned' }, { value: 'assigned', label: 'Assigned' }]
    : [{ value: 'all', label: 'All' }, { value: 'mine', label: 'Mine' }, { value: 'unassigned', label: 'Unassigned' }];
}

export function filterConversations(conversations, filter) {
  if (filter === 'mine') return conversations.filter((c) => c?.assigned_to?.mine);
  if (filter === 'unassigned') return conversations.filter((c) => !c?.assigned_to);
  if (filter === 'assigned') return conversations.filter((c) => Boolean(c?.assigned_to));
  return conversations;
}

/**
 * What someone can do about who has the open conversation.
 * → { show, canPickUp, canHandBack, canReassign, members }
 */
export function assignmentActions(room) {
  const role = room?.team?.role || '';
  const members = Array.isArray(room?.team?.members) ? room.team.members : [];
  const assigned = room?.assigned_to || null;
  if (!role) return { show: false, canPickUp: false, canHandBack: false, canReassign: false, members: [] };
  if (role === 'sales') {
    return { show: true, canPickUp: !assigned, canHandBack: Boolean(assigned?.mine), canReassign: false, members: [] };
  }
  // an owner working alone has nobody to hand a conversation to
  const show = Boolean(room.team.has_team) || members.length > 0 || Boolean(assigned);
  return { show, canPickUp: false, canHandBack: false, canReassign: show, members };
}
