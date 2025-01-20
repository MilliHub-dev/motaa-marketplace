import { ChevronDownIcon } from "@chakra-ui/icons"
import {
    Badge, Box, Button, Card, CardBody, CardHeader,
    Container, Divider, Flex, Heading, HStack, Image,
    Menu, MenuButton, MenuItem, MenuList, Switch, Text,
    ButtonGroup,
} from "@chakra-ui/react"
import { Fragment, useContext, useEffect, useState } from "react"
import { GlobalStore } from "../../../App"
import { RiClockwiseLine, RiGasStationLine, } from "react-icons/ri"
import { RxTimer } from "react-icons/rx"
import { TbManualGearbox } from "react-icons/tb"
import { ListingItemCard } from "../../../components"
import { Paginator } from "../../../components/nav"
import { objectifyJSON } from "../../../utils"
import { ListingSkeleton } from "../../../components/loaders"

const BuyListing = ({ }) => {
    const [listings, setListings] = useState([]);
    const [data, setData] = useState(null);
    const [carType, setCarType] = useState('new');
    const {axios, notify, commaInt} = useContext(GlobalStore);
    const [loading, setLoadingState] = useState(true);

    function gotoPage(pageNum){
        console.log("Page:", pageNum)
        // const res = await axios.get(`/listings/buy/`,);
        // let data = objectifyJSON(res.data);

    }

    async function getData(){
        const res = await axios.get(`/listings/buy/`,);
        let data = objectifyJSON(res.data);

        setData(data.data);
        setListings(data?.data?.results);
        console.log("Got Data:", data)
        
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
        {
            name: 'Make and Model',
            component:  ({ onChange, }) => (
                <MenuItem>
                    <li> BMW </li>
                </MenuItem>
            )
        },
        {name: 'Price'},
        {name: 'Location'},
        {name: 'Mileage'},
        {name: 'Transmission'},
        {name: 'Vehicle Type'},
    ]

    if (loading){
        return <ListingSkeleton />
    }

    return(
        <Fragment>
            <Container maxWidth={'container.xl'} py={4}>
                <Box>
                    <Heading size={'lg'} className="subtitle"> Cars for Sale </Heading>
                    <ButtonGroup size='md' isAttached variant='outline' mt={3}>
                        <Button onClick={() => setCarType('new')} 
                         bgColor={carType === 'new' ? 'primary' : 'transparent'}
                         color={carType === 'new' ? 'white' : 'primary'}
                         borderTopWidth={2} borderBottomWidth={2}
                         borderLeftWidth={2}
                         colorScheme={'blue'}
                         borderColor="cornflowerblue"
                         borderRadius="30px" px={'35px'}
                        >New</Button>

                        <Button onClick={() => setCarType('used')}
                         bgColor={carType === 'used' ? 'primary' : 'transparent'}
                         color={carType === 'used' ? 'white' : 'primary'}
                         borderTopWidth={2} borderBottomWidth={2}
                         borderRightWidth={2}
                         colorScheme={'blue'}
                         borderColor="cornflowerblue"
                         borderRadius="30px" px={'35px'}
                        >Used</Button>
                    </ButtonGroup>
                </Box>

                <Flex my={2} py={4} flexWrap={'nowrap'} gap={4} overflowX={'auto'} className="">
                    {
                        filters.map(({name, component}, idx) =>
                            <Menu>
                                {({ isOpen }) => (
                                    <Fragment>
                                        <MenuButton minW={'max-content'} size={'md'} borderRadius={'10px'} isActive={isOpen} as={Button} rightIcon={<ChevronDownIcon />}> {name} </MenuButton>
                                        <MenuList>
                                            {component}
                                        </MenuList>
                                    </Fragment>
                                )}
                            </Menu>
                        )
                    }
                </Flex>

                <Flex flexWrap={'wrap'} justifyContent={{base: 'space-evenly', lg: 'flex-start'}} rowGap={{base: 6, lg: 10}} columnGap={{base: 2, lg: 6}} pt={'2rem'} pb={'4rem'}>
                    {
                        listings.map((listing, idx) =>
                            <ListingItemCard listing={listing} key={idx} w={{base: '100%', md: 'calc(100% / 2 - 20px)', lg: 'calc(100% / 3 - 20px)'}} maxW={{base: '320px', lg: 'calc(100% / 3 - 20px)'}} />
                        )
                    }
                </Flex>

                <Paginator pagination={data?.pagination} onNext={() => gotoPage(data?.pagination?.next)} onPrevious={() => gotoPage(data?.pagination?.previous)} onClick={console.log} />
            </Container>
        </Fragment>
    )
}


export default BuyListing