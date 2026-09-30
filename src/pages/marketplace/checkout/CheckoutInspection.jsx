import { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Icon,
  Image,
  Select,
  Skeleton,
  Text,
} from '@chakra-ui/react';
import { Car, ClipboardCheck } from 'lucide-react';
import { GlobalStore } from '../../../App';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { CalendarPicker } from '../../../components';
import { EmptyState, InlineError } from '../../../components/states';

// 08:00 – 18:00 in 30-minute slots (the backend accepts 8am–6pm)
const SLOTS = Array.from({ length: 21 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
  return { value, label };
});
const MAX_DAYS_AHEAD = 60;

function CheckoutInspection() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const listingId = params.get('listingId');
  const navigate = useNavigate();
  const { commaInt, naturalDate } = useContext(GlobalStore);
  const [date, setDate] = useState();
  const [time, setTime] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // which car is this for?
  const order = useApiQuery((api, signal) => api.get(`/listings/orders/${orderId}/`, { signal }), [orderId], {
    enabled: Boolean(orderId), select: (b) => b?.data,
  });
  const listing = useApiQuery((api, signal) => api.get(`/listings/buy/${listingId}/`, { signal }), [listingId], {
    enabled: !orderId && Boolean(listingId), select: (b) => b?.data?.listing,
  });
  const car = order.data?.listing
    ? { title: order.data.listing.title, image: order.data.listing.image, dealer: order.data.listing.dealer?.business_name, fee: order.data.inspection_fee }
    : listing.data
      ? { title: listing.data.title, image: listing.data.vehicle?.images?.[0]?.url, dealer: listing.data.vehicle?.dealer?.business_name }
      : null;
  const loadingCar = (order.loading && !order.data) || (listing.loading && !listing.data);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = new Date(today);
  lastDay.setDate(lastDay.getDate() + MAX_DAYS_AHEAD);
  const now = new Date();
  const isToday = date && date.toDateString() === now.toDateString();
  const slots = SLOTS.filter((slot) => {
    if (!isToday) return true;
    const [h, m] = slot.value.split(':').map(Number);
    return h * 60 + m > now.getHours() * 60 + now.getMinutes();
  });

  const errors = {
    date: !date ? 'Choose a date' : '',
    time: !time ? 'Choose a time' : (isToday && !slots.some((s) => s.value === time) ? 'That time has passed — pick a later one' : ''),
  };

  const schedule = useApiMutation((api, payload) => api.post('/listings/checkout/inspection/', payload), {
    errorTitle: "Couldn't schedule your inspection",
    successMessage: 'Inspection scheduled',
    onSuccess: (body) => {
      const id = body?.data?.order_id || orderId;
      navigate(`/checkout/docs?docType=inspection-slip&orderId=${id}`);
    },
  });

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (errors.date || errors.time) return;
    const pad = (n) => String(n).padStart(2, '0');
    schedule.mutate({
      order_id: orderId || undefined,
      listing_id: orderId ? undefined : listingId,
      date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`, // DD/MM/YYYY
      time,
    });
  }

  if (!orderId && !listingId) {
    return (
      <Container maxW="container.md" py={16}>
        <EmptyState icon={ClipboardCheck} title="No order selected" description="Open the order you want to inspect from your cart." action={{ label: 'Go to cart', to: '/cart' }} />
      </Container>
    );
  }

  return (
    <Box bg="white" minH="100vh">
      <Box bg="primary" py={{ base: 6, md: 8 }} mb={8}>
        <Container maxW="container.xl" textAlign="center">
          <Heading as="h1" color="white" size="lg" fontWeight="500">Schedule inspection</Heading>
          <Text color="whiteAlpha.900" mt={2}>See the car in person before you pay the balance</Text>
        </Container>
      </Box>

      <Container maxW="container.md" pb={12}>
        {loadingCar ? <Skeleton h="90px" borderRadius="lg" mb={6} /> : car ? (
          <Flex gap={4} borderWidth={1} borderRadius="lg" p={4} mb={6} align="center">
            <Box w="96px" h="72px" borderRadius="md" overflow="hidden" bg="gray.100" flexShrink={0}>
              {car.image
                ? <Image src={car.image} alt={car.title || 'Car'} w="100%" h="100%" objectFit="cover" />
                : <Flex h="100%" align="center" justify="center" color="gray.400"><Icon as={Car} boxSize={7} aria-hidden="true" /></Flex>}
            </Box>
            <Box minW={0}>
              <Text className="bold" noOfLines={2}>{car.title}</Text>
              {car.dealer && <Text fontSize="sm" color="gray.600">{car.dealer}</Text>}
              {car.fee && <Text fontSize="sm" color="gray.600">Inspection fee paid: ₦{commaInt(car.fee)}</Text>}
            </Box>
          </Flex>
        ) : (order.error || listing.error) ? (
          <Box mb={6}><InlineError error={order.error || listing.error} onRetry={order.error ? order.reload : listing.reload} /></Box>
        ) : null}

        <Box as="form" onSubmit={submit} noValidate>
          <FormControl isRequired isInvalid={submitted && Boolean(errors.date)} mb={5}>
            <FormLabel>Date</FormLabel>
            <CalendarPicker
              mode="single"
              selected={date}
              onSelect={(value) => { setDate(value); setTime(''); }}
              disablePast
              toDate={lastDay}
              disabled={(day) => day > lastDay}
              borderWidth="1px"
              borderRadius="md"
            />
            {date && <FormHelperText>{naturalDate(date)}</FormHelperText>}
            <FormErrorMessage>{errors.date}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={submitted && Boolean(errors.time)} mb={6}>
            <FormLabel htmlFor="inspection-time">Time</FormLabel>
            <Select id="inspection-time" placeholder={date ? 'Choose a time' : 'Choose a date first'} value={time}
              onChange={(e) => setTime(e.target.value)} isDisabled={!date}>
              {slots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
            </Select>
            <FormHelperText>Inspections run from 8:00 am to 6:00 pm.</FormHelperText>
            <FormErrorMessage>{errors.time}</FormErrorMessage>
          </FormControl>

          <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} size="lg" w="100%" isLoading={schedule.loading} loadingText="Scheduling">
            Schedule inspection
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default CheckoutInspection;
