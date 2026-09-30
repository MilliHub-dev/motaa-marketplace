
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
