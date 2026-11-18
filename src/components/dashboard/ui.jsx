// Building blocks for the redesigned business dashboard (dealers first): soft grey page, white rounded cards,
// Motaa blue as the accent, one dark card or button for emphasis. Every dealer screen is made from these, so the
// look stays the same across Overview, Inventory, Orders, Analytics and Settings.
import {
  Box, Button, Flex, Heading, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, Progress, Select, Skeleton, Stack, Text, Tooltip,
} from '@chakra-ui/react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, MoreHorizontal } from 'lucide-react';
import { Link as RLink } from 'react-router-dom';

export const DASH = {
  page: '#F3F5F8',
  card: '#FFFFFF',
  ink: '#0B1220',
  muted: '#6B7280',
  line: '#EEF0F4',
  blue: '#0065B5',
  blueSoft: '#4C9BE0',
  bluePale: '#CFE3F7',
  blueWash: '#EAF3FC',
  yellow: '#FDD153',
  amber: '#F59E0B',
  green: '#12B886',
  violet: '#7C5CFA',
  radius: { base: '18px', md: '24px' },
};

export const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '12m', label: 'Last 12 months' },
];

/** ₦12,928 / ₦1.2M */
export function naira(value, { short = false } = {}) {
  const n = Number(value) || 0;
  if (short) {
    if (Math.abs(n) >= 1e9) return `₦${+(n / 1e9).toFixed(1)}B`;
    if (Math.abs(n) >= 1e6) return `₦${+(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `₦${+(n / 1e3).toFixed(1)}K`;
  }
  return `₦${Math.round(n).toLocaleString('en-NG')}`;
}

export function compactNumber(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-NG');
}

/** The page title row: big title, one line under it, actions on the right. */
export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <Flex justify="space-between" align={{ base: 'flex-start', lg: 'flex-end' }} gap={4} flexWrap="wrap" mb={{ base: 5, md: 6 }}>
      <Box minW={0}>
        <Heading as="h1" fontSize={{ base: '2xl', md: '4xl' }} fontWeight="600" color={DASH.ink} letterSpacing="-0.02em">{title}</Heading>
        {subtitle && <Text color={DASH.muted} mt={1} fontSize={{ base: 'sm', md: 'md' }}>{subtitle}</Text>}
        {children}
      </Box>
      {actions && <HStack spacing={3} flexWrap="wrap">{actions}</HStack>}
    </Flex>
  );
}

/** A white rounded card with an optional title row and "…" menu. `dark` makes the one emphasis card. */
export function DashCard({ title, subtitle, menu, action, dark, children, bodyProps, ...props }) {
  return (
    <Box as="section" bg={dark ? DASH.ink : DASH.card} color={dark ? 'white' : DASH.ink} borderRadius={DASH.radius}
      p={{ base: 4, md: 6 }} minW={0} {...props}>
      {(title || menu || action) && (
        <Flex justify="space-between" align="flex-start" gap={3} mb={{ base: 4, md: 5 }}>
          <Box minW={0}>
            {title && <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }} fontWeight="600">{title}</Heading>}
            {subtitle && <Text fontSize="sm" color={dark ? 'whiteAlpha.700' : DASH.muted} mt={1}>{subtitle}</Text>}
          </Box>
          <HStack spacing={2} flexShrink={0}>
            {action}
            {menu && <MoreMenu items={menu} dark={dark} label={`More options for ${title || 'this card'}`} />}
          </HStack>
        </Flex>
      )}
      <Box {...bodyProps}>{children}</Box>
    </Box>
  );
}

/** The round "…" button. items: [{ label, to?, onClick?, icon? }] */
export function MoreMenu({ items = [], dark, label = 'More options' }) {
  return (
    <Menu placement="bottom-end">
      <MenuButton as={IconButton} aria-label={label} icon={<MoreHorizontal size={20} />} isRound size="md"
        bg={dark ? 'white' : DASH.page} color={DASH.ink} _hover={{ bg: dark ? 'whiteAlpha.900' : '#E7EAF0' }} />
      <MenuList zIndex={30} color={DASH.ink} borderRadius="14px" py={2}>
        {items.map((item) => (
          <MenuItem key={item.label} as={item.to ? RLink : undefined} to={item.to} onClick={item.onClick} icon={item.icon}>{item.label}</MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}

/** A coloured circle with an icon (the stat tiles' and lists' leading mark). */
export function IconBubble({ icon: Icon, color = DASH.blue, size = 12 }) {
  return (
    <Flex w={size} h={size} borderRadius="full" bg={color} color="white" align="center" justify="center" flexShrink={0}
      boxShadow={`0 8px 18px ${color}40`}>
      <Icon size={size * 1.9} strokeWidth={2} aria-hidden="true" />
    </Flex>
  );
}

/** The +12% / −4% chip. */
export function ChangeChip({ value, suffix = 'vs previous period' }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  const up = Number(value) >= 0;
  return (
    <HStack spacing={1} fontSize="xs" color={up ? '#0E9F6E' : '#DC2626'}>
      <Box as={up ? ArrowUpRight : ArrowDownRight} size={14} aria-hidden="true" />
      <Text fontWeight="700">{Math.abs(Number(value))}%</Text>
      <Text color={DASH.muted}>{suffix}</Text>
    </HStack>
  );
}

/**
 * A KPI tile: icon, label, big value, and a progress bar towards a goal (or another measure).
 * progress: 0–100, or null to show `noGoal` (e.g. a "Set a goal" link) instead of the bar.
 */
export function StatTile({ icon, color = DASH.blue, label, value, progress, progressLabel = 'Monthly goal', footnote, change, noGoal, loading }) {
  return (
    <DashCard p={{ base: 4, md: 5 }}>
      <HStack spacing={4} align="center">
        <IconBubble icon={icon} color={color} size={12} />
        <Box minW={0}>
          <Text fontSize="sm" color={DASH.muted}>{label}</Text>
          {loading ? <Skeleton h="34px" w="140px" mt={1} borderRadius="8px" /> : (
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="600" lineHeight={1.15} color={DASH.ink} noOfLines={1}>{value}</Text>
          )}
        </Box>
      </HStack>
      <Box mt={4}>
        {progress !== null && progress !== undefined ? (
          <>
            <Flex justify="space-between" fontSize="xs" color={DASH.muted} mb={1.5}>
              <Text>{progressLabel}</Text>
              <Text fontWeight="700" color={DASH.ink}>{progress}%</Text>
            </Flex>
            <Progress value={progress} size="sm" borderRadius="full" bg={DASH.page}
              sx={{ '& > div': { background: color, borderRadius: '999px' } }} aria-label={`${label}: ${progress}% of ${progressLabel.toLowerCase()}`} />
          </>
        ) : (noGoal || <Box h="22px" />)}
      </Box>
      <Flex mt={3} justify="space-between" align="center" gap={2} flexWrap="wrap">
        {footnote && (
          <HStack spacing={1.5} fontSize="xs" color={DASH.muted}>
            <CalendarDays size={14} aria-hidden="true" />
            <Text>{footnote}</Text>
          </HStack>
        )}
        <ChangeChip value={change} suffix="" />
      </Flex>
    </DashCard>
  );
}

const PILL_TONES = {
  blue: ['#EAF3FC', '#0065B5'], green: ['#E7F7F0', '#047857'], amber: ['#FFF6DB', '#B45309'],
  red: ['#FDECEC', '#B91C1C'], grey: ['#F1F2F5', '#4B5563'], violet: ['#F0ECFF', '#5B3FD6'],
};

/** A rounded status pill: tone blue | green | amber | red | grey | violet. */
export function StatusPill({ tone = 'grey', children, ...props }) {
  const [bg, color] = PILL_TONES[tone] || PILL_TONES.grey;
  return (
    <Box as="span" display="inline-flex" alignItems="center" gap={1.5} px={2.5} py={0.5} borderRadius="full" bg={bg} color={color}
      fontSize="xs" fontWeight="700" whiteSpace="nowrap" border="1px solid" borderColor={`${color}33`} {...props}>
      {children}
    </Box>
  );
}

/** Order status → pill tone and words customers and dealers both understand. */
export const ORDER_PILLS = {
  'awaiting-payment': ['grey', 'Awaiting payment'],
  'awaiting-inspection': ['violet', 'Awaiting inspection'],
  inspecting: ['violet', 'Inspecting'],
  pending: ['amber', 'Paid · hand over'],
  completed: ['green', 'Completed'],
  cancelled: ['red', 'Cancelled'],
  expired: ['grey', 'Rental ended'],
  renewed: ['blue', 'Renewed'],
};

export function OrderPill({ status }) {
  const [tone, label] = ORDER_PILLS[status] || ['grey', status || 'Unknown'];
  return <StatusPill tone={tone}>{label}</StatusPill>;
}

/** The period picker ("Last 30 days"), styled like the design's "Default view" button. */
export function RangePicker({ value, onChange }) {
  return (
    <Box position="relative">
      <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Period" bg="white" border="none" borderRadius="full"
        h="48px" pl={5} pr={10} fontWeight="500" boxShadow="0 1px 2px rgba(16,24,40,0.04)" minW="190px">
        {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
    </Box>
  );
}

/** White pill button with a round icon on the right ("Export ⤓"). */
export function PillButton({ children, icon: Icon, dark, ...props }) {
  return (
    <Button h="48px" borderRadius="full" pl={dark ? 2 : 5} pr={dark ? 5 : 2} bg={dark ? DASH.ink : 'white'} color={dark ? 'white' : DASH.ink}
      fontWeight="500" boxShadow="0 1px 2px rgba(16,24,40,0.04)" _hover={{ bg: dark ? '#1F2937' : '#F8FAFC' }}
      leftIcon={dark && Icon ? <Flex w={8} h={8} borderRadius="full" bg="white" color={DASH.ink} align="center" justify="center"><Icon size={16} /></Flex> : undefined}
      rightIcon={!dark && Icon ? <Flex w={8} h={8} borderRadius="full" bg={DASH.page} align="center" justify="center"><Icon size={16} /></Flex> : undefined}
      {...props}>
      {children}
    </Button>
  );
}

/** A small coloured dot + label, for chart legends. */
export function LegendDot({ color, children }) {
  return (
    <HStack spacing={1.5} fontSize="sm" color={DASH.muted}>
      <Box w={2} h={2} borderRadius="full" bg={color} />
      <Text>{children}</Text>
    </HStack>
  );
}

/** Rounded pill bars for a short series (the "weekly overview"): highlights `active` with its value. */
export function PillBars({ labels, values, active, height = 140, format = (v) => v, color = DASH.blue }) {
  const max = Math.max(1, ...values.map(Number));
  return (
    <Flex align="flex-end" justify="space-between" gap={2} h={`${height + 44}px`} role="img"
      aria-label={labels.map((label, i) => `${label}: ${format(values[i])}`).join(', ')}>
      {labels.map((label, i) => {
        const on = i === active;
        const h = Math.max(18, (Number(values[i]) / max) * height);
        return (
          <Stack key={label} align="center" spacing={2} flex={1} minW={0} aria-hidden="true">
            <Box position="relative" w="100%" maxW="34px" h={`${height}px`} display="flex" alignItems="flex-end">
              <Tooltip label={`${label}: ${format(values[i])}`} hasArrow>
                <Box w="100%" h={`${h}px`} borderRadius="full" bg={on ? color : DASH.page} transition="height .4s" position="relative">
                  {on && (
                    <Box position="absolute" top="-30px" left="50%" transform="translateX(-50%)" bg={color} color="white" fontSize="xs"
                      fontWeight="700" px={2} py={0.5} borderRadius="full" whiteSpace="nowrap">{format(values[i])}</Box>
                  )}
                </Box>
              </Tooltip>
            </Box>
            <Text fontSize="xs" color={on ? DASH.ink : DASH.muted} fontWeight={on ? 700 : 400}>{label}</Text>
          </Stack>
        );
      })}
    </Flex>
  );
}

/** Chart.js options shared by the dashboard's charts: no clutter, soft grid, rounded tooltips. */
export function chartOptions({ money = false, stacked = false, legend = false } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: legend },
      tooltip: {
        backgroundColor: '#0B1220', padding: 12, cornerRadius: 12, boxPadding: 4, usePointStyle: true,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${money ? naira(ctx.parsed.y) : compactNumber(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: { stacked, grid: { display: false }, border: { display: false }, ticks: { color: DASH.muted, maxRotation: 0, autoSkipPadding: 12 } },
      y: {
        stacked, beginAtZero: true, border: { display: false }, grid: { color: DASH.line },
        ticks: { color: DASH.muted, maxTicksLimit: 5, callback: (v) => (money ? naira(v, { short: true }) : compactNumber(v)) },
      },
    },
  };
}

/** A friendly empty block inside a card. */
export function CardEmpty({ icon: Icon, title, body, action }) {
  return (
    <Stack align="center" textAlign="center" spacing={2} py={8} px={4} color={DASH.muted}>
      {Icon && <Flex w={12} h={12} borderRadius="full" bg={DASH.blueWash} color={DASH.blue} align="center" justify="center"><Icon size={22} /></Flex>}
      <Text fontWeight="600" color={DASH.ink}>{title}</Text>
      {body && <Text fontSize="sm" maxW="320px">{body}</Text>}
      {action && <Button as={RLink} to={action.to} size="sm" mt={1} borderRadius="full" bg={DASH.blue} color="white" _hover={{ bg: '#00539A' }}>{action.label}</Button>}
    </Stack>
  );
}
