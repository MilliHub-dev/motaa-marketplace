import { Box, Stack } from "@chakra-ui/react"
import { FormStepper, Navbar, Footer } from "../components/nav"
import { Outlet } from "react-router-dom";



export const Layout = ({ children, ...props }) => {
    return(
        <div>
            <Navbar />
            <Box minH={'50vh'}>{children}</Box>
            <Footer />
        </div>
    )
}


export default Layout;