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
    Stack,
    Input,
    Avatar,
} from "@chakra-ui/react";
import { Globe, Shield, Clock, Star, } from 'lucide-react'
import { Search, Car, DollarSign, Key, PenToolIcon as Tools } from 'lucide-react'
import Layout from "./Layout";
import {motion, } from 'framer-motion';
import {FaCirclePlus, FaCircleMinus} from 'react-icons/fa6';
// import {RxArrowRight} from 'react-icons/rx';
import {RxArrowRight} from 'react-icons/rx';
import faqs from '../data/faqs.json';
import '../assets/Home.css';


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
                  backgroundImage={`linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), ${isMobile ? 'url("/assets/images/hero-image-mobile.png")' : 'url("/assets/images/hero-image.png")'}`}

                >
                    {/* Hero */}
                    <Box position={'relative'} className='hero' width={{ base: '100%', md: '70%', lg: '60%'}}>
                      <Text as={motion.p} lineHeight={1} mb={3} className='title pt-sans-regular'>
                       One Platform for All your Car Needs <span className="dot">.</span>
                      </Text>
                      <Text className='text'> Buy, sell, rent cars or find trusted mechanics all in one platform. </Text>          
                    </Box>

                    <SimpleGrid columns={4} spacing={4} width="full" maxW="4xl" justifyConten="center">
                        {[
                          { icon: Car, label: 'Buy a Car' },
                          { icon: DollarSign, label: 'Sell your Car' },
                          { icon: Key, label: 'Rent a Car' },
                          { icon: Tools, label: 'Find Mechanic' },
                        ].map((item) => (
                          <Box
                            key={item.label}
                            size="lg"
                            variant="solid"
                            bg="whiteAlpha.200"
                            _hover={{ bg: 'whiteAlpha.300' }}
                            height="auto"
                            py={4}
                          >
                            <VStack spacing={2}>
                              <item.icon size={24} />
                              <Text fontSize="sm">{item.label}</Text>
                            </VStack>
                          </Box>
                        ))}
                    </SimpleGrid>
                </Box>
            </motion.section>

            <Box py={20} px={10}>
              <SimpleGrid columns={{base: 1, md: 2}} gap={4}>
                <Heading> Explore our network of <Text color="primary"> 5000+ verified dealers and mechanics.</Text> </Heading>
                <Text> Motaa connects you to verified dealers and certified mechanics across Nigeria. We believe in excellence and provide you with only partners you can trust.</Text>
              </SimpleGrid>

              <SimpleGrid columns={{base: 1, md: 2}} gap={6}>
                {
                  featureList.map((feature, idx) =>
                  <Box key={idx} className='feature-card' sx={{
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
                        position: 'relative',
                        top: 'calc(100% - 140px)',
                        color: '#fff',
                        fontSize: '15px',
                      }}
                    >
                      <Text px={3} py={1} borderRadius={'5px'} color={'#fff'} bg={'primary'} w={'max-content'}> {feature.label} </Text>
                      <Text my={2}> {feature.content} </Text>

                      <Button variant="outine" borderColor="white" color="white" borderWidth={2} rightIcon={<RxArrowRight />}>{feature.cta.label}</Button>
                    </Box>
                  </Box>
                )
              }
              </SimpleGrid>
            </Box>

            <Features />

            <Testimonials />

            <Partnership />

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
                            <Text flex={1} className='smalltext' textAlign={'left'}> {faq?.question} </Text>
                            <Icon className='icon' fontSize={'20px'}>{isExpanded ? <FaCircleMinus /> : <FaCirclePlus /> }</Icon>
                          </AccordionButton>

                          <AccordionPanel px={3} py={3}>
                            <Text className='smalltext'>{faq?.answer}</Text>
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
    <Box py={16} bg="blue.600" color="white">
      <Container maxW="7xl">
        <VStack spacing={6} textAlign="center">
          <Heading size="lg">
            Ready to drive your business forward<Text color="tertiary">?</Text>
            <br />
            partner with us today.
          </Heading>
          <Text fontSize="lg" maxW="2xl">
            Whether you're a dealer, mechanic, or anything in between, Motaa
            gives you the tools and help you need to accelerate your business growth.
          </Text>
          <HStack spacing={4}>
            <Button colorScheme="yellow" bg="tertiary" color="primary" rightIcon={<RxArrowRight />} size="md" width="200px">
              Get started
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <VStack
      p={8}
      bg="white"
      borderRadius="20px"
      boxShadow="2xl"
      spacing={4}
      maxW={{base: '70%', lg: '250px'}}
      align="center"
      mx={{base: 'auto', md: '0px'}}
      textAlign="center"
    >
      <Icon as={icon} boxSize={12} color="blue.500" />
      <Text fontSize="lg" fontWeight="bold">
        {title}
      </Text>
      <Text color="gray.600">{description}</Text>
    </VStack>
  )
}

function Features() {
  const features = [
    {
      icon: Globe,
      title: 'All-in-One Marketplace',
      description:
        'Access everything you need for your car in one place, from buying to maintenance.',
    },
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description:
        'Every dealer and mechanic is verified, ensuring safe and reliable service.',
    },
    {
      icon: Clock,
      title: 'Ease of Use',
      description:
        'Simple and intuitive platform designed to save you time and effort.',
    },
  ]

  return (
    <Box py={16} bg="gray.50">
      <Container maxW="7xl">
        <Heading size="lg" textAlign="center" mb={12}>
          Why Choose Us?
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} justifyContent="center">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </SimpleGrid>
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
        <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} spacing={8}>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}



