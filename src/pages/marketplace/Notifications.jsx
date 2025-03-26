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
import { useContext, useState, useEffect } from 'react'
import {Link} from 'react-router-dom'
import { objectifyJSON, jsonifyObject } from '../../utils'
import { GlobalStore } from '../../App'

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
          {action?.link && (
            <Link to={action?.link}>
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
                {action?.label}
              </Button>
            </Link>
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
  const [notifications, setNotifications] = useState([]);
  const {axios} = useContext(GlobalStore);

  async function init(){
    const res = await axios.get('/accounts/notifications/');
    const data = objectifyJSON(res.data);
    if (res.status === 200){
      setNotifications(data.data)
    }
  }


  async function readNotification(notification_id){
    const res = await axios.post('/accounts/notifications/', jsonifyObject({notification_id}));
    const data = objectifyJSON(res.data);
    if (res.status === 200){
      setNotifications(data.data)
    }
  }

  

  useEffect(() => {
    init()
  }, [])

  return (
    <Box minH="100vh">
      <Container maxW="container.xl" py={8}>
        <HStack mb={1} alignItems="center">
          <Text fontSize="2xl" fontWeight="bold"> Notifications </Text>
          <Badge px={3} colorScheme="blue" color="primary" py={"5px"} borderRadius="30px" fontSize="sm"> {notifications?.length} </Badge>
        </HStack>

        <Text color="gray.600" mb={8}>
          You have {notifications?.length} unread messages.
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
                {notifications?.map((notification) => (
                  <NotificationCard
                    key={notification?.id}
                    type={notification?.level}
                    title={notification?.subject}
                    message={notification?.message}
                    action={{link: notification?.cta_link, label: notification?.cta_text}}
                    onClose={() => readNotification(notification?.uuid)}
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

