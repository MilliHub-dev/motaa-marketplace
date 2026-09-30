import { useContext } from 'react';
import { Box, Heading, Icon, List, ListIcon, ListItem, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { LuLayoutDashboard, LuChartLine, LuPackage, LuBadgeCheck, LuUsers, LuLandmark } from 'react-icons/lu';
import { FaCircleCheck } from 'react-icons/fa6';
import { GlobalStore } from '../../App';
import { FaqList, InfoCard, Partnership, Steps, usePageTitle } from '../LandingPage';
import { CtaButtons, FeatureSplit, PageHero, Section, SectionHeading } from './shared';

const benefits = [
  { icon: LuLayoutDashboard, title: 'A dashboard for your business', body: 'See orders, bookings, revenue and your wallet balance at a glance.' },
  { icon: LuPackage, title: 'Inventory & services', body: 'Dealers add and edit cars for sale or rent; mechanics publish their service menu with flat or hourly rates.' },
  { icon: LuChartLine, title: 'Analytics', body: 'Understand how your listings and services perform so you can make better decisions.' },
  { icon: LuBadgeCheck, title: 'Verified badge', body: 'Complete business verification to show customers they are dealing with a registered business.' },
  { icon: LuUsers, title: 'Reach more customers', body: 'Get discovered by people across Nigeria who are ready to buy, rent or book a repair.' },
  { icon: LuLandmark, title: 'Payouts to your bank', body: 'Customer payments land in your Motaa wallet, and you can withdraw to your bank account.' },
];

const onboarding = [
  { title: 'Sign up', body: 'Create a business account and choose whether you are a dealership or a mechanic.' },
  { title: 'Set up your profile', body: 'Add your business name, location, logo and the services you offer.' },
  { title: 'Get verified', body: 'Verify your business with your CAC registration and TIN — checks are run securely through Dojah.' },
  { title: 'Start selling', body: 'List your cars or publish your services and start receiving orders and bookings.' },
];

const businessFaqs = [
  {
    id: 'b1',
    question: 'Who can join Motaa as a business?',
    answer: 'Car dealerships (selling and/or renting cars) and mechanics or auto workshops. Choose your business type when you create a business account.',
  },
  {
    id: 'b2',
    question: 'What do I need to verify my business?',
    answer: 'Your CAC registration number and your Tax Identification Number (TIN). Verification is carried out through our identity partner, Dojah, from your business dashboard.',
  },
  {
    id: 'b3',
    question: 'Can I use Motaa before my business is verified?',
    answer: 'You can create your account and set up your business profile straight away. Your dashboard will remind you to complete verification so customers can see you are a verified business.',
  },
  {
    id: 'b4',
    question: 'How do I get paid?',
    answer: 'Customers pay through the Motaa wallet. Payments are held securely until the order or booking is completed and then credited to your business wallet, from where you can withdraw to your bank account.',
  },
  {
    id: 'b5',
    question: 'Can mechanics set their own prices?',
    answer: 'Yes. Each service you offer has its own price, charged either as a flat rate or an hourly rate.',
  },
  {
    id: 'b6',
    question: 'Can dealerships offer rentals with a driver?',
    answer: 'Yes. Dealerships can list cars for sale or for rent, and indicate in their business settings that they offer driver services.',
  },
];

export default function BusinessPage(){
  usePageTitle('Motaa for Businesses — Dealerships and mechanics');
  const { isAuthenticated, authUser } = useContext(GlobalStore);
  const isBusiness = ['dealer', 'mechanic'].includes(authUser?.user_type);
  // logged-in customers can't create a second account from here, so point them to support
  const primary = isBusiness
    ? { label: 'Go to your dashboard', to: '/dashboard' }
    : isAuthenticated
      ? { label: 'Talk to our team', to: '/support' }
      : { label: 'Create a business account', to: '/signup?type=business' };

  return (
    <div>
      <PageHero
        id="business"
        eyebrow="Motaa for Businesses"
        title="Grow your dealership or workshop with Motaa"
        lead="List your cars or services, manage orders and bookings from one dashboard, and get paid securely."
        image="/assets/images/black-businessman.webp"
        imagePosition="60% center"
        actions={[primary, { label: 'How it works', to: '#onboarding', variant: 'secondary' }]}
      />

      <Section id="benefits">
        <SectionHeading id="benefits-title" eyebrow="Why partner with us" title="Tools to run and grow your business"
          intro="Everything you need to sell cars, rent them out or offer repair services online." />
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
          {benefits.map((b) => (
            <InfoCard key={b.title} iconNode={<Icon as={b.icon} boxSize="26px" />} title={b.title} body={b.body} align="left" />
          ))}
        </SimpleGrid>
      </Section>

      <FeatureSplit
        id="dealers"
        label="For dealerships"
        title="Sell and rent more cars"
        body="Put your inventory in front of buyers and renters who are looking for a trusted dealer."
        points={[
          'Add cars for sale or rent with photos, specs and prices',
          'Manage orders and inspection requests in one place',
          'Offer rentals with or without a driver',
          'Track sales and revenue on your analytics dashboard',
        ]}
        image="/assets/images/features-image-2.webp"
        imageAlt="A dealer handing car keys to a customer"
        overlay="/assets/images/sell-widget.svg"
      />

      <FeatureSplit
        id="mechanics"
        label="For mechanics"
        title="Fill your workshop with bookings"
        body="Let car owners nearby find you, see your services and book you directly."
        points={[
          'Publish a service menu with flat or hourly rates',
          'Accept and manage bookings from your dashboard',
          'Chat with customers before and after the job',
        ]}
        image="/assets/images/workshop.webp"
        imageAlt="Two mechanics reviewing a job in a workshop"
        overlay="/assets/images/mech-widget.svg"
        reverse
      />

      <Section id="onboarding" bg="gray.50" scrollMarginTop="90px">
        <SectionHeading id="onboarding-title" eyebrow="Getting started" title="How onboarding works" intro="Go from sign-up to your first listing in four steps." />
        <Steps steps={onboarding} />
        <Box mt={10}>
          <CtaButtons actions={[primary]} justify="center" />
        </Box>
      </Section>

      <Section id="verification">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 14 }} alignItems="center">
          <Stack spacing={4}>
            <Text color="primary" fontWeight="700" textTransform="uppercase" letterSpacing="wider" fontSize="sm">Business verification</Text>
            <Heading as="h2" id="verification-title" size="lg" color="secondary">Earn customers' trust from day one</Heading>
            <Text color="gray.600" fontSize={{ base: 'md', md: 'lg' }}>
              Customers on Motaa look for verified businesses. Verification confirms your business registration and tax details,
              so your listings and services carry the confidence customers expect.
            </Text>
          </Stack>
          <Box bg="blue.50" borderRadius="2xl" p={{ base: 6, md: 8 }}>
            <List spacing={4}>
              {[
                'CAC business registration check',
                'Tax Identification Number (TIN) check',
                'Handled securely through our verification partner, Dojah',
              ].map((text) => (
                <ListItem key={text} display="flex" alignItems="center" gap={3} fontWeight="600" color="secondary">
                  <ListIcon as={FaCircleCheck} color="primary" boxSize="20px" m={0} />
                  {text}
                </ListItem>
              ))}
            </List>
          </Box>
        </SimpleGrid>
      </Section>

      <Section id="business-faqs" bg="gray.50">
        <SectionHeading id="business-faqs-title" eyebrow="FAQs" title="Questions from businesses" />
        <Box maxW="720px" mx="auto">
          <FaqList items={businessFaqs} />
        </Box>
      </Section>

      <Partnership
        title={<>Ready to grow with Motaa<Text as="span" color="tertiary">?</Text></>}
        body="Join the dealerships and mechanics using Motaa to reach customers and get paid securely."
        primary={primary}
        secondary={{ label: 'Contact support', to: '/support' }}
      />
    </div>
  )
}
