import { Box } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { GlobalStore } from "../../../App";
import { jsonifyObject, objectifyJSON } from "../../../utils";
import { useSearchParams } from "react-router-dom";



export const MechanicDetailPage = ({ props }) => {
    const [searchResults, setSearchResults] = useState(null);
    const [matches, setMatches] = useState([]);
    const {find} =  useSearchParams()
    const [loading, setLoading] = useState(true);
    const {axios, authUser, commaInt, notify, redirect, } = useContext(GlobalStore);

    function init(){
        getData();
        setTimeout(() => setLoading(false), 2000)
    }

    async function getData(){
        const res = axios.get(`/listings/search/?find=${find}`);
        const data = objectifyJSON(res.data);
        setSearchResults(data);
        setMatches(data?.matches);
    }

    useEffect(() => {
        init()
    }, []);

    if (loading){
        return null;
    }

    return (
        <Box>

        </Box>
    )
}

export default MechanicDetailPage;


