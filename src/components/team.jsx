// Shared pieces for business teams (see src/utils/team.js for the rules).
import { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { GlobalStore } from '../App';
import { roleHome } from '../pages/auth/shared';

export const OWNER_ONLY_NOTICE = 'Only the business owner can open this.';
export const SETTINGS_NOTICE = "Your role can't change business settings. Ask a manager or the owner.";

/** Route element for a page this person's role can't use: back to their dashboard, with a short notice. */
export function RoleRedirect({ message = OWNER_ONLY_NOTICE }) {
  const { authUser, notify } = useContext(GlobalStore);
  useEffect(() => {
    notify({ title: 'Not available for your role', body: message, color: 'blue', duration: 5000 });
  // once, when the redirect happens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Navigate to={roleHome(authUser)} replace />;
}
