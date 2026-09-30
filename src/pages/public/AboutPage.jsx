import { useContext } from 'react';
import { Box, Flex, Heading, Icon, Link, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { LuShieldCheck, LuWrench, LuKeyRound, LuWallet, LuSearchCheck, LuBadgeCheck } from 'react-icons/lu';
import { RiMailLine, RiPhoneLine, RiMapPin2Line, RiInstagramLine, RiTwitterXFill } from 'react-icons/ri';
import { GlobalStore } from '../../App';
import { MOTAA_CONTACT } from '../../components/nav';
import { InfoCard, Partnership, usePageTitle } from '../LandingPage';
import { PageHero, Section, SectionHeading } from './shared';

const problems = [
  {
    icon: LuShieldCheck,
    title: 'Trust in car deals',
    body: 'Buying a used car often means dealing with unknown sellers, unclear histories and paying before you are sure. Motaa only lists cars from dealerships that have been verified.',
  },
  {
    icon: LuWrench,
    title: 'Finding a reliable mechanic',
    body: 'Good mechanics are usually found by word of mouth. On Motaa you can find certified mechanics near you, see the services they offer and what they charge.',
  },
  {
    icon: LuKeyRound,
    title: 'Renting without the hassle',
    body: 'Whether it is for a trip, a business meeting or a special occasion, you can find rental cars from verified dealers, with or without a driver.',
  },
];

const howItWorks = [
  { icon: LuBadgeCheck, title: 'Verified dealers', body: 'Dealerships complete business verification (CAC and TIN) before they can sell or rent on Motaa.' },
  { icon: LuWrench, title: 'Certified mechanics', body: 'Mechanics set up a business profile and verify their business, so you know who is working on your car.' },
  { icon: LuSearchCheck, title: 'Inspect before you pay', body: 'Schedule an inspection of the car you want to buy, and choose to pay only after it has been inspected.' },
  { icon: LuWallet, title: 'Escrow-protected payments', body: 'Payments go through your Motaa wallet and are held securely until the transaction is completed.' },
];

const values = [
  { icon: '/assets/icons/TrustAndTransparencyIcon.svg', title: 'Trust & Transparency', body: 'Verified partners, clear prices and secure payments, so you always know who you are dealing with.' },
  { icon: '/assets/icons/EaseOfUseIcon.svg', title: 'Ease of Use', body: 'A simple app that gets you from searching to driving (or fixing) your car in a few taps.' },
  { icon: '/assets/icons/FullCartIcon.svg', title: 'All in One', body: 'Buy, sell, rent and service your car in one place, instead of juggling different apps and contacts.' },
];

export default function AboutPage(){
  usePageTitle('About Motaa — Redefining Mobility');
  const { isAuthenticated } = useContext(GlobalStore);
  const startLink = isAuthenticated ? '/home' : '/signup';

  const contact = [
    { icon: RiMapPin2Line, label: 'Address', value: MOTAA_CONTACT.address },
    { icon: RiMailLine, label: 'Email', value: MOTAA_CONTACT.email, href: `mailto:${MOTAA_CONTACT.email}` },
    { icon: RiPhoneLine, label: 'Phone', value: MOTAA_CONTACT.phoneDisplay, href: `tel:${MOTAA_CONTACT.phone}` },
    { icon: RiInstagramLine, label: 'Instagram', value: '@motaaltd', href: MOTAA_CONTACT.instagram, external: true },
    { icon: RiTwitterXFill, label: 'X (Twitter)', value: '@motaaltd', href: MOTAA_CONTACT.x, external: true },
  ];

  return (
    <div>
      <PageHero
        id="about"
        eyebrow="Redefining Mobility"
        title="One platform for all your car needs in Nigeria"
        lead="Motaa brings verified car dealers, certified mechanics and secure payments together, so buying, renting and maintaining a car is simpler and safer."
        image="/assets/images/car-sale.webp"
        imagePosition="70% center"
        actions={[
          { label: isAuthenticated ? 'Go to your dashboard' : 'Create a free account', to: startLink },
          { label: 'Explore features', to: '/features', variant: 'secondary' },
        ]}
      />

      <Section id="mission">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 14 }} alignItems="center">
          <Box>
            <Text color="primary" fontWeight="700" textTransform="uppercase" letterSpacing="wider" fontSize="sm" mb={2}>Our mission</Text>
            <Heading as="h2" id="mission-title" size="lg" color="secondary">Making every car deal in Nigeria one you can trust</Heading>
          </Box>
          <Stack spacing={4} color="gray.700" fontSize={{ base: 'md', md: 'lg' }}>
            <Text>
              Owning a car in Nigeria should not be stressful. Yet finding an honest seller, a dependable mechanic
              or a rental you can count on usually takes phone calls, referrals and a lot of risk.
            </Text>
            <Text>
              Motaa is building one marketplace for all of it: buy, sell or rent cars from verified dealerships,
              find certified mechanics nearby, and pay securely from your Motaa wallet.
            </Text>
          </Stack>
        </SimpleGrid>
      </Section>

      <Section id="problem" bg="gray.50">
        <SectionHeading id="problem-title" eyebrow="The problem" title="What we are fixing" intro="Three everyday car problems Motaa was built to solve." />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {problems.map((p) => (
            <InfoCard key={p.title} iconNode={<Icon as={p.icon} boxSize="26px" />} title={p.title} body={p.body} align="left" />
          ))}
        </SimpleGrid>
      </Section>

      <Section id="how">
        <SectionHeading id="how-title" eyebrow="How it works" title="Built on verification and secure payments" />
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
          {howItWorks.map((p) => (
            <InfoCard key={p.title} iconNode={<Icon as={p.icon} boxSize="26px" />} title={p.title} body={p.body} align="left" />
          ))}
        </SimpleGrid>
      </Section>

      <Section id="values" bg="gray.50">
        <SectionHeading id="values-title" eyebrow="Our values" title="What we stand for" />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {values.map((v) => <InfoCard key={v.title} icon={v.icon} title={v.title} body={v.body} />)}
        </SimpleGrid>
      </Section>

      <Section id="contact">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 8, md: 14 }}>
          <Box>
            <Text color="primary" fontWeight="700" textTransform="uppercase" letterSpacing="wider" fontSize="sm" mb={2}>Get in touch</Text>
            <Heading as="h2" id="contact-title" size="lg" color="secondary" mb={3}>Our headquarters</Heading>
            <Text color="gray.600" fontSize={{ base: 'md', md: 'lg' }}>
              Have a question, a partnership idea or need help with an order? Reach our team through any of these channels.
            </Text>
          </Box>
          <Stack as="address" fontStyle="normal" spacing={4}>
            {contact.map((c) => (
              <Flex key={c.label} gap={4} align="center" p={4} borderRadius="xl" borderWidth={1} borderColor="gray.200">
                <Flex flexShrink={0} w="44px" h="44px" borderRadius="12px" bg="blue.50" color="primary" align="center" justify="center">
                  <Icon as={c.icon} boxSize="22px" aria-hidden="true" />
                </Flex>
                <Box minW={0}>
                  <Text fontSize="sm" color="gray.500">{c.label}</Text>
                  {c.href ? (
                    <Link href={c.href} fontWeight="600" color="primary" wordBreak="break-word"
                      {...(c.external ? { isExternal: true, rel: 'noopener noreferrer' } : {})}>
                      {c.value}
                    </Link>
                  ) : (
                    <Text fontWeight="600">{c.value}</Text>
                  )}
                </Box>
              </Flex>
            ))}
          </Stack>
        </SimpleGrid>
      </Section>

      <Partnership
        title={<>Ready to get moving<Text as="span" color="tertiary">?</Text></>}
        body="Create your free Motaa account to buy, rent or service your car — or list your business and reach more customers."
        primary={{ label: isAuthenticated ? 'Go to your dashboard' : 'Sign up for free', to: startLink }}
        secondary={{ label: 'For businesses', to: '/business' }}
      />
    </div>
  )
}
