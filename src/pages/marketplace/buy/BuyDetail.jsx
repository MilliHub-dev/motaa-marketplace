import {
    Avatar, Badge, Box, Button, Container,
    Divider, Flex, Heading, Icon, Image, List,
    ListItem, Stack, Text, IconButton, SimpleGrid,
    useMediaQuery, Tag, LinkBox,
    LinkOverlay, HStack, VStack,
} from "@chakra-ui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GlobalStore } from "../../../App";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import {ImageCarousel, LocationBreadcrumb, ListingItemCard} from "../../../components";
import { ListingDetailSkeleton } from "../../../components/loaders";
import { ChatPopup } from "../../../components/chat";
import { objectifyJSON } from "../../../utils";
import {HiMiniReceiptPercent} from 'react-icons/hi2';
import {FaCartPlus} from 'react-icons/fa';



export const BuyDetail = ({ }) => {
    const {listingId} = useParams();
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoadingState] = useState(true);
    const [showPopup, setPopupState] = useState(false);
    const [listing, setListing] = useState({});
    const {authUser, axios, notify, commaInt} = useContext(GlobalStore);
    const [isMobile] = useMediaQuery('(max-width: 768px)');

    async function getData(){
        const res = await axios.get(`/listings/buy/${listingId}/`);
        if (res.status === 200){
            let data = objectifyJSON(res.data);
            setListing(data.data.listing);
            setRecommended(data.data.recommended);
        }
    }

    async function addToCart(){
        const res = await axios.post(`/listings/buy/${listingId}/`, JSON.stringify({
                action: 'add-to-cart',
                item_type: 'sale',
            })
        )

        if (res.status === 200){
            notify({
                title: 'Success!',
                body: `${listing?.vehicle?.name} was added to your cart!`
            })
        }else{
            const data = await objectifyJSON(res.data)
            notify({
                title: 'An error occurred!',
                body: `${data?.message}`
            })
        }
    }

    function init(){
        setLoadingState(true)
        getData();
        setTimeout(() => setLoadingState(false), 2500)
    }

    useEffect(() => {
        init();
    }, [listingId]);

    if (loading){
        return <ListingDetailSkeleton />
    }

    return(
        <Container display={'block'} w={'100%'} maxW={'container.xl'} py={'2rem'}>
            <LocationBreadcrumb label={listing?.title} />
            
            <Box my={5}>
                <Heading size={'lg'} className="title"> {listing?.title} </Heading>
                <Text> {listing?.vehicle?.dealer?.location} </Text>
            </Box>

            <Flex
             my={5}
             alignItems={"flex-start"}
             gap={4}
              wrap="wrap"
            >
                <Box
                    flex={{ base: "1 1 100%", md: "1 1 55%", lg: "1 1 60%" }} 
                    maxW={{ md: "60%", lg: "60%" }} 
                    w="100%"
                >
                    <ImageCarousel w={'100%'} height={'350px'} images={listing?.vehicle?.images} />
                </Box>

                <Box
                    flex={{ base: "1 1 100%", md: "1 1 40%", lg: "1 1 35%" }} 
                    maxW={{ md: "40%", lg: "40%" }}
                    maxH="max-content"
                    w="100%"
                    border="2px solid lavender"
                    borderRadius="10px"
                    p={3}
                >
                    <LinkBox>
                        <LinkOverlay as={Link} to={`/dealership/${listing?.vehicle?.dealer?.uuid}`}>
                            <Flex gap={2}>
                                <Avatar name={listing?.vehicle?.dealer?.business_name} src={listing?.vehicle?.dealer?.logo}  />
                                <Stack>
                                    <Heading size={'sm'}> {listing?.vehicle?.dealer?.business_name} </Heading>
                                    <Text size={'sm'} className="small"> {listing?.vehicle?.dealer?.location || 'N/A'} </Text>
                                </Stack>
                            </Flex>
                        </LinkOverlay>
                    </LinkBox>

                    <Box mt={3}>
                        <Flex alignItems="center" gap={3}>
                            <Badge> Price: </Badge>
                            <Heading size={'lg'}><span className="">₦{commaInt(listing?.price)}</span></Heading>
                        </Flex>

                        <Tag as={Flex} alignItems="center" gap={1.25}>
                            <Icon> <HiMiniReceiptPercent size={25} /> </Icon>
                            <Text>+0.5% added fees</Text>
                        </Tag>
                    </Box>

                    <Divider my={5} />

                    <Stack columnGap={4}>
                        <Flex justify="space-between" align="center" gap={3}>
                            <Button as={Link} to={`/checkout/?listingId=${listingId}`} bg={'primary'} colorScheme="blue" w={'100%'}> Buy Now </Button>
                            <IconButton variant="outline" colorScheme="blue" icon={<FaCartPlus />} onClick={addToCart} />
                        </Flex>
                        <Button onClick={() => setPopupState(true)} variant={'outline'} colorScheme="blue" w={'100%'}> Message Seller </Button>
                    </Stack>
                </Box>
            </Flex>

            <ChatPopup
             isOpen={showPopup}
             onClose={() => setPopupState(false)}
             recipient_type="dealer" 
             recipient_id={listing?.vehicle?.dealer?.uuid}
            />

            <Stack w={{md: 8/12, lg: (8/12)}} pb="4rem" pt="1.25rem">
                <Box my={5}>
                    <Heading className="subtitle" size={'md'} mb={4}> Overview </Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} flexWrap="wrap">
                        <List w={'100%'}>
                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Mileage: </span>
                                <span> {listing?.vehicle?.mileage || "0"} miles </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Transmission: </span>
                                <span> {listing?.vehicle?.transmission} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Usage: </span>
                                <span> {listing?.vehicle?.condition} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Power: </span>
                                <span> {listing?.vehicle?.power || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Engine size: </span>
                                <span> {listing?.vehicle?.engine_size || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Fuel type: </span>
                                <span> {listing?.vehicle?.fuel_system} </span>
                            </ListItem>
                        </List>
                        
                        <List w={'100%'}>
                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Custom Duty: </span>
                                <span> {listing?.vehicle?.custom_duty ? 'Yes' : 'No'} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Doors: </span>
                                <span> {listing?.vehicle?.doors || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Seats: </span>
                                <span> {listing?.vehicle?.seats || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Drivetrain: </span>
                                <span> {listing?.vehicle?.drivetrain || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Vehicle type: </span>
                                <span> {listing?.vehicle?.type || "N/A"} </span>
                            </ListItem>

                            <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                                <span> Color: </span>
                                <span> {listing?.vehicle?.color || "N/A"} </span>
                            </ListItem>
                        </List>
                    </SimpleGrid>
                </Box>
                
                <Box my={5}>
                    <Heading className="subtitle" size={'md'} mb={4}> Performance & Stats </Heading>

                    <List w={{ base: '100%', md: '50%'}}>
                        <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                            <span> Top Speed: </span>
                            <span> {listing?.vehicle?.top_speed || "N/A"} </span>
                        </ListItem>

                        <ListItem borderBottom={'1px solid grey'} py={3} fontWeight={'600'} justifyContent="space-between" display="flex">
                            <span> Horse Power: </span>
                            <span> {listing?.vehicle?.horse_power || "N/A"} </span>
                        </ListItem>
                    </List>
                </Box>

                <Box my={5}>
                    <Heading className="subtitle" size={'md'} mb={4}> Seller notes </Heading>
                    <Text border={'1px solid grey'} dangerouslySetInnerHTML={{__html: listing?.notes || "No additional info."}} p={3} rounded={'md'}></Text>
                </Box>  
            </Stack>

            <WhyBuyOnMotaa />


            <Stack>
                <Heading textAlign="center" size="md" my={3}> Recommended Cars for You </Heading>

                <SimpleGrid
                 minChildWidth="300px"
                 maxChildWidth={'350px'}
                 placeItems={isMobile ? 'center' : 'unset'}
                 gap={8}
                 spacing={8}
                 columns={{base: 1, md: 2, lg: 3, xl: 4}}
                >
                    {recommended && recommended?.map((listing, idx) =>
                        <ListingItemCard
                         listing={listing}
                         key={idx}
                         w="100%"
                         maxW={'350px'}
                        />
                    )}
                </SimpleGrid>
            </Stack>
        </Container>
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

        <Box borderWidth="1px" shadow="md" borderColor="#f2f4f7" borderRadius="xl" p={6} minW={{ base: "full", md: "320px" }}>
          <Flex justify="space-between" align="center">
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="xl" fontWeight="semibold">
                Not happy?
              </Text>
              <Text fontSize="xl" fontWeight="semibold">
                Contact Sales
              </Text>
              <Button
                mt={4}
                bg="#0460cc"
                color="white"
                size="lg"
                borderRadius="md"
                _hover={{ bg: "#0354b4" }}
                leftIcon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22 16.92V19.92C22 20.4704 21.7893 20.9991 21.4142 21.3742C21.0391 21.7493 20.5104 21.96 19.96 21.96C18.4536 21.8996 16.9675 21.5757 15.57 21C14.2709 20.4571 13.0708 19.7006 12.03 18.76C11.0892 17.7492 10.3327 16.5491 9.79 15.25C9.21202 13.8458 8.88734 12.3528 8.83 10.84C8.83058 10.2905 9.04051 9.76279 9.41371 9.38747C9.78691 9.01215 10.3138 8.8 10.86 8.8H13.86C14.9187 8.79099 15.818 9.5951 15.94 10.64C16.0067 11.3407 16.1516 12.0284 16.37 12.69C16.6306 13.4627 16.4692 14.3064 15.94 14.87L14.95 15.86C15.437 17.0232 16.1432 18.0747 17.03 18.95C17.9053 19.8368 18.9568 20.543 20.12 21.03L21.11 20.04C21.6736 19.5108 22.5173 19.3494 23.29 19.61C23.9516 19.8284 24.6393 19.9733 25.34 20.04C26.4026 20.1648 27.2051 21.0867 27.19 22.15V25.15C27.19 25.6962 26.9779 26.2231 26.6026 26.5963C26.2273 26.9695 25.6995 27.1794 25.15 27.18C23.6428 27.1196 22.1567 26.7957 20.76 26.22C19.4609 25.6771 18.2608 24.9206 17.22 23.98C16.2792 22.9692 15.5227 21.7691 14.98 20.47C14.402 19.0658 14.0773 17.5728 14.02 16.06C14.0206 15.5105 14.2305 14.9828 14.6037 14.6075C14.9769 14.2322 15.5038 14.02 16.05 14.02H19.05C20.1087 14.011 21.008 14.8151 21.13 15.86C21.1967 16.5607 21.3416 17.2484 21.56 17.91C21.8206 18.6827 21.6592 19.5264 21.13 20.09L20.14 21.08C21.0201 22.0384 22.0458 22.8541 23.18 23.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              >
                Contact us
              </Button>
            </VStack>
            <Image
              src="/assets/images/features-image-2.png"
              alt="Customer support"
              borderRadius="full"
              boxSize="100px"
              objectFit="cover"
            />
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}



export default BuyDetail;