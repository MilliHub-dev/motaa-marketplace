import React from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react'
import { LuAlertTriangle } from 'react-icons/lu';

export const ErrorPage = () => {
  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p={4}>
      <Container maxW="650px">
        <Card>
          <CardHeader textAlign="center">
            <Box as={LuAlertTriangle} w={16} h={16} mx="auto" color="red.500" mb={4} />
            <Heading as="h1" size="xl" fontWeight="bold">
              Oops! Something went wrong
            </Heading>
          </CardHeader>
          <CardBody>
            <Text textAlign="center" color="gray.600">
              We're sorry, but it seems there was an error processing your request. Please try again later or contact our support team if the problem persists.
            </Text>
          </CardBody>
          <CardFooter justifyContent="center">
            <VStack spacing={4} w={'100%'} direction={{ base: 'column', sm: 'column' }}>
              <Button w={'100%'} variant="outline" onClick={() => window.location.reload()} colorScheme={'blue'}>
                Refresh Page
              </Button>

              <Button w={'100%'} variant="ghost" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </VStack>
          </CardFooter>
        </Card>
      </Container>
    </Box>
  )
}

// export default ErrorPage;