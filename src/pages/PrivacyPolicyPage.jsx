import { Box, Container, Heading, Text, VStack, Divider, UnorderedList, ListItem, Flex, Icon } from "@chakra-ui/react"
import {
  BsShieldLock,
  BsInfoCircle,
  BsPersonCircle,
  BsFileEarmarkText,
  BsShareFill,
  BsShieldCheck,
  BsClockHistory,
  BsLink45Deg,
  BsArrowClockwise,
  BsEnvelope,
  BsTelephone,
  BsGlobe,
  BsInstagram,
  BsGeoAlt,
  BsDatabase,
  BsPersonBadge,
  BsCookie,
} from "react-icons/bs"

const PrivacyPolicy = () => {
  return (
    <Container maxW="900px" py={8} px={4}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Flex align="center" mb={2}>
            <Icon as={BsShieldLock} boxSize={6} color="blue.500" mr={2} />
            <Heading as="h1" size="xl">
              Privacy Policy
            </Heading>
          </Flex>
          <Text color="gray.500" fontWeight="medium">
            LAST UPDATED: 17 OCT 2024
          </Text>
        </Box>

        <Divider />

        {/* Introduction */}
        <Box>
          <Flex align="center" mb={4}>
            <Icon as={BsInfoCircle} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="lg">
              Introduction
            </Heading>
          </Flex>
          <Text mb={4}>
            Welcome to Motaa Ltd ("Company," "we," "us," or "our"). We operate the website www.motaa.net, android and
            IOS mobile apps and provide various services related to Automotive transactions, including car sales,
            rentals, and mechanical services. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website, explore our apps and use our services (collectively, the
            "Services").
          </Text>
          <Text mb={4}>
            By using our Services, you agree to the terms of this Privacy Policy. If you do not agree with the terms,
            please do not access or use our Services.
          </Text>
        </Box>

        {/* Numbered Sections */}
        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsDatabase} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              1. Information We Collect
            </Heading>
          </Flex>
          <Text mb={3}>
            We collect various types of information to provide and improve our Services to you. The types of information
            we collect include:
          </Text>

          <Box pl={4} mb={4}>
            <Flex align="center" mb={2}>
              <Icon as={BsPersonCircle} boxSize={4} color="blue.400" mr={2} />
              <Heading as="h3" size="sm">
                1.1 Personal Information
              </Heading>
            </Flex>
            <Text mb={2}>
              When you register on our platform or interact with us, we may collect the following personal information:
            </Text>
            <UnorderedList pl={6} spacing={1} mb={3}>
              <ListItem>Name</ListItem>
              <ListItem>Email Address</ListItem>
              <ListItem>Phone Number</ListItem>
              <ListItem>Address and or live location</ListItem>
              <ListItem>Payment Information (e.g., credit card details)</ListItem>
            </UnorderedList>
          </Box>

          <Box pl={4} mb={4}>
            <Flex align="center" mb={2}>
              <Icon as={BsFileEarmarkText} boxSize={4} color="blue.400" mr={2} />
              <Heading as="h3" size="sm">
                1.2 Non-Personal Information
              </Heading>
            </Flex>
            <Text mb={2}>
              We also collect non-personal information that cannot be used to identify you directly, such as:
            </Text>
            <UnorderedList pl={6} spacing={1} mb={3}>
              <ListItem>Browser type and version</ListItem>
              <ListItem>Device information (e.g., IP address, operating system)</ListItem>
              <ListItem>Usage data, such as pages viewed and interactions with our website</ListItem>
            </UnorderedList>
          </Box>

          <Box pl={4} mb={4}>
            <Flex align="center" mb={2}>
              <Icon as={BsCookie} boxSize={4} color="blue.400" mr={2} />
              <Heading as="h3" size="sm">
                1.3 Cookies and Tracking Technologies
              </Heading>
            </Flex>
            <Text>
              We use cookies and similar tracking technologies (e.g., web beacons, pixels) to collect information about
              your activity on our website. Cookies help us improve the functionality and user experience of our
              Services.
            </Text>
          </Box>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsInfoCircle} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              2. How We Use Your Information
            </Heading>
          </Flex>
          <Text mb={2}>We use the information we collect for various purposes, including:</Text>
          <UnorderedList pl={6} spacing={2} mb={4}>
            <ListItem>
              <strong>Providing and Improving Services:</strong> To process transactions, manage your account, and
              provide customer support.
            </ListItem>
            <ListItem>
              <strong>Communication:</strong> To send you updates, newsletters, and promotional materials (you can opt
              out at any time).
            </ListItem>
            <ListItem>
              <strong>Analytics:</strong> To understand how our users interact with the website and improve our
              offerings.
            </ListItem>
            <ListItem>
              <strong>Security:</strong> To detect and prevent fraud, unauthorized access, and any other unlawful
              activities.
            </ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsShareFill} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              3. How We Share Your Information
            </Heading>
          </Flex>
          <Text mb={2}>We may share your information in the following ways:</Text>
          <UnorderedList pl={6} spacing={2} mb={4}>
            <ListItem>
              <strong>With Service Providers:</strong> We may share your data with third-party service providers to
              assist in providing our Services (e.g., payment processors, email service providers).
            </ListItem>
            <ListItem>
              <strong>Legal Requirements:</strong> We may disclose your information if required by law or if we believe
              that such action is necessary to comply with legal obligations or protect our rights.
            </ListItem>
            <ListItem>
              <strong>Business Transfers:</strong> If we merge with or are acquired by another company, your information
              may be transferred as part of that transaction.
            </ListItem>
          </UnorderedList>
          <Text mb={4}>
            We do not sell, trade, or rent your personal information to third parties for their marketing purposes.
          </Text>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsShieldCheck} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              4. Data Security
            </Heading>
          </Flex>
          <Text mb={3}>
            We implement appropriate technical and organizational security measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </Text>
          <UnorderedList pl={6} spacing={2} mb={4}>
            <ListItem>
              <strong>Encryption:</strong> We use SSL encryption to protect data during transmission.
            </ListItem>
            <ListItem>
              <strong>Access Controls:</strong> Only authorized personnel have access to your information.
            </ListItem>
            <ListItem>
              <strong>Regular Security Audits:</strong> We conduct regular security audits to identify and address
              vulnerabilities.
            </ListItem>
          </UnorderedList>
          <Text mb={4}>
            However, please note that no method of data transmission or storage is completely secure. While we strive to
            protect your data, we cannot guarantee its absolute security.
          </Text>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsPersonBadge} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              5. Your Privacy Rights
            </Heading>
          </Flex>
          <Text mb={2}>You have the following rights regarding your personal information:</Text>
          <UnorderedList pl={6} spacing={2} mb={4}>
            <ListItem>
              <strong>Access:</strong> You can request access to the personal data we hold about you.
            </ListItem>
            <ListItem>
              <strong>Correction:</strong> You can request that we correct any inaccurate or incomplete data.
            </ListItem>
            <ListItem>
              <strong>Deletion:</strong> You can request the deletion of your personal data, subject to certain
              conditions.
            </ListItem>
            <ListItem>
              <strong>Opt-Out:</strong> You can opt out of receiving marketing communications from us at any time by
              following the unsubscribe instructions in the emails.
            </ListItem>
          </UnorderedList>
          <Text mb={4}>To exercise any of these rights, please contact us at support@motaa.net</Text>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsClockHistory} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              6. Data Retention
            </Heading>
          </Flex>
          <Text mb={4}>
            We retain your personal information for as long as necessary to fulfil the purposes outlined in this Privacy
            Policy, unless a longer retention period is required or permitted by law. When we no longer need your
            personal data, we will securely delete or anonymize it.
          </Text>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsLink45Deg} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              7. Third-Party Links
            </Heading>
          </Flex>
          <Text mb={4}>
            Our website may contain links to third-party websites. This Privacy Policy does not apply to these external
            sites, and we are not responsible for their privacy practices. We encourage you to review the privacy
            policies of any third-party websites you visit.
          </Text>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsArrowClockwise} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              8. Changes to This Privacy Policy
            </Heading>
          </Flex>
          <Text mb={4}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on our website and updating the "Last updated" date. Your continued use of our Services after
            any modifications indicates your acceptance of the updated Privacy Policy.
          </Text>
        </Box>

        <Box>
          <Flex align="center" mb={3}>
            <Icon as={BsEnvelope} boxSize={5} color="blue.500" mr={2} />
            <Heading as="h2" size="md">
              9. Contact Us
            </Heading>
          </Flex>
          <Text mb={2}>
            If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact
            us at:
          </Text>
          <VStack align="flex-start" spacing={1} mb={4} pl={4}>
            <Flex align="center">
              <Icon as={BsEnvelope} boxSize={4} color="gray.500" mr={2} />
              <Text>
                <strong>Email:</strong> support@motaa.net
              </Text>
            </Flex>
            <Flex align="center">
              <Icon as={BsTelephone} boxSize={4} color="gray.500" mr={2} />
              <Text>
                <strong>Phone:</strong> +2348104484364
              </Text>
            </Flex>
            <Flex align="center">
              <Icon as={BsGlobe} boxSize={4} color="gray.500" mr={2} />
              <Text>
                <strong>Website:</strong> www.motaa.net
              </Text>
            </Flex>
            <Flex align="center">
              <Icon as={BsInstagram} boxSize={4} color="gray.500" mr={2} />
              <Text>
                <strong>IG/X:</strong> @motaaltd
              </Text>
            </Flex>
            <Flex align="center">
              <Icon as={BsGeoAlt} boxSize={4} color="gray.500" mr={2} />
              <Text>
                <strong>Address:</strong> I5 Kawo road, Kawo, Kaduna state, Nigeria.
              </Text>
            </Flex>
          </VStack>
        </Box>

        <Box>
          <Text fontWeight="medium">
            By using our Services, you acknowledge that you have read and understood this Privacy Policy and agree to
            its terms.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}

export default PrivacyPolicy
