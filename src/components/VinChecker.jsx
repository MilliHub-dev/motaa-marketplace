// "Check a VIN" on the landing page: decodes a car's VIN into its make, model, year and specs
// using NHTSA's free vPIC database (the US government's VIN decoder), straight from the browser, then looks for the
// car's US auction record (Copart / IAAI photos and sale history) on the Motaa API without holding up the specs.
import { lazy, Suspense, useRef, useState } from 'react';
import {
  Alert, AlertDescription, AlertIcon, Badge, Box, Button, Container, Flex, FormControl, FormErrorMessage, FormLabel, Grid,
  Heading, Icon, Input, InputGroup, InputRightElement, SimpleGrid, Skeleton, Spinner, Text, VStack,
} from '@chakra-ui/react';
import { Link as RLink } from 'react-router-dom';
import {
  Calendar, Car, CircleCheck, Cog, DoorOpen, FileText, Flag, Fuel, Gauge, Layers, PanelTop, Route, ScanSearch, Search,
  ShieldCheck, Tag, TriangleAlert, Users,
} from 'lucide-react';
import { VIN_API, auctionQuery, cleanVin, summariseVin, vinProblem } from '../utils/vin';
import { API_URL } from '../config';

// the photo carousel is only downloaded when there is an auction record to show
const VinAuction = lazy(() => import('./VinAuction'));

const SAMPLE_VIN = '1HGCM82633A004352';
const ROW_ICONS = {
  Year: Calendar, Make: Car, Model: Tag, Trim: Layers, Body: Car, Engine: Gauge, Fuel, Transmission: Cog,
  Drive: Route, Doors: DoorOpen, Seats: Users, 'Made in': Flag,
};
const WHERE = [
  { icon: PanelTop, text: 'On the dashboard, at the bottom of the windscreen' },
  { icon: DoorOpen, text: "On the driver's door frame" },
  { icon: FileText, text: "In the car's papers and customs documents" },
];
const BENEFITS = ['Year, make, model and trim', 'Engine, fuel and transmission', 'Spot details that don’t match the listing'];

function Spec({ label, value }) {
  return (
    <Flex as="div" gap={{ base: 2, sm: 3 }} align="center" bg="gray.50" borderWidth="1px" borderColor="gray.100" rounded="xl" px={{ base: 2.5, sm: 3 }} py={2.5} minW={0}>
      <Flex boxSize={{ base: '30px', sm: '36px' }} rounded="lg" bg="white" color="primary" align="center" justify="center" flexShrink={0} boxShadow="xs">
        <Icon as={ROW_ICONS[label] || Car} boxSize="18px" aria-hidden="true" />
      </Flex>
      <Box minW={0}>
        <Text as="dt" fontSize="11px" textTransform="uppercase" letterSpacing="wider" color="gray.500">{label}</Text>
        <Text as="dd" fontWeight="600" color="gray.800" fontSize={{ base: 'sm', sm: 'md' }} noOfLines={2} wordBreak="break-word">{value}</Text>
      </Box>
    </Flex>
  );
}

function ResultSkeleton() {
  return (
    <Box mt={6} role="status" aria-label="Checking the VIN">
      <Skeleton h="22px" w="60%" mb={2} rounded="md" />
      <Skeleton h="14px" w="40%" mb={5} rounded="md" />
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h="58px" rounded="xl" />)}
      </SimpleGrid>
    </Box>
  );
}

export default function VinChecker() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState({ status: 'idle', result: null }); // idle | loading | done | none | failed
  const [auction, setAuction] = useState({ status: 'idle', record: null, message: '' }); // idle | loading | found | none | failed
  const auctionRequest = useRef(null);
  const lookupId = useRef(0); // a newer check replaces an older one still in flight
  const typed = cleanVin(value).length;

  /**
   * The US auction record, right after the decode (so the lookup can ask for photos of a similar car by make,
   * model and year when this VIN has none). One lookup per check; it never hides the specs.
   */
  async function lookUpAuction(vin, decoded) {
    auctionRequest.current?.abort();
    const controller = new AbortController();
    auctionRequest.current = controller;
    setAuction({ status: 'loading', record: null, message: '' });
    try {
      const query = auctionQuery(decoded);
      const response = await fetch(`${API_URL}/vin/${encodeURIComponent(vin)}/auction/${query ? `?${query}` : ''}`,
        { signal: controller.signal, headers: { Accept: 'application/json' } });
      let body = null;
      try { body = await response.json(); } catch { /* not JSON */ }
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setAuction({ status: 'failed', record: null, message: response.status === 503 ? (body?.message || '') : '' });
        return;
      }
      const record = body?.data;
      if (record?.found) setAuction({ status: 'found', record, message: '' });
      // no record: photos of this exact car from a US dealer listing, else of a similar car
      else setAuction({ status: 'none', record: null, dealer: record?.dealer?.photos?.length ? record.dealer : null, similar: record?.similar || null, message: '' });
    } catch (err) {
      if (err?.name !== 'AbortError') setAuction({ status: 'failed', record: null, message: '' });
    }
  }

  async function lookUp(raw) {
    const problem = vinProblem(raw);
    setError(problem);
    if (problem) return;
    const vin = cleanVin(raw);
    const id = ++lookupId.current;
    setState({ status: 'loading', result: null });
    auctionRequest.current?.abort();
    setAuction({ status: 'idle', record: null, message: '' });
    let summary = null;
    try {
      const response = await fetch(`${VIN_API}/${encodeURIComponent(vin)}?format=json`);
      if (!response.ok) throw new Error(String(response.status));
      const body = await response.json();
      summary = summariseVin(body?.Results?.[0], vin);
      if (id !== lookupId.current) return;
      setState(summary ? { status: 'done', result: summary } : { status: 'none', result: null });
    } catch {
      if (id !== lookupId.current) return;
      setState({ status: 'failed', result: null });
    }
    // then the auction record (with make/model/year when the decode found them, for similar-car photos)
    lookUpAuction(vin, summary);
  }

  const result = state.result;
  const carName = result ? [result.make, result.model].filter(Boolean).join(' ') : '';

  return (
    <Box
      as="section" id="vin-check" aria-labelledby="vin-check-title" position="relative" overflow="hidden" scrollMarginTop="90px"
      py={{ base: 12, md: 20 }} bgGradient="linear(135deg, #0065B5 0%, #0A4C8C 55%, #1C3D5A 100%)"
    >
      {/* soft shapes for depth */}
      <Box position="absolute" top="-120px" right="-80px" boxSize="380px" rounded="full" bg="whiteAlpha.100" pointerEvents="none" />
      <Box position="absolute" bottom="-140px" left="-100px" boxSize="320px" rounded="full" bg="rgba(253,209,83,0.12)" pointerEvents="none" />

      <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
        <Grid templateColumns={{ base: '1fr', lg: '5fr 7fr' }} gap={{ base: 8, lg: 14 }} alignItems="start">
          {/* the pitch */}
          <Box color="white" pt={{ lg: 4 }}>
            <Badge bg="tertiary" color="secondary" rounded="full" px={3} py={1} fontSize="xs" letterSpacing="wider" mb={4}>
              Free VIN check
            </Badge>
            <Heading as="h2" id="vin-check-title" fontSize={{ base: '30px', md: '40px' }} lineHeight={1.15} mb={4}>
              Know the car <Text as="span" color="tertiary">before you buy it</Text>
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="whiteAlpha.900" mb={6}>
              Every car has a 17-character VIN. Enter it to see how the car was built, and make sure it matches what the seller told you.
            </Text>
            <VStack align="stretch" spacing={3} mb={8}>
              {BENEFITS.map((text) => (
                <Flex key={text} align="center" gap={3}>
                  <Icon as={CircleCheck} boxSize="20px" color="tertiary" aria-hidden="true" />
                  <Text fontWeight="500">{text}</Text>
                </Flex>
              ))}
            </VStack>
            <Box bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.300" rounded="2xl" p={4}>
              <Text fontWeight="700" mb={3}>Where to find the VIN</Text>
              <VStack align="stretch" spacing={2.5}>
                {WHERE.map(({ icon, text }) => (
                  <Flex key={text} align="center" gap={3} fontSize="sm" color="whiteAlpha.900">
                    <Flex boxSize="30px" rounded="lg" bg="whiteAlpha.200" align="center" justify="center" flexShrink={0}>
                      <Icon as={icon} boxSize="16px" aria-hidden="true" />
                    </Flex>
                    {text}
                  </Flex>
                ))}
              </VStack>
            </Box>
          </Box>

          {/* the checker */}
          {/* minW 0: a wide child (the photo thumbnails) must scroll inside the card, not widen the grid column */}
          <Box bg="white" rounded="3xl" p={{ base: 5, md: 8 }} boxShadow="0 30px 60px -20px rgba(4, 30, 70, 0.55)" minW={0}>
            <Box as="form" noValidate onSubmit={(event) => { event.preventDefault(); lookUp(value); }}>
              <FormControl isInvalid={Boolean(error)}>
                <FormLabel htmlFor="vin-input" fontWeight="700" fontSize="lg" color="secondary" mb={3}>Enter the VIN</FormLabel>
                <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
                  <InputGroup size="lg">
                    <Input
                      id="vin-input" value={value} maxLength={24} autoComplete="off" spellCheck={false}
                      placeholder="17 characters, e.g. 1HGCM82633A004352" fontFamily="mono" letterSpacing="0.08em" textTransform="uppercase"
                      bg="gray.50" borderColor="gray.200" rounded="xl" pr="64px" _placeholder={{ textTransform: 'none', letterSpacing: 'normal', fontFamily: 'body', fontSize: 'md' }}
                      focusBorderColor="primary"
                      onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
                      aria-describedby="vin-count"
                    />
                    <InputRightElement w="64px" pointerEvents="none">
                      <Text id="vin-count" fontSize="xs" fontWeight="600" color={typed === 17 ? 'green.600' : 'gray.400'} aria-label={`${typed} of 17 characters`}>
                        {typed}/17
                      </Text>
                    </InputRightElement>
                  </InputGroup>
                  <Button type="submit" size="lg" rounded="xl" bg="primary" color="white" _hover={{ bg: '#00579C' }} _active={{ bg: '#004C88' }}
                    minW={{ sm: '150px' }} leftIcon={<Search size={18} aria-hidden="true" />} isLoading={state.status === 'loading'} loadingText="Checking">
                    Check VIN
                  </Button>
                </Flex>
                {error ? <FormErrorMessage>{error}</FormErrorMessage> : (
                  <Text fontSize="sm" color="gray.500" mt={3}>
                    Don't have one to hand?{' '}
                    <Button variant="link" size="sm" color="primary" fontWeight="600" verticalAlign="baseline"
                      onClick={() => { setValue(SAMPLE_VIN); lookUp(SAMPLE_VIN); }}>
                      Try a sample VIN
                    </Button>
                  </Text>
                )}
              </FormControl>
            </Box>

            <Box aria-live="polite">
              {state.status === 'idle' && (
                <Flex mt={8} direction="column" align="center" textAlign="center" color="gray.500" py={6} borderWidth="2px" borderStyle="dashed" borderColor="gray.200" rounded="2xl">
                  <Flex boxSize="56px" rounded="full" bg="blue.50" color="primary" align="center" justify="center" mb={3}>
                    <Icon as={ScanSearch} boxSize="26px" aria-hidden="true" />
                  </Flex>
                  <Text fontWeight="600" color="gray.700">The car's details will appear here</Text>
                  <Text fontSize="sm" maxW="340px">Year, make, model, engine and more, in a few seconds.</Text>
                </Flex>
              )}
              {state.status === 'loading' && <ResultSkeleton />}
              {state.status === 'none' && (
                <Alert status="warning" rounded="xl" mt={6} alignItems="flex-start"><AlertIcon />
                  <AlertDescription>We couldn't find details for this VIN. Check it was typed correctly. Some cars built for markets outside North America aren't in the database.</AlertDescription>
                </Alert>
              )}
              {state.status === 'failed' && (
                <Alert status="error" rounded="xl" mt={6}><AlertIcon /><AlertDescription>The VIN check isn't available right now. Please try again in a moment.</AlertDescription></Alert>
              )}
              {state.status === 'done' && result && (
                <Box mt={7}>
                  <Flex gap={4} align="center" mb={5}>
                    <Flex boxSize="52px" rounded="2xl" bg="blue.50" color="primary" align="center" justify="center" flexShrink={0}>
                      <Icon as={Car} boxSize="26px" aria-hidden="true" />
                    </Flex>
                    <Box minW={0} flex={1}>
                      <Heading as="h3" fontSize={{ base: 'xl', md: '2xl' }} color="secondary" noOfLines={2}>{result.name}</Heading>
                      <Flex align="center" gap={2} mt={1} flexWrap="wrap">
                        <Text fontFamily="mono" fontSize="sm" color="gray.500" letterSpacing="0.06em">{result.vin}</Text>
                        {result.checkDigit ? (
                          <Badge colorScheme="green" rounded="full" px={2} display="inline-flex" alignItems="center" gap={1} textTransform="none">
                            <Icon as={ShieldCheck} boxSize="12px" aria-hidden="true" /> VIN checks out
                          </Badge>
                        ) : (
                          <Badge colorScheme="orange" rounded="full" px={2} display="inline-flex" alignItems="center" gap={1} textTransform="none">
                            <Icon as={TriangleAlert} boxSize="12px" aria-hidden="true" /> Check digit mismatch
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  </Flex>

                  {!result.checkDigit && (
                    <Alert status="warning" rounded="xl" mb={4} fontSize="sm"><AlertIcon />
                      <AlertDescription>The VIN's check digit doesn't add up. It may be mistyped, or the car was built for a market that doesn't use one. Compare it with the car itself.</AlertDescription>
                    </Alert>
                  )}

                  <SimpleGrid as="dl" columns={2} spacing={{ base: 2, sm: 3 }}>
                    {result.rows.map(([label, detail]) => <Spec key={label} label={label} value={detail} />)}
                  </SimpleGrid>

                  {carName && (
                    <Button as={RLink} to={`/search/cars/?find=${encodeURIComponent(carName)}`} mt={6} w="100%" size="lg" rounded="xl"
                      bg="tertiary" color="secondary" _hover={{ bg: '#F6C53B' }} rightIcon={<Search size={18} aria-hidden="true" />}>
                      Find a {carName} on Motaa
                    </Button>
                  )}
                  <Text fontSize="xs" color="gray.500" mt={4}>
                    From the US government's NHTSA vehicle database: how the car was built. This is not an accident, mileage or ownership history.
                  </Text>
                </Box>
              )}

              {/* the US auction record: after the specs, or on its own when the decode found nothing */}
              {['done', 'none', 'failed'].includes(state.status) && auction.status !== 'idle' && (
                <Box>
                  {auction.status === 'loading' && (
                    <Flex mt={6} align="center" gap={3} color="gray.600" fontSize="sm" role="status">
                      <Spinner size="sm" color="primary" /> Checking US auction records…
                    </Flex>
                  )}
                  {auction.status === 'found' && (
                    <Suspense fallback={<Flex mt={6} align="center" gap={3} color="gray.600" fontSize="sm"><Spinner size="sm" color="primary" /> Loading auction photos…</Flex>}>
                      <VinAuction record={auction.record} />
                    </Suspense>
                  )}
                  {auction.status === 'none' && (
                    <Text mt={5} fontSize="sm" color="gray.600">
                      {auction.dealer ? 'No US auction record for this VIN, but we found dealer photos.' : 'No US auction record found for this VIN.'}
                    </Text>
                  )}
                  {auction.status === 'none' && auction.dealer && (
                    <Suspense fallback={<Flex mt={4} align="center" gap={3} color="gray.600" fontSize="sm"><Spinner size="sm" color="primary" /> Loading photos…</Flex>}>
                      <VinAuction dealer={auction.dealer} carName={result?.name || ''} />
                    </Suspense>
                  )}
                  {auction.status === 'none' && !auction.dealer && auction.similar && (
                    <Suspense fallback={<Flex mt={4} align="center" gap={3} color="gray.600" fontSize="sm"><Spinner size="sm" color="primary" /> Loading photos…</Flex>}>
                      <VinAuction record={auction.similar} similar />
                    </Suspense>
                  )}
                  {auction.status === 'failed' && (
                    <Text mt={5} fontSize="sm" color="gray.600">{auction.message || "We couldn't check US auction records just now."}</Text>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
}
