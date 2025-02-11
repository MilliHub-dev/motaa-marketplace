import {useRef, useContext, Fragment} from 'react';
import {
    Box,
    Button,
    Flex,
    Icon,
    Text,
    useMediaQuery,
    Container,
    Heading,
    SimpleGrid,
    VStack,
    HStack,
    InputLeftElement,
    InputGroup,
    Image,
    Accordion,
    AccordionItem,
    AccordionPanel,
    AccordionButton,
    Tabs, TabList, Tab,
    ButtonGroup, 
    Stack,
    Input,
    Avatar,
} from "@chakra-ui/react";
import {Link} from 'react-router-dom';
import { Globe, Shield, Clock, Star, } from 'lucide-react'
import { Search, Car, DollarSign, Key, PenToolIcon as Tools } from 'lucide-react'
import Layout from "./Layout";
import {motion, } from 'framer-motion';
import {FaCirclePlus, FaCircleMinus, FaPlus} from 'react-icons/fa6';
import {RxArrowRight} from 'react-icons/rx';
import faqs from '../data/faqs.json';
import '../assets/Home.css';
import ScrollAnimation from 'react-animate-on-scroll';
import { SearchBar } from '../components';

const featureList = [
  {
    label: 'Buy',
    background: {
      xAxis: '90%',
      yAxis: '10%'
    },
    image: '/assets/images/features-image-1.png',
    cta: {
      label: 'Find your car',
      link: ''
    },
    content: 'Get more value for your car faster, easier and more securely',
    card: {
      image: {
        mobile: '/assets/images/buy-widget-mobile.svg',
        desktop: '/assets/images/buy-widget.svg'
      },
      posX: '10%',
      posY: '27.5%'
    }
  },
  {
    label: 'Sell',
    background: {
      xAxis: '50%',
      yAxis: '10%'
    },
    image: '/assets/images/features-image-2.png',
    cta: {
      label: 'List your car',
      link: ''
    },
    content: 'Get more value for your car faster, easier and more securely.',
    card: {
      image: {
        mobile: '/assets/images/sale-widget-mobile.svg',
        desktop: '/assets/images/sell-widget.svg'
      },
      posX: '50%',
      posY: '25px'
    }
  },
  {
    label: 'Rent',
    background: {
      xAxis: '70%',
      yAxis: '10%'
    },
    image: '/assets/images/features-image-3.png',
    cta: {
      label: 'Find Rentals',
      link: ''
    },
    content: 'Choose from a premium fleet of rental cars. Whether for business or leisure, Motaa has the car you need.',
    card: {
      image: {
        mobile: '/assets/images/rent-not-mobile.svg',
        desktop: '/assets/images/rent-not.svg'
      },
      posX: '50%',
      posY: '55.0%'
    }
  },
  {
    label: 'Find Mechanic',
    background: {
      xAxis: '50%',
      yAxis: '10%'
    },
    image: '/assets/images/mechanic-fixing-tyre.png',
    cta: {
      label: 'Find Mechanics',
      link: ''
    },
    content: 'Choose from a premium fleet of rental cars. Whether for business or leisure, Motaa has the car you need.',
    card: {
      image: {
        mobile: '/assets/images/rent-not-mobile.svg',
        desktop: '/assets/images/rent-not.svg'
      },
      posX: '50%',
      posY: '15.0%'
    }
  },
]

export const HomePage = ({ props }) => {
    const heroRef = useRef();
    const [isMobile] = useMediaQuery('(max-width: 760px)');

    return(
      <div>
        <motion.section id='welcome' ref={heroRef}>
            <Box
              className='header'
              position={'relative'}
              loading="eager"
              backgroundImage={
                `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), ${isMobile ? 
                'url("/assets/images/hero-image-mobile.png")' 
                :'url("/assets/images/hero-image.png")'}`
              }
            >
                {/* Hero */}
              <Container maxW={'600px'} pt={15} pb={'2rem'}>
                <Box position={'relative'} className='hero' mb={3}>
                  <Text position="relative" lineHeight={1} mb={0} className='title animate__animated animate__fadeInUp'>
                   One Platform for </Text>  
                  <Text position="relative" zIndex={'3'}  lineHeight={1} mb={3} className='title animate__animated animate__fadeInUp'>
                   All your <Text as={'span'} className="after-line">Car Needs<Text as='span' color="primary">.</Text></Text>
                  </Text>
                  <Text size="lg"> Buy, sell, rent cars or find trusted mechanics all in one platform. </Text>          
                </Box>

                <SearchBar onSearch={(query) => console.log(query)} bg="white" color="black" />

                <SimpleGrid
                 placeItems="center"
                 justify="center"
                 columns={{sm: 2, md: 4}}
                 spacing={4}
                 width="100%"
                 mt={5}
                 minChildWidth={isMobile ? '150px' : '130px'}
                >
                    {[
                      { icon: '/assets/icons/BuyCarIcon.svg', label: 'Buy a Car' },
                      { icon: '/assets/icons/SellCarIcon.svg', label: 'Sell your Car' },
                      { icon: '/assets/icons/RentCarIcon.svg', label: 'Rent a Car' },
                      { icon: '/assets/icons/FindMechanicIcon.svg', label: 'Find Mechanic' },
                    ].map((item, idx) => (
                      
                      <Flex
                        as={ScrollAnimation}
                       animateIn={"flipInY"}
                        key={item.label}
                        variant="solid"
                        w="100%"
                        bg="whiteAlpha.200"
                        _hover={{ bg: 'whiteAlpha.300' }}
                        height={isMobile ? "max-content" : "150px"}
                        py={6}
                        px={3}
                        align="center"
                        alignItems="center"
                        placeContent="center"
                        borderWidth={2}
                        borderRadius="10px"
                        gap={2} direction={isMobile ? 'row' : 'column'}
                      >
                        <Icon as={Image} src={item.icon} fontSize={27} />
                        <Text fontSize="sm">{item.label}</Text>
                      </Flex>
                      
                    ))}
                </SimpleGrid>
              </Container>
            </Box>
        </motion.section>

        <Box py={20} px={10}>
          <SimpleGrid my={4} columns={{base: 1, md: 2}} gap={4} alignItems="baseline" textAlign={isMobile && 'center'}>
            <Heading> Explore our network of <Text as="span" color="primary"> 5000+ verified dealers and mechanics.</Text> </Heading>
            <Text> Motaa connects you to verified dealers and certified mechanics across Nigeria. We believe in excellence and provide you with only partners you can trust.</Text>
          </SimpleGrid>

          <SimpleGrid columns={{base: 1, sm: 2, md: 2}} gap={6}>
            {
              featureList.map((feature, idx) =>
              <ScrollAnimation animateIn={idx % 2 === 0 ? "fadeInLeft" : "fadeInRight"}>
              <Box loading="eager" key={idx} className='feature-card' sx={{
                position: 'relative',
                display: 'block',
                backgroundColor: 'rgba(0, 0, 0, 0.27)',
                backgroundImage: `url("${feature.image}")`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundBlendMode: 'overlay',
                borderRadius: '20px',
                px: 3, py: 3,
                backgroundPositionX: feature.background.xAxis,
              }}
              whileHover={{ scale: 1.025 }}
              >
                <Image
                 src={isMobile ? feature.card.image.mobile : feature.card.image.desktop }
                 width={'150px'}
                 position={'absolute'}
                 top={feature.card.posY}
                 left={feature.card.posX}
                />

                <Box className=''
                  sx={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    color: '#fff',
                    fontSize: '15px',
                  }}
                >
                  <Text px={3} py={1} borderRadius={'5px'} color={'#fff'} bg={'primary'} w={'max-content'}> {feature.label} </Text>
                  <Text my={2} maxW="75%"> {feature.content} </Text>

                  <Button variant="outine" borderColor="white" color="white" borderWidth={2} rightIcon={<RxArrowRight />}>{feature.cta.label}</Button>
                </Box>
              </Box>
              </ScrollAnimation>
            )
          }
          </SimpleGrid>
        </Box>

        <Features />

        <Container maxW="container.xl" px={4} py={10}>
          <Heading my={5} textAlign="center" size="lg"> Browse all Cars </Heading>

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
               width="150px"
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
               width="150px"
               borderRadius="30px" px={'35px'}
              >Rent</Tab>
            </TabList>
          </Tabs>

          <Stack px={4}>
            <Heading size="md"> Search by Budget </Heading>

            <Stack placeItems="center">
              <Flex w={'100%'} alignItems="center" gap={8} justify="space-between" className="hidden-scroll" flexWrap="nowrap" overflowX='scroll' py={10}>
                {[
                  {amount: '3,000,000', logo: '/assets/icons/BudgetCarsIcon.svg'},
                  {amount: '5,000,000', logo: '/assets/icons/BudgetCarsIcon.svg'},
                  {amount: '10,000,000', logo: '/assets/icons/BudgetCarsIcon.svg'},
                  {amount: '20,000,000', logo: '/assets/icons/BudgetCarsIcon.svg'},
                ].map((budget) => 
                  <ScrollAnimation animateIn="bounceIn">
                    <Stack minW={'250px'} maxW={'250px'} px={4} py={4} rounded="xl" bgColor="gray.100">
                      <Flex gap={2} justifyContent="space-between" w={'100%'}>
                        <Image loading="eager" src={budget.logo} width={'70px'} />
                        <VStack flex={1} textAlign="left" w="100%" placeItems="flex-start" placeContent="flex-start" pl={2}>
                          <Text textAlign="left !important" flex={1} className="small" color="gray"> Cars less than </Text>
                          <Text textAlign="left !important" flex={1} className="bold" size="md"> <Text as='span' fontWeight="800">₦</Text>{budget.amount} </Text>
                        </VStack>
                      </Flex>

                    </Stack>
                  </ScrollAnimation>
                )}
              </Flex>
            </Stack>
          </Stack>

          <Stack px={4}>
            <Heading size="md"> Top Brands </Heading>

            <Stack placeItems="center">
              <Flex w={'100%'} alignItems="center" gap={8} justify="space-between" className="hidden-scroll" flexWrap="nowrap" overflowX='scroll' py={10}>
                {[
                  {name: 'Toyota', logo: '/assets/icons/ToyotaLogo.svg'},
                  {name: 'Ford', logo: '/assets/icons/FordLogo.svg'},
                  {name: 'BMW', logo: '/assets/icons/BmwLogo.svg'},
                  {name: 'Mercedes Benz', logo: '/assets/icons/MercedesLogo.svg'},
                ].map((brand) => 
                  <ScrollAnimation animateIn="bounceIn">
                    <Stack minW={'250px'} maxW={'250px'} px={4} py={4} rounded="xl" bgColor="gray.100" placeItems="center">
                      <Image loading="eager" src={brand.logo} width={'100px'} />

                      <Heading size="md" textTransform="uppercase" mt={5}> {brand.name} </Heading>
                    </Stack>
                  </ScrollAnimation>
                )}
              </Flex>

              <Button variant="outline" maxW={'200px'} rightIcon={<FaPlus />}> Show all Brands </Button>
            </Stack>
          </Stack>
        </Container>

        <Testimonials />

        <Partnership />

        {/* FAQs */}
        <Container maxW={{md: '75%'}} py={'100px'} textAlign={'center'}>
          <Text my={2} className='title'> Frequently Asked Questions </Text>
          <Text my={2} className='text'> Still not convinced? <a href={'/'} className='link'>Chat with our team here.</a> </Text>

          <Stack mt={10} maxW={{md: '500px'}} mx={'auto'}>
            <Accordion allowMultiple allowToggle border={'none'} textAlign={'left'}>
              {
                faqs.map((faq, idx) => 
                    <AccordionItem borderRadius={5} my={4} border={'1px solid lavender'}>
                      {({ isExpanded }) => (
                        <Fragment key={idx}>
                        <AccordionButton as={Flex} wrap={'nowrap'} alignItems={'center'} justifyContent={'space-between'}>
                          <Text flex={1} className='' size="md" textAlign={'left'}> {faq?.question} </Text>
                          <Icon className='icon' fontSize={'20px'}>{isExpanded ? <FaCircleMinus /> : <FaCirclePlus /> }</Icon>
                        </AccordionButton>

                        <AccordionPanel px={3} py={3}>
                          <Text className=''>{faq?.answer}</Text>
                        </AccordionPanel>
                        </Fragment>
                      )}
                    </AccordionItem>
              )}
            </Accordion>
          </Stack>
        </Container>
      </div>
    )
}

export default HomePage;



function Partnership() {
  return (
    <Box
      py={16}
      bgColor="blue.600"
      color="white"
      backgroundImage={`url('/assets/images/partner-banner-background.png')`}
      backgroundRepeat="no-repeat"
      backgroundSize="cover"
      minH={'450px'}
      placeContent="center"
      placeItems="center"
      backgroundPosition="left"
    >
      <Container maxW="7xl">
        <VStack spacing={6} textAlign="center">
          <Heading size="lg" align="center">
            Ready to drive your business forward<Text as="span" color="tertiary">?</Text>
            <br /> partner with us today.
          </Heading>

          <Text fontSize="md" maxW="2xl">
            Whether you're a dealer, mechanic, or anything in between, Motaa
            gives you the tools and help you need to accelerate your business growth.
          </Text>
          <HStack spacing={4}>
            <Link to="/signup/business">
            <Button colorScheme="yellow" bg="tertiary" color="primary" rightIcon={<RxArrowRight />} size="md" width="200px">
              Get started
            </Button>
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
}



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


function Features() {
  return (
    <Box py={16}>
      <Container maxW="container.xl">
        <Heading size="lg" textAlign="center" mb={12}>
          Why Choose Us<Text as="span" color="primary">?</Text>
        </Heading>

        <Flex
         w={'100%'}
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
      </Container>
    </Box>
  )
}


function TestimonialCard({ name, role, comment, rating, avatar, title }) {
  return (
    <Box
      bg="white"
      p={6}
      borderRadius="20px"
      boxShadow="md"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-4px)' }}
      minW="280px"
      maxW="280px"

    >
      <Flex gap={2}>
        <Avatar name={name} src={avatar} />
        <HStack spacing={1} mb={4}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon
              key={i}
              as={Star}
              color={i < rating ? 'yellow.400' : 'gray.300'}
              fill={i < rating ? 'currentColor' : 'none'}
            />
          ))}
        </HStack>
      </Flex>

      <Text my={2} fontWeight="bold">"{title}"</Text>

      <Text color="gray.600" mb={4}>
        {comment}
      </Text>

      <HStack spacing={3}>  
        <Box>
          <Text fontWeight="bold">{name}</Text>
          <Text fontSize="sm" color="gray.500">
            {role}
          </Text>
        </Box>
      </HStack>
    </Box>
  )
}

function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Bought a Toyota Yaris 2023',
      title: "So easy and fast",
      comment:
        'Incredible platform! Made buying my dream car so much easier than I expected.',
      rating: 5,
      avatar: '/placeholder.svg?height=40&width=40',
    },
    {
      name: 'Michael Brown',
      role: 'Hired a mechanic for Paint Job + other services',
      title: "Awesome Experience",
      comment:
        'The mechanics on this platform are highly skilled and professional.',
      rating: 5,
      avatar: '/placeholder.svg?height=40&width=40',
    },
    {
      name: 'Jessica Lee',
      role: 'Car Dealer',
      title: "Great Platform",
      comment:
        'As a dealer, this platform has helped me reach more customers than ever.',
      rating: 5,
      avatar: '/placeholder.svg?height=40&width=40',
    },
    {
      name: 'David Wilson',
      role: 'Mechanic',
      title: "Highly recommended",
      comment:
        'Great community of car enthusiasts and professionals. Highly recommended!',
      rating: 5,
      avatar: '/placeholder.svg?height=40&width=40',
    },
  ]

  return (
    <Box py={16} bg="gray.50">
      <Container maxW="7xl">
        <Heading size="lg" textAlign="center" mb={12}>
          What our clients say
        </Heading>
        <Flex px={4} py={10} flexWrap="nowrap" justify="space-between" overflowX="scroll" className="hidden-scroll" gap={4}>
          {testimonials.map((testimonial, index) => (
            <ScrollAnimation animateIn="slideIn" delay={`0.${index}s`}>
              <TestimonialCard key={index} {...testimonial} />
            </ScrollAnimation>
          ))}
        </Flex>
      </Container>
    </Box>
  )
}



