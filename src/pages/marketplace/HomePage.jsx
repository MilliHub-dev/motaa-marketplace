import { useContext, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Image,
  Input,
  ButtonGroup,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Tabs,
  Text,
  VStack,
  Button,
  Flex,
} from "@chakra-ui/react"
import { Search, Car } from "lucide-react"
import { ListingItemCard } from "../../components";
import FeaturedSlider from "../../components/FeaturedSlider";
import { GlobalStore } from "../../App";
import { useApiQuery } from "../../hooks/useApi";
import { AsyncState, EmptyState } from "../../components/states";
import { ListingSkeleton } from "../../components/loaders";
import { asList } from "../../utils";
import ScrollAnimation from 'react-animate-on-scroll';
import { Link, useNavigate } from 'react-router-dom';

// Feature Card Component
function FeatureCard({ icon, title, description, ...props }) {
  return (
    <Box bg="white" minW={{ base: '260px', md: '300px' }} maxW={'300px'} p={8} borderRadius="xl" boxShadow="2xl" textAlign="center" {...props}>
      <Box bg="blue.200" w="fit-content" px={4} py={3} borderRadius="10px" mx="auto" mb={4}>
        {icon}
      </Box>
      <Text as="h3" fontSize="lg" color="primary" fontWeight="bold" mb={2}>
        {title}
      </Text>
      <Text color="gray.600">{description}</Text>
    </Box>
  )
}

function ListingGrid({ items }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={{ base: 6, md: 8 }} textAlign="left">
      {items.map((listing) => <ListingItemCard key={listing?.uuid || listing?.id} listing={listing} />)}
    </SimpleGrid>
  )
}

const tabProps = {
  as: Button,
  color: "primary",
  _selected: { bgColor: 'primary', color: 'white' },
  borderWidth: "1px",
  borderColor: "cornflowerblue",
  borderRadius: "30px",
  px: { base: '24px', sm: '35px' },
}

export default function MainPage() {
  const [query, setQuery] = useState("");
  const { authUser } = useContext(GlobalStore);
  const navigate = useNavigate();
  const home = useApiQuery(
    (api, signal) => api.get('/listings/my-listings/?summary=1&scope=recents;top-deals', { signal }),
    [],
  );
  const recentlyViewed = asList(home.data?.recents);
  const name = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ');

  function onSearch(e) {
    e.preventDefault();
    const text = query.trim();
    if (text) navigate(`/search/cars/?find=${encodeURIComponent(text)}`);
  }

  return (
    <Box minH="100vh" overflowX="hidden">
      {/* Hero Section */}
      <Box>
        <Container maxW="container.xl" pb={8} pt={6}>
          <Grid
           templateColumns={{ base: "minmax(0, 1fr)", md: "1fr 1fr" }}
           gap={8}
           alignItems="center"
           templateAreas={{
              base: `"image" "content"`,
              md: `"content image"`,
           }}
          >
            <Box gridArea="content">
              <Heading as="h1" size="xl" mb={4} className="subtitle">
                {name ? `Welcome back, ${name}` : 'Welcome back'}
              </Heading>

              <Text fontSize="md" mb={4}>
                Buy, Sell, Rent and Find Mechanics all in one platform
              </Text>

              <VStack spacing={4} align="stretch" mb={4}>
                <form role="search" onSubmit={onSearch}>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <Search size="20px" aria-hidden="true" />
                    </InputLeftElement>
                    <Input
                     type="search"
                     value={query}
                     aria-label="Search for cars"
                     placeholder="Search for cars, e.g. Toyota Camry"
                     borderRadius="30px" bg="gray.200"
                     enterKeyHint="search"
                     onChange={e => setQuery(e.target.value)}
                    />
                  </InputGroup>
                </form>

                <Button as={Link} to='/buy' colorScheme="blue" bg="primary" size="lg">
                  Browse cars for sale
                </Button>
                <Button as={Link} to='/rent' colorScheme="blue" bg="primary" size="lg">
                  Browse cars for rent
                </Button>
                <Button as={Link} to='/mechanics' colorScheme="blue" variant="outline" borderColor="primary" borderWidth={2} size="lg">
                  Find a Mechanic
                </Button>
              </VStack>
            </Box>

            <Box gridArea="image" py={5} minW={0}>
              {/* featured cars from the admin; the original picture when there are none */}
              <FeaturedSlider
                fallback={
                  <Box position="relative">
                    <Image loading="lazy" src="/assets/images/motaa-car-top.png" alt="" w="full" h="auto" />
                    <Box display={{ base: 'none', sm: 'block' }} width={{ sm: '180px', lg: '247px' }} position="absolute" top={4} right={4} p={2}>
                      <Image w="100%" loading="lazy" src="/assets/icons/1.png" h="auto" alt="Verified car dealers" />
                    </Box>
                    <Box display={{ base: 'none', sm: 'block' }} width={{ sm: '180px', lg: '247px' }} position="absolute" bottom={{ sm: 4, lg: 20 }} left={4} p={2}>
                      <Image w="100%" loading="lazy" src="/assets/icons/2.png" h="auto" alt="Certified mechanics" />
                    </Box>
                  </Box>
                }
              />
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 &&
        <Container maxW="7xl" py={12}>
          <Heading as="h2" size="lg" mb={2}>
            Recently viewed
          </Heading>
          <Text as="p" color="gray.600" mb={8}>
            Pick up where you left off.
          </Text>
          <ListingGrid items={recentlyViewed} />
        </Container>
      }

      {/* Promotional Banner */}
      <Box bg="primary" color="white">
        <Container maxW="7xl" py={12}>
          <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={8} alignItems="center">
            <Image loading="lazy" src="/assets/images/motaa-car-mid.png" alt="" />

            <Box>
              <Heading as="h2" size={{base: "2xl", sm: "3xl", md: "4xl"}} mb={4}>
                NEED A CAR?
              </Heading>

              <Heading as="p" className="title" fontWeight="400" size={{base: 'md', md: "lg"}} mb={4} px={4} py={4} bg="tertiary" color="primary">
                Cars from verified dealers across Nigeria
              </Heading>
              
              <Text mb={6}>
                Explore a range of cars on Motaa, buy from verified car dealerships across the country.
              </Text>

              <Button as={Link} to='/buy/' fontWeight={'600'} bg="tertiary" color="primary" w={{base: '100%', md: '250px'}} size="lg">
                BUY NOW!
              </Button>
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* Why Choose Us Section */}
      <Container maxW="container.xl" my={20}>
        <Heading as="h2" size="lg" textAlign="center" mb={12}>
          Why Choose Us<Text as="span" color="primary">?</Text>
        </Heading>
                <Flex
         w={'100%'}
         maxW={'996px'}
         mx="auto"
         className="hidden-scroll"
         alignItems="center"
         px={4} gap={8} justify="space-between"
         flexWrap="nowrap"
         overflowX='auto'
         py={10}
        >
          <ScrollAnimation animateIn="zoomIn">
            <FeatureCard
              icon={<Image boxSize="25px" alt="" src="/assets/icons/FullCartIcon.svg" />}
              title="All in One Marketplace"
              description="Motaa offers you the best experience by providing solutions to your car needs all in one place."
            />
          </ScrollAnimation>

          <ScrollAnimation animateIn="zoomIn">
            <FeatureCard
              icon={<Image boxSize="25px" alt="" src="/assets/icons/TrustAndTransparencyIcon.svg" />}
              title="Trust & Transparency"
              description="Have peace of mind when dealing on Motaa with our verified partners and secure payment solutions."
            />
          </ScrollAnimation>

          <ScrollAnimation animateIn="zoomIn">
            <FeatureCard
              icon={<Image boxSize="25px" alt="" src="/assets/icons/EaseOfUseIcon.svg" />}
              title="Ease of Use"
              description="Motaa makes it easy for users to find verified dealers and mechanics with our intuitive interface."
            />
          </ScrollAnimation>
        </Flex>
              </Container>

      {/* Top Deals Section */}
      <Container maxW="7xl" py={12}>
        <Heading as="h2" size="lg" mb={6} textAlign="center">
          Top Deals
        </Heading>

        <AsyncState
          query={home}
          skeleton={<ListingSkeleton />}
          isEmpty={(data) => !asList(data?.top_deals?.sales).length && !asList(data?.top_deals?.rentals).length}
          empty={<EmptyState icon={Car} title="No deals right now" description="New cars are listed every week. Browse everything that's available in the meantime." action={{ label: 'Browse cars', to: '/buy' }} />}
        >
          {(data) => (
            <Tabs colorScheme="blue" align="center" mb={8} variant="unstyled">
              <TabList as={ButtonGroup} size='md' isAttached variant='outline' mt={3}>
                <Tab {...tabProps}>Buy</Tab>
                <Tab {...tabProps}>Rent</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  {asList(data?.top_deals?.sales).length
                    ? <ListingGrid items={asList(data.top_deals.sales)} />
                    : <EmptyState icon={Car} title="No cars for sale yet" action={{ label: 'See all cars for sale', to: '/buy' }} />}
                </TabPanel>
                <TabPanel px={0}>
                  {asList(data?.top_deals?.rentals).length
                    ? <ListingGrid items={asList(data.top_deals.rentals)} />
                    : <EmptyState icon={Car} title="No rentals yet" action={{ label: 'See all rentals', to: '/rent' }} />}
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </AsyncState>
      </Container>
    </Box>
  )
}
