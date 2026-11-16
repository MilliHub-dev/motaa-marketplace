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
  InputRightElement,
  Select,
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
import { SEARCH_KINDS, carSearchPath } from "../../utils/carSearch";
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
  const [searchFor, setSearchFor] = useState("sale"); // the Buy / Rent picker next to the search box
  const { authUser } = useContext(GlobalStore);
  const navigate = useNavigate();
  const home = useApiQuery(
    (api, signal, { useCache }) => api.get('/listings/my-listings/?summary=1&scope=recents;top-deals', { signal, cacheTTL: useCache ? 30000 : 0 }),
    [],
    { keepAs: 'home' },
  );
  const recentlyViewed = asList(home.data?.recents);
  const name = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ');

  function onSearch(e) {
    e.preventDefault();
    navigate(carSearchPath(query, searchFor));
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
                     aria-label={searchFor === 'rental' ? 'Search cars for rent' : 'Search cars for sale'}
                     placeholder={searchFor === 'rental' ? 'Cars to rent, e.g. Toyota Prado' : 'Cars to buy, e.g. Toyota Camry'}
                     borderRadius="30px" bg="gray.200"
                     pr="7.5rem"
                     enterKeyHint="search"
                     onChange={e => setQuery(e.target.value)}
                    />
                    {/* buy or rent: which cars the search looks through */}
                    <InputRightElement width="7rem" pr={1}>
                      <Select
                       aria-label="Search cars to buy or to rent"
                       value={searchFor}
                       onChange={(e) => setSearchFor(e.target.value)}
                       size="sm"
                       borderRadius="full"
                       bg="white"
                       fontWeight="600"
                       color="primary"
                       borderColor="gray.300"
                       cursor="pointer"
                      >
                        {SEARCH_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                      </Select>
                    </InputRightElement>
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
      <Box position="relative" overflow="hidden" py={16}>
        <Box position="absolute" inset={0} bg="primary" />
        <Box position="absolute" top={-80} right={-80} w={300} h={300} borderRadius="full" bg="rgba(255,255,255,0.06)" />
        <Box position="absolute" bottom={-60} left={-40} w={200} h={200} borderRadius="full" bg="rgba(255,255,255,0.04)" />
        <Box position="absolute" top={40} right={120} w={60} h={60} borderRadius="full" bg="rgba(255,255,255,0.08)" />

        <Container maxW="7xl" position="relative" zIndex={1}>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8} alignItems="center">
            <Box display={{ base: 'none', md: 'block' }}>
              <Box position="relative">
                <Box position="absolute" inset={-20} bg="rgba(255,255,255,0.05)" borderRadius="3xl" />
                <Image
                  loading="lazy"
                  src="/assets/images/motaa-car-mid.png"
                  alt=""
                  w="full"
                  h="auto"
                  borderRadius="2xl"
                  boxShadow="2xl"
                />
                <Box
                  position="absolute"
                  top={-12}
                  right={-12}
                  bg="tertiary"
                  color="primary"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontWeight="700"
                  fontSize="sm"
                  boxShadow="lg"
                >
                  Verified
                </Box>
              </Box>
            </Box>

            <Box color="white">
              <Box display="inline-flex" alignItems="center" gap={2} bg="rgba(255,255,255,0.15)" px={4} py={2} borderRadius="full" mb={4}>
                <Box w={8} h={8} borderRadius="full" bg="tertiary" display="flex" alignItems="center" justifyContent="center">
                  <Box w={4} h={4} borderRadius="2px" bg="primary" />
                </Box>
                <Text fontWeight="600" fontSize="sm">Verified Dealerships</Text>
              </Box>

              <Heading as="h2" size={{ base: "3xl", sm: "4xl", md: "5xl" }} mb={4} fontWeight="800" lineHeight="1.1">
                NEED A CAR?
              </Heading>

              <Box
                display="inline-block"
                bg="tertiary"
                color="primary"
                px={6}
                py={3}
                borderRadius="xl"
                mb={6}
                fontWeight="600"
                fontSize="lg"
              >
                Cars from verified dealers across Nigeria
              </Box>

              <Text mb={8} fontSize="md" opacity={0.9} lineHeight={1.6} maxW="480px">
                Explore a range of cars on Motaa, buy from verified car dealerships across the country. Secure payments, transparent deals.
              </Text>

              <Flex gap={4} flexWrap="wrap">
                <Button
                  as={Link}
                  to='/buy/'
                  fontWeight={'700'}
                  bg="tertiary"
                  color="primary"
                  size="lg"
                  px={8}
                  py={7}
                  borderRadius="xl"
                  rightIcon={<Box as="span" fontSize="lg">→</Box>}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                  transition="all 0.2s"
                >
                  BUY NOW!
                </Button>
                <Button
                  as={Link}
                  to='/rent/'
                  fontWeight={'600'}
                  bg="transparent"
                  color="white"
                  size="lg"
                  px={8}
                  py={7}
                  borderRadius="xl"
                  border="2px solid rgba(255,255,255,0.4)"
                  _hover={{ bg: "rgba(255,255,255,0.1)", transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  Rent a Car
                </Button>
              </Flex>
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
