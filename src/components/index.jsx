import { Box, Flex, IconButton, Heading, Badge, Text, Divider, Stack, HStack, VStack, PinInput, PinInputField, Card, CardBody, Button, Input, CardHeader, Image, Icon, Grid, Modal, ModalOverlay, ModalContent, ModalBody, useDisclosure, Tag, AspectRatio, Avatar, Select, useColorModeValue, BreadcrumbItem, BreadcrumbLink, Breadcrumb, SimpleGrid, Popover, PopoverTrigger, PopoverContent, PopoverBody, Progress, List, ListItem, Alert, AlertTitle, AlertIcon, useOutsideClick, ModalCloseButton } from '@chakra-ui/react';
import { useContext, useEffect, useState, useRef } from 'react';
import { RiGasStationLine, RiSearch2Line } from 'react-icons/ri'
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa6'
import { LuMapPin } from 'react-icons/lu'
import { RxTimer } from 'react-icons/rx';
import { TbManualGearbox } from 'react-icons/tb';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { GlobalStore } from '../App';
import { CarFront, Leaf, Star } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, StarIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import { addMonths, endOfMonth, format, isSameDay, isSameMonth, isToday, startOfMonth, subMonths } from "date-fns"
import { MdWarning, MdLock } from "react-icons/md"
import Dojah from 'react-dojah';


import { DOJAH } from '../config';
export const ComboBox = ({ defaultOptions, onSelect }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(defaultOptions);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const ref = useRef(null);

  useOutsideClick({
    ref,
    handler: () => setIsOpen(false),
  });

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    const matched = defaultOptions.filter(option =>
      option.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(matched);
    setIsOpen(true);
  };

  const handleSelect = (value) => {
    setInputValue(value);
    setSelected(value);
    setIsOpen(false);
    onSelect(value)
  };

  const showCreateOption =
    inputValue.trim() !== '' &&
    !defaultOptions.some(
      option => option.toLowerCase() === inputValue.trim().toLowerCase()
    );

  return (
    <VStack ref={ref} align="stretch" position="relative" spacing={1}>
      <Input
        placeholder="Select an option or type..."
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && (filteredOptions.length > 0 || showCreateOption) && (
        <Box
          position="absolute"
          top="100%"
          left="0"
          right="0"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
          zIndex="1"
          maxHeight="200px"
          overflowY="auto"
        >
          <List spacing={0}>
            {filteredOptions.map(option => (
              <ListItem
                key={option}
                px={4}
                py={2}
                cursor="pointer"
                _hover={{ bg: 'gray.100' }}
                onClick={() => handleSelect(option)}
              >
                {option}
              </ListItem>
            ))}
            {showCreateOption && (
              <ListItem
                px={4}
                py={2}
                bg="gray.50"
                color="blue.600"
                fontStyle="italic"
                cursor="pointer"
                _hover={{ bg: 'blue.50' }}
                onClick={() => handleSelect(inputValue.trim())}
              >
                Create "{inputValue.trim()}"
              </ListItem>
            )}
          </List>
        </Box>
      )}
      {selected && (
        <Text fontSize="sm" color="gray.600">
          Selected: <strong>{selected}</strong>
        </Text>
      )}
    </VStack>
  );
}


/**
 * businessType: 'dealership' | 'mechanic' (keys of DOJAH.appIds / DOJAH.widgetIds).
 * onVerification(type, data) receives the Dojah events ('success', 'error', 'close', ...).
 */
export const VerificationNotice = ({ businessType, user, onVerification, verificationStatus, ...props })=>{
  const [beginVerification, setVerificationState] = useState(false);
  const { api, notifyError } = useContext(GlobalStore);
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  async function startVerification() {
    setStarting(true);
    try {
      const body = await api.post('/accounts/verify-business/session/', {});
      setSession(body.data);
      setVerificationState(true);
    } catch (error) {
      notifyError(error, "Couldn't start verification");
    } finally {
      setStarting(false);
    }
  }
  const appId = DOJAH.appIds?.[businessType];
  const widgetId = DOJAH.widgetIds?.[businessType];
  const configured = Boolean(DOJAH.publicKey && appId && widgetId);

  function handleResponse(type, data){
    // unmount the widget when it finishes so the button can start a new attempt
    if (['success', 'error', 'close'].includes(type)) setVerificationState(false);
    onVerification?.(type, data);
  }

  return(
    <Alert my={4} status="warning" rounded="lg" alignItems="flex-start" {...props}>
      <AlertIcon as={MdWarning} boxSize={6} />
      <Flex width="100%" alignItems="center" flexWrap="wrap" justify="space-between" gap={3}>
        <AlertTitle fontSize="sm" fontWeight="600" flex="1 1 260px" whiteSpace="normal">
          You haven't completed your business verification yet. Verify your business to {
            businessType === 'dealership' ? 'add and publish listings' : 'add services'
          }.
          {verificationStatus === 'pending' && (
            <Text as="span" display="block" fontWeight="normal" mt={1}>
              Verification is in progress. This page updates automatically when a result arrives.
            </Text>
          )}
          {!configured && (
            <Text as="span" display="block" fontWeight="normal" mt={1}>
              Online verification is unavailable right now. Please contact Motaa support to verify your business.
            </Text>
          )}
        </AlertTitle>
        <Button
          onClick={startVerification}
          isLoading={beginVerification || starting}
          loadingText="Verification open"
          isDisabled={!configured}
          colorScheme="yellow"
          variant="outline"
          size="sm"
        >
          Complete verification
        </Button>
        {
          beginVerification && configured &&
          <Dojah
            response={handleResponse}
            publicKey={DOJAH.publicKey}
            appID={appId}
            metadata={session?.metadata}
            type="custom"
            config={{
              widget_id: widgetId,
            }}
          />
        }
      </Flex>
    </Alert>
  )
}

// Status Badge Component
export const StatusBadge = ({ status }) => {
  let color, bg, icon

  switch (status) {
    case "Successful":
      color = "green.600"
      bg = "green.50"
      break
    case "Locked":
      color = "blue.500"
      bg = "blue.50"
      icon = <MdLock size={12} style={{ marginRight: "4px" }} />
      break
    case "Pending":
      color = "orange.500"
      bg = "orange.50"
      break
    default:
      color = "gray.500"
      bg = "gray.50"
  }

  return (
    <Badge
      display="flex"
      alignItems="center"
      px={3}
      py={1}
      borderRadius="full"
      color={color}
      bg={bg}
      fontWeight="medium"
      fontSize="sm"
    >
      {icon}
      {status}
    </Badge>
  )
}


/**
 * Average per-category star ratings.
 * `ratings` may be a list of review rating objects ({communication: 4, ...})
 * or one already-averaged object (DealershipSerializer.ratings).
 */
function averageRatings(ratings) {
  const list = Array.isArray(ratings) ? ratings : (ratings && typeof ratings === 'object' ? [ratings] : []);
  const totals = {};
  for (const rating of list) {
    if (!rating || typeof rating !== 'object') continue;
    for (const [key, stars] of Object.entries(rating)) {
      const value = Number(stars);
      if (!Number.isFinite(value)) continue;
      totals[key] = totals[key] || { sum: 0, count: 0 };
      totals[key].sum += value;
      totals[key].count += 1;
    }
  }
  return Object.fromEntries(
    Object.entries(totals).map(([key, { sum, count }]) => [key, Math.round((sum / count) * 10) / 10])
  );
}

export const RatingCard = ({ avg_rating, ratings, reviewCount }) => {
  const categories = averageRatings(ratings);
  const average = Number(avg_rating);
  const hasAverage = Number.isFinite(average) && average > 0;

  return(
    <Box mb={8}>
      <Heading as="h2" size="md" mb={4} fontWeight={'500'}>Ratings & reviews</Heading>
      {hasAverage ? (
        <HStack spacing={2} mb={6}>
          <Heading as="p" size="lg">{average.toFixed(1)}</Heading>
          <Icon as={StarIcon} color="yellow.400" w={6} h={6} aria-hidden="true" />
          {Number.isFinite(reviewCount) && (
            <Text color="gray.500">({reviewCount} review{reviewCount === 1 ? '' : 's'})</Text>
          )}
        </HStack>
      ) : (
        <Text color="gray.600" mb={4}>No ratings yet.</Text>
      )}

      {Object.keys(categories).length > 0 && (
        <VStack align="stretch" spacing={2} mb={8}>
          {Object.entries(categories).map(([category, stars]) => (
            <SimpleGrid key={category} columns={2} alignItems="center" spacing={2}>
              <Text textTransform="capitalize">{category.replace(/-/g, ' ')}</Text>
              <Flex alignItems="center" gap={2}>
                <Progress size="sm" value={stars * 20} borderRadius="lg" flex={1} colorScheme="blue" aria-label={`${category.replace(/-/g, ' ')}: ${stars} out of 5`} />
                <Text color="gray.500" fontSize="sm">{stars}</Text>
              </Flex>
            </SimpleGrid>
          ))}
        </VStack>
      )}
    </Box>
  )
}


// Review Card Component
export function ReviewCard({ review }) {
  const stars = Number(review?.avg_rating) || 0;
  const name = review?.reviewer?.name || 'Motaa customer';

  return (
    <Box pb={6} borderBottom="1px solid lavender">
      <HStack mb={2} align="flex-start">
        <Avatar size="sm" name={name} src={review?.reviewer?.image || undefined} />
        <VStack spacing={0} align="flex-start" minW={0}>
          <Flex gap={2} alignItems="center" flexWrap="wrap">
            <Text fontWeight="bold">{name}</Text>
            <HStack spacing={1} role="img" aria-label={`Rated ${stars} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  as={Star}
                  color={i < Math.round(stars) ? "yellow.400" : "gray.300"}
                  fill={i < Math.round(stars) ? "currentColor" : "none"}
                  w={3}
                  h={3}
                  aria-hidden="true"
                />
              ))}
            </HStack>
          </Flex>
          {review?.date && <Text fontSize="sm" color="gray.500">{review.date}</Text>}
        </VStack>
      </HStack>
      {review?.comment && (
        <Text color="gray.600" fontSize="sm" whiteSpace="pre-line">
          {review.comment}
        </Text>
      )}
    </Box>
  )
}


export function CalendarPicker({
  className,
  mode = "single",
  selected,
  onSelect,
  disabled,
  initialFocus,
  numberOfMonths = 1,
  defaultMonth = new Date(),
  fromDate,
  toDate,
  disablePast = false,
  ...props
}) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const isBlocked = (day) => Boolean(disabled?.(day)) || (disablePast && day < startOfToday)
  const [month, setMonth] = useState(defaultMonth)
  const [selectedDates, setSelectedDates] = useState(() => {
    if (mode === "single" && selected instanceof Date) {
      return [selected]
    }
    if (mode === "multiple" && Array.isArray(selected)) {
      return selected
    }
    if (mode === "range" && Array.isArray(selected)) {
      return selected
    }
    return []
  })
  const [hoverDate, setHoverDate] = useState(null)

  // Generate years for the select (10 years before and after current year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  // Generate months for the select
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const handleDateSelect = (day) => {
    if (isBlocked(day)) return

    let newSelectedDates = []

    if (mode === "single") {
      newSelectedDates = [day]
    } else if (mode === "multiple") {
      newSelectedDates = [...selectedDates]
      const index = newSelectedDates.findIndex((d) => d instanceof Date && isSameDay(d, day))

      if (index !== -1) {
        newSelectedDates.splice(index, 1)
      } else {
        newSelectedDates.push(day)
      }
    } else if (mode === "range") {
      if (selectedDates.length === 0) {
        newSelectedDates = [day]
      } else if (selectedDates.length === 1) {
        const startDate = selectedDates[0]
        if (startDate instanceof Date) {
          if (day < startDate) {
            newSelectedDates = [day, startDate]
          } else {
            newSelectedDates = [startDate, day]
          }
        }
      } else {
        newSelectedDates = [day]
      }
    }

    setSelectedDates(newSelectedDates)
    onSelect?.(mode === "single" ? newSelectedDates[0] : newSelectedDates)
  }

  const handleMonthChange = (event) => {
    const value = event.target.value
    const newMonth = new Date(month)
    newMonth.setMonth(months.indexOf(value))
    setMonth(newMonth)
  }

  const handleYearChange = (event) => {
    const value = event.target.value
    const newMonth = new Date(month)
    newMonth.setFullYear(Number.parseInt(value))
    setMonth(newMonth)
  }

  const isDateSelected = (day) => {
    if (mode === "single") {
      return selectedDates[0] instanceof Date && isSameDay(selectedDates[0], day)
    }

    if (mode === "multiple") {
      return selectedDates.some((d) => d instanceof Date && isSameDay(d, day))
    }

    if (mode === "range") {
      if (selectedDates.length === 1) {
        return selectedDates[0] instanceof Date && isSameDay(selectedDates[0], day)
      }

      if (selectedDates.length === 2) {
        const [start, end] = selectedDates
        return day >= start && day <= end
      }
    }

    return false
  }

  const isDateInRange = (day) => {
    if (mode !== "range" || selectedDates.length !== 2) return false

    const [start, end] = selectedDates
    return day > start && day < end
  }

  const isDateRangeStart = (day) => {
    if (mode !== "range" || selectedDates.length !== 2) return false

    const [start] = selectedDates
    return isSameDay(start, day)
  }

  const isDateRangeEnd = (day) => {
    if (mode !== "range" || selectedDates.length !== 2) return false

    const [, end] = selectedDates
    return isSameDay(end, day)
  }

  const isDateHovered = (day) => {
    if (mode !== "range" || selectedDates.length !== 1 || !hoverDate) return false

    const start = selectedDates[0]
    return (day > start && day <= hoverDate) || (day < start && day >= hoverDate)
  }

  const handleMouseEnter = (day) => {
    if (mode === "range" && selectedDates.length === 1) {
      setHoverDate(day)
    }
  }

  const handleMouseLeave = () => {
    setHoverDate(null)
  }

  // Colors
  const todayBg = useColorModeValue("tertiary", "tertiary")
  const selectedBg = useColorModeValue("primary", "primary")
  const selectedColor = useColorModeValue("white", "white")
  const inRangeBg = useColorModeValue("blue.100", "blue.700")
  const hoveredBg = useColorModeValue("tertiary", "tertiary")
  const mutedColor = useColorModeValue("gray.400", "gray.500")

  const renderCalendarMonth = (monthDate, index) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const startDate = new Date(monthStart)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    const endDate = new Date(monthEnd)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days = []
    const currentDate = startDate

    while (currentDate <= endDate) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return (
      <Box key={index} mb={8}>
        <Grid templateColumns="repeat(7, 1fr)" gap={1} textAlign="center" fontSize="xs" mb={2}>
          <Box>Su</Box>
          <Box>Mo</Box>
          <Box>Tu</Box>
          <Box>We</Box>
          <Box>Th</Box>
          <Box>Fr</Box>
          <Box>Sa</Box>
        </Grid>
        <Grid templateColumns="repeat(7, 1fr)" gap={1}>
          {days.map((day, dayIndex) => {
            const isSelected = isDateSelected(day)
            const isInRange = isDateInRange(day)
            const isRangeStart = isDateRangeStart(day)
            const isRangeEnd = isDateRangeEnd(day)
            const isHovered = isDateHovered(day)
            const isDisabled = isBlocked(day)
            const isCurrentMonth = isSameMonth(day, monthDate)

            return (
              <Button
                key={dayIndex}
                size="sm"
                variant="ghost"
                h="50px"
                w="100%"
                maxW={'60px'}
                mx="auto"
                p={0}
                fontWeight="normal"
                fontSize="lg"
                bg={
                  isSelected
                    ? selectedBg
                    : isInRange
                      ? inRangeBg
                      : isHovered
                        ? hoveredBg
                        : isToday(day)
                          ? todayBg
                          : "transparent"
                }
                color={isSelected ? selectedColor : isCurrentMonth ? "inherit" : mutedColor}
                opacity={!isCurrentMonth ? 0.5 : 1}
                borderLeftRadius={isRangeStart ? "md" : undefined}
                borderRightRadius={isRangeEnd ? "md" : undefined}
                isDisabled={isDisabled}
                onClick={() => handleDateSelect(day)}
                onMouseEnter={() => handleMouseEnter(day)}
                onMouseLeave={handleMouseLeave}
                _hover={{
                  bg: isSelected ? selectedBg : hoveredBg,
                }}
              >
                {format(day, "d")}
              </Button>
            )
          })}
        </Grid>
      </Box>
    )
  }

  return (
    <Box p={3} {...props}>
      <Flex justifyContent={{base: 'center', md: "space-between"}} flexWrap="wrap-reverse" alignItems="center" mb={4}>
        <Flex alignItems="center">
          <Select value={format(month, "MMMM")} onChange={handleMonthChange} size="sm" width="120px" mr={2}>
            {months.map((monthName) => (
              <option key={monthName} value={monthName}>
                {monthName}
              </option>
            ))}
          </Select>
          <Select value={format(month, "yyyy")} onChange={handleYearChange} size="sm" width="90px">
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </Select>
        </Flex>

        <Flex alignItems="center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(subMonths(month, 1))}
            isDisabled={fromDate ? subMonths(month, 1) < startOfMonth(fromDate) : false}
            mr={2}
          >
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())} mr={2}>
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(addMonths(month, 1))}
            isDisabled={toDate ? addMonths(month, 1) > startOfMonth(toDate) : false}
          >
            <ChevronRightIcon />
          </Button>
        </Flex>
      </Flex>
      <Box>
        {Array.from({ length: numberOfMonths }).map((_, i) => {
          const monthToRender = addMonths(month, i)
          return renderCalendarMonth(monthToRender, i)
        })}
      </Box>
    </Box>
  )
}


export function TimePicker({ value, onChange, format = "12h", showSeconds = false, ...props }) {
  // Parse initial value or set default to current time
  const parseInitialTime = () => {
    if (!value) {
      const now = new Date()
      return {
        hours: format === "12h" ? now.getHours() % 12 || 12 : now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        period: now.getHours() >= 12 ? "PM" : "AM",
      }
    }

    if (typeof value === "string") {
      // Parse time string (e.g. "10:30 AM")
      const [timePart, periodPart] = value.split(" ")
      const [hoursPart, minutesPart, secondsPart] = timePart.split(":")

      return {
        hours: Number.parseInt(hoursPart, 10),
        minutes: Number.parseInt(minutesPart, 10),
        seconds: secondsPart ? Number.parseInt(secondsPart, 10) : 0,
        period: periodPart || (Number.parseInt(hoursPart, 10) >= 12 ? "PM" : "AM"),
      }
    }

    if (value instanceof Date) {
      return {
        hours: format === "12h" ? value.getHours() % 12 || 12 : value.getHours(),
        minutes: value.getMinutes(),
        seconds: value.getSeconds(),
        period: value.getHours() >= 12 ? "PM" : "AM",
      }
    }

    return { hours: 12, minutes: 0, seconds: 0, period: "AM" }
  }

  const [time, setTime] = useState(parseInitialTime)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  // Update input value when time changes
  useEffect(() => {
    let formattedTime = `${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}`

    if (showSeconds) {
      formattedTime += `:${time.seconds.toString().padStart(2, "0")}`
    }

    if (format === "12h") {
      formattedTime += ` ${time.period}`
    }

    setInputValue(formattedTime)
  }, [time, format, showSeconds])

  // Notify parent component when time changes
  useEffect(() => {
    if (onChange) {
      let hours = time.hours

      // Convert to 24-hour format for the Date object
      if (format === "12h" && time.period === "PM" && hours < 12) {
        hours += 12
      } else if (format === "12h" && time.period === "AM" && hours === 12) {
        hours = 0
      }

      const date = new Date()
      date.setHours(hours)
      date.setMinutes(time.minutes)
      date.setSeconds(time.seconds)
      date.setMilliseconds(0)

      onChange(date)
    }
  }, [time, onChange, format])

  // Handle direct input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value)

    // Try to parse the input
    const timeRegex =
      format === "12h"
        ? /^(0?[1-9]|1[0-2]):([0-5][0-9])(?::([0-5][0-9]))?\s?(AM|PM|am|pm)$/
        : /^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/

    const match = e.target.value.match(timeRegex)

    if (match) {
      const newTime = {
        hours: Number.parseInt(match[1], 10),
        minutes: Number.parseInt(match[2], 10),
        seconds: match[3] ? Number.parseInt(match[3], 10) : 0,
        period: format === "12h" ? match[4].toUpperCase() : Number.parseInt(match[1], 10) >= 12 ? "PM" : "AM",
      }

      setTime(newTime)
    }
  }

  // Increment/decrement handlers
  const incrementHours = () => {
    setTime((prev) => ({
      ...prev,
      hours: format === "12h" ? (prev.hours % 12) + 1 : (prev.hours + 1) % 24,
    }))
  }

  const decrementHours = () => {
    setTime((prev) => ({
      ...prev,
      hours: format === "12h" ? ((prev.hours - 2 + 12) % 12) + 1 : (prev.hours - 1 + 24) % 24,
    }))
  }

  const incrementMinutes = () => {
    setTime((prev) => ({
      ...prev,
      minutes: (prev.minutes + 1) % 60,
    }))
  }

  const decrementMinutes = () => {
    setTime((prev) => ({
      ...prev,
      minutes: (prev.minutes - 1 + 60) % 60,
    }))
  }

  const incrementSeconds = () => {
    setTime((prev) => ({
      ...prev,
      seconds: (prev.seconds + 1) % 60,
    }))
  }

  const decrementSeconds = () => {
    setTime((prev) => ({
      ...prev,
      seconds: (prev.seconds - 1 + 60) % 60,
    }))
  }

  const togglePeriod = () => {
    setTime((prev) => ({
      ...prev,
      period: prev.period === "AM" ? "PM" : "AM",
    }))
  }

  // Quick time selections
  const quickTimes = [
    { label: "Morning", hours: 9, minutes: 0, period: "AM" },
    { label: "Noon", hours: 12, minutes: 0, period: "PM" },
    { label: "Afternoon", hours: 3, minutes: 0, period: "PM" },
    { label: "Evening", hours: 6, minutes: 0, period: "PM" },
    { label: "Night", hours: 9, minutes: 0, period: "PM" },
  ]

  const setQuickTime = (quickTime) => {
    setTime({
      hours: quickTime.hours,
      minutes: quickTime.minutes,
      seconds: 0,
      period: quickTime.period,
    })
  }

  // Colors
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const hoverBg = useColorModeValue("gray.100", "gray.700")
  const activeBg = useColorModeValue("blue.50", "blue.900")

  return (
    <Box {...props}>
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom" autoFocus={false}>
        <PopoverTrigger width="100%" flex={1}>
          <Flex flexDirection="row" flex={1}>
            <Text
              value={inputValue}
              textAlign="left"
              px={2}
              onClick={() => setIsOpen(true)}
              cursor="pointer"
              pr="4.5rem"
              flex={1}
              width="100%"
            >{inputValue}</Text>
            <IconButton
              aria-label="Select time"
              icon={<TimeIcon />}
              size="sm"
              flex={1}
              position="absolute"
              right="8px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={1}
              onClick={() => setIsOpen(!isOpen)}
            />
          </Flex>
        </PopoverTrigger>
        <PopoverContent width="300px" p={0}>
          <PopoverBody p={4}>
            <Flex direction="column">
              <Flex justify="space-between" mb={4}>
                <VStack spacing={2} align="center" flex={1}>
                  <IconButton
                    size="sm"
                    icon={<ChevronUpIcon />}
                    aria-label="Increment hours"
                    onClick={incrementHours}
                  />
                  <Box
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    px={3}
                    py={2}
                    textAlign="center"
                    minWidth="60px"
                  >
                    {time.hours.toString().padStart(2, "0")}
                  </Box>
                  <IconButton
                    size="sm"
                    icon={<ChevronDownIcon />}
                    aria-label="Decrement hours"
                    onClick={decrementHours}
                  />
                  <Text fontSize="sm" color="gray.500">
                    Hours
                  </Text>
                </VStack>

                <Text fontSize="xl" alignSelf="center" mx={2} mt={-4}>
                  :
                </Text>

                <VStack spacing={2} align="center" flex={1}>
                  <IconButton
                    size="sm"
                    icon={<ChevronUpIcon />}
                    aria-label="Increment minutes"
                    onClick={incrementMinutes}
                  />
                  <Box
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    px={3}
                    py={2}
                    textAlign="center"
                    minWidth="60px"
                  >
                    {time.minutes.toString().padStart(2, "0")}
                  </Box>
                  <IconButton
                    size="sm"
                    icon={<ChevronDownIcon />}
                    aria-label="Decrement minutes"
                    onClick={decrementMinutes}
                  />
                  <Text fontSize="sm" color="gray.500">
                    Minutes
                  </Text>
                </VStack>

                {showSeconds && (
                  <>
                    <Text fontSize="xl" alignSelf="center" mx={2} mt={-4}>
                      :
                    </Text>

                    <VStack spacing={2} align="center" flex={1}>
                      <IconButton
                        size="sm"
                        icon={<ChevronUpIcon />}
                        aria-label="Increment seconds"
                        onClick={incrementSeconds}
                      />
                      <Box
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        px={3}
                        py={2}
                        textAlign="center"
                        minWidth="60px"
                      >
                        {time.seconds.toString().padStart(2, "0")}
                      </Box>
                      <IconButton
                        size="sm"
                        icon={<ChevronDownIcon />}
                        aria-label="Decrement seconds"
                        onClick={decrementSeconds}
                      />
                      <Text fontSize="sm" color="gray.500">
                        Seconds
                      </Text>
                    </VStack>
                  </>
                )}

                {format === "12h" && (
                  <VStack spacing={2} align="center" flex={1}>
                    <Button
                      size="sm"
                      onClick={togglePeriod}
                      colorScheme={time.period === "AM" ? "blue" : "gray"}
                      variant={time.period === "AM" ? "solid" : "outline"}
                    >
                      AM
                    </Button>
                    <Button
                      size="sm"
                      onClick={togglePeriod}
                      colorScheme={time.period === "PM" ? "blue" : "gray"}
                      variant={time.period === "PM" ? "solid" : "outline"}
                    >
                      PM
                    </Button>
                    <Text fontSize="sm" color="gray.500">
                      Period
                    </Text>
                  </VStack>
                )}
              </Flex>

              <Box mt={4}>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Quick Select
                </Text>
                <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                  {quickTimes.map((quickTime) => (
                    <Button key={quickTime.label} size="sm" variant="outline" onClick={() => setQuickTime(quickTime)}>
                      {quickTime.label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const now = new Date()
                      setTime({
                        hours: format === "12h" ? now.getHours() % 12 || 12 : now.getHours(),
                        minutes: now.getMinutes(),
                        seconds: now.getSeconds(),
                        period: now.getHours() >= 12 ? "PM" : "AM",
                      })
                    }}
                  >
                    Now
                  </Button>
                </Grid>
              </Box>

              <HStack justifyContent="flex-end" mt={4}>
                <Button w="50%" colorScheme="blue" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  Done
                </Button>
              </HStack>
            </Flex>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  )
}


/** Grey box shown when a listing has no photo (or the photo fails to load). */
export const NoPhoto = ({ label = 'No photo available', ...props }) => (
  <Flex w="100%" h="100%" bg="gray.100" color="gray.500" direction="column" align="center" justify="center" gap={2} {...props}>
    <Icon as={CarFront} boxSize={10} aria-hidden="true" />
    <Text fontSize="sm">{label}</Text>
  </Flex>
);

/** "12,000 km" for a numeric mileage, null when unknown. */
export function formatMileage(mileage, commaInt) {
  if (mileage === null || mileage === undefined || mileage === '') return null;
  const value = Number(String(mileage).replace(/[^\d.]/g, ''));
  return Number.isFinite(value) ? `${commaInt(value)} km` : null;
}

/** " / day" style suffix for a rental's payment_cycle ('' for one-off or unknown). */
export function cycleSuffix(cycle){
  const unit = { day: 'day', week: 'week', month: 'month', year: 'year' }[cycle];
  return unit ? ` / ${unit}` : '';
}

export const ListingItemCard = ({ listing, linkSearch = '', ...props }) => {
    const {commaInt} = useContext(GlobalStore);
    const vehicle = listing?.vehicle;
    const images = (Array.isArray(vehicle?.images) ? vehicle.images : []).filter((img) => img?.url);
    const [index, setIndex] = useState(0);

    // a different listing starts on its first photo
    useEffect(() => { setIndex(0); }, [listing?.uuid]);

    const isRental = listing?.listing_type === 'rental';
    const href = `/${isRental ? 'rent' : 'buy'}/${listing?.uuid}${linkSearch}`;
    const title = listing?.title || vehicle?.name || 'Untitled listing';
    const image = images.length ? images[index % images.length] : null;
    const mileage = formatMileage(vehicle?.mileage, commaInt);
    const trips = Number(vehicle?.trips);
    const rating = Number(vehicle?.dealer?.rating);

    function step(delta){
        setIndex((current) => (current + delta + images.length) % images.length);
    }

    return(
        <Box position="relative" w="100%" {...props}>
            <Card shadow={'lg'} p={0} w={'100%'} h="100%" rounded={'10px'} overflow="hidden">
                <CardHeader p={0} position="relative">
                    <Link to={href} aria-label={`View ${title}`}>
                        {!image ? <NoPhoto h="200px" /> : <Image
                          src={image?.url}
                          alt={image ? `Photo ${index + 1} of ${title}` : ''}
                          w="100%"
                          h="200px"
                          objectFit="cover"
                          loading="lazy"
                          fallback={<NoPhoto h="200px" />}
                        />}
                    </Link>
                    {images.length > 1 &&
                        <Flex position="absolute" w="100%" justifyContent="space-between" px={3} top="50%" transform="translateY(-50%)" pointerEvents="none">
                            <IconButton
                              size="sm"
                              icon={<FaCaretLeft />}
                              aria-label={`Previous photo of ${title}`}
                              onClick={() => step(-1)}
                              bg="blackAlpha.600"
                              color="white"
                              _hover={{ bg: 'blackAlpha.700' }}
                              pointerEvents="auto"
                            />
                            <IconButton
                              size="sm"
                              icon={<FaCaretRight />}
                              aria-label={`Next photo of ${title}`}
                              onClick={() => step(1)}
                              bg="blackAlpha.600"
                              color="white"
                              _hover={{ bg: 'blackAlpha.700' }}
                              pointerEvents="auto"
                            />
                        </Flex>
                    }
                </CardHeader>

                <CardBody p={3}>
                    <Flex justifyContent={'space-between'} alignItems={'flex-start'} gap={2}>
                        <Heading as="h3" size="md" className="subtitle" textTransform="capitalize" noOfLines={2}>
                            <Link to={href}>{title}</Link>
                        </Heading>
                        {vehicle?.condition && <Badge color="gray.600" className="bold" flexShrink={0}>{vehicle.condition}</Badge>}
                    </Flex>

                    {isRental ? (
                        <Flex alignItems={'center'} gap={3} my={2} flexWrap="wrap" color="gray.700" fontSize="sm">
                            {Number.isFinite(rating) && rating > 0 && (
                                <Text as={Flex} gap={1} alignItems={'center'}>{rating.toFixed(1)} <StarIcon color="yellow.400" aria-label="stars" /></Text>
                            )}
                            {Number.isFinite(trips) && (
                                <Text>{trips === 0 ? 'No trips yet' : `${trips} trip${trips === 1 ? '' : 's'}`}</Text>
                            )}
                            {vehicle?.transmission && <Text as={Flex} gap={1} alignItems={'center'}><TbManualGearbox aria-hidden="true" /> {vehicle.transmission}</Text>}
                        </Flex>
                    ) : (
                        <Flex alignItems={'center'} gap={3} my={2} flexWrap="wrap" color="gray.700" fontSize="sm">
                            {mileage && <Text as={Flex} gap={1} alignItems={'center'}><RxTimer aria-hidden="true" /> {mileage}</Text>}
                            {vehicle?.transmission && <Text as={Flex} gap={1} alignItems={'center'}><TbManualGearbox aria-hidden="true" /> {vehicle.transmission}</Text>}
                            {vehicle?.fuel_system && <Text as={Flex} gap={1} alignItems={'center'}><RiGasStationLine aria-hidden="true" /> {vehicle.fuel_system}</Text>}
                        </Flex>
                    )}

                    <Text fontWeight="600" fontSize="22px">
                        ₦{commaInt(listing?.price)}
                        {isRental && cycleSuffix(listing?.payment_cycle) && <Text as='span' fontSize="sm" color="gray.500" fontWeight="normal">{cycleSuffix(listing?.payment_cycle)}</Text>}
                    </Text>

                    <Divider my={3} />

                    <Flex justifyContent={'space-between'} alignItems={'center'} gap={2} flexWrap="wrap">
                        {vehicle?.dealer?.location
                          ? <Text fontSize="sm" as={Flex} alignItems="center" gap={1} color="gray.700"><LuMapPin aria-hidden="true" /> {vehicle.dealer.location}</Text>
                          : <span />}
                        <Flex gap={2} flexWrap="wrap">
                            {listing?.verified && (
                                <Badge display="inline-flex" alignItems="center" fontWeight={'600'} gap={1}>Verified <BsFillPatchCheckFill color="#0065B5" aria-hidden="true" /></Badge>
                            )}
                            {!isRental && vehicle?.custom_duty && (
                                <Badge display="inline-flex" alignItems="center" fontWeight={'600'} gap={1}>Duty paid <BsFillPatchCheckFill color="purple" aria-hidden="true" /></Badge>
                            )}
                            {isRental && vehicle?.fuel_system && (
                                <Tag size="sm" fontWeight={'bold'} gap={1}><Leaf size={14} aria-hidden="true" /> {vehicle.fuel_system}</Tag>
                            )}
                        </Flex>
                    </Flex>
                </CardBody>
            </Card>
        </Box>
    )
}


/** Offset pagination for the API's { offset, limit, count } block. */
export const PageControls = ({ offset = 0, limit = 25, count = 0, onPage, isLoading, ...props }) => {
    const size = Number(limit) > 0 ? Number(limit) : 25;
    const total = Number(count) > 0 ? Number(count) : 0;
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(pages, Math.floor((Number(offset) || 0) / size) + 1);
    if (pages <= 1) return null;

    // first, last and up to two pages either side of the current one
    const shown = [];
    for (let page = 1; page <= pages; page++) {
        if (page === 1 || page === pages || Math.abs(page - current) <= 1) shown.push(page);
        else if (shown[shown.length - 1] !== '…') shown.push('…');
    }

    return (
        <Flex as="nav" aria-label="Pagination" justify="center" align="center" gap={2} mt={8} flexWrap="wrap" {...props}>
            <Button size="sm" variant="outline" leftIcon={<ChevronLeftIcon />} isDisabled={current <= 1 || isLoading} onClick={() => onPage((current - 2) * size)}>
                Previous
            </Button>
            {shown.map((page, idx) => page === '…'
                ? <Text key={`gap-${idx}`} px={1} color="gray.500" aria-hidden="true">…</Text>
                : (
                    <Button
                      key={page}
                      size="sm"
                      display={{ base: page === current ? 'inline-flex' : 'none', sm: 'inline-flex' }}
                      variant={page === current ? 'solid' : 'outline'}
                      bg={page === current ? 'primary' : undefined}
                      color={page === current ? 'white' : undefined}
                      aria-current={page === current ? 'page' : undefined}
                      aria-label={`Page ${page}`}
                      isDisabled={isLoading && page !== current}
                      onClick={() => page !== current && onPage((page - 1) * size)}
                    >
                        {page}
                    </Button>
                ))}
            <Button size="sm" variant="outline" rightIcon={<ChevronRightIcon />} isDisabled={current >= pages || isLoading} onClick={() => onPage(current * size)}>
                Next
            </Button>
        </Flex>
    );
}


export const CustomerSearchBar = ({ onSearch, ...props }) => {
    const [target, setTarget] = useState('cars');
    const [query, setQuery] = useState('');
    const nav = useNavigate();

    function handleSearch(e){
        e.preventDefault();
        const text = query.trim();
        if (!text) return;
        onSearch?.(text, target);
        nav(`/search/${target}/?find=${encodeURIComponent(text)}`);
    }

    return (
        <form role="search" onSubmit={handleSearch}>
        <Flex rounded={'30px'} alignItems={'center'} gap={2} justifyContent={'space-between'} pl={4} pr={1} py={0} border={'1px solid lightgrey'} {...props}>
            <Icon className='icon' color="inherit" fontSize={'20px'} aria-hidden="true"><RiSearch2Line /></Icon>
            <Input
             type='search'
             value={query} pl={0}
             rounded={'30px'} flex={1} minW={0}
             className='no-style ellipsis small'
             placeholder='Search for cars, rentals or mechanics...'
             aria-label="Search Motaa"
             onChange={(e) => setQuery(e.target.value)}
            />
            <Select
             value={target}
             onChange={(e) => setTarget(e.target.value)}
             aria-label="What to search for"
             variant="unstyled"
             w="auto" minW="max-content" size="sm" pr={1}
            >
                <option value="cars">Cars</option>
                <option value="mechanics">Mechanics</option>
            </Select>
        </Flex>
        </form>
    )
}


export const DashboardSearchBar = ({ onSearch, target = 'cars', ...props }) => {
    const [query, setQuery] = useState('');
    const nav = useNavigate();

    function handleSearch(e){
        e.preventDefault();
        const text = query.trim();
        if (!text) return;
        onSearch?.(text, target);
        nav(`/search/${target}/?find=${encodeURIComponent(text)}`);
    }

    return (
        <form role="search" onSubmit={handleSearch}>
            <Flex rounded="md" alignItems={'center'} gap={2} justifyContent={'space-between'} pl={4} pr={0} py={0} border={'1px solid lightgrey'} {...props}>
                <Icon className='icon' color="inherit" fontSize={'20px'} aria-hidden="true"><RiSearch2Line /></Icon>
                <Input
                 type='search'
                 value={query} pl={0}
                 rounded={'30px'} flex={1} minW={0}
                 className='no-style ellipsis small'
                 placeholder='Search for cars, rentals or mechanics...'
                 aria-label="Search Motaa"
                 onChange={(e) => setQuery(e.target.value)}
                />
            </Flex>
        </form>
    )
}


/** Local-time YYYY-MM-DD (the value format of input[type=date]). */
export function toDateInputValue(date){
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parse YYYY-MM-DD as a local date (new Date('2025-01-02') would be UTC midnight). */
export function fromDateInputValue(value){
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Date field that looks like a button. `value`/`onChange` use 'YYYY-MM-DD' strings.
 * `min` defaults to today so past dates can't be picked.
 */
export const DatePicker = ({ value, defaultValue, onChange, min, max, label = 'Select date', id, isInvalid, ...props }) => {
    const { naturalDate } = useContext(GlobalStore);
    const input = useRef(null);
    const [inner, setInner] = useState(() => toDateInputValue(value ?? defaultValue ?? '') || '');
    const current = value !== undefined ? (value || '') : inner;
    const parsed = fromDateInputValue(current);
    const minValue = min === undefined ? toDateInputValue(new Date()) : min;

    function handleChange(e){
        setInner(e.target.value);
        onChange?.(e.target.value);
    }

    function openPicker(){
        try { input.current?.showPicker?.(); } catch (e) { input.current?.focus(); }
    }

    return (
        <Button
            as="div"
            role="group"
            rightIcon={<CalendarIcon aria-hidden="true" />}
            onClick={openPicker}
            variant="outline"
            className="small"
            position="relative"
            justifyContent="space-between"
            fontWeight="normal"
            borderColor={isInvalid ? 'red.500' : undefined}
            {...props}
        >
            <Text as="span" color={parsed ? 'inherit' : 'gray.500'}>{parsed ? naturalDate(parsed) : label}</Text>
            <Input
                id={id}
                type="date"
                ref={input}
                aria-label={label}
                aria-invalid={isInvalid || undefined}
                onChange={handleChange}
                value={current}
                min={minValue || undefined}
                max={max || undefined}
                position="absolute"
                inset="0"
                w="100%"
                h="100%"
                opacity="0"
                cursor="pointer"
            />
        </Button>
    );
}


export const CenteredLayout = ({ children, wrapperProps, ...props }) => {
    return(
        <Box placeItems="center" placeContent="center" w={'100%'} justifyContent={'center'} align={'center'} minH={'80vh'} {...wrapperProps}>
            {children}
        </Box>
    )
}


export const PinField = ({ onChange, value}) => {
    return(
        <HStack my={3} alignItems={'center'} justifyContent={'center'}>
            <PinInput otp size={'lg'} value={value} onChange={onChange}>
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
            </PinInput>
        </HStack>
    )
}

export const OTPField = ({ onChange, value}) => {
    return(
        <HStack my={3} alignItems={'center'} justifyContent={'center'}>
            <PinInput otp size={'lg'} value={value} onChange={onChange}>
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
            </PinInput>
        </HStack>
    )
}


export function ImageCarousel({ images, alt = 'Vehicle', height = { base: '260px', md: '400px' } }) {
  const photos = (Array.isArray(images) ? images : []).filter((img) => img?.url)
  const [currentImage, setCurrentImage] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const total = photos.length
  const current = total ? currentImage % total : 0

  // new image set (e.g. navigating to another listing) starts from the first photo
  const key = photos.map((img) => img.url).join('|')
  useEffect(() => { setCurrentImage(0) }, [key])

  if (!total){
    return <NoPhoto h={height} borderRadius="10px" mb={4} />
  }

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % total)
  const previousImage = () => setCurrentImage((prev) => (prev - 1 + total) % total)
  const arrowProps = {
    rounded: 'full',
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    bg: 'blackAlpha.600',
    color: 'white',
    _hover: { bg: 'blackAlpha.700' },
    fontSize: '28px',
  }

  return (
    <Box>
        <Box position="relative" mb={4}>
            <Box as="button" type="button" display="block" w="100%" onClick={onOpen} aria-label={`Enlarge photo ${current + 1} of ${total}`} cursor="zoom-in">
              <Image
                src={photos[current].url}
                alt={`${alt} – photo ${current + 1} of ${total}`}
                w="100%"
                h={height}
                objectFit="cover"
                borderRadius="10px"
                fallback={<NoPhoto h={height} borderRadius="10px" label="Photo unavailable" />}
              />
            </Box>

            {total > 1 && (
              <>
                <IconButton {...arrowProps} left={2} aria-label="Previous photo" icon={<ChevronLeftIcon />} onClick={previousImage} />
                <IconButton {...arrowProps} right={2} aria-label="Next photo" icon={<ChevronRightIcon />} onClick={nextImage} />
                <Text position="absolute" bottom={3} right={3} bg="blackAlpha.700" color="white" fontSize="xs" px={2} py={0.5} rounded="full" aria-hidden="true">
                  {current + 1} / {total}
                </Text>
              </>
            )}
        </Box>

        {total > 1 && (
          <HStack spacing={2} overflowX="auto" w='100%' pb={2} className="hidden-scroll">
            {photos.map((img, index) => (
              <Box
                as="button"
                type="button"
                key={img.uuid || img.url}
                onClick={() => setCurrentImage(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={current === index ? 'true' : undefined}
                flexShrink={0}
                w="24"
                borderRadius="md"
                borderWidth={2}
                borderColor={current === index ? 'primary' : 'transparent'}
                overflow="hidden"
              >
                <AspectRatio ratio={4/3}>
                  <Image src={img.url} alt="" objectFit="cover" loading="lazy" fallback={<NoPhoto label="" />} />
                </AspectRatio>
              </Box>
            ))}
          </HStack>
        )}

        <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: '4xl' }} isCentered>
          <ModalOverlay />
          <ModalContent bg="black">
            <ModalCloseButton color="white" zIndex={2} />
            <ModalBody p={0} display="flex" alignItems="center">
              <Box position="relative" w="100%">
                <Image
                  src={photos[current].url}
                  alt={`${alt} – photo ${current + 1} of ${total}`}
                  w="100%"
                  maxH="85vh"
                  objectFit="contain"
                  fallback={<NoPhoto h="60vh" label="Photo unavailable" />}
                />
                {total > 1 && (
                  <>
                    <IconButton {...arrowProps} left={2} aria-label="Previous photo" icon={<ChevronLeftIcon />} onClick={previousImage} />
                    <IconButton {...arrowProps} right={2} aria-label="Next photo" icon={<ChevronRightIcon />} onClick={nextImage} />
                  </>
                )}
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
    </Box>
  )
}



// parent paths that are real pages (e.g. /search on its own is not)
const LINKABLE_CRUMBS = new Set(['/home', '/buy', '/rent', '/mechanics', '/cart']);

export const LocationBreadcrumb = ({ label }) => {
  const { pathname: path } = useLocation();

  // If on home, return only the home breadcrumb
  if (path === '/' || path.replace(/\/+$/, '') === '/home') {
    return (
      <Breadcrumb alignItems="center" separator={<ChevronRightIcon />}>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink as={Link} to="/home">Home</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
    );
  }

  // Split path into segments and remove empty strings
  const pathSegments = path.split('/').filter(segment => segment);

  // Link every parent segment; the last one is the current page's label
  const breadcrumbItems = pathSegments.slice(0, -1).map((segment, index) => {
    const routeTo = '/' + pathSegments.slice(0, index + 1).join('/');

    return (
      <BreadcrumbItem key={routeTo}>
        {LINKABLE_CRUMBS.has(routeTo)
          ? <BreadcrumbLink as={Link} to={routeTo} textTransform="capitalize">{segment.replace(/-/g, ' ')}</BreadcrumbLink>
          : <Text as="span" textTransform="capitalize">{segment.replace(/-/g, ' ')}</Text>}
      </BreadcrumbItem>
    );
  });
  if (pathSegments[0] !== 'home') {
    breadcrumbItems.unshift(
      <BreadcrumbItem key="/home">
        <BreadcrumbLink as={Link} to="/home">Home</BreadcrumbLink>
      </BreadcrumbItem>
    );
  }

  breadcrumbItems.push(
    <BreadcrumbItem key="current" isCurrentPage minW={0}>
      <BreadcrumbLink noOfLines={1}>{label || pathSegments[pathSegments.length - 1]?.replace(/-/g, ' ')}</BreadcrumbLink>
    </BreadcrumbItem>
  );

  return (
    <Breadcrumb alignItems={'center'} separator={<ChevronRightIcon />} sx={{ ol: { flexWrap: 'wrap' } }}>
      {breadcrumbItems}
    </Breadcrumb>
  );
};
