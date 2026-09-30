// Shared loading / empty / error states. Every page that loads data should
// render exactly one of these instead of a blank screen, a timer, or NaN.
import { Box, Button, Flex, Heading, Icon, Spinner, Text, VStack } from '@chakra-ui/react';
import { Link as RLink } from 'react-router-dom';
import { AlertTriangle, Inbox, WifiOff } from 'lucide-react';

/** Centered spinner, for pages/sections without a dedicated skeleton. */
export function LoadingState({ label = 'Loading…', minH = '240px', ...props }) {
  return (
    <Flex direction="column" align="center" justify="center" gap={3} minH={minH} color="gray.500" role="status" aria-live="polite" {...props}>
      <Spinner size="lg" color="primary" thickness="3px" />
      <Text fontSize="sm">{label}</Text>
    </Flex>
  );
}

/**
 * Nothing to show yet.
 * action: { label, to } for a link or { label, onClick } for a button.
 */
export function EmptyState({ icon = Inbox, title = 'Nothing here yet', description, action, minH = '240px', ...props }) {
  return (
    <Flex direction="column" align="center" justify="center" textAlign="center" gap={3} minH={minH} px={4} py={8} {...props}>
      <Flex w={14} h={14} rounded="full" bg="blue.50" align="center" justify="center" color="primary">
        <Icon as={icon} boxSize={7} aria-hidden="true" />
      </Flex>
      <Heading as="h3" size="sm" color="gray.800">{title}</Heading>
      {description && <Text color="gray.600" fontSize="sm" maxW="380px">{description}</Text>}
      {action && (
        action.to
          ? <Button as={RLink} to={action.to} mt={2} bg="primary" color="white" _hover={{ bg: 'secondary' }}>{action.label}</Button>
          : <Button onClick={action.onClick} mt={2} bg="primary" color="white" _hover={{ bg: 'secondary' }}>{action.label}</Button>
      )}
    </Flex>
  );
}

/** Something failed. Shows the ApiError's readable message and a retry button. */
export function ErrorState({ error, onRetry, title, minH = '240px', ...props }) {
  const offline = error?.isNetworkError;
  const notFound = error?.isNotFound;
  const heading = title || (offline ? "You're offline" : notFound ? 'Not found' : "We couldn't load this");
  return (
    <Flex direction="column" align="center" justify="center" textAlign="center" gap={3} minH={minH} px={4} py={8} role="alert" {...props}>
      <Flex w={14} h={14} rounded="full" bg={offline ? 'gray.100' : 'red.50'} align="center" justify="center" color={offline ? 'gray.600' : 'red.500'}>
        <Icon as={offline ? WifiOff : AlertTriangle} boxSize={7} aria-hidden="true" />
      </Flex>
      <Heading as="h3" size="sm" color="gray.800">{heading}</Heading>
      <Text color="gray.600" fontSize="sm" maxW="400px">
        {error?.message || 'Something went wrong. Please try again.'}
      </Text>
      {onRetry && !notFound && (
        <Button onClick={onRetry} mt={2} variant="outline" borderColor="primary" color="primary">Try again</Button>
      )}
    </Flex>
  );
}

/**
 * Renders the right state for a useApiQuery result.
 *
 *   <AsyncState query={q} skeleton={<ListingSkeleton />} isEmpty={(d) => !d.length}
 *               empty={<EmptyState title="No cars yet" />}>
 *     {(data) => <Grid>...</Grid>}
 *   </AsyncState>
 */
export function AsyncState({ query, skeleton, loadingLabel, isEmpty, empty, errorTitle, children }) {
  const { data, error, loading, reload } = query;
  // keep showing stale data while a background reload runs
  if (loading && data === undefined) return skeleton ?? <LoadingState label={loadingLabel} />;
  if (error && data === undefined) return <ErrorState error={error} onRetry={reload} title={errorTitle} />;
  if (isEmpty?.(data)) return empty ?? <EmptyState />;
  return <Box>{typeof children === 'function' ? children(data) : children}</Box>;
}

/** Small inline error for a form or section, with optional retry. */
export function InlineError({ error, onRetry }) {
  if (!error) return null;
  return (
    <VStack align="start" spacing={2} p={3} rounded="md" bg="red.50" color="red.700" role="alert">
      <Text fontSize="sm">{error.message || String(error)}</Text>
      {onRetry && <Button size="sm" variant="link" color="red.700" onClick={onRetry}>Try again</Button>}
    </VStack>
  );
}
