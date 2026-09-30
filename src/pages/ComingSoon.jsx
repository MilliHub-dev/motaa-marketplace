import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { BackButton } from "../components/nav";

export default function ComingSoon({ feature }) {
  return (
    <Box
      as="section"
      aria-labelledby="coming-soon-title"
      w="100%"
      minH={{ base: '60vh', md: '70vh' }}
      bgGradient="linear(to-b, primary, blue.700)"
      borderRadius="xl"
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={6}
      py={12}
    >
      <VStack spacing={5} textAlign="center" maxW="lg">
        <Heading as="h1" id="coming-soon-title" fontSize={{ base: '2xl', md: '4xl' }}>
          {feature ? `${feature} is coming soon` : 'This feature is coming soon'}
        </Heading>
        <Text fontSize={{ base: 'md', md: 'lg' }} opacity={0.9}>
          We're working hard to bring you an amazing experience. Check back soon!
        </Text>
        <BackButton mb={0} bg="white" color="primary" borderColor="white" _hover={{ bg: 'gray.100' }} />
      </VStack>
    </Box>
  );
}
