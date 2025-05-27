"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Heading,
  Icon,
  Image,
  Input,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
} from "@chakra-ui/react"
import { ChevronDown, Info, Minus, Zap } from "react-feather"

const BoostProfile = () => {
  const [selectedBoosts, setSelectedBoosts] = useState({
    visibility: true,
    homepage: true,
    search: false,
  })

  const [durations, setDurations] = useState({
    visibility: "2 days",
    homepage: "10 days",
    search: "0 days",
  })

  const handleBoostToggle = (boostType) => {
    setSelectedBoosts({
      ...selectedBoosts,
      [boostType]: !selectedBoosts[boostType],
    })
  }

  const handleDurationChange = (boostType, value) => {
    setDurations({
      ...durations,
      [boostType]: value,
    })
  }

  const totalAmount = 56765.0

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {/* Header */}
      <Box mb={6}>
        <Heading as="h1" size="lg" mb={1}>
          Boost your Profile
        </Heading>
        <Text color="gray.600">Boost your profile to improve visibility and get clients</Text>
      </Box>

      {/* Tabs */}
      <Tabs variant="unstyled" mb={6}>
        <TabList borderBottom="1px solid" borderColor="gray.200">
          <Tab
            fontWeight="medium"
            color="gray.900"
            _selected={{
              color: "blue.500",
              borderBottom: "2px solid",
              borderColor: "blue.500",
            }}
            pb={3}
            mr={4}
          >
            New Campaign
          </Tab>
          <Tab
            fontWeight="medium"
            color="gray.600"
            _selected={{
              color: "blue.500",
              borderBottom: "2px solid",
              borderColor: "blue.500",
            }}
            pb={3}
          >
            Saved
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0} pt={6}>
            {/* Profile Card */}
            <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4} mb={6}>
              <Flex align="center">
                <Box mr={4}>
                  <Image
                    src="https://via.placeholder.com/60"
                    alt="Kingsley Okafor"
                    borderRadius="full"
                    boxSize="60px"
                    objectFit="cover"
                  />
                </Box>
                <Box>
                  <Heading as="h3" size="md" fontWeight="semibold" mb={1}>
                    Kingsley Okafor
                  </Heading>
                  <Text color="gray.600" fontSize="sm" mb={1}>
                    LAGOS, NIGERIA
                  </Text>
                  <Flex align="center" fontSize="sm" color="gray.500">
                    <Text>09012345678</Text>
                    <Text mx={2}>•</Text>
                    <Text>sales@costa.com</Text>
                  </Flex>
                </Box>
              </Flex>
            </Box>

            {/* Boost Options */}
            <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden" mb={6}>
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th pl={4} py={4}>
                      <Flex align="center">
                        <Icon as={Minus} boxSize={4} mr={2} />
                        Boost Type
                      </Flex>
                    </Th>
                    <Th py={4}>Description</Th>
                    <Th py={4}>Duration</Th>
                    <Th py={4}></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td pl={4}>
                      <Checkbox
                        isChecked={selectedBoosts.visibility}
                        onChange={() => handleBoostToggle("visibility")}
                        colorScheme="blue"
                      >
                        Visibility Boost (General)
                      </Checkbox>
                    </Td>
                    <Td>Appears in the homepage carousel</Td>
                    <Td>
                      <Select
                        value={durations.visibility}
                        onChange={(e) => handleDurationChange("visibility", e.target.value)}
                        w="120px"
                        icon={<ChevronDown size={16} />}
                      >
                        <option value="1 day">1 day</option>
                        <option value="2 days">2 days</option>
                        <option value="3 days">3 days</option>
                        <option value="7 days">7 days</option>
                      </Select>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="More information"
                        icon={<Info size={16} />}
                        variant="ghost"
                        color="gray.400"
                      />
                    </Td>
                  </Tr>
                  <Tr>
                    <Td pl={4}>
                      <Checkbox
                        isChecked={selectedBoosts.homepage}
                        onChange={() => handleBoostToggle("homepage")}
                        colorScheme="blue"
                      >
                        Homepage Featured
                      </Checkbox>
                    </Td>
                    <Td>Ranks in the top 5 search results</Td>
                    <Td>
                      <Select
                        value={durations.homepage}
                        onChange={(e) => handleDurationChange("homepage", e.target.value)}
                        w="120px"
                        icon={<ChevronDown size={16} />}
                      >
                        <option value="5 days">5 days</option>
                        <option value="10 days">10 days</option>
                        <option value="15 days">15 days</option>
                        <option value="30 days">30 days</option>
                      </Select>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="More information"
                        icon={<Info size={16} />}
                        variant="ghost"
                        color="gray.400"
                      />
                    </Td>
                  </Tr>
                  <Tr>
                    <Td pl={4}>
                      <Checkbox
                        isChecked={selectedBoosts.search}
                        onChange={() => handleBoostToggle("search")}
                        colorScheme="blue"
                      >
                        Search Top Spot
                      </Checkbox>
                    </Td>
                    <Td>Listed in a dedicated trending section</Td>
                    <Td>
                      <Select
                        value={durations.search}
                        onChange={(e) => handleDurationChange("search", e.target.value)}
                        w="120px"
                        icon={<ChevronDown size={16} />}
                      >
                        <option value="0 days">0 days</option>
                        <option value="3 days">3 days</option>
                        <option value="7 days">7 days</option>
                        <option value="14 days">14 days</option>
                      </Select>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="More information"
                        icon={<Info size={16} />}
                        variant="ghost"
                        color="gray.400"
                      />
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>

            {/* Promo Code */}
            <Flex gap={4} mb={6} direction={{ base: "column", md: "row" }}>
              <Input placeholder="Enter Promo Code" borderColor="gray.200" flex={1} />
              <Button colorScheme="blue" minW={{ base: "full", md: "100px" }}>
                Apply
              </Button>
            </Flex>

            <Divider mb={6} />

            {/* Total */}
            <Flex justify="space-between" align="center" mb={6}>
              <Text fontSize="xl" fontWeight="bold">
                Total:
              </Text>
              <Text fontSize="xl" fontWeight="bold">
                ₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </Text>
            </Flex>

            {/* Action Buttons */}
            <VStack spacing={3} mb={6}>
              <Button
                colorScheme="green"
                size="lg"
                w="full"
                h="50px"
                leftIcon={<Zap size={20} />}
                bg="#4CAF50"
                _hover={{ bg: "#43A047" }}
              >
                Boost Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                w="full"
                h="50px"
                color="blue.500"
                borderColor="transparent"
                bg="blue.50"
                _hover={{ bg: "blue.100" }}
              >
                CANCEL
              </Button>
            </VStack>
          </TabPanel>

          <TabPanel>
            <Box p={10} textAlign="center" color="gray.500">
              No saved campaigns yet.
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default BoostProfile

