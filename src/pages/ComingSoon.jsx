import { Box, Text, Button, VStack, HStack, Spacer } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const targetDate = new Date("2025-06-01").getTime();

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     const now = new Date().getTime();
  //     const distance = targetDate - now;
  //     if (distance <= 0) {
  //       clearInterval(timer);
  //     } else {
  //       setTimeLeft({
  //         days: Math.floor(distance / (1000 * 60 * 60 * 24)),
  //         hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
  //         minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
  //         seconds: Math.floor((distance % (1000 * 60)) / 1000),
  //       });
  //     }
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

  return (
    <Box w="100%" h="80vh" bgGradient="linear(to-b, primary, blue.700)" borderRadius="xl" color="white" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={6} textAlign="center">
        <Text fontSize="4xl" fontWeight="bold">This Feature Coming Soon!</Text>
        <Text fontSize="lg" opacity={0.8}>We're working hard to bring you an amazing experience.</Text>
        
        {/*<HStack spacing={6} fontSize="2xl" fontWeight="bold">
          <Box>{timeLeft.days}d</Box>
          <Box>{timeLeft.hours}h</Box>
          <Box>{timeLeft.minutes}m</Box>
          <Box>{timeLeft.seconds}s</Box>
        </HStack>*/}
        
        {/*<Button colorScheme="blue" size="lg">Notify Me</Button>*/}
      </VStack>
    </Box>
  );
}
