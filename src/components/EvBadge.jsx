// The EV mark: a small green "⚡ EV" pill for electric cars, EV parts and businesses that deal with electric
// vehicles (dealers, parts shops and mechanics; see motaa_backend/utils/ev.py for who gets it).
import { Box, Button, Flex, HStack, Switch, Text, Tooltip } from '@chakra-ui/react';
import { useId } from 'react';
import { Zap } from 'lucide-react';

export const EV_GREEN = '#0E9F6E';

/** Whether a listing's car is electric (by its fuel type). */
export function isElectric(listing) {
  const vehicle = listing?.vehicle || listing;
  return String(vehicle?.fuel_system || vehicle?.fuel_type || '').toLowerCase() === 'electric';
}

/**
 * label: "EV" (default), "EV part", "EV dealer"…; tip: what it means, for the tooltip and screen readers.
 * variant: "subtle" (light green, for white backgrounds) or "solid" (on photos).
 */
export default function EvBadge({ label = 'EV', tip = 'Deals in electric vehicles', variant = 'subtle', size = 'sm', ...props }) {
  const solid = variant === 'solid';
  const small = size === 'sm';
  return (
    <Tooltip label={tip} hasArrow openDelay={250}>
      <HStack
        as="span"
        role="img"
        aria-label={`${label}: ${tip}`}
        display="inline-flex"
        spacing={1}
        px={small ? 2 : 2.5}
        py={small ? 0.5 : 1}
        borderRadius="full"
        bg={solid ? EV_GREEN : '#E7F7F0'}
        color={solid ? 'white' : '#047857'}
        border="1px solid"
        borderColor={solid ? EV_GREEN : '#B7E8D2'}
        boxShadow={solid ? '0 2px 6px rgba(14,159,110,0.35)' : 'none'}
        verticalAlign="middle"
        flexShrink={0}
        lineHeight={1}
        {...props}
      >
        <Zap size={small ? 12 : 14} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
        <Text as="span" fontSize={small ? 'xs' : 'sm'} fontWeight="700" letterSpacing="0.02em" aria-hidden="true">{label}</Text>
      </HStack>
    </Tooltip>
  );
}


/**
 * The "we deal in EVs" switch for business settings and the part form.
 * title: what ticking it means; hint: the line under it.
 */
export function EvToggle({ isChecked, onChange, title = 'We deal in electric vehicles (EV)', hint, label = 'EV', isDisabled }) {
  const id = useId();
  return (
    <Flex as="label" htmlFor={id} gap={4} align="center" justify="space-between" p={4} borderWidth="1px" borderRadius="12px" cursor={isDisabled ? 'not-allowed' : 'pointer'}
      borderColor={isChecked ? '#B7E8D2' : 'gray.200'} bg={isChecked ? '#F3FBF7' : 'white'} transition="all .15s">
      <Box minW={0}>
        <HStack spacing={2} flexWrap="wrap">
          <Text fontWeight="600">{title}</Text>
          <EvBadge label={label} tip="Shown to customers" />
        </HStack>
        {hint && <Text fontSize="sm" color="gray.600" mt={1}>{hint}</Text>}
      </Box>
      <Switch id={id} colorScheme="green" size="lg" isChecked={Boolean(isChecked)} isDisabled={isDisabled}
        onChange={(event) => onChange?.(event.target.checked)} />
    </Flex>
  );
}


/** "EV only" pill for list filter bars: green when on. */
export function EvFilterButton({ isOn, onToggle, label = 'EV only' }) {
  return (
    <Button
      onClick={() => onToggle?.(!isOn)}
      aria-pressed={Boolean(isOn)}
      flexShrink={0}
      borderRadius="full"
      leftIcon={<Zap size={15} fill={isOn ? 'currentColor' : 'none'} aria-hidden="true" />}
      bg={isOn ? EV_GREEN : '#E7F7F0'}
      color={isOn ? 'white' : '#047857'}
      border="1px solid"
      borderColor={isOn ? EV_GREEN : '#B7E8D2'}
      _hover={{ bg: isOn ? '#0B8A5F' : '#D5F1E4' }}
      fontWeight="600"
    >
      {label}
    </Button>
  );
}
