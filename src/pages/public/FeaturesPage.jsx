import { useContext } from 'react';
import { Box, Button, Container, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { LuWallet, LuMessageCircle, LuBell, LuArrowDownToLine, LuArrowUpFromLine, LuLock } from 'react-icons/lu';
import { GlobalStore } from '../../App';
import { InfoCard, Partnership, usePageTitle } from '../LandingPage';
import { FeatureSplit, PageHero, Section, SectionHeading } from './shared';

const jumpLinks = [
  { label: 'Buy', href: '#buy' },
  { label: 'Sell', href: '#sell' },
  { label: 'Rent', href: '#rent' },
  { label: 'Mechanics', href: '#mechanics' },
  { label: 'Wallet', href: '#wallet' },
  { label: 'Chat & alerts', href: '#stay-connected' },
];

export default function FeaturesPage(){
  usePageTitle('Features — Buy, sell, rent and service your car | Motaa');
  const { isAuthenticated } = useContext(GlobalStore);
  // logged-in customers go straight to the feature; visitors create an account first
  const to = (path) => (isAuthenticated ? path : '/signup');

  const splits = [
    {
      id: 'buy',
      label: 'Buy',
      title: 'Buy a car you can trust',
      body: 'Every car for sale on Motaa is listed by a verified dealership, so you know exactly who you are buying from.',
      points: [
        'Browse verified listings with photos, specs and prices in naira',
        'Schedule an inspection before you commit',
        'Choose to pay after the inspection',
        'Sign your purchase documents digitally in the app',
      ],
      image: '/assets/images/features-image-1.webp',
      imageAlt: 'A customer smiling beside the car she just bought',
      overlay: '/assets/images/buy-widget.svg',
      cta: { label: 'Find your car', to: to('/buy') },
    },
    {
      id: 'sell',
      label: 'Sell',
      title: 'Sell through verified dealers',
      body: 'Dealerships list their inventory on Motaa and manage orders from one dashboard, reaching buyers across Nigeria.',
      points: [
        'List cars for sale or for rent from your dealer dashboard',
        'Receive and manage orders and inspection requests',
        'Get paid securely into your Motaa wallet',
      ],
      image: '/assets/images/features-image-2.webp',
      imageAlt: 'A dealer handing car keys to a buyer',
      overlay: '/assets/images/sell-widget.svg',
      cta: { label: 'Motaa for businesses', to: '/business' },
    },
    {
      id: 'rent',
      label: 'Rent',
      title: 'Daily rentals, with or without a driver',
      body: 'Need a car for a trip, a meeting or a special occasion? Rent from verified dealers for as many days as you need.',
      points: [
        'Pick your dates and see the price before you book',
        'Choose dealers that offer a driver when you would rather not drive',
        'Book and pay securely in the app',
      ],
      image: '/assets/images/features-image-3.webp',
      imageAlt: 'A passenger relaxing in the back seat of a rented car',
      overlay: '/assets/images/rent-not.svg',
      cta: { label: 'Find rentals', to: to('/rent') },
    },
    {
      id: 'mechanics',
      label: 'Find a mechanic',
      title: 'Certified mechanics near you',
      body: 'Find mechanics close to you, see what they offer and what they charge, then book them without the back and forth.',
      points: [
        'Discover nearby mechanics on the map',
        'Compare service menus with flat or hourly rates',
        'Book a service and chat with the mechanic in the app',
      ],
      image: '/assets/images/mechanic-image.webp',
      imageAlt: 'A mechanic checking a car wheel in a workshop',
      overlay: '/assets/images/mech-widget.svg',
      cta: { label: 'Find mechanics', to: to('/mechanics') },
    },
  ];

  const wallet = [
    { icon: LuArrowDownToLine, title: 'Deposit', body: 'Fund your wallet securely through our payment partners, Paystack and Flutterwave.' },
    { icon: LuLock, title: 'Escrow protection', body: 'Payments for orders and bookings are held securely until the transaction is completed.' },
    { icon: LuArrowUpFromLine, title: 'Withdraw', body: 'Move your balance to your Nigerian bank account whenever you need it.' },
  ];

  const connected = [
    { icon: LuMessageCircle, title: 'In-app chat', body: 'Message dealers and mechanics directly to ask questions, agree details and follow up.' },
    { icon: LuBell, title: 'Notifications', body: 'Get notified about your orders, bookings, inspections and payments as soon as something changes.' },
    { icon: LuWallet, title: 'One account for everything', body: 'Your purchases, rentals, bookings and wallet live in one Motaa account.' },
  ];

  return (
    <div>
      <PageHero
        id="features"
        eyebrow="Features"
        title="Everything your car needs, in one app"
        lead="Buy, sell, rent, find a mechanic and pay securely — all from verified partners on Motaa."
        image="/assets/images/workshop.webp"
        imagePosition="60% center"
        actions={[
          { label: isAuthenticated ? 'Start browsing' : 'Create a free account', to: isAuthenticated ? '/home' : '/signup' },
          { label: 'About Motaa', to: '/about', variant: 'secondary' },
        ]}
      />

      <Box as="nav" aria-label="Features on this page" position="sticky" top={{ base: '64px', md: '82px' }} zIndex={10} bg="whiteAlpha.900" backdropFilter="blur(10px)" borderBottomWidth={1}>
        <Container maxW="container.xl" px={{ base: 2, md: 8 }}>
          <Flex as="ul" listStyleType="none" gap={2} py={2} overflowX="auto" className="hidden-scroll">
            {jumpLinks.map((l) => (
              <Box as="li" key={l.href} flexShrink={0}>
                <Button as="a" href={l.href} size="sm" variant="ghost" color="secondary">{l.label}</Button>
              </Box>
            ))}
          </Flex>
        </Container>
      </Box>

      {splits.map((s, i) => <FeatureSplit key={s.id} {...s} reverse={i % 2 === 1} />)}

      <Section id="wallet" bg="gray.50" scrollMarginTop="90px">
        <SectionHeading id="wallet-title" eyebrow="Motaa Wallet" title="Pay and get paid securely"
          intro="Your Motaa wallet is how you pay for cars, rentals and repairs — and how businesses receive payment." />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {wallet.map((w) => <InfoCard key={w.title} iconNode={<Icon as={w.icon} boxSize="26px" />} title={w.title} body={w.body} />)}
        </SimpleGrid>
      </Section>

      <Section id="stay-connected" scrollMarginTop="90px">
        <SectionHeading id="stay-connected-title" eyebrow="Stay in the loop" title="Chat and notifications" />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {connected.map((c) => <InfoCard key={c.title} iconNode={<Icon as={c.icon} boxSize="26px" />} title={c.title} body={c.body} />)}
        </SimpleGrid>
      </Section>

      <Partnership
        title={<>Ready to try Motaa<Text as="span" color="tertiary">?</Text></>}
        body="Create a free account in minutes and get everything your car needs in one place."
        primary={{ label: isAuthenticated ? 'Start browsing' : 'Sign up for free', to: isAuthenticated ? '/home' : '/signup' }}
        secondary={{ label: 'For businesses', to: '/business' }}
      />
    </div>
  )
}
