import {useState, useContext, Fragment} from 'react';
import {
    Checkbox,
    Box,
    MenuItem,
    Menu,
    MenuList,
    MenuButton,
    Button,
    Input,
    Heading,
    Text,
} from '@chakra-ui/react';
import {ChevronDownIcon} from '@chakra-ui/icons';


export const CarBrandFilter = ({ onChange, onClose }) => {
    const brands = [
        'BMW', 'Audi', 'Toyota', 'Mercedis', 'Nissan', 'Mazda', 'Honda',
        'Peugeot', 'Opel', 'Volkswagen', 'Innoson', 'Ford',
    ]
    const [isOpen, setOpenState] = useState(false);

    function onClose(){
        setOpenState(false)
    }
    function onOpen(){
        setOpenState(true)
    }

    function applyFilter(){
        onClose();
        onChange({

        })
    }

    return(
        <Menu closeOnSelect={false} isOpen={isOpen} onClose={onClose}>
            <MenuButton
             minW={'max-content'}
             size={'md'} borderRadius={'10px'}
             isActive={isOpen}
             as={Button}
             onClick={isOpen ? onClose : onOpen}
             bgColor="gray.100"
             rightIcon={<ChevronDownIcon />}
            > Brand </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
                <Box>
                    <Text p={3} size="md"> Select Make </Text>
                    {brands.map((make) => <MenuItem key={make} as={Checkbox}> {make} </MenuItem>)}
                </Box>
                <Box px={2} display={'block'} mt={2}>
                    <Button onClick={applyFilter} colorScheme="blue" bgColor="primary" w={'100%'}> Confirm </Button>
                </Box>
            </MenuList>
        </Menu>
    )
}


export const LocationFilter = ({ onChange, onClose }) => {
    const [isOpen, setOpenState] = useState(false);

    function onClose(){
        setOpenState(false)
    }
    function onOpen(){
        setOpenState(true)
    }

    function applyFilter(){
        onClose();
        onChange({

        })
    }

    return(
        <Menu closeOnSelect={false} isOpen={isOpen} onClose={onClose}>
            <MenuButton
             minW={'max-content'}
             size={'md'} borderRadius={'10px'}
             isActive={isOpen}
             as={Button}
             onClick={isOpen ? onClose : onOpen}
             bgColor="gray.100"
             rightIcon={<ChevronDownIcon />}
            > Location </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
                <Box>
                    <Text p={3} size="md"> Select Location </Text>

                    {
                        [
                            'Abuja', 'Kaduna',
                        ]
                        .map((location) => <MenuItem key={location} value={location} as={Checkbox}> {location} </MenuItem>
                    )}
                </Box>

                <Box px={2} display={'block'} mt={2}>
                    <Button onClick={applyFilter} colorScheme="blue" bgColor="primary" w={'100%'}> Confirm </Button>
                </Box>
            </MenuList>
        </Menu>
    )
}


export const PriceFilter = ({ onChange, onClose }) => {
    const [isOpen, setOpenState] = useState(false);

    function onClose(){
        setOpenState(false)
    }
    function onOpen(){
        setOpenState(true)
    }

    function applyFilter(){
        onClose();
        onChange({

        })
    }

    return(
        <Menu closeOnSelect={false} isOpen={isOpen} onClose={onClose}>
            <MenuButton
             minW={'max-content'}
             size={'md'} borderRadius={'10px'}
             isActive={isOpen}
             as={Button}
             onClick={isOpen ? onClose : onOpen}
             bgColor="gray.100"
             rightIcon={<ChevronDownIcon />}
            > Price </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
                <Box>
                    <Text p={3} size="md"> Set min and max amount </Text>
                    <Box px={2} py={2} display={'block'}>
                        <Text> Min Amount </Text>
                        <Input type="number" min="1" step="0.01" />
                    </Box>
                    <Box px={2} py={2} display={'block'}>
                        <Text> Max Amount </Text>
                        <Input type="number" min="1" step="0.01" />
                    </Box>
                    <Box px={2} display={'block'} mt={2}>
                        <Button onClick={applyFilter} colorScheme="blue" bgColor="primary" w={'100%'}> Confirm </Button>
                    </Box>
                </Box>
            </MenuList>
        </Menu>
    )
}


export const TransmissionFilter = ({ onChange, onClose }) => {
    const [isOpen, setOpenState] = useState(false);

    function onClose(){
        setOpenState(false)
    }
    function onOpen(){
        setOpenState(true)
    }

    function applyFilter(){
        onClose();
        onChange({

        })
    }

    return(
        <Menu closeOnSelect={false} isOpen={isOpen} onClose={onClose}>
            <MenuButton
             minW={'max-content'}
             size={'md'} borderRadius={'10px'}
             isActive={isOpen}
             as={Button}
             onClick={isOpen ? onClose : onOpen}
             bgColor="gray.100"
             rightIcon={<ChevronDownIcon />}
            > Transmission </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
                <Box>
                    <Text p={3} size="md"> Select Transmission </Text>
                        {
                            ['Auto', 'Manual', 'Assisted Manual']
                            .map((trans) => <MenuItem key={trans} as={Checkbox}> {trans} </MenuItem>
                        )}
                    <Box px={2} display={'block'} mt={2}>
                        <Button onClick={applyFilter} colorScheme="blue" bgColor="primary" w={'100%'}> Confirm </Button>
                    </Box>
                </Box>
            </MenuList>
        </Menu>
    )
}



