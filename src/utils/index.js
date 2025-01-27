
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