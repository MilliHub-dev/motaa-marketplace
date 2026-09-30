// Building blocks shared by the public marketing pages (/about, /features, /business).
import { Box, Button, Container, Flex, Heading, HStack, Image, List, ListIcon, ListItem, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { Link as RLink } from 'react-router-dom';
import { RxArrowRight } from 'react-icons/rx';
import { FaCircleCheck } from 'react-icons/fa6';

/** Page header over a darkened photo. `actions`: [{label, to, variant: 'primary'|'secondary'}] */
export function PageHero({ id = 'top', eyebrow, title, lead, image, imagePosition = 'center', actions = [] }){
  return (
    <Box
      as="section"
      id={id}
      aria-labelledby={`${id}-title`}
      color="white"
      bgColor="secondary"
      backgroundImage={`linear-gradient(90deg, rgba(28, 61, 90, 0.92) 0%, rgba(28, 61, 90, 0.72) 55%, rgba(0, 0, 0, 0.25) 100%), url("${image}")`}
      backgroundSize="cover"
      backgroundPosition={imagePosition}
    >
      <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={{ base: 16, md: 28 }}>
        <Box maxW="640px">
          {eyebrow && (
            <Text as="p" display="inline-block" bg="tertiary" color="secondary" fontWeight="700" fontSize="sm" px={3} py={1} borderRadius="full" mb={4}>
              {eyebrow}
            </Text>
          )}
          <Heading as="h1" id={`${id}-title`} fontSize={{ base: '34px', md: '52px' }} lineHeight={1.1} mb={5}>{title}</Heading>
          {lead && <Text fontSize={{ base: 'md', md: 'xl' }} opacity={0.92} mb={8}>{lead}</Text>}
          {actions.length > 0 && <CtaButtons actions={actions} dark />}
        </Box>
      </Container>
    </Box>
  )
}

export function CtaButtons({ actions, dark, justify }){
  return (
    <Flex gap={3} flexWrap="wrap" justify={justify}>
      {actions.map((a) => {
        // in-page anchors are plain links so the browser scrolls to them
        const link = a.to.startsWith('#') ? { as: 'a', href: a.to } : { as: RLink, to: a.to };
        return a.variant === 'secondary' ? (
        <Button key={a.to} {...link} size="lg" bg={dark ? 'white' : 'transparent'} color="primary"
         variant={dark ? 'solid' : 'outline'} borderColor="primary" _hover={{ bg: dark ? 'gray.100' : 'blue.50' }}>
          {a.label}
        </Button>
      ) : (
        <Button key={a.to} {...link} size="lg" bg="tertiary" color="primary" colorScheme="yellow" rightIcon={<RxArrowRight />}>
          {a.label}
        </Button>
      )})}
    </Flex>
  )
}

/** Centered section title + optional intro. */
export function SectionHeading({ id, eyebrow, title, intro, align = 'center' }){
  return (
    <Box textAlign={align} maxW="720px" mx={align === 'center' ? 'auto' : 0} mb={{ base: 8, md: 12 }}>
      {eyebrow && <Text color="primary" fontWeight="700" textTransform="uppercase" letterSpacing="wider" fontSize="sm" mb={2}>{eyebrow}</Text>}
      <Heading as="h2" id={id} size="lg" color="secondary" mb={intro ? 3 : 0}>{title}</Heading>
      {intro && <Text color="gray.600" fontSize={{ base: 'md', md: 'lg' }}>{intro}</Text>}
    </Box>
  )
}

/** Wrapper for a page section with its landmark label wired to the heading id. */
export function Section({ id, bg, children, ...props }){
  return (
    <Box as="section" id={id} aria-labelledby={`${id}-title`} bg={bg} py={{ base: 12, md: 20 }} {...props}>
      <Container maxW="container.xl" px={{ base: 4, md: 8 }}>{children}</Container>
    </Box>
  )
}

/** Photo on one side, heading + copy + checklist on the other. */
export function FeatureSplit({ id, label, title, body, points = [], image, imageAlt, overlay, reverse, cta }){
  return (
    <Box as="section" id={id} aria-labelledby={`${id}-title`} py={{ base: 10, md: 16 }} scrollMarginTop="90px">
      <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 8, md: 14 }} alignItems="center">
          <Box position="relative" order={{ base: 0, md: reverse ? 1 : 0 }}>
            <Image src={image} alt={imageAlt} loading="lazy" w="100%" h={{ base: '240px', sm: '320px', md: '420px' }} objectFit="cover" borderRadius="2xl" boxShadow="xl" />
            {overlay && (
              <Image src={overlay} alt="" loading="lazy" position="absolute" bottom={{ base: 3, md: 6 }} left={{ base: 3, md: 6 }} w={{ base: '170px', md: '220px' }} filter="drop-shadow(0 8px 16px rgba(0,0,0,.25))" />
            )}
          </Box>
          <Stack spacing={4}>
            {label && <Text as="p" bg="primary" color="white" fontWeight="600" fontSize="sm" px={3} py={1} borderRadius="md" w="max-content">{label}</Text>}
            <Heading as="h2" id={`${id}-title`} size="lg" color="secondary">{title}</Heading>
            <Text color="gray.600" fontSize={{ base: 'md', md: 'lg' }}>{body}</Text>
            {points.length > 0 && (
              <List spacing={3}>
                {points.map((p) => (
                  <ListItem key={p} display="flex" alignItems="flex-start">
                    <ListIcon as={FaCircleCheck} color="primary" mt="5px" />
                    <Text as="span">{p}</Text>
                  </ListItem>
                ))}
              </List>
            )}
            {cta && (
              <HStack pt={2}>
                <Button as={RLink} to={cta.to} variant="outline" borderColor="primary" color="primary" rightIcon={<RxArrowRight />}>{cta.label}</Button>
              </HStack>
            )}
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  )
}
