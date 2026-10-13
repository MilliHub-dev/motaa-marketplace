import { describe, expect, it } from 'vitest';
import {
  assignmentActions, assignmentLabel, canChangeSettings, canDelete, canUseWallet, chatFilters, filterConversations,
  hasTeam, isOwner, isTeamMember, lastSeenText, memberStatus, roleLine, teamRole, visibleLinks, whenText,
} from './team';
import { roleHome } from '../pages/auth/shared';

const owner = { user_type: 'dealer', team_role: 'owner' };
const manager = { user_type: 'mechanic', team_role: 'manager', team_role_label: 'Manager', business_name: 'Fix It' };
const sales = { user_type: 'parts_dealer', team_role: 'sales', team_role_label: 'Sales staff', business_name: 'Ade Parts' };
const customer = { user_type: 'customer' };

describe('teamRole', () => {
  it('reads the role the API sent', () => {
    expect([owner, manager, sales].map(teamRole)).toEqual(['owner', 'manager', 'sales']);
  });

  it('treats a business session saved before teams existed as the owner', () => {
    expect(teamRole({ user_type: 'dealer' })).toBe('owner');
  });

  it('gives customers, removed members and logged-out visitors no role', () => {
    expect(teamRole(customer)).toBe('');
    expect(teamRole({ user_type: 'team', team_role: null, team_access: false })).toBe('');
    expect(teamRole(null)).toBe('');
  });
});

describe('what each role is offered', () => {
  it('keeps the wallet for the owner', () => {
    expect([owner, manager, sales, customer].map(canUseWallet)).toEqual([true, false, false, false]);
  });

  it('lets managers, but not sales staff, change settings and delete', () => {
    expect([owner, manager, sales].map(canChangeSettings)).toEqual([true, true, false]);
    expect([owner, manager, sales].map(canDelete)).toEqual([true, true, false]);
  });

  it('tells owners and team members apart', () => {
    expect([owner, manager, sales, customer].map(isOwner)).toEqual([true, false, false, false]);
    expect([owner, manager, sales, customer].map(isTeamMember)).toEqual([false, true, true, false]);
  });

  it('knows whether the business has a team from the login', () => {
    expect(hasTeam(owner)).toBe(false);
    expect(hasTeam({ ...owner, has_team: true })).toBe(true);
    expect([manager, sales, customer].map(hasTeam)).toEqual([true, true, false]);
  });

  it('filters sidebar links', () => {
    const links = [{ label: 'Orders' }, { label: 'Team', ownerOnly: true }, { label: 'Settings', settings: true }];
    const labels = (user) => visibleLinks(links, user).map((link) => link.label);
    expect(labels(owner)).toEqual(['Orders', 'Team', 'Settings']);
    expect(labels(manager)).toEqual(['Orders', 'Settings']);
    expect(labels(sales)).toEqual(['Orders']);
  });
});

describe('roleLine', () => {
  it('names the role and the business for a team member', () => {
    expect(roleLine(sales)).toBe('Sales staff at Ade Parts');
    expect(roleLine({ user_type: 'dealer', team_role: 'manager' }, 'Ade Motors')).toBe('Manager at Ade Motors');
    expect(roleLine({ user_type: 'dealer', team_role: 'sales' })).toBe('Sales staff');
  });

  it('is short for the owner and empty for customers', () => {
    expect(roleLine(owner)).toBe('Owner');
    expect(roleLine(customer)).toBe('');
  });
});

describe('a team member lands on their business dashboard', () => {
  it('uses the business type the API put on the login', () => {
    expect(roleHome(sales)).toBe('/parts-store');
    expect(roleHome(manager)).toBe('/dashboard');
    expect(roleHome(customer)).toBe('/home');
  });
});

describe('memberStatus', () => {
  it('colours active, invited and expired differently', () => {
    expect(memberStatus({ status: 'active', status_label: 'Active' })).toEqual({ label: 'Active', color: 'green', expired: false });
    expect(memberStatus({ status: 'invited', status_label: 'Invited' })).toEqual({ label: 'Invited', color: 'yellow', expired: false });
    expect(memberStatus({ status: 'invited', status_label: 'Invitation expired', invite_expired: true })).toEqual({ label: 'Invitation expired', color: 'red', expired: true });
    // the flag decides, not the wording
    expect(memberStatus({ status: 'invited', status_label: 'Invitation expired', invite_expired: false }).expired).toBe(false);
    expect(memberStatus({ status: 'invited', invite_expired: true })).toEqual({ label: 'Invitation expired', color: 'red', expired: true });
  });
});

describe('dates', () => {
  const now = new Date(2026, 9, 13, 15, 0);

  it('says today, yesterday or the date', () => {
    expect(whenText(new Date(2026, 9, 13, 14, 5), now)).toBe('Today, 2:05 pm');
    expect(whenText(new Date(2026, 9, 12, 0, 30), now)).toBe('Yesterday, 12:30 am');
    expect(whenText(new Date(2026, 9, 3, 9, 0), now)).toBe('Oct 3, 2026');
    expect(whenText(null, now)).toBe('');
    expect(whenText('not a date', now)).toBe('');
  });

  it('describes when a member was last seen', () => {
    expect(lastSeenText({ status: 'active', last_seen: new Date(2026, 9, 13, 9, 0) }, now)).toBe('Today, 9:00 am');
    expect(lastSeenText({ status: 'active', last_seen: null }, now)).toBe('Not signed in yet');
    expect(lastSeenText({ status: 'invited', invited_at: new Date(2026, 9, 12, 9, 0) }, now)).toBe('Invited yesterday, 9:00 am');
    expect(lastSeenText({ status: 'invited', invited_at: new Date(2026, 9, 1, 9, 0) }, now)).toBe('Invited Oct 1, 2026');
  });
});

describe('conversations', () => {
  const list = [
    { uuid: 'a', assigned_to: null },
    { uuid: 'b', assigned_to: { name: 'Tunde Bello', mine: true } },
    { uuid: 'c', assigned_to: { name: 'Ngozi Eze', mine: false } },
  ];
  const ids = (filter) => filterConversations(list, filter).map((c) => c.uuid);

  it('labels who has a conversation', () => {
    expect(list.map((c) => assignmentLabel(c.assigned_to))).toEqual(['Unassigned', 'You', 'Ngozi Eze']);
  });

  it('filters the list', () => {
    expect(ids('all')).toEqual(['a', 'b', 'c']);
    expect(ids('mine')).toEqual(['b']);
    expect(ids('unassigned')).toEqual(['a']);
    expect(ids('assigned')).toEqual(['b', 'c']);
  });

  it('offers filters to business users only', () => {
    expect(chatFilters('')).toEqual([]);
    expect(chatFilters('sales').map((f) => f.value)).toEqual(['all', 'mine', 'unassigned']);
    expect(chatFilters('owner').map((f) => f.value)).toEqual(['all', 'unassigned', 'assigned']);
  });

  it('lets sales staff pick up an unassigned conversation or hand back their own', () => {
    const team = { role: 'sales', members: [] };
    expect(assignmentActions({ team, assigned_to: null })).toMatchObject({ show: true, canPickUp: true, canHandBack: false, canReassign: false });
    expect(assignmentActions({ team, assigned_to: { name: 'Tunde', mine: true } })).toMatchObject({ canPickUp: false, canHandBack: true });
    expect(assignmentActions({ team, assigned_to: { name: 'Ngozi', mine: false } })).toMatchObject({ canPickUp: false, canHandBack: false });
  });

  it('lets the owner and managers give it to anyone on the team', () => {
    const members = [{ uuid: 'm1', name: 'Tunde Bello', role_label: 'Sales staff' }];
    expect(assignmentActions({ team: { role: 'manager', members }, assigned_to: null })).toMatchObject({ show: true, canReassign: true, members });
    expect(assignmentActions({ team: { role: 'owner', members: [] }, assigned_to: null })).toMatchObject({ show: false, canReassign: false });
    expect(assignmentActions({ team: { role: 'owner', members: [], has_team: true }, assigned_to: null })).toMatchObject({ show: true, canReassign: true });
  });

  it('shows customers nothing', () => {
    expect(assignmentActions({ team: null, assigned_to: null }).show).toBe(false);
    expect(assignmentActions(undefined).show).toBe(false);
  });
});
