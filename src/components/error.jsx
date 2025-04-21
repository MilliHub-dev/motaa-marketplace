import React, { Component } from 'react';
import { Box, Container, Card, CardHeader, CardBody, CardFooter, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { LuTriangleAlert } from 'react-icons/lu';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p={4}>
          <Container maxW="650px">
            <Card>
              <CardHeader textAlign="center">
                <Box as={LuTriangleAlert} w={16} h={16} mx="auto" color="red.500" mb={4} />
                <Heading as="h1" size="xl" fontWeight="bold">
                  Oops! Something went wrong
                </Heading>
              </CardHeader>
              <CardBody>
                <Text textAlign="center" color="gray.600">
                  We're sorry, but an error occurred. Please try again later or contact support if the issue persists.
                </Text>
              </CardBody>
              <CardFooter justifyContent="center">
                <VStack spacing={4} w={'100%'}>
                  <Button w={'100%'} variant="outline" onClick={this.handleRefresh} colorScheme="blue">
                    Refresh Page
                  </Button>
                  <Button w={'100%'} variant="ghost" onClick={this.handleGoBack}>
                    Go Back
                  </Button>
                </VStack>
              </CardFooter>
            </Card>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
