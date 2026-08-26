
/** Turn a JavaScript object into JSON formatted string
 * - Checks if data is already
 */
export function jsonifyObject(dataobject){
    let data = dataobject;
    if (typeof data === 'string'){
        try{
            data = JSON.stringify(JSON.parse(data));
        }catch(error){
            console.error("jsonifyObject failed due to:-> ", error)
        }
    }
    if (typeof data === 'object'){
        data = JSON.stringify(data);
    }
    
    return data
}

export function objectifyJSON(datastring){
    let data = datastring;
    if (typeof data === 'object'){
        try{
            data = JSON.parse(JSON.stringify(data));
        }catch(error){
            console.error("objectifyJSON failed due to:-> ", error);
        }
    }
    if (typeof data === 'string'){
        data = JSON.parse(data);
    }

    return data;
}

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
