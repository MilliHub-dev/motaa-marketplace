import { Suspense, useContext, useEffect, useState } from "react";
import { LoadingState } from "../components/states";
import { GlobalStore } from "../App";
import {
    Footer, UnauthenticatedNavbar, CustomerNavbar,
    DealerNavbar, MechanicNavbar, DealerDashboardSideBar, MechanicDashboardSideBar,
} from "../components/nav";
import { Box, Stack } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import LandingMaintenance from "../components/LandingMaintenance";

// Pages logged-out visitors can always use, even in maintenance mode.
export const PUBLIC_PATHS = [
    '/', '/login', '/signup', '/signup/business', '/privacy-policy', '/terms-of-service',
    '/about', '/features', '/business', '/support', '/reset-password/*',
];

// Dealers and mechanics keep their dashboard navbar (and its menu drawer) on shared pages.
function BusinessNav({ userType }){
    const [sidebarOpen, setSidebarState] = useState(false);
    const Navbar = userType === 'mechanic' ? MechanicNavbar : DealerNavbar;
    const SideBar = userType === 'mechanic' ? MechanicDashboardSideBar : DealerDashboardSideBar;
    return (
        <>
            <Navbar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} hideSidebar />
            <SideBar sidebarOpen={sidebarOpen} setSidebarState={setSidebarState} mode="drawer" />
        </>
    )
}

function UserNav({ authUser }){
    if (!authUser) return <UnauthenticatedNavbar />;
    if (['dealer', 'mechanic'].includes(authUser.user_type)) return <BusinessNav userType={authUser.user_type} />;
    return <CustomerNavbar />;
}

export const Layout = ({ hideFooter }) => {
    const { authUser, isAuthenticated, maintenanceMode } = useContext(GlobalStore);
    const { pathname } = useLocation();
    // the maintenance dialog only guards actions for logged-out visitors
    const maintenanceActive = maintenanceMode && !isAuthenticated;
    const segments = pathname.split('/');
    const showFooter = !hideFooter && !segments.includes('wallet') && !segments.includes('chat');

    // start each page at the top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname])

    return (
        <LandingMaintenance enabled={maintenanceActive} allowedPaths={PUBLIC_PATHS}>
            <Stack bgColor="#fff" spacing={0}>
                <UserNav authUser={isAuthenticated ? authUser : null} />
                <Box as="main" id="main" minH="50vh"><Suspense fallback={<LoadingState minH="50vh" />}><Outlet /></Suspense></Box>
                {showFooter && <Footer />}
            </Stack>
        </LandingMaintenance>
    )
}


export default Layout;
