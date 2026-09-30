import { useEffect, useState } from 'react';
import {
  Box, Button, Flex, Icon, Text, Container, Heading, SimpleGrid, VStack, HStack, Image,
  Accordion, AccordionItem, AccordionPanel, AccordionButton, Stack, Input, InputGroup,
  InputLeftElement, Link,
} from '@chakra-ui/react';
import { Link as RLink, useNavigate } from 'react-router-dom';
import { FaCirclePlus, FaCircleMinus } from 'react-icons/fa6';
import { RxArrowRight } from 'react-icons/rx';
import { TbSearch } from 'react-icons/tb';
import faqs from '../data/faqs.json';
import '../assets/Home.css';

export const featureList = [
  {
    label: 'Buy',
    image: '/assets/images/features-image-1.webp',
    imageAlt: 'A happy customer holding the keys to her new car',
    backgroundX: '90%',
    cta: { label: 'Find your car', link: '/signup' },
    content: 'Browse verified listings from trusted dealers, book an inspection and pay securely through your Motaa wallet.',
    card: {
      mobile: '/assets/images/buy-widget-mobile.svg',
      desktop: '/assets/images/buy-widget.svg',
      posX: '10%', posY: '27.5%',
    },
  },
  {
    label: 'Sell',
    image: '/assets/images/features-image-2.webp',
    imageAlt: 'A dealer handing car keys to a buyer',
    backgroundX: '50%',
    cta: { label: 'List your cars', link: '/signup?type=business&as=dealer' },
    content: 'Get more value for your cars faster, easier and more securely by reaching buyers across Nigeria.',
    card: {
      mobile: '/assets/images/sale-widget-mobile.svg',
      desktop: '/assets/images/sell-widget.svg',
      posX: '50%', posY: '25px',
    },
  },
  {
    label: 'Rent',
    image: '/assets/images/features-image-3.webp',
    imageAlt: 'A passenger relaxing in the back of a rented car',
    backgroundX: '70%',
    cta: { label: 'Find rentals', link: '/signup' },
    content: 'Choose from a fleet of rental cars, with or without a driver. Whether for business or leisure, Motaa has the car you need.',
    card: {
      mobile: '/assets/images/rent-not-mobile.svg',
      desktop: '/assets/images/rent-not.svg',
      posX: '50%', posY: '55%',
    },
  },
  {
    label: 'Find Mechanic',
    image: '/assets/images/mechanic-fixing-tyre.webp',
    imageAlt: 'A mechanic fixing a car tyre',
    backgroundX: '50%',
    cta: { label: 'Find mechanics', link: '/signup' },
    content: 'Find certified mechanics near you, compare their services and rates, and book a repair in a few taps.',
    card: {
      mobile: '/assets/images/mech-widget-mobile.svg',
      desktop: '/assets/images/mech-widget.svg',
      posX: '40%', posY: '15%',
    },
  },
];

const heroActions = [
  { icon: '/assets/icons/BuyCarIcon.svg', label: 'Buy a Car', link: '/signup' },
  { icon: '/assets/icons/SellCarIcon.svg', label: 'Sell your Car', link: '/signup?type=business&as=dealer' },
  { icon: '/assets/icons/RentCarIcon.svg', label: 'Rent a Car', link: '/signup' },
  { icon: '/assets/icons/FindMechanicIcon.svg', label: 'Find Mechanic', link: '/signup' },
];

const budgets = [3000000, 5000000, 10000000, 20000000];

const brands = [
  { name: 'Toyota', logo: '/assets/icons/ToyotaLogo.svg' },
  { name: 'Ford', logo: '/assets/icons/FordLogo.svg' },
  { name: 'BMW', logo: '/assets/icons/BmwLogo.svg' },
  { name: 'Mercedes-Benz', logo: '/assets/icons/MercedesLogo.webp' },
];

const howItWorks = [
  { title: 'Create a free account', body: 'Sign up in minutes as a car buyer, renter or car owner looking for a mechanic.' },
  { title: 'Choose with confidence', body: 'Browse listings from verified dealers and certified mechanics, and chat with them in the app.' },
  { title: 'Pay securely', body: 'Fund your Motaa wallet and pay through escrow, so the seller is only paid when the deal is done.' },
];


/** Sets the tab title while a page is mounted. */
export function usePageTitle(title){
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}


function HeroSearch(){
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function onSubmit(e){
    e.preventDefault();
    const find = query.trim();
    navigate(`/search/cars/${find ? `?find=${encodeURIComponent(find)}` : ''}`);
  }

  return (
    <Box as="form" role="search" onSubmit={onSubmit} maxW="560px" mx="auto">
      <Flex bg="white" borderRadius="full" p={1} pl={2} alignItems="center" boxShadow="lg">
        <InputGroup flex={1}>
          <InputLeftElement pointerEvents="none" color="gray.500"><TbSearch size={20} /></InputLeftElement>
          <Input
           type="search"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           aria-label="Search cars"
           placeholder="Search for a make or model, e.g. Corolla"
           border="none"
           color="black"
           _focusVisible={{ boxShadow: 'none' }}
           _placeholder={{ color: 'gray.500' }}
          />
        </InputGroup>
        <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} borderRadius="full" px={{ base: 4, md: 6 }}>Search</Button>
      </Flex>
    </Box>
  )
}


function Hero(){
  return (
    <Box
      as="section"
      id="welcome"
      aria-labelledby="hero-title"
      className="header hero-bg"
      display="flex"
      alignItems="center"
    >
      <Container maxW="800px" px={{ base: 4, md: 6 }} py={{ base: 10, md: 16 }} textAlign="center">
        <Heading as="h1" id="hero-title" fontWeight={700} fontSize={{ base: '34px', sm: '43px', md: '56px' }} lineHeight={1.1} mb={4} className="animate__animated animate__fadeInUp">
          One Platform for <br />
          All your <Text as="span" className="after-line">Car Needs<Text as="span" color="primary">.</Text></Text>
        </Heading>
        <Text fontSize={{ base: 'md', md: 'xl' }} fontWeight={600} maxW="560px" mx="auto" mb={6}>
          Buy, sell, rent cars or find trusted mechanics all in one platform.
        </Text>

        <HeroSearch />

        <SimpleGrid
          as="nav"
          aria-label="Get started"
          columns={{ base: 2, md: 4 }}
          spacing={{ base: 3, md: 4 }}
          w="100%"
          maxW={{ base: '360px', md: '640px' }}
          mx="auto"
          mt={{ base: 6, md: 8 }}
        >
          {heroActions.map((item) => (
            <Flex
              as={RLink}
              to={item.link}
              key={item.label}
              className="hero-tile"
              direction="column"
              align="center"
              justify="center"
              gap={{ base: 2, md: 3 }}
              h={{ base: '96px', md: '136px' }}
              px={2}
              borderRadius={{ base: '18px', md: '22px' }}
            >
              <Image src={item.icon} alt="" boxSize={{ base: '30px', md: '46px' }} />
              <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight={600} lineHeight="short">{item.label}</Text>
            </Flex>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}


export function FeatureCards({ items = featureList }){
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
      {items.map((feature) => (
          <Box
            key={feature.label}
            as="article"
            className="feature-card"
            position="relative"
            overflow="hidden"
            role="group"
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.27)',
              // bottom gradient keeps the white copy readable over bright photos
              backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0) 65%), url("${feature.image}")`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundPositionX: feature.backgroundX,
            }}
          >
            <Box as="span" srOnly>{feature.imageAlt}</Box>
            <Box
              position="absolute"
              top={{ base: '16px', md: feature.card.posY }}
              right={{ base: '16px', md: 'auto' }}
              left={{ base: 'auto', md: feature.card.posX }}
              w={{ base: '150px', md: '170px' }}
            >
              <picture>
                <source media="(min-width: 48em)" srcSet={feature.card.desktop} />
                <img src={feature.card.mobile} alt="" loading="lazy" style={{ width: '100%' }} />
              </picture>
            </Box>

            <Box position="absolute" bottom="20px" left="20px" right="20px" color="#fff" fontSize="15px">
              <Heading as="h3" fontSize="md" px={3} py={1} borderRadius="5px" color="#fff" bg="primary" w="max-content">{feature.label}</Heading>
              <Text my={2} maxW={{ base: '100%', md: '80%' }}>{feature.content}</Text>
              <Button as={RLink} to={feature.cta.link} variant="outline" borderColor="white" color="white" borderWidth={2} _hover={{ bg: 'whiteAlpha.300' }} rightIcon={<RxArrowRight />}>
                {feature.cta.label}
              </Button>
            </Box>
          </Box>
      ))}
    </SimpleGrid>
  )
}


export const HomePage = () => {
  usePageTitle('Motaa — Buy, sell, rent cars and find mechanics in Nigeria');

  return (
    <div>
      <Hero />

      <Box as="section" id="services" aria-labelledby="services-title" py={{ base: 12, md: 20 }} px={{ base: 4, md: 10 }}>
        <SimpleGrid my={4} mb={{ base: 8, md: 10 }} columns={{ base: 1, md: 2 }} gap={4} alignItems="baseline" textAlign={{ base: 'center', md: 'left' }}>
          <Heading as="h2" id="services-title" size="lg">
            Explore our growing network of{' '}
            <Text as="span" color="primary">
              verified dealers <Image display="inline" verticalAlign="middle" boxSize="22px" src="/assets/icons/Vector.svg" alt="" /> and certified mechanics.
            </Text>
          </Heading>
          <Text fontSize="lg">Motaa connects you to verified dealers and certified mechanics across Nigeria, so every car you buy, rent or fix comes from a partner you can trust.</Text>
        </SimpleGrid>

        <FeatureCards />
      </Box>

      <WhyMotaa />

      <BrowseCars />

      <HowItWorks />

      <Partnership />

      <Faqs />
    </div>
  )
}

export default HomePage;


function WhyMotaa(){
  const reasons = [
    { icon: '/assets/icons/FullCartIcon.svg', title: 'All in One Marketplace', body: 'Buy, rent, sell and service your car in one place instead of juggling different apps and contacts.' },
    { icon: '/assets/icons/TrustAndTransparencyIcon.svg', title: 'Trust & Transparency', body: 'Deal with verified businesses and pay through escrow-protected wallet payments.' },
    { icon: '/assets/icons/EaseOfUseIcon.svg', title: 'Ease of Use', body: 'Find verified dealers and mechanics quickly with a simple, intuitive app.' },
  ];

  return (
    <Box as="section" id="why-motaa" aria-labelledby="why-title" py={{ base: 12, md: 16 }} bg="gray.50">
      <Container maxW="container.xl">
        <Heading as="h2" id="why-title" size="lg" textAlign="center" mb={{ base: 8, md: 12 }}>
          Why Choose Us<Text as="span" color="primary">?</Text>
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, md: 8 }} maxW="1000px" mx="auto">
          {reasons.map((r) => (
            <InfoCard key={r.title} icon={r.icon} title={r.title} body={r.body} />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}


/** White card with an icon badge, title and copy (shared by the marketing pages). */
export function InfoCard({ icon, iconNode, title, body, align = 'center', ...props }){
  return (
    <Box bg="white" h="100%" p={{ base: 6, md: 8 }} borderRadius="xl" boxShadow="lg" textAlign={align} {...props}>
      <Flex bg="blue.100" color="primary" w="56px" h="56px" borderRadius="14px" mx={align === 'center' ? 'auto' : 0} mb={4} align="center" justify="center">
        {iconNode || <Image src={icon} alt="" boxSize="28px" />}
      </Flex>
      <Heading as="h3" fontSize="lg" color="primary" mb={2}>{title}</Heading>
      <Text color="gray.600">{body}</Text>
    </Box>
  )
}


function BrowseCars(){
  const naira = (n) => n.toLocaleString('en-NG');

  return (
    <Box as="section" id="browse" aria-labelledby="browse-title" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl" px={4}>
        <Heading as="h2" id="browse-title" mb={{ base: 6, md: 8 }} textAlign="center" size="lg">Browse cars for sale</Heading>

        <Heading as="h3" size="md" mb={2}>Search by budget</Heading>
        <Flex as="ul" listStyleType="none" gap={{ base: 4, md: 6 }} className="hidden-scroll snap-row" overflowX="auto" py={{ base: 4, md: 6 }} mb={6}>
          {budgets.map((amount) => (
            <Box as="li" key={amount} flex={{ base: '0 0 230px', xl: 1 }}>
              <Flex
                as={RLink}
                to={`/buy?max_price=${amount}`}
                gap={3}
                align="center"
                p={4}
                rounded="xl"
                bgColor="gray.100"
                transition="background-color .2s, transform .2s"
                _hover={{ bgColor: 'blue.50', transform: 'translateY(-2px)' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'primary' }}
              >
                <Image loading="lazy" src="/assets/icons/BudgetCarsIcon.svg" alt="" w="70px" />
                <Box textAlign="left">
                  <Text fontSize="sm" color="gray.600">Cars less than</Text>
                  <Text fontWeight="800" fontSize="lg">₦{naira(amount)}</Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Flex>

        <Heading as="h3" size="md" mb={2}>Top brands</Heading>
        <Flex as="ul" listStyleType="none" gap={{ base: 4, md: 6 }} className="hidden-scroll snap-row" overflowX="auto" py={{ base: 4, md: 6 }}>
          {brands.map((brand) => (
            <Box as="li" key={brand.name} flex={{ base: '0 0 200px', xl: 1 }}>
              <VStack
                as={RLink}
                to={`/buy?brands=${encodeURIComponent(brand.name)}`}
                p={5}
                rounded="xl"
                bgColor="gray.100"
                spacing={4}
                transition="background-color .2s, transform .2s"
                _hover={{ bgColor: 'blue.50', transform: 'translateY(-2px)' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'primary' }}
              >
                <Image loading="lazy" src={brand.logo} alt="" boxSize="100px" objectFit="contain" />
                <Text fontWeight="700" textTransform="uppercase">{brand.name}</Text>
              </VStack>
            </Box>
          ))}
        </Flex>

        <Flex justify="center" mt={6}>
          <Button as={RLink} to="/buy" variant="outline" borderColor="primary" color="primary" rightIcon={<RxArrowRight />}>Browse all cars</Button>
        </Flex>
      </Container>
    </Box>
  )
}


function HowItWorks(){
  return (
    <Box as="section" id="how-it-works" aria-labelledby="how-title" py={{ base: 12, md: 16 }} bg="gray.50">
      <Container maxW="container.lg">
        <Heading as="h2" id="how-title" size="lg" textAlign="center" mb={3}>How Motaa works</Heading>
        <Text textAlign="center" color="gray.600" maxW="2xl" mx="auto" mb={{ base: 8, md: 12 }}>
          From finding the right car to paying for it, every step happens in one place.
        </Text>
        <Steps steps={howItWorks} />
      </Container>
    </Box>
  )
}


/** Numbered steps (shared by the marketing pages). */
export function Steps({ steps }){
  return (
    <SimpleGrid as="ol" listStyleType="none" columns={{ base: 1, md: steps.length > 3 ? 4 : 3 }} spacing={{ base: 4, md: 6 }}>
      {steps.map((step, i) => (
        <Box as="li" key={step.title} bg="white" borderRadius="xl" p={6} boxShadow="md" position="relative">
          <Flex w="40px" h="40px" borderRadius="full" bg="tertiary" color="secondary" fontWeight="800" align="center" justify="center" mb={4} aria-hidden="true">{i + 1}</Flex>
          <Heading as="h3" fontSize="lg" mb={2} color="secondary">{step.title}</Heading>
          <Text color="gray.600">{step.body}</Text>
        </Box>
      ))}
    </SimpleGrid>
  )
}


/** Blue call-to-action banner for businesses (shared by the marketing pages). */
export function Partnership({ title, body, primary, secondary }){
  return (
    <Box
      as="section"
      id="partner-with-us"
      aria-labelledby="partner-title"
      py={16}
      px={4}
      bgColor="primary"
      color="white"
      backgroundImage="url('/assets/images/partner-banner-background.webp')"
      backgroundRepeat="no-repeat"
      backgroundSize="cover"
      backgroundPosition="left"
      minH={{ md: '420px' }}
      display="flex"
      alignItems="center"
    >
      <Container maxW="7xl">
        <VStack spacing={6} textAlign="center">
          <Heading as="h2" id="partner-title" size="lg">
            {title || <>Ready to drive your business forward<Text as="span" color="tertiary">?</Text><br /> Partner with us today.</>}
          </Heading>
          <Text fontSize={{ base: 'md', md: 'xl' }} maxW="2xl">
            {body || "Whether you're a dealer, a mechanic or anything in between, Motaa gives you the tools and support you need to grow your business."}
          </Text>
          <HStack spacing={4} flexWrap="wrap" justify="center">
            <Button as={RLink} to={primary?.to || '/signup?type=business'} colorScheme="yellow" bg="tertiary" color="primary" rightIcon={<RxArrowRight />} minW="180px">
              {primary?.label || 'Get started'}
            </Button>
            {secondary !== false &&
              <Button as={RLink} to={secondary?.to || '/business'} bg="white" color="primary" _hover={{ bg: 'gray.100' }} minW="180px">
                {secondary?.label || 'Learn more'}
              </Button>
            }
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
}


/** FAQ accordion; AccordionButton stays a real <button> so it works with the keyboard. */
export function FaqList({ items }){
  return (
    <Accordion allowMultiple textAlign="left">
      {items.map((faq) => (
        <AccordionItem key={faq.id || faq.question} borderRadius="md" my={3} border="1px solid" borderColor="gray.200">
          {({ isExpanded }) => (
            <>
              <Heading as="h3" fontSize="md" fontWeight="600" m={0}>
                <AccordionButton py={4} gap={3} borderRadius="md" _expanded={{ color: 'primary' }}>
                  <Box as="span" flex={1} textAlign="left">{faq.question}</Box>
                  <Icon as={isExpanded ? FaCircleMinus : FaCirclePlus} boxSize="20px" color="primary" aria-hidden="true" />
                </AccordionButton>
              </Heading>
              <AccordionPanel px={4} pb={4}>
                <Text color="gray.700">{faq.answer}</Text>
              </AccordionPanel>
            </>
          )}
        </AccordionItem>
      ))}
    </Accordion>
  )
}


function Faqs(){
  return (
    <Box as="section" id="faqs" aria-labelledby="faq-title">
      <Container maxW="container.md" py={{ base: 16, md: '100px' }} textAlign="center">
        <Heading as="h2" id="faq-title" my={2} size="xl">Frequently Asked Questions</Heading>
        <Text my={2}>
          Still have questions? <Link as={RLink} to="/support" color="primary" textDecoration="underline">Contact our support team.</Link>
        </Text>
        <Stack mt={8} maxW="640px" mx="auto">
          <FaqList items={faqs} />
        </Stack>
      </Container>
    </Box>
  )
}
