import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Badge,
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Image,
    Skeleton,
    Stack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tag,
    Text,
    Wrap,
} from "@chakra-ui/react";
import { useContext, useEffect, useRef, useState } from "react";
import { Link as RLink, useSearchParams } from "react-router-dom";
import { CalendarClock, Car, KeyRound, Package, Receipt, Wrench } from "lucide-react";
import { GlobalStore } from "../../App";
import { useApiMutation, useApiQuery } from "../../hooks/useApi";
import { EmptyState, ErrorState } from "../../components/states";
import { asList } from "../../utils";

const TABS = ['orders', 'cars', 'rentals', 'mechanics'];

const ORDER_STATUS = {
    'awaiting-inspection': { label: 'Awaiting inspection', color: 'yellow' },
    inspecting: { label: 'Inspecting', color: 'yellow' },
    pending: { label: 'Awaiting payment', color: 'orange' },
    completed: { label: 'Completed', color: 'green' },
    expired: { label: 'Expired', color: 'gray' },
    renewed: { label: 'Renewed', color: 'blue' },
};

const BOOKING_STATUS = {
    requested: { label: 'Requested', color: 'yellow' },
    accepted: { label: 'Accepted', color: 'blue' },
    working: { label: 'In progress', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    declined: { label: 'Declined', color: 'red' },
    canceled: { label: 'Cancelled', color: 'gray' },
    expired: { label: 'Expired', color: 'gray' },
};

function vehicleImage(vehicle) {
    return asList(vehicle?.images).find((img) => img?.url)?.url || null;
}

function listingName(listing) {
    return listing?.title || listing?.vehicle?.name || 'Vehicle';
}

function StatusBadge({ map, value }) {
    if (!value) return null;
    const status = map[value] || { label: String(value).replace(/-/g, ' '), color: 'gray' };
    return <Badge colorScheme={status.color} textTransform="none" px={2} py={0.5} borderRadius="full">{status.label}</Badge>;
}

/** One row: picture, details, actions — stacks on phones. */
function CartRow({ image, imageAlt, children, actions }) {
    return (
        <Flex
            as="li"
            direction={{ base: 'column', sm: 'row' }}
            gap={4}
            p={4}
            borderWidth="1px"
            borderColor="gray.100"
            borderRadius="lg"
            bg="white"
            align={{ base: 'stretch', sm: 'center' }}
        >
            <Flex gap={4} flex={1} minW={0} align="center">
                {image !== undefined && (
                    <Flex w={{ base: '96px', md: '120px' }} h={{ base: '68px', md: '80px' }} rounded="lg" overflow="hidden" flexShrink={0} bg="gray.100" align="center" justify="center" color="gray.400">
                        {image
                            ? <Image w="100%" h="100%" objectFit="cover" src={image} alt={imageAlt} loading="lazy" fallback={<Car size={28} aria-hidden="true" />} />
                            : <Car size={28} aria-label={`No photo of ${imageAlt}`} role="img" />}
                    </Flex>
                )}
                <Box flex={1} minW={0}>{children}</Box>
            </Flex>
            {actions && (
                <Flex gap={2} flexWrap="wrap" justify={{ base: 'stretch', sm: 'flex-end' }} sx={{ '& > *': { flex: { base: 1, sm: 'initial' } } }}>
                    {actions}
                </Flex>
            )}
        </Flex>
    );
}

function CartSkeleton() {
    return (
        <Stack spacing={4} mt={6} role="status" aria-label="Loading your cart">
            {[0, 1, 2].map((i) => (
                <Flex key={i} gap={4} p={4} borderWidth="1px" borderColor="gray.100" borderRadius="lg" align="center">
                    <Skeleton w="110px" h="75px" borderRadius="lg" />
                    <Box flex={1}>
                        <Skeleton h="14px" w="50%" mb={3} />
                        <Skeleton h="12px" w="30%" />
                    </Box>
                </Flex>
            ))}
        </Stack>
    );
}

function ConfirmCancelBooking({ booking, onCancel, onConfirm, isLoading }) {
    const cancelRef = useRef(null);
    return (
        <AlertDialog isOpen={Boolean(booking)} leastDestructiveRef={cancelRef} onClose={onCancel} isCentered>
            <AlertDialogOverlay>
                <AlertDialogContent mx={4}>
                    <AlertDialogHeader fontSize="lg">Cancel this booking?</AlertDialogHeader>
                    <AlertDialogBody>
                        Your request to {booking?.mechanic || 'the mechanic'} will be cancelled and the booking fee returned to your Motaa wallet.
                    </AlertDialogBody>
                    <AlertDialogFooter gap={3}>
                        <Button ref={cancelRef} onClick={onCancel} isDisabled={isLoading}>Keep booking</Button>
                        <Button colorScheme="red" onClick={onConfirm} isLoading={isLoading} loadingText="Cancelling">Cancel booking</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

function ConfirmRemove({ item, onCancel, onConfirm, isLoading }) {
    const cancelRef = useRef(null);
    return (
        <AlertDialog isOpen={Boolean(item)} leastDestructiveRef={cancelRef} onClose={onCancel} isCentered>
            <AlertDialogOverlay>
                <AlertDialogContent mx={4}>
                    <AlertDialogHeader fontSize="lg">Remove from cart?</AlertDialogHeader>
                    <AlertDialogBody>
                        {listingName(item)} will be removed from your cart. You can add it again from its listing at any time.
                    </AlertDialogBody>
                    <AlertDialogFooter gap={3}>
                        <Button ref={cancelRef} onClick={onCancel} isDisabled={isLoading}>Keep it</Button>
                        <Button colorScheme="red" onClick={onConfirm} isLoading={isLoading} loadingText="Removing">Remove</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

export const CartPage = () => {
    const { commaInt, naturalDate, notify } = useContext(GlobalStore);
    const [params, setParams] = useSearchParams();
    const tabIndex = Math.max(0, TABS.indexOf(params.get('tab')));
    const [confirmItem, setConfirmItem] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [bookingToCancel, setBookingToCancel] = useState(null);

    useEffect(() => { document.title = 'Your cart | Motaa'; }, []);

    const query = useApiQuery(
        (api, signal) => api.get('/accounts/cart/', { signal }),
        [],
        { select: (body) => body?.data || {} }
    );
    const cart = query.data || {};
    const orders = asList(cart.orders);
    const cars = asList(cart.cars);
    const rentals = asList(cart.rentals);
    const bookings = asList(cart.bookings);

    const remove = useApiMutation(
        (api, item) => api.post('/accounts/cart/', { item: item.uuid, action: 'remove-from-cart' }),
        {
            errorTitle: "Couldn't remove that item",
            onSuccess: (body, item) => {
                query.setData((current) => ({
                    ...current,
                    cars: asList(current?.cars).filter((c) => c?.uuid !== item.uuid),
                    rentals: asList(current?.rentals).filter((r) => r?.uuid !== item.uuid),
                }));
                notify({ title: 'Removed from cart', body: `${listingName(item)} was removed from your cart.` });
            },
        }
    );

    const cancelBooking = useApiMutation(
        (api, booking) => api.post(`/mechanics/bookings/${booking.uuid}/cancel/`),
        {
            errorTitle: "Couldn't cancel the booking",
            onSuccess: (body, booking) => {
                query.setData((current) => ({
                    ...current,
                    bookings: asList(current?.bookings).map((b) => (b?.uuid === booking.uuid
                        ? { ...b, booking_status: 'canceled', can_cancel: false }
                        : b)),
                }));
                notify({ title: 'Booking cancelled', body: 'The booking fee has been returned to your Motaa wallet.' });
            },
        }
    );

    async function confirmCancelBooking() {
        if (!bookingToCancel?.uuid) return;
        await cancelBooking.mutate(bookingToCancel);
        setBookingToCancel(null);
    }

    async function confirmRemove() {
        const item = confirmItem;
        if (!item?.uuid) return;
        setRemovingId(item.uuid);
        await remove.mutate(item);
        setRemovingId(null);
        setConfirmItem(null);
    }

    function selectTab(index) {
        const next = new URLSearchParams(params);
        next.set('tab', TABS[index]);
        setParams(next, { replace: true });
    }

    const formatDate = (value) => {
        const date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? naturalDate(date) : null;
    };

    const tabs = [
        { label: 'Orders', count: orders.length },
        { label: 'Cars', count: cars.length },
        { label: 'Rentals', count: rentals.length },
        { label: 'Mechanics', count: bookings.length },
    ];

    const removeButton = (item) => (
        <Button
            variant="outline"
            colorScheme="red"
            onClick={() => setConfirmItem(item)}
            isLoading={removingId === item?.uuid}
            loadingText="Removing"
            isDisabled={Boolean(removingId) && removingId !== item?.uuid}
        >
            Remove
        </Button>
    );

    // The order page handles paying the balance, inspection, cancelling and confirming delivery.
    function orderActions(order) {
        if (!order?.uuid) return null;
        const to = `/checkout/status?order=${order.uuid}`;
        if (order?.order_type === 'sale' && ['awaiting-inspection', 'inspecting'].includes(order?.order_status)) {
            return <Button as={RLink} to={to} bg="tertiary" color="secondary" _hover={{ bg: 'yellow.300' }}>Finish inspection</Button>;
        }
        if (!order?.paid && order?.order_status === 'pending') {
            return <Button as={RLink} to={to} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Pay now</Button>;
        }
        return <Button as={RLink} to={to} variant="outline" borderColor="primary" color="primary">View order</Button>;
    }

    return (
        <Box py={{ base: 4, md: 8 }}>
            <Container maxW="container.lg">
                <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} mb={1}>Your cart</Heading>
                <Text color="gray.600" mb={4}>Cars you've saved, your orders and mechanic bookings.</Text>

                <Flex as="nav" aria-label="Spare parts" align="center" gap={3} flexWrap="wrap" p={3} mb={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="gray.50">
                    <Flex align="center" gap={2} flex={1} minW="200px" color="gray.700">
                        <Package size={18} aria-hidden="true" />
                        <Text fontSize="sm">Spare parts have their own cart and orders.</Text>
                    </Flex>
                    <Button as={RLink} to="/parts/cart" size="sm" variant="outline" borderColor="primary" color="primary">Parts cart</Button>
                    <Button as={RLink} to="/parts/orders" size="sm" variant="outline" borderColor="primary" color="primary">My parts orders</Button>
                </Flex>

                {query.loading && query.data === undefined ? (
                    <CartSkeleton />
                ) : query.error && query.data === undefined ? (
                    <ErrorState error={query.error} onRetry={query.reload} />
                ) : (
                    <Tabs index={tabIndex} onChange={selectTab} isLazy colorScheme="blue">
                        <TabList overflowX="auto" overflowY="hidden" className="hidden-scroll" whiteSpace="nowrap">
                            {tabs.map((tab) => (
                                <Tab key={tab.label} gap={2} px={{ base: 3, md: 4 }} fontWeight="600" _selected={{ color: 'primary', borderColor: 'primary' }}>
                                    {tab.label}
                                    <Badge borderRadius="full" px={2} colorScheme={tab.count ? 'blue' : 'gray'}>{tab.count}</Badge>
                                </Tab>
                            ))}
                        </TabList>

                        <TabPanels>
                            {/* Orders */}
                            <TabPanel px={0}>
                                {orders.length === 0 ? (
                                    <EmptyState icon={Receipt} title="No orders yet" description="When you buy or rent a car, your order and its progress will show up here." action={{ label: 'Browse cars', to: '/buy' }} />
                                ) : (
                                    <Stack as="ul" spacing={3} listStyleType="none">
                                        {orders.map((order) => {
                                            const listing = order?.order_item;
                                            const from = formatDate(order?.rent_from);
                                            const until = formatDate(order?.rent_until);
                                            return (
                                                <CartRow key={order?.uuid || order?.id} image={vehicleImage(listing?.vehicle)} imageAlt={listingName(listing)} actions={orderActions(order)}>
                                                    <Wrap spacing={2} mb={1} align="center">
                                                        <Tag size="sm">{order?.order_type === 'rental' ? 'Rental' : 'Purchase'}</Tag>
                                                        <StatusBadge map={ORDER_STATUS} value={order?.order_status} />
                                                        {order?.paid && <Badge colorScheme="green" borderRadius="full" px={2} textTransform="none">Paid</Badge>}
                                                    </Wrap>
                                                    <Heading as="h3" size="sm" noOfLines={1}>{listingName(listing)}</Heading>
                                                    <Text fontWeight="600" mt={1}>
                                                        ₦{commaInt(listing?.price)}
                                                        {order?.order_type === 'rental' && listing?.cycle ? <Text as="span" fontWeight="400" color="gray.500"> / {String(listing.cycle).toLowerCase()}</Text> : null}
                                                    </Text>
                                                    {order?.order_type === 'rental' && from && (
                                                        <Text fontSize="sm" color="gray.600" mt={1}>{from}{until ? ` – ${until}` : ''}</Text>
                                                    )}
                                                </CartRow>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </TabPanel>

                            {/* Cars */}
                            <TabPanel px={0}>
                                {cars.length === 0 ? (
                                    <EmptyState icon={Car} title="No cars in your cart" description="Save cars you're interested in buying and come back to pay when you're ready." action={{ label: 'Browse cars for sale', to: '/buy' }} />
                                ) : (
                                    <Stack as="ul" spacing={3} listStyleType="none">
                                        {cars.map((car) => (
                                            <CartRow
                                                key={car?.uuid || car?.id}
                                                image={vehicleImage(car?.vehicle)}
                                                imageAlt={listingName(car)}
                                                actions={<>
                                                    {removeButton(car)}
                                                    <Button as={RLink} to={`/checkout/?listingId=${car?.uuid}`} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Pay now</Button>
                                                </>}
                                            >
                                                {car?.vehicle?.condition && <Tag size="sm" mb={1}>{car.vehicle.condition}</Tag>}
                                                <Heading as="h3" size="sm" noOfLines={1}>
                                                    <Box as={RLink} to={`/buy/${car?.uuid}`} _hover={{ color: 'primary' }}>{listingName(car)}</Box>
                                                </Heading>
                                                <Text fontWeight="600" mt={1}>₦{commaInt(car?.price)}</Text>
                                            </CartRow>
                                        ))}
                                    </Stack>
                                )}
                            </TabPanel>

                            {/* Rentals */}
                            <TabPanel px={0}>
                                {rentals.length === 0 ? (
                                    <EmptyState icon={KeyRound} title="No rentals saved" description="Rentals you save will appear here so you can pick your dates and book." action={{ label: 'Browse rentals', to: '/rent' }} />
                                ) : (
                                    <Stack as="ul" spacing={3} listStyleType="none">
                                        {rentals.map((rental) => (
                                            <CartRow
                                                key={rental?.uuid || rental?.id}
                                                image={vehicleImage(rental?.vehicle)}
                                                imageAlt={listingName(rental)}
                                                actions={<>
                                                    {removeButton(rental)}
                                                    <Button as={RLink} to={`/rent/${rental?.uuid}`} bg="primary" color="white" _hover={{ bg: 'secondary' }}>Choose dates</Button>
                                                </>}
                                            >
                                                {rental?.vehicle?.condition && <Tag size="sm" mb={1}>{rental.vehicle.condition}</Tag>}
                                                <Heading as="h3" size="sm" noOfLines={1}>{listingName(rental)}</Heading>
                                                <Text fontWeight="600" mt={1}>
                                                    ₦{commaInt(rental?.price)}
                                                    {rental?.cycle && <Text as="span" fontWeight="400" color="gray.500"> / {String(rental.cycle).toLowerCase()}</Text>}
                                                </Text>
                                            </CartRow>
                                        ))}
                                    </Stack>
                                )}
                            </TabPanel>

                            {/* Mechanic bookings */}
                            <TabPanel px={0}>
                                {bookings.length === 0 ? (
                                    <EmptyState icon={Wrench} title="No pending mechanic bookings" description="Book a certified mechanic for repairs, servicing or emergency help and track the request here." action={{ label: 'Find a mechanic', to: '/mechanics' }} />
                                ) : (
                                    <Stack as="ul" spacing={3} listStyleType="none">
                                        {bookings.map((booking, idx) => {
                                            const requested = formatDate(booking?.date_created);
                                            return (
                                                <CartRow
                                                    key={booking?.uuid || `${booking?.mechanic}-${booking?.date_created}-${idx}`}
                                                    actions={booking?.uuid && booking?.can_cancel ? (
                                                        <Button variant="outline" colorScheme="red" onClick={() => setBookingToCancel(booking)}
                                                            isLoading={cancelBooking.loading && bookingToCancel?.uuid === booking.uuid}>
                                                            Cancel booking
                                                        </Button>
                                                    ) : null}
                                                >
                                                    <Wrap spacing={2} mb={1} align="center">
                                                        <Heading as="h3" size="sm">{booking?.mechanic || 'Mechanic'}</Heading>
                                                        <StatusBadge map={BOOKING_STATUS} value={booking?.booking_status || booking?.status} />
                                                    </Wrap>
                                                    <Text fontWeight="600">₦{commaInt(booking?.sub_total)} <Text as="span" fontSize="sm" fontWeight="400" color="gray.500">quoted</Text></Text>
                                                    {Number(booking?.booking_fee) > 0 && (
                                                        <Text fontSize="sm" color="gray.600">Booking fee paid: ₦{commaInt(booking.booking_fee)}</Text>
                                                    )}
                                                    {asList(booking?.services).length > 0 && (
                                                        <Wrap spacing={2} mt={2}>
                                                            {asList(booking.services).map((service, i) => <Tag key={`${service}-${i}`} size="sm">{service}</Tag>)}
                                                        </Wrap>
                                                    )}
                                                    {requested && (
                                                        <Flex align="center" gap={1} fontSize="sm" color="gray.500" mt={2}>
                                                            <CalendarClock size={14} aria-hidden="true" /> Requested {requested}
                                                        </Flex>
                                                    )}
                                                </CartRow>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                )}
            </Container>

            <ConfirmRemove
                item={confirmItem}
                isLoading={Boolean(removingId)}
                onCancel={() => { if (!removingId) setConfirmItem(null); }}
                onConfirm={confirmRemove}
            />
            <ConfirmCancelBooking
                booking={bookingToCancel}
                isLoading={cancelBooking.loading}
                onCancel={() => { if (!cancelBooking.loading) setBookingToCancel(null); }}
                onConfirm={confirmCancelBooking}
            />
        </Box>
    );
};

export default CartPage;
