import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  IconButton,
  Divider,
  Badge,
  Flex,
  Button,
  Heading,
} from '@chakra-ui/react'
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { GlobalStore } from '../../App'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { AsyncState, EmptyState } from '../../components/states'
import { asList } from '../../utils'

const LEVELS = {
  info: { color: 'blue', icon: Info },
  success: { color: 'green', icon: CheckCircle },
  error: { color: 'red', icon: AlertCircle },
  warning: { color: 'orange', icon: AlertTriangle },
}

function NotificationCard({ level, title, message, action, onDismiss, dismissing }) {
  const { color, icon: Icon } = LEVELS[level] || LEVELS.info

  return (
    <Box
      w="full"
      bg="white"
      borderRadius="md"
      borderColor="gray.100"
      borderWidth="1px"
      borderLeftWidth={4}
      borderLeftColor={`${color}.500`}
      boxShadow="sm"
    >
      <Flex gap={4} justifyContent="space-between" p={4} alignItems="flex-start">
        <Box color={`${color}.500`} pt={1} aria-hidden="true"><Icon size="17px" /></Box>

        <Box flex={1} minW={0}>
          <Text className="bold" mb={1}>{title}</Text>
          <Text color="gray.600" fontSize="sm">{message}</Text>
          {action?.link && (
            // cta_link is a full URL on the backend; keep same-site links in the SPA
            action.link.startsWith('/') || action.link.startsWith(window.location.origin)
              ? <Button as={Link} to={action.link.replace(window.location.origin, '')} size="sm" colorScheme={color} mt={3}>{action.label || 'View'}</Button>
              : <Button as="a" href={action.link} target="_blank" rel="noopener noreferrer" size="sm" colorScheme={color} mt={3}>{action.label || 'View'}</Button>
          )}
        </Box>

        <IconButton
          icon={<X size="18px" />}
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          isLoading={dismissing}
          aria-label={`Mark "${title}" as read`}
        />
      </Flex>
    </Box>
  )
}

// "Today", "Yesterday", or a date label for grouping.
function dayLabel(value, naturalDate) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Earlier'
  const today = new Date()
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return naturalDate(date)
}

function groupByDay(notifications, naturalDate) {
  const groups = []
  for (const notification of notifications) {
    const label = dayLabel(notification?.date_created, naturalDate)
    const group = groups.find((g) => g.label === label)
    if (group) group.items.push(notification)
    else groups.push({ label, items: [notification] })
  }
  return groups
}

function NotificationsPage() {
  const { naturalDate } = useContext(GlobalStore)
  // the endpoint returns unread notifications only
  const query = useApiQuery(
    (api, signal) => api.get('/accounts/notifications/', { signal }),
    [],
    { select: (body) => asList(body?.data) }
  )
  const markRead = useApiMutation(
    (api, notificationId) => api.post('/accounts/notifications/', { notification_id: notificationId }),
    { onSuccess: (body) => query.setData(asList(body?.data)), errorTitle: "Couldn't update notification" }
  )
  const unread = query.data?.length ?? 0

  return (
    <Box minH="70vh">
      <Container maxW="container.md" py={8}>
        <HStack mb={1} alignItems="center">
          <Heading as="h1" fontSize="2xl">Notifications</Heading>
          {unread > 0 && <Badge px={3} colorScheme="blue" py="5px" borderRadius="30px" fontSize="sm">{unread}</Badge>}
        </HStack>

        <Text color="gray.600" mb={8}>
          {query.loading && query.data === undefined
            ? 'Checking for new notifications…'
            : query.error && query.data === undefined
              ? 'Your notifications will appear here.'
              : unread === 0
              ? "You're all caught up."
              : `You have ${unread} unread notification${unread === 1 ? '' : 's'}.`}
        </Text>

        <AsyncState
          query={query}
          loadingLabel="Loading notifications…"
          isEmpty={(items) => items.length === 0}
          empty={<EmptyState icon={Bell} title="No new notifications" description="Updates about your orders, bookings and payments will show up here." />}
        >
          {(items) => groupByDay(items, naturalDate).map((group) => (
            <Box key={group.label} mb={8}>
              <Text as={Flex} color="gray.500" alignItems="center" gap={3} fontSize="sm" className="bold" mb={4} whiteSpace="nowrap">
                <Divider /> {group.label} <Divider />
              </Text>
              <VStack spacing={4} align="stretch">
                {group.items.map((notification) => (
                  <NotificationCard
                    key={notification?.uuid || notification?.id}
                    level={notification?.level}
                    title={notification?.subject}
                    message={notification?.message}
                    action={{ link: notification?.cta_link, label: notification?.cta_text }}
                    dismissing={markRead.loading}
                    onDismiss={() => markRead.mutate(notification?.uuid)}
                  />
                ))}
              </VStack>
            </Box>
          ))}
        </AsyncState>
      </Container>
    </Box>
  )
}

export default NotificationsPage
