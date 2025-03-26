import {
    Box, Flex, IconButton, Heading,
    Badge, Text, Divider,
    HStack, VStack,
    PinInput,
    PinInputField,
    Card,
    CardBody,
    Button,
    Input,
    CardHeader,
    Image,
    Icon,
    FormLabel,
    FormControl,
    Grid,
    Fade,
    LinkBox,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    useDisclosure,
    Tag,
    AspectRatio,
    Select,
    useColorModeValue,
    Menu,
    MenuItem,
    MenuButton,
    MenuList,
    BreadcrumbItem,
    BreadcrumbLink,
    Breadcrumb,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
} from '@chakra-ui/react';
import {Fragment, useContext, useEffect, useState, useRef} from 'react';
import { RiGasStationLine, RiHeart2Fill, RiHeart2Line, RiSearch2Line } from 'react-icons/ri'
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa6'
import { HiMiniReceiptPercent } from 'react-icons/hi2'
import { LuMapPin } from 'react-icons/lu'
import { RxCaretLeft, RxCaretRight, RxTimer } from 'react-icons/rx';
import { TbManualGearbox } from 'react-icons/tb';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { GlobalStore } from '../App';
import { FcCheckmark } from 'react-icons/fc';
import { Leaf } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, StarIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { addMonths, endOfMonth, format, isSameDay, isSameMonth, isToday, startOfMonth, subMonths } from "date-fns"

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
  ...props
}) {
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
    if (disabled?.(day)) return

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
            const isDisabled = disabled?.(day) || false
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
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
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


export const ListingItemCard = ({ listing, ...props }) => {
    const {commaInt} = useContext(GlobalStore);
    const {vehicle, } = listing;
    const [image, setImage] = useState({});
    const [index, setIndex] = useState(0);

    function discount(price, dprice){
        const percent = (dprice / price) * 100
        return percent
    }

    useEffect(() => {
        setImage(vehicle.images[0])
    }, [listing]);

    function nextImage(idx){
        let images = vehicle.images
        idx += index
        if (idx >= images.length){
            idx = 0
        }
        if (idx < 0){
            idx = (images.length - 1)
        }

        setIndex(idx)
        setImage(images[idx]);
    }

    let type = 'buy';

    if (listing.listing_type === 'sale'){
        type = 'buy';
    }
    if (listing.listing_type === 'rental'){
        type = 'rent';
    }

    return(
        <Box position="relative" {...props}>
            <Card shadow={'lg'} p={0} w={'100%'} rounded={'10px'}>
                <CardHeader p={0}>
                    <Box
                        width={'100%'}
                        minH={'170px'}
                        maxH={'270px'}
                        borderRadius={'10px'}
                        position={'relative'}
                    >
                        <NavLink to={`/${type}/${listing?.uuid}`}>
                            <LinkBox
                                flex={1} w={'100%'} height={'200px'}
                                position={'relative'}
                                sx={{
                                    backgroundImage: `url(${image.url})`,
                                    borderRadius: '10px',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: 'cover',
                                    backgroundPositionX: '70%',
                                    backgroundPositionY: '37.5%',
                                }}
                            />
                        </NavLink>
                        {
                            vehicle?.images.length > 1 &&
                            <Flex
                             position={'absolute'}
                             w={'100%'}
                             justifyContent="space-between"
                             px={'20px'}
                             top={'45%'}
                             gap={2} left={'0px'}
                            >
                                <Icon
                                 cursor={'pointer'}
                                 rounded={'5px'}
                                 bg={'#00000066'}
                                 color={'#fff'}
                                 p={'5px'}
                                 onClick={() => nextImage(-1)}
                                 className='icon'
                                > <FaCaretLeft /> </Icon>
                                <Icon
                                 cursor={'pointer'}
                                 rounded={'5px'}
                                 bg={'#00000066'}
                                 color={'#fff'}
                                 p={'5px'}
                                 onClick={() => nextImage(1)} 
                                 className='icon'
                                > <FaCaretRight /> </Icon>
                            </Flex>
                        }
                    </Box>
                </CardHeader>

                <CardBody p={3}>
                    <Flex justifyContent={'space-between'} alignItems={'center'}>
                        <Heading size="md" className="subtitle" textTransform="capitalize"> {listing?.title} </Heading>
                        <Badge color="grey.500" className="bold"> {listing?.vehicle?.condition} </Badge>
                    </Flex>

                    {
                      listing?.listing_type === 'sale'?
                    <Flex justifyContent={'flex-start'} alignItems={'center'} gap={2} my={2}>
                      <Text as={Flex} gap={1} alignItems={'center'} className=""> <RxTimer /> {commaInt(listing?.vehicle?.mileage) || 0} miles</Text>
                      <Text as={Flex} gap={1} alignItems={'center'} className=""> <TbManualGearbox /> {listing?.vehicle?.transmission}</Text>
                      <Text as={Flex} gap={1} alignItems={'center'} className=""> <RiGasStationLine /> {listing?.vehicle?.fuel_system}</Text>
                    </Flex>
                    :
                    <Flex justifyContent={'flex-start'} alignItems={'center'} gap={2} my={2}>
                      <Text as={Flex} gap={1} alignItems={'center'} className=""> {(listing?.vehicle?.dealer?.rating) || 0} <StarIcon color="yellow" /> </Text>
                      <Text as={Flex} gap={1} alignItems={'center'} className=""> ({listing?.vehicle?.trips} Trips) </Text>
                      <Text as={Flex} gap={1} alignItems={'center'} className=""> {listing?.vehicle?.dealer?.level}</Text>
                    </Flex>
                    }

                    <Flex alignItems="center" gap={1}>
                        <Text fontWeight="600" fontSize="22px"> ₦{commaInt(listing?.price)}
                            <Text as='span' className="small" color="gray.500">{listing?.listing_type === 'rental' && `/${listing?.payment_cycle}`} </Text>
                        </Text>
                        {listing?.listing_type === 'sale' &&
                          <Tag as={Flex} ml="auto" size="sm" alignItems="center" gap={1.25}>
                              <Icon> <HiMiniReceiptPercent size={25} /> </Icon>
                              <Text>+0.5% fee</Text>
                          </Tag>
                        }
                    </Flex>

                    <Divider my={3} />

                    <Flex justifyContent={'space-between'} alignItems={'center'} my={2}>
                        <Text className="small-text" as={Flex} alignItems="center" gap={1.25}> <Icon> <LuMapPin size={25} /> </Icon> {listing?.vehicle?.dealer?.location} </Text>
                        {
                          listing?.listing_type === 'sale' ?
                           listing?.vehicle?.custom_duty &&
                            <Tag fontWeight={'bold'} gap={1.5}> <span> Custom Duty </span> <Icon color="purple"> <BsFillPatchCheckFill size={25} /> </Icon> </Tag>
                          :
                          <Tag fontWeight={'bold'} gap={1.5}><Icon> <Leaf size={25} /> </Icon> <span> {listing?.vehicle?.fuel_system} </span> </Tag>
                        }
                    </Flex>
                </CardBody>
            </Card>
        </Box>
    )
}


export const CustomerSearchBar = ({ onSearch, ...props }) => {
    const {notify, redirect} = useContext(GlobalStore);
    const [menuOpen, setMenuState] = useState(false);
    const [target, setTarget] = useState('cars');
    const [query, setQuery] = useState('');
    const nav = useNavigate();

    function handleSearch(e){
        e.preventDefault();
        nav(`/search/${target}/?find=${query}`);
    }

    useEffect(() => {
        return () => {
            setQuery('');
        }
    }, [])

    return (
        <form method='post' onSubmit={handleSearch}>
        <Flex rounded={'30px'} alignItems={'center'} zIndex={'100'} gap={2} justifyContent={'space-between'} pl={4} pr={0} py={0} border={'1px solid lightgrey'} {...props}>
            <Icon className='icon' color="inherit" fontSize={'20px'}><RiSearch2Line /> </Icon>
            <Input
             type='search'
             value={query} pl={0}
             rounded={'30px'} flex={1}
             className='no-style ellipsis small'
             placeholder='Search for cars, rentals or mechanics...'
             onInput={(e) => setQuery(e.target.value)}
            />
            <Menu>
                <Select color="inherit" minW="30px" maxW={'min-content'} onClick={() => setMenuState(!menuOpen)} type='button' rounded={'30px'} as={MenuButton} textTransform={'capitalize'}>
                    <option value={target}>{target}</option>
                </Select>

                <MenuList minW={'max-content'} py={0}>
                    <MenuItem color="inherit" as={motion.button} type='button' onClick={() => setTarget('cars')} > Cars </MenuItem>
                    <MenuItem color="inherit" as={motion.button} type='button' onClick={() => setTarget('mechanics')}  maxW={'max-content'}> Mechanics </MenuItem>
                </MenuList>
            </Menu>
        </Flex>
        </form>
    )
}


export const DashboardSearchBar = ({ onSearch, ...props }) => {
    const {notify, redirect} = useContext(GlobalStore);
    const [menuOpen, setMenuState] = useState(false);
    const [query, setQuery] = useState('');
    const nav = useNavigate();

    function handleSearch(e){
        e.preventDefault();
        nav(`/search/${target}/?find=${query}`);
    }

    useEffect(() => {
        return () => {
            setQuery('');
        }
    }, [])

    return (
        <form method='post' onSubmit={handleSearch}>
            <Flex rounded="md" alignItems={'center'} zIndex={'100'} gap={2} justifyContent={'space-between'} pl={4} pr={0} py={0} border={'1px solid lightgrey'} {...props}>
                <Icon className='icon' color="inherit" fontSize={'20px'}><RiSearch2Line /> </Icon>
                <Input
                 type='search'
                 value={query} pl={0}
                 rounded={'30px'} flex={1}
                 className='no-style ellipsis small'
                 placeholder='Search for cars, rentals or mechanics...'
                 onInput={(e) => setQuery(e.target.value)}
                />
            </Flex>
        </form>
    )
}



export const DatePicker = ({ defaultValue, onChange, ...props }) => {
    const input = useRef(null);
    let date = new Date();
    if (defaultValue){
        date = new Date(defaultValue);
    }
    const [value, setValue] = useState(date);
    const [open, setOpenState] = useState(false);
    const [label, setLabel] = useState(`${date.toLocaleDateString()}`);

    const changeVal = (e) => {
        setValue(e.target.value);
        const dateValue = new Date(e.target.value);
        if (!dateValue) return; // Prevent empty values

        onChange(`${dateValue}`);
        setLabel(`${dateValue.toLocaleDateString()}`);
    };

    const openPicker = () => {
        if (input.current) {
            window.datepicker = input.current;
            if(!open){
                if (input.current.showPicker) {
                    input.current.showPicker(); // Works in modern browsers
                } else {
                    input.current.click(); // Fallback for older browsers
                }
            }else{
                input.current.blur();
            }
        }
    };

    return (
        <Button
            rightIcon={<ChevronDownIcon />}
            onClick={openPicker}
            variant="outline"
            className="small"
            position="relative"
            {...props}
        >
            {label}
            <Input
                type="date"
                ref={input}
                onInput={changeVal}
                value={value}
                position="absolute"
                inset="0"
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


export const DNDUploadField = ({ accept, multiple=true, onUpload, ...props}) => {
    const [uploads, setUploads] = useState([]);

    function handleInput(e){
        const files = e.target.files;

        for (let _file of files){
            const file = new File(_file)
            const data = {
                'name': file.name,
                'size': file.size,
            }
            setUploads([
                ...uploads,
                data
            ])
            onUpload({...data});
        }

    }

    return(
        <Box border={'2px dashed grey'} py={5} px={3}>
            <Input type='file' hidden={true} multiple={multiple} onInput={handleInput} />
        </Box>
    )
}



export function ImageCarousel({ images, ...props }) {
  const [currentImage, setCurrentImage] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <Box>
        <Box position="relative" mb={4}>
            <Box
                sx={{
                    backgroundImage: `url(${images[currentImage].url})`,
                    borderRadius: '10px',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPositionX: '50%',
                    backgroundPositionY: '45%',
                }}
                w={'100%'}
                minH={'400px'}
                cursor="zoom-in"
                onClick={onOpen}
            ></Box>

            <IconButton
            fontSize={"35px"}
            rounded={"full"}
            style={{background: 'rgba(0, 0, 0, 0.43)', color: '#fff'}}
            aria-label="Previous image"
            icon={<ChevronLeftIcon />}
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={previousImage}
            bg="white"
            _hover={{ bg: 'gray.100' }}
            />
        
            <IconButton
            fontSize={"35px"}
            rounded={"full"}
            style={{background: 'rgba(0, 0, 0, 0.43)', color: '#fff'}}
            aria-label="Next image"
            icon={<ChevronRightIcon />}
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={nextImage}
            bg="white"
            _hover={{ bg: 'gray.100' }}
            />
        </Box>

        <HStack spacing={2} overflowX="scroll" w='100%' pb={2}>
        {images.map((img, index) => (
            <AspectRatio
            key={index}
            ratio={4/3}
            w="24"
            minW="24"
            cursor="pointer"
            onClick={() => setCurrentImage(index)}
            >
            {
                images?.length > 4 ? (
                    <Fragment>
                        {
                            index > 4 ? (null):(
                                <Image
                                    src={img.url}
                                    alt={`Thumbnail ${index + 1}`}
                                    objectFit="cover"
                                    borderRadius="md"
                                    borderWidth={2}
                                    borderColor={currentImage === index ? 'blue.500' : 'transparent'}
                                />
                            )
                        }
                        {index === 4 &&
                        <Image
                                src={img.url}
                                alt={`Thumbnail ${index + 1}`}
                                objectFit="cover"
                                borderRadius="md"
                                borderWidth={2}
                                borderColor={currentImage === index ? 'blue.500' : 'transparent'}
                            />
                        }
                    </Fragment>
                ) : (
                    <Image
                        src={img.url}
                        alt={`Thumbnail ${index + 1}`}
                        objectFit="cover"
                        borderRadius="md"
                        borderWidth={2}
                        borderColor={currentImage === index ? 'blue.500' : 'transparent'}
                    />
                )
            }
            </AspectRatio>
        ))}
        </HStack>

        <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
            <ModalBody p={0}>
            <AspectRatio ratio={4/3}>
                <Box position="relative">
                <Image
                    src={images[currentImage].url}
                    alt={`Car image ${currentImage + 1}`}
                    objectFit="cover"
                />
                <IconButton
                    aria-label="Previous image"
                    icon={<ChevronLeftIcon />}
                    position="absolute"
                    left={2}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={previousImage}
                />
                <IconButton
                    aria-label="Next image"
                    icon={<ChevronRightIcon />}
                    position="absolute"
                    right={2}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={nextImage}
                />
                </Box>
            </AspectRatio>
            </ModalBody>
        </ModalContent>
        </Modal>
    </Box>
  )
}


export const LocationBreadcrumb = ({ label }) => {
  // Get the current URL from window.location.pathname (remove protocol and domain)
  const path = window.location.pathname;
  
  // Split the path into individual segments (remove any empty strings from the array)
  const pathSegments = path.split('/').filter(segment => segment);

  // Initialize the breadcrumb items
  const breadcrumbItems = pathSegments.slice(0, -1).map((segment, index) => {
    // Construct the path up to the current segment (excluding the last one)
    const routeTo = '/' + pathSegments.slice(0, index + 1).join('/');

    return (
      <BreadcrumbItem key={index}>
        <BreadcrumbLink as={Link} to={routeTo} textTransform={'capitalize'}>
          {segment.replace(/-/g, ' ')} {/* Replace hyphens with spaces */}
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
  });

  // Add the label as the final breadcrumb, without a link
  breadcrumbItems.push(
    <BreadcrumbItem key="current" isCurrentPage>
      <BreadcrumbLink>{label}</BreadcrumbLink>
    </BreadcrumbItem>
  );

  return (
    <Breadcrumb separator=">">
      <BreadcrumbItem>
        <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      {breadcrumbItems}
    </Breadcrumb>
  );
};



