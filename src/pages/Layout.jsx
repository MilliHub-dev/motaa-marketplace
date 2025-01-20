import { Box, Stack } from "@chakra-ui/react"
import { FormStepper, Navbar, Footer } from "../components/nav"
import { Outlet } from "react-router-dom";



export const Layout = ({ children, hideFooter, ...props }) => {
    return(
        <Stack bgColor="#fff" gap={0} spacing={0}>
            <Navbar />
            <Box minH={'50vh'}>{children}</Box>
            {!hideFooter && <Footer />}
        </Stack>
    )
}


export default Layout;