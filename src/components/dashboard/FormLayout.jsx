// Building blocks for the dashboard's "add / edit" screens (cars, parts, services, transport): a numbered stepper,
// form sections as cards, big choice cards, and a sticky side panel with a live preview and a checklist, so the
// person can see what customers will see and what is still missing while they fill the form in.
import { Box, Flex, Grid, HStack, Image, Stack, Text } from '@chakra-ui/react';
import { Check, CheckCircle2, Circle, ImageOff } from 'lucide-react';
import { DASH, DashCard } from './ui';

/** Rounder, taller fields inside a form section. */
export const FIELD_SX = {
  '.chakra-input, .chakra-select, .chakra-numberinput__field': { height: '48px', borderRadius: '12px', borderColor: '#E3E7ED', bg: '#FBFCFD' },
  '.chakra-textarea': { borderRadius: '12px', borderColor: '#E3E7ED', bg: '#FBFCFD' },
  '.chakra-input__left-addon': { height: '48px', borderLeftRadius: '12px', bg: DASH.page, borderColor: '#E3E7ED' },
  '.chakra-input__right-addon': { height: '48px', borderRightRadius: '12px', bg: DASH.page, borderColor: '#E3E7ED' },
  '.chakra-input__group .chakra-input:not(:first-of-type)': { borderLeftRadius: 0 },
  '.chakra-input__group .chakra-input:has(+ .chakra-input__right-addon)': { borderRightRadius: 0 },
  '.chakra-form__label': { fontWeight: 500, color: DASH.ink },
};

/** A titled section of a form. `number` shows a step-like badge; `icon` shows an icon instead. */
export function FormSection({ number, icon: Icon, title, description, children, ...props }) {
  return (
    <DashCard {...props}>
      <HStack spacing={3} align="flex-start" mb={5}>
        <Flex w={10} h={10} borderRadius="full" bg={DASH.blueWash} color={DASH.blue} align="center" justify="center" flexShrink={0} fontWeight="700">
          {Icon ? <Icon size={18} /> : number}
        </Flex>
        <Box minW={0}>
          <Text fontWeight="600" fontSize="lg" color={DASH.ink}>{title}</Text>
          {description && <Text fontSize="sm" color={DASH.muted}>{description}</Text>}
        </Box>
      </HStack>
      <Box sx={FIELD_SX}>{children}</Box>
    </DashCard>
  );
}

/** Numbered steps joined by a line; done steps get a tick. onStep(index) makes done steps clickable. */
export function WizardStepper({ steps, current, onStep }) {
  return (
    <Box as="nav" aria-label="Progress" bg="white" borderRadius="full" px={{ base: 3, md: 5 }} py={3} mb={{ base: 4, md: 5 }}>
      <HStack as="ol" listStyleType="none" spacing={0}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const clickable = done && onStep;
          return (
            <HStack as="li" key={step} flex={index < steps.length - 1 ? 1 : '0 0 auto'} spacing={0} aria-current={active ? 'step' : undefined}>
              <HStack as={clickable ? 'button' : 'span'} type={clickable ? 'button' : undefined} onClick={clickable ? () => onStep(index) : undefined}
                spacing={2.5} px={2} py={1} borderRadius="full" _hover={clickable ? { bg: DASH.page } : undefined} flexShrink={0}>
                <Flex w={8} h={8} borderRadius="full" align="center" justify="center" fontSize="sm" fontWeight="700"
                  bg={done ? DASH.blue : active ? DASH.ink : DASH.page} color={done || active ? 'white' : DASH.muted}>
                  {done ? <Check size={16} strokeWidth={3} /> : index + 1}
                </Flex>
                <Text fontWeight={active ? 600 : 500} color={active || done ? DASH.ink : DASH.muted} display={{ base: active ? 'block' : 'none', sm: 'block' }}>
                  {step}
                </Text>
              </HStack>
              {index < steps.length - 1 && <Box flex={1} h="2px" mx={2} borderRadius="full" bg={done ? DASH.blue : DASH.line} minW="16px" />}
            </HStack>
          );
        })}
      </HStack>
    </Box>
  );
}

/** Big selectable cards (radio group). options: [{ value, label, description, icon }] */
export function ChoiceCards({ value, options, onChange, label, columns = 2 }) {
  return (
    <Grid templateColumns={{ base: '1fr', sm: `repeat(${columns}, 1fr)` }} gap={3} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const on = value === option.value;
        const Icon = option.icon;
        return (
          <Flex key={option.value} as="button" type="button" role="radio" aria-checked={on} onClick={() => onChange(option.value)} textAlign="left"
            gap={3} p={4} borderRadius="16px" border="2px solid" borderColor={on ? DASH.blue : '#E3E7ED'} bg={on ? DASH.blueWash : 'white'}
            transition="all .15s" _hover={{ borderColor: on ? DASH.blue : '#C9D2DE' }} _focusVisible={{ boxShadow: `0 0 0 3px ${DASH.bluePale}` }}>
            {Icon && (
              <Flex w={10} h={10} borderRadius="full" bg={on ? DASH.blue : DASH.page} color={on ? 'white' : DASH.muted} align="center" justify="center" flexShrink={0}>
                <Icon size={18} />
              </Flex>
            )}
            <Box flex={1} minW={0}>
              <Text fontWeight="600" color={DASH.ink}>{option.label}</Text>
              {option.description && <Text fontSize="sm" color={DASH.muted}>{option.description}</Text>}
            </Box>
            <Box color={on ? DASH.blue : '#C9D2DE'} flexShrink={0}>{on ? <CheckCircle2 size={20} /> : <Circle size={20} />}</Box>
          </Flex>
        );
      })}
    </Grid>
  );
}

/** "What customers will see": a photo, a title, a price line and small facts. */
export function PreviewCard({ label = 'Preview', image, title, price, facts = [], placeholder = 'Your title shows here' }) {
  return (
    <DashCard p={{ base: 4, md: 5 }}>
      <Text fontSize="xs" color={DASH.muted} textTransform="uppercase" letterSpacing="0.08em" mb={3}>{label}</Text>
      <Box borderRadius="16px" overflow="hidden" bg={DASH.page} h="170px" mb={3}>
        {image ? <Image src={image} alt="" w="100%" h="100%" objectFit="cover" /> : (
          <Flex h="100%" direction="column" align="center" justify="center" color="#9CA3AF" gap={1}><ImageOff size={26} /><Text fontSize="xs">No photo yet</Text></Flex>
        )}
      </Box>
      <Text fontWeight="600" fontSize="lg" noOfLines={2} color={title ? DASH.ink : '#9CA3AF'}>{title || placeholder}</Text>
      {price && <Text fontWeight="700" fontSize="xl" color={DASH.blue} mt={1}>{price}</Text>}
      {facts.filter(Boolean).length > 0 && (
        <HStack spacing={2} mt={3} flexWrap="wrap">
          {facts.filter(Boolean).map((fact) => (
            <Box key={fact} px={2.5} py={1} borderRadius="full" bg={DASH.page} fontSize="xs" color={DASH.ink}>{fact}</Box>
          ))}
        </HStack>
      )}
    </DashCard>
  );
}

/** What's done and what's left. items: [{ label, done }] */
export function Checklist({ title = 'Checklist', items }) {
  const done = items.filter((item) => item.done).length;
  return (
    <DashCard p={{ base: 4, md: 5 }}>
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="600">{title}</Text>
        <Text fontSize="sm" color={DASH.muted}>{done}/{items.length}</Text>
      </Flex>
      <Box h="6px" bg={DASH.page} borderRadius="full" mb={4} overflow="hidden">
        <Box h="100%" w={`${items.length ? (done / items.length) * 100 : 0}%`} bg={DASH.blue} borderRadius="full" transition="width .3s" />
      </Box>
      <Stack spacing={2.5}>
        {items.map((item) => (
          <HStack key={item.label} spacing={2.5} color={item.done ? DASH.ink : DASH.muted}>
            <Box color={item.done ? '#0E9F6E' : '#C9D2DE'} flexShrink={0}>{item.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}</Box>
            <Text fontSize="sm" textDecoration={item.done ? 'none' : 'none'}>{item.label}</Text>
          </HStack>
        ))}
      </Stack>
    </DashCard>
  );
}

/** Main form + sticky side panel (stacks on smaller screens, with the side panel first). */
export function FormWithAside({ children, aside }) {
  return (
    <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 340px' }} gap={{ base: 4, md: 5 }} alignItems="start">
      <Stack spacing={{ base: 4, md: 5 }} minW={0} order={{ base: 2, xl: 1 }}>{children}</Stack>
      <Stack spacing={{ base: 4, md: 5 }} position={{ xl: 'sticky' }} top={{ xl: '112px' }} order={{ base: 1, xl: 2 }} display={{ base: 'none', md: 'flex' }}>
        {aside}
      </Stack>
    </Grid>
  );
}

/** The bottom action bar of a form: secondary on the left, primary on the right. */
export function FormActions({ children }) {
  return (
    <Flex bg="white" borderRadius={DASH.radius} p={{ base: 3, md: 4 }} gap={3} justify="flex-end" direction={{ base: 'column-reverse', sm: 'row' }}
      position="sticky" bottom={3} zIndex={5} boxShadow="0 -4px 24px rgba(16,24,40,0.06)">
      {children}
    </Flex>
  );
}
