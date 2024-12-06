import React, {Fragment} from "react";
import {
  Box,
  Skeleton,
  SkeletonText,
  SimpleGrid,
  VStack,
  HStack,
  Flex,
  Container,
  Heading,
  Select,
  Stack,
  SkeletonCircle,
  Card,
  CardBody,
  Badge,
  Button,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";



export const ListingSkeleton = ({ props }) => {
  return (
    <Fragment>
      <Container maxWidth="container.lg" px={4} py={4}>
        {/* Heading Skeleton */}
        <Skeleton height="24px" width="200px" mb={4} />

        {/* Filter Buttons Skeleton */}
        <HStack my={5} overflowX="auto" spacing={4}>
          {[...Array(7)].map((idx) => (
            <Skeleton key={idx} height="36px" width="120px" borderRadius="md" />
          ))}
        </HStack>

        {/* Listings Grid Skeleton */}
        <Flex
          flexWrap="wrap"
          justifyContent={{ base: 'space-evenly', lg: 'space-between' }}
          rowGap={6}
          columnGap={2}
          py="2rem"
        >
          {[...Array(12)].map((idx) => (
            <Box
              key={idx}
              w={{ base: '100%', md: 'calc(100% / 2 - 20px)', lg: 'calc(100% / 3 - 20px)' }}
              maxW={{ base: '320px', lg: 'calc(100% / 3 - 20px)' }}
              p={4}
              borderWidth="1px"
              borderRadius="md"
            >
              {/* Image Skeleton */}
              <Skeleton height="150px" borderRadius="md" mb={4} />
              {/* Title Skeleton */}
              <Skeleton height="20px" width="70%" mb={2} />
              {/* Description Skeleton */}
              <SkeletonText noOfLines={3} spacing="4" />
            </Box>
          ))}
        </Flex>
      </Container>
    </Fragment>
  );
};



export const ListingDetailSkeleton = ({ props }) => {
  return (
    <Container maxW={'container.lg'} py={8}>
      {/* Breadcrumb and Title */}
      <Skeleton height="20px" width="200px" mb={4} />
      <Skeleton height="30px" width="300px" mb={8} />

      <SimpleGrid columns={[1, null, 2]} spacing={8}>
        {/* Image Section */}
        <VStack align="stretch" spacing={4}>
          <Skeleton height="400px" borderRadius="md" />
          <HStack spacing={4}>
            <Skeleton height="60px" width="60px" borderRadius="md" />
            <Skeleton height="60px" width="60px" borderRadius="md" />
            <Skeleton height="60px" width="60px" borderRadius="md" />
          </HStack>
        </VStack>

        {/* Price and Actions */}
        <VStack align="stretch" spacing={6}>
          <Card>
            <CardBody>
              <Skeleton height="20px" width="150px" my={5} />
              <Skeleton height="20px" width="150px" my={5} />
              <Skeleton height="40px" width="200px" my={5} />
              <Flex gap={4} my={5}>
                <Skeleton height="40px" width="150px" borderRadius="md" />
                <Skeleton height="40px" width="150px" borderRadius="md" />
              </Flex>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>

      {/* Overview Section */}
      <Box mt={8}>
        <Skeleton height="20px" width="150px" mb={4} />
        <SimpleGrid columns={[1, null, 2]} spacing={4}>
          <SkeletonText noOfLines={5} spacing="4" />
          <SkeletonText noOfLines={5} spacing="4" />
        </SimpleGrid>
      </Box>

      {/* Performance Section */}
      <Box mt={8}>
        <Skeleton height="20px" width="200px" mb={4} />
        <SimpleGrid columns={[1, null, 2]} spacing={4}>
          <SkeletonText noOfLines={3} spacing="4" />
          <SkeletonText noOfLines={3} spacing="4" />
        </SimpleGrid>
      </Box>

      {/* Seller Note Section */}
      <Box mt={8}>
        <Skeleton height="20px" width="150px" mb={4} />
        <SkeletonText noOfLines={3} spacing="4" />
      </Box>

      {/* Footer */}
      <Box mt={16} p={8} bg="blue.50" borderRadius="md">
        <Skeleton height="20px" width="250px" mb={4} />
        <Skeleton height="40px" width="400px" />
      </Box>
    </Container>
  );
};



export const MechanicListSkeleton = () => {
  return (
    <Box px={4} py={4}>
      <Container maxW="container.lg" py={4}>
        {/* Page title */}
        <Skeleton height="30px" width="60%" mb={5} />

        {/* Filters */}
        <Flex gap={2} mb={6} flexWrap="wrap">
          <Skeleton height="40px" width="120px" borderRadius="md" />
          <Skeleton height="40px" width="120px" borderRadius="md" />
        </Flex>

        {/* Skeleton list items */}
        <Stack spacing={4}>
          {Array(5)
            .fill(0)
            .map((_, idx) => (
              <Card key={idx} shadow="lg" my={3}>
                <CardBody>
                  <Flex gap={4}>
                    {/* Avatar placeholder */}
                    <SkeletonCircle size="50px" />

                    {/* Details */}
                    <Box flex={1}>
                      {/* Name and location */}
                      <Flex justify="space-between" alignItems="center" mb={2}>
                        <Box>
                          <Skeleton height="20px" width="150px" mb={1} />
                          <Skeleton height="15px" width="100px" />
                        </Box>
                        <Skeleton height="25px" width="100px" borderRadius="md" />
                      </Flex>

                      {/* Services offered */}
                      <Wrap spacing={2} mb={4}>
                        {Array(3)
                          .fill(0)
                          .map((_, key) => (
                            <WrapItem key={key}>
                              <Skeleton height="20px" width="80px" borderRadius="md" />
                            </WrapItem>
                          ))}
                      </Wrap>

                      {/* About description */}
                      <SkeletonText noOfLines={3} spacing="4" mb={4} />

                      {/* Action buttons */}
                      <Flex gap={3}>
                        <Skeleton height="40px" width="120px" borderRadius="md" />
                        <Skeleton height="40px" width="100px" borderRadius="md" />
                      </Flex>
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            ))}
        </Stack>
      </Container>
    </Box>
  );
};



export const SearchCarsSkeleton = () => {
  return(
    <Box py={4}>
      <Container maxW="container.lg" py={4}>
          <Skeleton height="30px" width="50%" mb={5} />
          
          {/* Search Header */}
          <Flex gap={4} mb={6}>
              <Skeleton height="40px" flex={1} borderRadius="30px" />
              <Skeleton height="40px" width="150px" />
          </Flex>

          {/* Filters */}
          <Flex gap={2} mb={6} flexWrap="wrap">
              <Skeleton height="40px" width="150px" />
              <Skeleton height="40px" width="150px" />
          </Flex>

          {/* Results */}
          <Flex flexWrap={'wrap'} justifyContent={{base: 'space-evenly', lg: 'flex-start'}} rowGap={6} columnGap={6} py={'2rem'}>
              {[...Array(6)].map((_, idx) => (
                  <Card key={idx} shadow={'lg'} my={3} w={{base: '100%', md: 'calc(100% / 2 - 20px)', lg: 'calc(100% / 3 - 20px)'}} maxW={{base: '320px', lg: 'calc(100% / 3 - 20px)'}}>
                      <CardBody>
                          <Flex gap={4}>
                              <SkeletonCircle size="12" />
                              <Box flex={1}>
                                  <SkeletonText mt="4" noOfLines={2} spacing="4" />
                                  <Skeleton height="20px" width="60px" my={2} />
                                  <Wrap spacing={2} mb={4}>
                                      {[...Array(3)].map((_, key) => (
                                          <WrapItem key={key}>
                                              <Skeleton height="20px" width="50px" />
                                          </WrapItem>
                                      ))}
                                  </Wrap>
                                  <SkeletonText mt="4" noOfLines={4} spacing="4" />
                                  <Flex gap={3} mt={4}>
                                      <Skeleton height="40px" flex={1} />
                                      <Skeleton height="40px" flex={1} />
                                  </Flex>
                              </Box>
                          </Flex>
                      </CardBody>
                  </Card>
              ))}
          </Flex>
      </Container>
  </Box>
  );
}



export const ChatRoomSkeleton = () => {
  return (
    <Flex h="100vh" bg="gray.50" position={'fixed'} left={'0px'} zIndex={'10'} w={'100%'}>
      {/* Chat List Skeleton */}
      <Box w="30%" bg="white" p={4} shadow="md">
        <SkeletonText mt="4" noOfLines={1} spacing="4" skeletonHeight="2" mb={4} />
        <VStack align="stretch" spacing={4}>
          {[...Array(4)].map((_, idx) => (
            <Flex key={idx} p={3} bg="gray.100" borderRadius="lg" align="center">
              <SkeletonCircle size="10" mr={3} />
              <Box flex={1}>
                <SkeletonText noOfLines={1} spacing="4" skeletonHeight="2" />
                <SkeletonText noOfLines={1} spacing="4" skeletonHeight="2" mt={2} />
              </Box>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Chat Window Skeleton */}
      <Flex flex={1} direction="column" bg="white" p={4}>
        {/* Header Skeleton */}
        <Flex align="center" mb={4} p={3} bg="gray.50">
          <SkeletonCircle size="10" mr={3} />
          <SkeletonText noOfLines={1} spacing="4" skeletonHeight="4" w="50%" />
        </Flex>

        {/* Divider Skeleton */}
        <Skeleton h="1px" w="100%" mb={4} />

        {/* Messages Skeleton */}
        <Flex flex={1} direction="column" overflowY="auto" px={3}>
          {[...Array(4)].map((_, idx) => (
            <Flex
              key={idx}
              justify={idx % 2 === 0 ? "flex-start" : "flex-end"}
              mb={4}
            >
              <Box
                bg="gray.100"
                px={4}
                py={2}
                borderRadius="lg"
                maxW="70%"
                w="40%"
              >
                <SkeletonText noOfLines={2} spacing="4" skeletonHeight="2" />
              </Box>
            </Flex>
          ))}
        </Flex>

        {/* Input Area Skeleton */}
        <Flex mt={4} align="center">
          <Skeleton h="40px" flex={1} mr={4} borderRadius="md" />
          <Skeleton h="40px" w="60px" borderRadius="md" />
        </Flex>
      </Flex>
    </Flex>
  );
};


