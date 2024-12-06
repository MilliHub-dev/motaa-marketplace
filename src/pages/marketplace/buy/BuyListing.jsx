import { ChevronDownIcon } from "@chakra-ui/icons"
import { Badge, Box, Button, Card, CardBody, CardHeader, Container, Divider, Flex, Heading, HStack, Image, Menu, MenuButton, MenuItem, MenuList, Switch, Text } from "@chakra-ui/react"
import { Fragment, useContext, useEffect, useState } from "react"
import { GlobalStore } from "../../../App"
import { RiClockwiseLine, RiGasStationLine, } from "react-icons/ri"
import { RxTimer } from "react-icons/rx"
import { TbManualGearbox } from "react-icons/tb"
import { ListingItemCard } from "../../../components"
import { objectifyJSON } from "../../../utils"
import { ListingSkeleton } from "../../../components/loaders"

const BuyListing = ({ }) => {
    const [listings, setListings] = useState([]);
    const [data, setData] = useState(null);
    const {axios, notify, commaInt} = useContext(GlobalStore);
    const [loading, setLoadingState] = useState(true);

    async function getData(){
        const res = await axios.get(`/listings/buy/`,);
        let data = objectifyJSON(res.data);

        setData(data.data);
        setListings(data?.data?.results);
        
        if (!res.status === 200){
            notify({
                title: 'Error',
                body: data?.message || "Something went wrong"
            })
        }

    }

    function init(){
        getData();
        setTimeout(() => setLoadingState(false), 2500);
    }

    useEffect(() => {
        init()
    }, [])

    const filters = [
        {name: 'Make and Model', component: ({ onChange, }) => {
            return(
                <div>

                </div>
            )
        }},
        {name: 'Price'},
        {name: 'Mileage'},
        {name: 'Location'},
        {name: 'Transmission'},
        {name: 'Vehicle Type'},
        {name: 'Condition'},
        {name: 'Fuel System'},
    ]

    if (loading){
        return <ListingSkeleton />
    }

    return(
        <Fragment>
            <Container maxWidth={'container.lg'} py={4}>
                <Heading size={'lg'} className="subtitle"> Cars for Sale </Heading>
                {/* <Switch /> */}

                <Flex my={2} py={4} flexWrap={'nowrap'} gap={4} overflowX={'auto'} className="">
                    {
                        filters.map((filter, idx) =>
                            <Menu>
                                {({ isOpen }) => (
                                    <Fragment>
                                    <MenuButton minW={'max-content'} size={'sm'} isActive={isOpen} as={Button} rightIcon={<ChevronDownIcon />}> {filter.name} </MenuButton>
                                    <MenuList py={0} className="small">
                                        <MenuItem>{filter.name}</MenuItem>
                                        <MenuItem onClick={() => alert('Kagebunshin')}>Create a Copy</MenuItem>
                                    </MenuList>
                                    </Fragment>
                                )}
                            </Menu>
                        )
                    }

                </Flex>

                <Flex flexWrap={'wrap'} justifyContent={{base: 'space-evenly', lg: 'space-between'}} rowGap={6} columnGap={2} py={'2rem'}>
                    {
                        listings.map((listing, idx) =>
                            <ListingItemCard listing={listing} key={idx} w={{base: '100%', md: 'calc(100% / 2 - 20px)', lg: 'calc(100% / 3 - 20px)'}} maxW={{base: '320px', lg: 'calc(100% / 3 - 20px)'}} />
                        )
                    }
                </Flex>
            </Container>
        </Fragment>
    )
}


export default BuyListing