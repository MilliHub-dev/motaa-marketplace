// The "Auction history" part of the VIN checker: photos and details from the US auction (Copart / IAAI) where the
// car was sold, from GET /vin/<VIN>/auction/. Loaded only when a record is found (it pulls in the photo carousel).
import { Badge, Box, Flex, Heading, Icon, List, ListItem, SimpleGrid, Text } from '@chakra-ui/react';
import { Gavel, Gauge, Hash, MapPin, TriangleAlert, Palette } from 'lucide-react';
import { ImageCarousel } from '.';
import { SERVER_ORIGIN } from '../config';
import {
  auctionHistoryLine, auctionOdometer, auctionPhotoAlt, auctionPhotoUrl, auctionSaleLine,
} from '../utils/vin';

function Fact({ icon, label, value }) {
  if (!value) return null;
  return (
    <Flex gap={2.5} align="start" bg="gray.50" borderWidth="1px" borderColor="gray.100" rounded="xl" px={3} py={2.5} minW={0}>
      <Icon as={icon} boxSize="18px" color="primary" mt={0.5} flexShrink={0} aria-hidden="true" />
      <Box minW={0}>
        <Text as="dt" fontSize="11px" textTransform="uppercase" letterSpacing="wider" color="gray.500">{label}</Text>
        <Text as="dd" fontWeight="600" color="gray.800" fontSize="sm" wordBreak="break-word">{value}</Text>
      </Box>
    </Flex>
  );
}

export default function VinAuction({ record }) {
  const photos = (Array.isArray(record?.photos) ? record.photos : [])
    .map((path) => ({ url: auctionPhotoUrl(path, SERVER_ORIGIN) }))
    .filter((photo) => photo.url);
  const history = (Array.isArray(record?.history) ? record.history : []).filter((row) => auctionHistoryLine(row));
  const earlier = history.filter((row) => !(row.lot_number && row.lot_number === record?.lot_number && row.date === record?.sale_date));

  return (
    <Box as="section" aria-labelledby="vin-auction-title" mt={8} pt={6} borderTopWidth="1px" borderColor="gray.100">
      <Flex align="center" gap={2} mb={1} flexWrap="wrap">
        <Icon as={Gavel} boxSize="20px" color="primary" aria-hidden="true" />
        <Heading as="h3" id="vin-auction-title" fontSize="xl" color="secondary">Auction history</Heading>
        {record?.platform && <Badge colorScheme="purple" rounded="full" px={2} textTransform="none">{record.platform}</Badge>}
      </Flex>
      <Text fontWeight="600" color="gray.800" mb={1}>{auctionSaleLine(record)}</Text>
      {record?.title && <Text fontSize="sm" color="gray.600" mb={4}>{record.title}</Text>}

      {photos.length > 0 && (
        <Box mb={2}>
          <ImageCarousel images={photos} lazy height={{ base: '220px', md: '320px' }}
            altFor={(index, total) => auctionPhotoAlt(record, index, total)} />
          <Text fontSize="xs" color="gray.500">
            Photos from the US auction where this car was sold. The car may have been repaired since.
          </Text>
        </Box>
      )}

      <SimpleGrid as="dl" columns={{ base: 1, sm: 2 }} spacing={{ base: 2, sm: 3 }} mt={4}>
        <Fact icon={TriangleAlert} label="Damage" value={record?.damage} />
        <Fact icon={Gauge} label="Odometer" value={auctionOdometer(record?.odometer_km, record?.odometer_mi)} />
        <Fact icon={MapPin} label="Auction location" value={record?.location} />
        <Fact icon={Hash} label="Lot number" value={record?.lot_number} />
        <Fact icon={Palette} label="Colour" value={record?.color} />
      </SimpleGrid>

      {earlier.length > 0 && (
        <Box mt={5}>
          <Text fontWeight="700" fontSize="sm" color="gray.700" mb={2}>Other auction sales</Text>
          <List spacing={1.5} fontSize="sm" color="gray.700">
            {earlier.map((row, index) => (
              <ListItem key={`${row.platform}-${row.lot_number}-${row.date}-${index}`} pl={3} borderLeftWidth="2px" borderColor="gray.200">
                {auctionHistoryLine(row)}
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
