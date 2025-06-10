import {useState, useEffect, useContext} from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  ButtonGroup,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Tabs,
  Text,
  VStack,
  Button,
  Badge,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react"
import {
  Search,
  MessageCircle,
  Bell,
  ShoppingCart,
  User,
  Star,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
} from "lucide-react"
import {ListingItemCard, ImageCarousel, LocationBreadcrumb} from "../../components";
import {GlobalStore} from "../../App";
import {objectifyJSON} from "../../utils";
import ScrollAnimation from 'react-animate-on-scroll';
import {Link} from 'react-router-dom';

// Feature Card Component
function FeatureCard({ icon, title, description, ...props }) {
  return (
    <Box bg="white" minW={'300px'} maxW={'300px'} p={8} borderRadius="xl" boxShadow="2xl" textAlign="center" {...props}>
      <Box bg="blue.200" w="fit-content" px={4} py={3} borderRadius="10px" mx="auto" mb={4}>
        {icon}
      </Box>
      <Text fontSize="lg" color="primary" fontWeight="bold" mb={2}>
        {title}
      </Text>
      <Text color="gray.600">{description}</Text>
    </Box>
  )
}

export default function MainPage() {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [query, setQuery] = useState("");
  const [topDeals, setTopDeals] = useState({
    rentals: [],
    sales: [],
    services: [],
  });
  const {authUser, redirect, axios, notify} = useContext(GlobalStore);

  function navToPage(path){
    if (!query.trim()){
      return redirect(path)
    }
  }

  async function getData(){
    const res = await axios.get(`/listings/my-listings/?scope=recents;top-deals`);
    const data = objectifyJSON(res.data);

    setRecentlyViewed(data.recents);
    setTopDeals(data.top_deals);
  }

  useEffect(() => {
    getData();
  }, [])

  return (
    <Box minH="100vh">
      {/* Hero Section */}
      <Box>
        <Container maxW="container.xl" pb={8} pt={6}>
          <LocationBreadcrumb />

          <Grid
           mt={5}
           templateColumns={{ base: "1fr", md: "1fr 1fr" }}
           gap={8}
           alignItems="center"
           templateAreas={{
              base: `"image" "content"`,  // Reverse order on small screens
              md: `"content image"`,       // Normal order on larger screens
           }}
          >
            <Box gridArea="content">
              <Heading size="xl" mb={4} className="subtitle">
                Welcome Back, {authUser?.first_name} {authUser?.last_name}
              </Heading>

              <Text fontSize="md" mb={4}>
                Buy, Sell, Rent and Find Mechanics all in one platform
              </Text>

              <VStack spacing={4} align="stretch" mb={4}>
               {/* <InputGroup size="lg">
                  <InputLeftElement>
                    <Search size="20px"/>
                  </InputLeftElement>
                  <Input
                   value={query}
                   placeholder="Search for cars, rentals or mechanic services..."
                   borderRadius="30px" bg="gray.200"
                   onInput={e => setQuery(e.target.value)}
                  />
                </InputGroup> */}

                <Button as={!query.trim() && Link} to='/buy' colorScheme="blue" bg="primary" size="lg">
                  Browse cars for sale
                </Button>
                <Button as={!query.trim() && Link} to='/rent' colorScheme="blue" bg="primary" size="lg">
                  Browse cars for rent
                </Button>
                <Button as={!query.trim() && Link} to='/mechanics' colorScheme="blue" variant="outline" borderColor="primary" borderWidth={2} size="lg">
                  Find a Mechanic
                </Button>
              </VStack>
            </Box>

            <Box position="relative" gridArea="image">
              <Image lazy src="/assets/images/motaa-car-top.png" alt="Featured Car" w="full" h="auto" />
              <Box width="247px" position="absolute" top={4} right={4}  p={2} borderRadius="md">
                <Image w="100%" lazy src="/assets/icons/1.png" h="auto" alt='icon' />
              </Box>
              <Box width="247px" position="absolute" bottom={200} left={4}  p={2} borderRadius="md" >
                <Image w="247px" lazy src="/assets/icons/2.png" h="auto" alt='icon' />
              </Box>
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* Recently Viewed Section */}
      {
        recentlyViewed?.length > 0 &&
        <Container maxW="7xl" py={12}>
          <Heading size="lg" mb={2}>
            Recently viewed
          </Heading>
          <Text as="p" color="gray.600" mb={8}>
            Catchup where you left!
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={8}>
            {recentlyViewed?.map((listing, index) => (
              <ListingItemCard key={index} listing={listing} />
            ))}
          </SimpleGrid>
        </Container>
      }

      {/* Promotional Banner */}
      <Box bg="primary" color="white">
        <Container maxW="7xl" py={12}>
          <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={8} alignItems="center">
            <Image src="/assets/images/motaa-car-mid.png" alt="BMW Promotional" />

            <Box>
              <Heading size={{base: "2xl", sm: "3xl", md: "4xl"}} mb={4}>
                NEED A CAR?
              </Heading>

              <Heading className="title" fontWeight="400" size={{base: 'md', md: "lg"}} mb={4} px={4} py={4} bg="tertiary" color="primary">
                Get upto 30% OFF your first order
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
        <Heading size="lg" textAlign="center" mb={12}>
          Why Choose Us<Text as="span" color="primary">?</Text>
        </Heading>
        <center>
        <Flex
         w={'996px'}
         className="hidden-scroll"
         alignItems="center"
         px={4} gap={8} justify="space-between"
         flexWrap="nowrap"
         overflowX='scroll'
         py={10}
        >
          <ScrollAnimation animateIn="zoomIn">
            <FeatureCard
              icon={<Icon as={Image} fontSize="25px" src="/assets/icons/FullCartIcon.svg" />}
              title="All in One Marketplace"
              description="Motaa offers you the best experience by providing solutions to your car needs all in one place."
            />
          </ScrollAnimation>

          <ScrollAnimation animateIn="zoomIn">
            <FeatureCard
              icon={<Icon as={Image} fontSize="25px" src="/assets/icons/TrustAndTransparencyIcon.svg" />}
              title="Trust & Transparency"
              description="Have peace of mind when dealing on Motaa with our verified partners and secure payment solutions."
            />
          </ScrollAnimation>

          <ScrollAnimation animateIn="zoomIn">
            <FeatureCard
              icon={<Icon as={Image} fontSize="25px" src="/assets/icons/EaseOfUseIcon.svg" />}
              title="Ease of Use"
              description="Motaa makes it easy for users to find verified dealers and mechanics with our intuitive interface."
            />
          </ScrollAnimation>
        </Flex>
        </center>
      </Container>

      {/* Top Deals Section */}
      
      <Container maxW="7xl" py={12} align="center">
        <Heading size="lg" mb={6} textAlign="center">
          Top Deals
        </Heading>

        <Tabs colorScheme="blue"  align="center" mb={8}>
          <TabList align="center" mx="auto" as={ButtonGroup} size='md' border="none" isAttached variant='outline' mt={3}>
            <Tab as={Button}
              color="primary"
             _selected={{
               bgColor: 'primary',
               color: 'white'
             }}
             borderWidth="1px"
             colorScheme={'blue'}
             borderColor="cornflowerblue"
             borderRadius="30px" px={'35px'}
            >Buy</Tab>

            <Tab as={Button}
              color="primary"
             _selected={{
               bgColor: 'primary',
               color: 'white'
             }}
             borderWidth="1px"
             colorScheme={'blue'}
             borderColor="cornflowerblue"
             borderRadius="30px" px={'35px'}
            >Rent</Tab>

            <Tab as={Button}
              color="primary"
             _selected={{
               bgColor: 'primary',
               color: 'white'
             }}
             borderWidth="1px"
             colorScheme={'blue'}
             borderColor="cornflowerblue"
             borderRadius="30px" px={'35px'}
            >Mechanic</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={8}>
                {topDeals?.sales?.map((listing, index) => (
                  <ListingItemCard key={index} listing={listing} />
                ))}
              </SimpleGrid>
            </TabPanel>

            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={8}>
                {topDeals?.rentals?.map((listing, index) => (
                  <ListingItemCard key={index} listing={listing} />
                ))}
              </SimpleGrid>
            </TabPanel>
            
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={8}>
                {/*{topDeals.services?.map((listing, index) => (
                  <ListingItemCard key={index} listing={listing} />
                ))}*/}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>


    </Box>
  )
}

