import {useRef, useContext} from 'react';
import { Box, Button, Flex, Icon, Text, useMediaQuery } from "@chakra-ui/react";
import Layout from "./Layout";
import {motion, } from 'framer-motion';
import {RxArrowRight} from 'react-icons/rx';
import '../assets/Home.css';

const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 2.5, delay: 1.5 }, // Add 1.5 seconds delay
    },
    scaleOnHover: {
      whileHover: { scale: 1.05 },
      transition: { duration: 0.2 },
    },
    fadeInLeft: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.5, delay: 1.5 }, // Add 1.5 seconds delay
    },
    fadeInRight: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 1.5 }, // Adjust duration here
    },
    fadeInPop: {
      initial: { opacity: 0, scale: 0.8 }, // Start with 0 opacity and scale down
      animate: { opacity: 1, scale: 1 }, // End with full opacity and normal scale
      transition: { duration: 1.6, delay: 0.5, ease: "easeOut" }, // Smooth transition
    },
  };
  
  const arrowDownAnimation = {
    initial: { y: 0 },
    animate: {
      y: [0, 10, 0], // Moves down and back up
      transition: {
        duration: 1, // Duration of one complete cycle
        ease: "easeInOut", // Easing function for a smooth animation
        repeat: Infinity, // Repeat indefinitely
        repeatType: "loop", // Loop the animation
      },
    },
  };


export const HomePage = ({ props }) => {
    const heroRef = useRef();
    const [isMobile] = useMediaQuery('(max-width: 760px)');


    return(
        <div>
            <motion.section id='welcome' ref={heroRef}>
                <Box className='header' position={'relative'}
                    as={motion.div}
                    // initial={{ opacity: 0, }}
                    animate={{opacity: 1,}}
                    transition={'1.5s forwards'}
                    style={{backgroundImage: isMobile ? 'url("/assets/images/hero-image-mobile.png")' : 'url("/assets/images/hero-image.png")'}}
                >
                    
                    {/* Hero */}
                    <Box position={'relative'} className='hero' width={{ base: '100%', md: '70%', lg: '60%'}}>
                        <Text as={motion.p}
                            lineHeight={1} mb={3}
                            className='hero-title pt-sans-regular'
                        > Welcome to <br /> Nigeria's Largest <br /> Car Marketplace<Text className='box-dot' as={motion.span} color={'primary'}>.</Text> </Text>
                        <Text as={motion.p}
                            className='text animated'
                            // animate={heroView ? animations.fadeInUp.animate : animations.fadeInUp.initial}
                            initial={animations.fadeInUp.initial}
                        > Buy, sell, rent and find trusted mechanics all with ease and confidence of verified dealers. </Text>

                        <Flex mt={'40px'} gap={4} flexWrap={'wrap'} justifyContent={'flex-start'}>
                            <Button
                            as={motion.a} href='/#join-waitlist'
                            colorScheme='blue'
                            bg={'primary'}
                            className='animated'
                            // animate={heroView ? animations.fadeInUp.animate : animations.fadeInUp.initial}
                            initial={animations.fadeInUp.initial}
                            > Get early access </Button>
                            <Button
                            as={motion.a} href='/#join-waitlist'
                            colorScheme='transparent'
                            className='btn-outline animated'
                            gap={2} alignItems={'center'}
                            // animate={heroView ? animations.fadeInUp.animate : animations.fadeInUp.initial}
                            initial={animations.fadeInUp.initial}
                            > See how it works <RxArrowRight className='icon' /> </Button>
                        </Flex>
                    </Box>
                </Box>
            </motion.section>
        </div>
    )
}

export default HomePage;
