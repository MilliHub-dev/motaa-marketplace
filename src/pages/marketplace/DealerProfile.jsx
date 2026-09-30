import {
  Box, Container, HStack, VStack, Text, Button, Avatar, Badge, Image, Heading, Flex, IconButton,
  Menu, MenuButton, MenuList, MenuItem, Divider, Link as ChakraLink, SimpleGrid, Tabs, TabList, Tab,
} from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GlobalStore } from '../../App';
import { BackButton } from '../../components/nav';
import { ListingItemCard, RatingCard, ReviewCard } from '../../components';
import { ChatPopup } from '../../components/chat';
import { AsyncState, EmptyState } from '../../components/states';
import { ListingDetailSkeleton, ListingSkeleton } from '../../components/loaders';
import { useApiQuery } from '../../hooks/useApi';
import { asList } from '../../utils';
import { MessageCircle, MapPin, Star, MoreVertical, Share2, Flag, Phone, Mail, Car } from 'lucide-react';

const SUPPORT_EMAIL = 'support@motaa.net';

function Stats({ number, label }) {
  return (
    <VStack spacing={0} align="flex-start">
      <Text fontWeight="bold" fontSize="lg">{number}</Text>
      <Text color="gray.600" fontSize="sm">{label}</Text>
    </VStack>
  )
}

// The dealer's live cars, for sale or for rent (/listings/{buy,rentals}/?dealer=<uuid>).
function DealerListings({ dealerUuid, offersSales, offersRentals }) {
  const kinds = [
    offersSales !== false && { key: 'buy', label: 'For sale' },
    offersRentals && { key: 'rentals', label: 'For rent' },
  ].filter(Boolean);
  const [kind, setKind] = useState(kinds[0]?.key || 'buy');
  const listings = useApiQuery(
    (api, signal) => api.get(`/listings/${kind}/?dealer=${encodeURIComponent(dealerUuid)}`, { signal }),
    [kind, dealerUuid],
    { select: (body) => asList(body?.data?.results) }
  );

  return (
    <Box as="section" aria-labelledby="dealer-cars" mb={8}>
      <Flex align="center" justify="space-between" gap={3} flexWrap="wrap" mb={3}>
        <Heading as="h2" id="dealer-cars" size="md">Cars from this dealer</Heading>
        {kinds.length > 1 && (
          <Tabs variant="soft-rounded" size="sm" index={kinds.findIndex((k) => k.key === kind)} onChange={(i) => setKind(kinds[i].key)}>
            <TabList>{kinds.map((k) => <Tab key={k.key}>{k.label}</Tab>)}</TabList>
          </Tabs>
        )}
      </Flex>
      <AsyncState
        query={listings}
        skeleton={<ListingSkeleton />}
        isEmpty={(items) => items.length === 0}
        empty={<EmptyState icon={Car} title="No cars listed right now" description="Check back soon, or message the dealer to ask what's coming in." minH="160px" />}
      >
        {(items) => (
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={6}>
            {items.map((listing) => <ListingItemCard key={listing?.uuid || listing?.id} listing={listing} />)}
          </SimpleGrid>
        )}
      </AsyncState>
    </Box>
  );
}

export default function DealerProfile() {
  const { notify } = useContext(GlobalStore);
  const { dealerId } = useParams();
  const [chatOpen, setChatOpen] = useState(false);
  const dealer = useApiQuery(
    (api, signal) => api.get(`/listings/dealer/${dealerId}/`, { signal }),
    [dealerId],
    { select: (body) => body?.data }
  );

  async function share(name) {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on Motaa`, url });
      } else {
        await navigator.clipboard.writeText(url);
        notify({ title: 'Link copied', body: 'The profile link is on your clipboard.' });
      }
    } catch (error) {
      if (error?.name !== 'AbortError') notify({ title: "Couldn't share", body: url, color: 'red' });
    }
  }

  return (
    <AsyncState query={dealer} skeleton={<ListingDetailSkeleton />} errorTitle={dealer.error?.isNotFound ? "We couldn't find this dealer" : undefined}>
      {(data) => {
        const name = data?.business_name || data?.user?.name || 'Dealer';
        const reviews = asList(data?.reviews);
        const listings = asList(data?.listings);
        const services = asList(data?.services);
        const rating = Number(data?.avg_rating);
        const reportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Report dealer: ${name}`)}&body=${encodeURIComponent(`Dealer profile: ${window.location.href}\n\nWhat happened:\n`)}`;

        return (
          <Box minH="100vh" overflowX="hidden">
            <Box position="relative" h={{ base: '180px', md: '300px' }}>
              <Image src="/assets/images/features-image-1.png" alt="" w="full" h="full" objectFit="cover" />
              <BackButton position={'absolute'} left={{ base: 4, md: '30px' }} top={4} variant="solid" color="white" />
            </Box>

            <Container maxW={'1100px'} pb={12}>
              <Flex direction={{ base: 'column', lg: 'row' }} gap={8} alignItems="flex-start">
                <Box flex={1} minW={0} w="100%">
                  <Flex gap={4} mb={6} direction={{ base: 'column', sm: 'row' }} alignItems={{ base: 'flex-start', sm: 'flex-end' }}>
                    <Box mt={'-40px'} bg="white" borderRadius={'50%'} zIndex={'1'} p={2}>
                      <Avatar size="xl" name={name} src={data?.logo || undefined} />
                    </Box>

                    <Box flex={1} minW={0}>
                      <Heading as="h1" fontSize="xl" py={1}>{name}</Heading>
                      {data?.headline && <Text color="gray.700">{data.headline}</Text>}
                      <HStack spacing={3} mt={1} flexWrap="wrap">
                        <Badge variant="subtle" colorScheme="blue">Car Dealership</Badge>
                        {data?.location && (
                          <HStack spacing={1} color="gray.600">
                            <MapPin size={16} aria-hidden="true" />
                            <Text>{data.location}</Text>
                          </HStack>
                        )}
                      </HStack>
                    </Box>

                    <HStack>
                      <Button leftIcon={<MessageCircle size={20} />} variant="outline" borderRadius="30px" onClick={() => setChatOpen(true)} isDisabled={!data?.uuid}>
                        Message
                      </Button>
                      <Menu placement="bottom-end">
                        <MenuButton as={IconButton} icon={<MoreVertical size={20} />} variant="ghost" aria-label="More actions" />
                        <MenuList>
                          <MenuItem icon={<Share2 size={16} />} onClick={() => share(name)}>Share profile</MenuItem>
                          <MenuItem as="a" href={reportHref} icon={<Flag size={16} />}>Report dealer</MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Flex>

                  <HStack spacing={8} mb={6}>
                    <Stats number={listings.length} label={listings.length === 1 ? 'Listing' : 'Listings'} />
                    <Stats number={reviews.length} label={reviews.length === 1 ? 'Review' : 'Reviews'} />
                    {Number.isFinite(rating) && rating > 0 && (
                      <Stats number={<HStack as="span" spacing={1}><span>{rating.toFixed(1)}</span><Star size={16} fill="orange" color="orange" aria-hidden="true" /></HStack>} label="Rating" />
                    )}
                  </HStack>

                  <Box mb={6}>
                    <Heading as="h2" size="md" my={2}>About</Heading>
                    <Text color="gray.600" whiteSpace="pre-line">{data?.about || 'This dealer has not added a description yet.'}</Text>
                  </Box>

                  {services.length > 0 && (
                    <Box mb={6}>
                      <Heading as="h2" size="md" my={2}>Services</Heading>
                      <Flex gap={2} flexWrap="wrap">
                        {services.map((service) => (
                          <Badge key={service} px={4} py={2} bg="gray.200" color="gray.800" rounded="full" textTransform="capitalize" fontSize="md">{service}</Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}

                  <Divider mb={6} />

                  {data?.uuid && (
                    <DealerListings dealerUuid={data.uuid} offersSales={data?.offers_purchase} offersRentals={data?.offers_rental} />
                  )}

                  <Divider mb={6} />

                  <RatingCard avg_rating={data?.avg_rating} ratings={data?.ratings} reviewCount={reviews.length} />
                  <VStack spacing={6} align="stretch">
                    {reviews.map((review, idx) => <ReviewCard key={review?.uuid || idx} review={review} />)}
                  </VStack>
                </Box>

                {(data?.contact_phone || data?.contact_email) && (
                  <Box w={{ base: '100%', lg: '320px' }} borderWidth="1px" borderRadius="lg" p={4} bg="white" boxShadow="sm" mt={{ lg: 6 }}>
                    <Heading as="h2" size="sm" mb={3}>Contact</Heading>
                    <VStack align="stretch" spacing={2}>
                      {data?.contact_phone && (
                        <ChakraLink href={`tel:${data.contact_phone}`} display="flex" alignItems="center" gap={2} color="primary">
                          <Phone size={16} aria-hidden="true" /> {data.contact_phone}
                        </ChakraLink>
                      )}
                      {data?.contact_email && (
                        <ChakraLink href={`mailto:${data.contact_email}`} display="flex" alignItems="center" gap={2} color="primary" wordBreak="break-all">
                          <Mail size={16} aria-hidden="true" /> {data.contact_email}
                        </ChakraLink>
                      )}
                    </VStack>
                  </Box>
                )}
              </Flex>
            </Container>

            {data?.uuid && (
              <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} recipient_type="dealer" recipient_id={data.uuid} />
            )}
          </Box>
        );
      }}
    </AsyncState>
  )
}
