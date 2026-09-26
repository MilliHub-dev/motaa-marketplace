import {useContext, useEffect,} from "react";
import {GlobalStore} from "../App";
import {
    FormStepper, Footer,
    UnauthenticatedNavbar, CustomerNavbar,
    DealerNavbar, MechanicNavbar,
} from "../components/nav";
import { Box, Stack } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import LandingMaintenance from "../components/LandingMaintenance";



export const Layout = ({ children, hideFooter, ...props }) => {
    const {authUser, isAuthenticated} = useContext(GlobalStore);
    const { pathname } = useLocation();
    const isLandingPage = !isAuthenticated && ![
        '/login', '/signup', '/signup/business', '/privacy-policy', '/terms-of-service',
    ].includes(pathname.replace(/\/$/, ''));
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
        <LandingMaintenance enabled={isLandingPage}>
        <Stack bgColor="#fff" gap={0} spacing={0}>
            {
                !isAuthenticated ? (<UnauthenticatedNavbar />):(<CustomerNavbar />)
            }
            <Box minH={'50vh'}><Outlet /></Box>
            {!shouldHideFooter && <Footer />}
        </Stack>
        </LandingMaintenance>
    )
}


export default Layout;
