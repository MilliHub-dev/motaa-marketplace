import {
    Avatar, Box, Button, Container, Divider, Flex, Heading, Image, List,
    ListItem, Stack, Text, IconButton, SimpleGrid, Tag, HStack, VStack, Tooltip,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GlobalStore } from "../../../App";
import { ImageCarousel, LocationBreadcrumb, ListingItemCard, formatMileage } from "../../../components";
import { ListingDetailSkeleton } from "../../../components/loaders";
import { ChatPopup } from "../../../components/chat";
import { AsyncState } from "../../../components/states";
import { useApiMutation, useApiQuery } from "../../../hooks/useApi";
import { asList } from "../../../utils";
import { HiMiniReceiptPercent } from 'react-icons/hi2';
import { FaCartPlus } from 'react-icons/fa';
import { FaCartShopping } from 'react-icons/fa6';
import { Phone } from 'lucide-react';
import { profilePicture } from '../../../utils';


function SpecList({ items }) {
    return (
        <List w={'100%'}>
            {items.map(([label, value, capitalize = true]) => (
                <ListItem key={label} borderBottom={'1px solid'} borderColor="gray.300" py={3} fontWeight={'600'} justifyContent="space-between" display="flex" gap={4}>
                    <Text as="span">{label}</Text>
                    <Text as="span" textAlign="right" textTransform={capitalize && typeof value === 'string' ? 'capitalize' : undefined}>{value ?? 'N/A'}</Text>
                </ListItem>
            ))}
        </List>
    );
}


export const BuyDetail = () => {
    const {listingId} = useParams();
    const [showPopup, setPopupState] = useState(false);
    const {authUser, commaInt} = useContext(GlobalStore);
    const isCustomer = authUser?.user_type === 'customer';

    const detail = useApiQuery(
        (api, signal) => api.get(`/listings/buy/${listingId}/`, { signal }),
        [listingId],
        { select: (body) => body?.data, keepAs: `buy-detail:${listingId}` }
    );
    // the customer's cart, to show "In cart" instead of offering to add it twice
    const cart = useApiQuery(
        (api, signal) => api.get('/accounts/cart/', { signal }),
        [isCustomer],
        { enabled: isCustomer, select: (body) => asList(body?.data?.cars).map((item) => item?.uuid) }
    );
    const inCart = asList(cart.data).includes(listingId);
    const addToCart = useApiMutation(
        (api) => api.post(`/listings/buy/${listingId}/`, { action: 'add-to-cart', item_type: 'sale' }),
        {
            successMessage: 'Added to your cart',
            errorTitle: "Couldn't add to cart",
            onSuccess: () => cart.setData((current) => [...asList(current), listingId]),
        }
    );

    return (
        <AsyncState query={detail} skeleton={<ListingDetailSkeleton />} errorTitle={detail.error?.isNotFound ? 'This car is no longer listed' : undefined}>
            {(data) => {
                const listing = data?.listing || {};
                const vehicle = listing?.vehicle || {};
                const dealer = vehicle?.dealer;
                const recommended = asList(data?.recommended);
                const title = listing?.title || vehicle?.name || 'Car for sale';

                return (
                    <Container display={'block'} w={'100%'} maxW={'container.xl'} py={'2rem'}>
                        <LocationBreadcrumb label={title} />

                        <Box my={5}>
                            <Heading as="h1" size={'lg'} className="title">{title}</Heading>
                            {dealer?.location && <Text color="gray.600">{dealer.location}</Text>}
                        </Box>

                        <Flex my={5} alignItems={"flex-start"} gap={4} wrap={{ base: 'wrap', md: 'nowrap' }}>
                            <Box flex={{ base: "1 1 100%", md: "1 1 60%" }} minW={0} w="100%">
                                <ImageCarousel images={vehicle?.images} alt={title} />
                            </Box>

                            <Box
                                flex={{ base: "1 1 100%", md: "1 1 40%" }}
                                minW={0}
                                w="100%"
                                border="2px solid lavender"
                                borderRadius="10px"
                                p={4}
                            >
                                {dealer?.uuid && (
                                    <Flex as={Link} to={`/dealership/${dealer.uuid}`} gap={3} alignItems="center" _hover={{ textDecoration: 'underline' }}>
                                        <Avatar name={dealer?.business_name} src={profilePicture(dealer)} />
                                        <Stack spacing={0} minW={0}>
                                            <Heading as="p" size={'sm'} noOfLines={1}>{dealer?.business_name || 'Dealer'}</Heading>
                                            <Text fontSize="sm" color="gray.600">View dealer profile</Text>
                                        </Stack>
                                    </Flex>
                                )}

                                <Box mt={4}>
                                    <Text fontSize="sm" color="gray.600">Price</Text>
                                    <Heading as="p" size={'lg'}>₦{commaInt(listing?.price)}</Heading>
                                    <Tag mt={2} display="inline-flex" alignItems="center" gap={1.5}>
                                        <HiMiniReceiptPercent size={18} aria-hidden="true" />
                                        <Text>Fees and tax calculated at checkout</Text>
                                    </Tag>
                                </Box>

                                <Divider my={5} />

                                <Stack spacing={3}>
                                    <Flex justify="space-between" align="center" gap={3}>
                                        <Button as={Link} to={`/checkout/?listingId=${encodeURIComponent(listingId)}`} bg={'primary'} colorScheme="blue" flex={1}>Buy Now</Button>
                                        {isCustomer && (
                                            <Tooltip label={inCart ? 'Already in your cart' : 'Add to cart'}>
                                                <IconButton
                                                  variant={inCart ? 'solid' : 'outline'}
                                                  colorScheme={inCart ? 'green' : 'blue'}
                                                  icon={inCart ? <FaCartShopping /> : <FaCartPlus />}
                                                  aria-label={inCart ? `${title} is in your cart` : `Add ${title} to cart`}
                                                  isLoading={addToCart.loading}
                                                  isDisabled={inCart || cart.loading}
                                                  onClick={() => !inCart && !addToCart.loading && addToCart.mutate()}
                                                />
                                            </Tooltip>
                                        )}
                                    </Flex>
                                    {inCart && <Text fontSize="sm" color="green.600">In your cart. <Link to="/cart"><u>View cart</u></Link></Text>}
                                    {dealer?.uuid && (
                                        <Button onClick={() => setPopupState(true)} variant={'outline'} colorScheme="blue" w={'100%'}>Message Seller</Button>
                                    )}
                                </Stack>
                            </Box>
                        </Flex>

                        {dealer?.uuid && (
                            <ChatPopup
                             isOpen={showPopup}
                             onClose={() => setPopupState(false)}
                             recipient_type="dealer"
                             recipient_id={dealer.uuid}
                             recipient_name={dealer.business_name}
                             listing={listing?.uuid ? { ...listing, listing_type: listing.listing_type || 'sale' } : undefined}
                            />
                        )}

                        <Stack w={{ base: '100%', lg: '66%' }} pb="4rem" pt="1.25rem">
                            <Box my={5}>
                                <Heading as="h2" className="subtitle" size={'md'} mb={4}>Overview</Heading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={8}>
                                    <SpecList items={[
                                        ['Mileage', formatMileage(vehicle?.mileage, commaInt), false],
                                        ['Transmission', vehicle?.transmission],
                                        ['Condition', vehicle?.condition],
                                        ['Fuel type', vehicle?.fuel_system],
                                        ['Brand', vehicle?.brand],
                                        ['Model', vehicle?.model],
                                    ]} />
                                    <SpecList items={[
                                        ['Custom duty paid', vehicle?.custom_duty ? 'Yes' : 'No'],
                                        ['Doors', vehicle?.doors],
                                        ['Seats', vehicle?.seats],
                                        ['Drivetrain', vehicle?.drivetrain],
                                        ['Vehicle type', vehicle?.type],
                                        ['Color', vehicle?.color],
                                    ]} />
                                </SimpleGrid>
                            </Box>

                            {asList(vehicle?.features).length > 0 && (
                                <Box my={5}>
                                    <Heading as="h2" className="subtitle" size={'md'} mb={4}>Features</Heading>
                                    <Flex gap={2} flexWrap="wrap">
                                        {asList(vehicle.features).map((feature) => <Tag key={feature} size="lg">{feature}</Tag>)}
                                    </Flex>
                                </Box>
                            )}

                            <Box my={5}>
                                <Heading as="h2" className="subtitle" size={'md'} mb={4}>Seller notes</Heading>
                                {/* plain text: seller input is never rendered as HTML */}
                                <Text border={'1px solid'} borderColor="gray.300" whiteSpace="pre-line" p={3} rounded={'md'} color={listing?.notes ? 'inherit' : 'gray.500'}>
                                    {listing?.notes || 'No additional info.'}
                                </Text>
                            </Box>
                        </Stack>

                        <WhyBuyOnMotaa />

                        {recommended.length > 0 && (
                            <Stack>
                                <Heading as="h2" textAlign="center" size="md" my={3}>Recommended Cars for You</Heading>
                                <SimpleGrid spacing={{ base: 6, md: 8 }} columns={{base: 1, sm: 2, lg: 3, xl: 4}}>
                                    {recommended.map((item) =>
                                        <ListingItemCard listing={item} key={item?.uuid || item?.id} />
                                    )}
                                </SimpleGrid>
                            </Stack>
                        )}
                    </Container>
                );
            }}
        </AsyncState>
    )
}


const FeatureItem = ({ icon, text }) => (
  <HStack spacing={4} align="center">
    <Flex w="60px" h="60px" borderRadius="full" bg="#f2f4f7" alignItems="center" justifyContent="center">
      {icon}
    </Flex>
    <Text fontWeight="medium" fontSize="md">
      {text}
    </Text>
  </HStack>
)

const WhyBuyOnMotaa = () => {
  return (
    <Box py={8} px={4} mb={3} borderTop={'1px solid gray'}>
      <Heading as="h2" fontSize="xl" fontWeight="bold" mb={8}>
        Why buy on Motaa?
      </Heading>

      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap={6}
      >
        <VStack align="flex-start" spacing={6} flex={1}>
          <FeatureItem
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 20V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V20"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            text="Secure escrow payments"
          />
          <FeatureItem
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 5H18C18.5304 5 19.0391 5.21071 19.4142 5.58579C19.7893 5.96086 20 6.46957 20 7V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21H6C5.46957 21 4.96086 20.7893 4.58579 20.4142C4.21071 20.0391 4 19.5304 4 19V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H8"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 3H9C8.44772 3 8 3.44772 8 4V6C8 6.55228 8.44772 7 9 7H15C15.5523 7 16 6.55228 16 6V4C16 3.44772 15.5523 3 15 3Z"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            text="Home delivery"
          />
        </VStack>

        <VStack align="flex-start" spacing={6} flex={1}>
          <FeatureItem
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            text="Verified vehicles"
          />
          <FeatureItem
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 6V12L16 14"
                  stroke="#292D32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            text="14 day return policy"
          />
        </VStack>

        <Box borderWidth="1px" shadow="md" borderColor="#f2f4f7" borderRadius="xl" p={{ base: 4, md: 6 }} w={{ base: "100%", md: "auto" }} minW={{ base: 0, md: "320px" }}>
          <Flex justify="space-between" align="center" gap={3}>
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="xl" fontWeight="semibold">
                Not happy?
              </Text>
              <Text fontSize="xl" fontWeight="semibold">
                We can help
              </Text>
              <Button
                as={Link}
                to="/support"
                mt={4}
                bg="#0460cc"
                color="white"
                size="lg"
                borderRadius="md"
                _hover={{ bg: "#0354b4" }}
                leftIcon={<Phone size={20} aria-hidden="true" />}
              >
                Contact support
              </Button>
            </VStack>
            <Image
              src="/assets/images/features-image-2.png"
              alt=""
              borderRadius="full"
              boxSize={{ base: "64px", md: "100px" }}
              objectFit="cover"
            />
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}



export default BuyDetail;