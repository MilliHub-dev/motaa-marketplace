// Filter menus for listing pages. Each one is controlled by `value` (what is
// currently applied, usually read from the URL) and reports changes with
// onChange({ filter, value }) — value '' / null means "remove this filter".
import { useEffect, useState } from 'react';
import {
    Box,
    Menu,
    MenuList,
    MenuButton,
    MenuOptionGroup,
    MenuItemOption,
    Button,
    FormControl,
    FormLabel,
    FormErrorMessage,
    Input,
    Text,
    Badge,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Portal,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export const CAR_BRANDS = [
    'BMW', 'Audi', 'Toyota', 'Mercedes-Benz', 'Lexus', 'Nissan', 'Mazda', 'Honda', 'Hyundai', 'Kia',
    'Peugeot', 'Opel', 'Volkswagen', 'Innoson', 'Ford',
];

// backend Vehicle.TRANSMISSION values
export const TRANSMISSIONS = [
    { value: 'auto', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

export const SERVICES = ['Oil Change', 'Tire Alignment/Rotation', 'Body Work'];

function toList(value) {
    if (Array.isArray(value)) return value;
    return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

const triggerProps = {
    minW: 'max-content',
    size: 'md',
    borderRadius: '10px',
    as: Button,
    bgColor: 'gray.100',
    rightIcon: <ChevronDownIcon />,
    flexShrink: 0,
};

/** Multi-select menu; applies on "Apply" so one request is made per change. */
function CheckboxFilter({ filter, label, heading, options, value, onChange }) {
    const applied = toList(value);
    const [draft, setDraft] = useState(applied);
    const appliedKey = applied.join(',');

    // chips removed elsewhere (or back/forward navigation) reset the ticks
    useEffect(() => { setDraft(toList(appliedKey)); }, [appliedKey]);

    return (
        <Menu closeOnSelect={false} onOpen={() => setDraft(toList(appliedKey))}>
            {({ onClose }) => (
                <>
                    <MenuButton {...triggerProps} aria-label={applied.length ? `${label}: ${applied.length} selected` : label}>
                        {label}
                        {applied.length > 0 && <Badge ml={2} colorScheme="blue" borderRadius="full">{applied.length}</Badge>}
                    </MenuButton>
                    <Portal>
                    <MenuList maxH="320px" overflowY="auto" zIndex={20}>
                        <MenuOptionGroup
                          title={heading}
                          type="checkbox"
                          value={draft}
                          onChange={(next) => setDraft(Array.isArray(next) ? next : [next])}
                        >
                            {options.map((option) => (
                                <MenuItemOption key={option.value} value={option.value}>{option.label}</MenuItemOption>
                            ))}
                        </MenuOptionGroup>
                        <Box px={3} pt={2} pb={1} display="flex" gap={2}>
                            <Button size="sm" variant="ghost" flex={1} isDisabled={!draft.length} onClick={() => setDraft([])}>
                                Clear
                            </Button>
                            <Button
                              size="sm"
                              flex={1}
                              colorScheme="blue"
                              bgColor="primary"
                              onClick={() => {
                                  onClose();
                                  onChange({ filter, value: draft.join(',') });
                              }}
                            >
                                Apply
                            </Button>
                        </Box>
                    </MenuList>
                    </Portal>
                </>
            )}
        </Menu>
    );
}


export const ServiceFilter = ({ onChange, value, services = SERVICES }) => (
    <CheckboxFilter
      filter="services"
      label="Services"
      heading="Select services"
      options={services.map((service) => ({ value: service, label: service }))}
      value={value}
      onChange={onChange}
    />
);


/** `param` is the API's name for the brand filter: 'brands' on /listings/buy/, 'make' on rentals and search. */
export const CarBrandFilter = ({ onChange, value, param = 'brands' }) => (
    <CheckboxFilter
      filter={param}
      label="Brand"
      heading="Select make"
      options={CAR_BRANDS.map((brand) => ({ value: brand, label: brand }))}
      value={value}
      onChange={onChange}
    />
);


export const TransmissionFilter = ({ onChange, value }) => (
    <CheckboxFilter
      filter="transmission"
      label="Transmission"
      heading="Select transmission"
      options={TRANSMISSIONS}
      value={value}
      onChange={onChange}
    />
);


/** Single location choice. Emits { filter: 'location', value: 'Lagos' }. */
export const LocationFilter = ({ onChange, value, locations = ['Abuja', 'Lagos', 'Kaduna', 'Port Harcourt', 'Kano', 'Ibadan'] }) => (
    <Menu>
        <MenuButton {...triggerProps}>{value ? `Location: ${value}` : 'Location'}</MenuButton>
        <Portal>
        <MenuList maxH="320px" overflowY="auto" zIndex={20}>
            <MenuOptionGroup
              title="Select location"
              type="radio"
              value={value || ''}
              onChange={(next) => onChange({ filter: 'location', value: next })}
            >
                <MenuItemOption value="">Anywhere</MenuItemOption>
                {locations.map((location) => <MenuItemOption key={location} value={location}>{location}</MenuItemOption>)}
            </MenuOptionGroup>
        </MenuList>
        </Portal>
    </Menu>
);


/**
 * Min/max price in naira. Emits { filter: 'price', value: { min, max } } with
 * numbers or null; both null removes the filter.
 */
export const PriceFilter = ({ onChange, value }) => {
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const min = value?.min ?? '';
    const max = value?.max ?? '';

    useEffect(() => { setMinPrice(min === null ? '' : String(min)); setMaxPrice(max === null ? '' : String(max)); }, [min, max]);

    const minNumber = minPrice === '' ? null : Number(minPrice);
    const maxNumber = maxPrice === '' ? null : Number(maxPrice);
    const invalidMin = minNumber !== null && (!Number.isFinite(minNumber) || minNumber < 0);
    const invalidMax = maxNumber !== null && (!Number.isFinite(maxNumber) || maxNumber <= 0);
    const invalidRange = !invalidMin && !invalidMax && minNumber !== null && maxNumber !== null && minNumber > maxNumber;
    const active = min !== '' && min !== null ? true : (max !== '' && max !== null);

    return (
        <Popover placement="bottom-start" isLazy>
            {({ onClose }) => (
                <>
                    <PopoverTrigger>
                        <Button {...triggerProps} as={undefined}>
                            Price {active && <Badge ml={2} colorScheme="blue" borderRadius="full">1</Badge>}
                        </Button>
                    </PopoverTrigger>
                    <Portal>
                    <PopoverContent zIndex={20} px={3} py={3} maxW="280px">
                        <Text fontWeight="600" mb={2}>Price range (₦)</Text>
                        <form
                          noValidate
                          onSubmit={(e) => {
                              e.preventDefault();
                              if (invalidMin || invalidMax || invalidRange) return;
                              onClose();
                              onChange({ filter: 'price', value: minNumber === null && maxNumber === null ? null : { min: minNumber, max: maxNumber } });
                          }}
                        >
                            <FormControl isInvalid={invalidMin} mb={2}>
                                <FormLabel fontSize="sm" mb={1}>Minimum</FormLabel>
                                <Input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" inputMode="numeric" min="0" step="1000" placeholder="No minimum" />
                                <FormErrorMessage>Enter a valid amount</FormErrorMessage>
                            </FormControl>
                            <FormControl isInvalid={invalidMax || invalidRange} mb={3}>
                                <FormLabel fontSize="sm" mb={1}>Maximum</FormLabel>
                                <Input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" inputMode="numeric" min="1" step="1000" placeholder="No maximum" />
                                <FormErrorMessage>{invalidRange ? 'Maximum must be more than the minimum' : 'Enter a valid amount'}</FormErrorMessage>
                            </FormControl>
                            <Box display="flex" gap={2}>
                                <Button size="sm" variant="ghost" flex={1} onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Clear</Button>
                                <Button size="sm" type="submit" flex={1} colorScheme="blue" bgColor="primary" isDisabled={invalidMin || invalidMax || invalidRange}>Apply</Button>
                            </Box>
                        </form>
                    </PopoverContent>
                    </Portal>
                </>
            )}
        </Popover>
    );
};
