
/** Safely read a boolean-ish Vite env var.
 * `import.meta.env.X` is undefined when no .env file is present, and
 * JSON.parse(undefined) throws on the string "undefined".
 */
export function envFlag(value, fallback = false){
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    return String(value).trim().toLowerCase() === 'true' || String(value).trim() === '1';
}

/** True when VITE_DEBUG is set to a truthy value. */
export function isDebug(){
    return envFlag(import.meta.env.VITE_DEBUG, false);
}

/** Always hand back an array: API lists can arrive missing or malformed on errors. */
export function asList(value){
    return Array.isArray(value) ? value : [];
}

// The Motaa icon stands in for a dealer whose profile Motaa has hidden from customers
// (the API then sends `profile_hidden: true`, no logo, and "Motaa Dealer #<id>" as the name).
export const MOTAA_ICON = '/logo192.png';

/** Picture for a dealer or chat contact: their own logo, or the Motaa icon when hidden. */
export function profilePicture(profile) {
  return profile?.logo || profile?.image || (profile?.profile_hidden ? MOTAA_ICON : undefined);
}


// Account types that run a business dashboard (everything else is a customer).
export const BUSINESS_USER_TYPES = ['dealer', 'mechanic', 'parts_dealer'];

/** True for car dealers, mechanics and parts dealers. */
export function isBusinessUser(user) {
  return BUSINESS_USER_TYPES.includes(user?.user_type);
}
