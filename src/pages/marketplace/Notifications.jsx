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
  useColorModeValue,
} from '@chakra-ui/react'
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

function NotificationCard({ type, title, message, action, onClose }) {
  const borderColors = {
    info: 'blue.500',
    success: 'green.500',
    error: 'red.500',
    warning: 'orange.500',
  }

  const icons = {
    info: Info,
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
  }

  const Icon = icons[type]
  const borderColor = borderColors[type]
  const bgColor = useColorModeValue('white', 'gray.800')

  return (
    <Box
      w="full"
      bg={bgColor}
      borderRadius="5px"
      borderColor="lavender"
      borderWidth="2px"
      borderLeftWidth={4}
      borderLeftColor={borderColor}
      boxShadow="sm"
      position="relative"
      overflow="hidden"
    >
      <Flex gap={4} justifyContent="space-between" p={4} alignItems="flex-start">
        <Icon size="17px" />
        
        <Box flex={1} borderRight="1px solid lavender">
          <Text className="bold" mb={1}> {title} </Text>
          <Text color="gray.600" fontSize="sm"> {message} </Text>
          {action && (
            <Button
              size="sm"
              colorScheme={
                type === 'info'
                  ? 'blue'
                  : type === 'success'
                  ? 'green'
                  : type === 'error'
                  ? 'red'
                  : 'orange'
              }
              mt={3}
            >
              {action}
            </Button>
          )}
        </Box>

        <IconButton
          icon={<X size="20px" />}
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close notification"
        />

      </Flex>
    </Box>
  )
}

function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: 'info',
      title: 'You have 1 message from MANGA AUTOS.',
      message:
        'The alert & notifications component is designed to work with the actions buttons.',
    },
    {
      id: 2,
      type: 'success',
      title: 'You booked an inspection with MANGA AUTOS!',
      message:
        'The alert & notifications component is designed to work with the actions buttons.',
      action: 'See details',
    },
    {
      id: 3,
      type: 'success',
      title: 'You deposited ₦58,005,000 to escrow!',
      message:
        'The alert & notifications component is designed to work with the actions buttons.',
    },
    {
      id: 4,
      type: 'error',
      title: 'Account verification failed!',
      message:
        'The alert & notifications component is designed to work with the actions buttons.',
    },
    {
      id: 5,
      type: 'warning',
      title: 'Your premium subscription will end soon.',
      message:
        'The alert & notifications component is designed to work with the actions buttons.',
    },
  ]

  return (
    <Box minH="100vh">
      <Container maxW="container.xl" py={8}>
        <HStack mb={1} alignItems="center">
          <Text fontSize="2xl" fontWeight="bold"> Notifications </Text>
          <Badge px={3} colorScheme="blue" color="primary" py={"5px"} borderRadius="30px" fontSize="sm"> 14 </Badge>
        </HStack>

        <Text color="gray.600" mb={8}>
          You have 14 unread messages.
        </Text>

          <Box mb={8}>
            <Text
              color="gray.500"
              as={Flex}
              alignItems="center"
              gap={3}
              fontSize="sm"
              className="bold"
              textAlign="center"
              mb={4}
            >
              <Divider /> Today <Divider />
            </Text>

            <Container maxW="700px">
              <VStack spacing={4} align="stretch">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    type={notification.type}
                    title={notification.title}
                    message={notification.message}
                    action={notification.action}
                    onClose={() => console.log('Close notification:', notification.id)}
                  />
                ))}
              </VStack>
            </Container>
          </Box>
        
      </Container>
    </Box>
  )
}

export default NotificationsPage

