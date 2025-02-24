import {useContext, useEffect,} from "react";
import {GlobalStore} from "../App";
import {
    FormStepper, Footer,
    UnauthenticatedNavbar, CustomerNavbar,
    DealerNavbar, MechanicNavbar,
} from "../components/nav";
import { Box, Stack } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";



export const Layout = ({ children, hideFooter, ...props }) => {
    const {authUser, isAuthenticated} = useContext(GlobalStore);
    const loc = window.location.pathname.split('/');

    function getUserNav(userType){
        switch(userType){
            case "mechanic":
                return <MechanicNavbar />
            case "dealer":
                return <DealerNavbar />
            default: // customer
                return <CustomerNavbar />
        }
    }

    const footerVisibility = () => {
        if(loc.includes('wallet') || loc.includes('chat') || hideFooter){
            return true
        }
        return false
    }

    const shouldHideFooter = footerVisibility();

    useEffect(() => {

    }, [window.location.pathname, hideFooter])

    return(
        <Stack bgColor="#fff" gap={0} spacing={0}>
            {
                !isAuthenticated ? (<UnauthenticatedNavbar />):(<CustomerNavbar />)
            }
            <Box minH={'50vh'}><Outlet /></Box>
            {!shouldHideFooter && <Footer />}
        </Stack>
    )
}


export default Layout;