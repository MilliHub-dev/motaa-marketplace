// Live tracking: the customer follows a mechanic or tow truck on a map, and the business shares its live location.
// API and rules: src/utils/tracking.js. Requests here use a plain fetch (not the app's API client) so a poll every
// 10 s never shows connection toasts or signs anyone out; errors are shown next to the map or the button.
import { useEffect, useState } from 'react';
import {
  Box, Button, Flex, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Skeleton, Text,
  useDisclosure,
} from '@chakra-ui/react';
import { Map as MapIcon, Navigation, Square } from 'lucide-react';
import { API_URL } from '../config';
import {
  WATCH_OPTIONS, liveAgeSeconds, nextPollDelay, positionPayload, sharingErrorMessage, shouldSendPosition, stopsSharing, trackingPath,
  updatedAgoText,
} from '../utils/tracking';
import { MapComponent } from './maps';

const AUTH_STORAGE_KEY = 'motaa-auth-user';

function token() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(AUTH_STORAGE_KEY) || 'null')?.token || '';
  } catch {
    return '';
  }
}

/** GET / POST / DELETE /tracking/<kind>/<uuid>/ → `data`, or throws an Error with `status` (0 when offline). */
async function trackingRequest(method, kind, uuid, body, { signal, keepalive } = {}) {
  const auth = token();
  let response;
  try {
    response = await fetch(`${API_URL}${trackingPath(kind, uuid)}`, {
      method,
      signal,
      keepalive,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth ? { Authorization: `Token ${auth}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw Object.assign(new Error("Can't reach Motaa right now."), { status: 0 });
  }
  let parsed = null;
  try { parsed = await response.json(); } catch { /* empty (e.g. DELETE) */ }
  if (!response.ok || parsed?.error === true) {
    throw Object.assign(new Error(parsed?.message || parsed?.detail || `Tracking responded ${response.status}`), { status: response.status });
  }
  return parsed?.data;
}

/** A clock that ticks every `ms` (for "Updated 12 s ago"). */
function useNow(ms = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms, enabled]);
  return now;
}

/**
 * Polls GET /tracking/<kind>/<uuid>/ every `poll_seconds` while the page is visible; backs off after errors and
 * stops once the job isn't trackable. → { data, error, fetchedAt }
 */
export function useLiveTracking(kind, uuid, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, fetchedAt: 0 });

  useEffect(() => {
    if (!enabled || !uuid) return undefined;
    let timer;
    let controller;
    let failures = 0;
    let stopped = false;

    const schedule = (ms) => { clearTimeout(timer); timer = setTimeout(tick, ms); };
    async function tick() {
      if (stopped || document.visibilityState === 'hidden') return; // picked up again when the page shows
      controller?.abort();
      controller = new AbortController();
      try {
        const data = await trackingRequest('GET', kind, uuid, null, { signal: controller.signal });
        if (stopped) return;
        failures = 0;
        setState({ data, error: null, fetchedAt: Date.now() });
        if (data?.trackable === false) return; // finished, cancelled or not started: nothing more to follow
        schedule(nextPollDelay(data?.poll_seconds));
      } catch (error) {
        if (stopped || error?.name === 'AbortError') return;
        failures += 1;
        setState((current) => ({ ...current, error }));
        if (error.status === 404 || error.status === 403) return;
        schedule(nextPollDelay(undefined, failures));
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') { clearTimeout(timer); tick(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [kind, uuid, enabled]);

  return state;
}

function LegendDot({ color, ring }) {
  return <Box as="span" display="inline-block" w="10px" h="10px" borderRadius="full" bg={color} boxShadow={ring ? `0 0 0 2px white, 0 0 0 3px ${ring}` : undefined} aria-hidden="true" />;
}

/**
 * The live map: the customer's spot ("You" / pickup), the drop-off if any, and the moving vehicle, with the
 * server's message ("Musa Motors is 4.2 km away, about 11 min.") and "Updated 12 s ago".
 * Renders nothing once the job isn't trackable. `wrap(node)` puts it in a card (and the card goes too).
 */
export function LiveTrackingPanel({ kind, uuid, height = '320px', youLabel, wrap = (node) => node, ...props }) {
  const { data, error, fetchedAt } = useLiveTracking(kind, uuid);
  const live = data?.live;
  const now = useNow(1000, Boolean(live));

  if (data && data.trackable === false) return null;
  if (!data) {
    return wrap(error
      ? <Text fontSize="sm" color="gray.600" role="status" {...props}>{error.status === 404 ? "Live tracking isn't available for this job." : "We couldn't load the live location. We'll keep trying."}</Text>
      : <Box {...props}><Skeleton h="18px" w="70%" mb={3} /><Skeleton h={height} borderRadius="lg" /></Box>);
  }

  const name = data.provider?.name || (kind === 'transport' ? 'The truck' : 'Your mechanic');
  const age = updatedAgoText(liveAgeSeconds(live, fetchedAt, now));
  const target = data.target && data.target.lat != null ? data.target : null;
  const dropoff = data.dropoff && data.dropoff.lat != null ? data.dropoff : null;
  const here = youLabel || (kind === 'transport' ? 'Pickup' : 'You');

  return wrap(
    <Box {...props}>
      <Flex justify="space-between" align="baseline" gap={3} flexWrap="wrap" mb={2}>
        <Text fontWeight="600" role="status" aria-live="polite">{data.message}</Text>
        {live && <Text fontSize="xs" color={live.stale ? 'orange.600' : 'gray.500'}>{age}</Text>}
      </Flex>
      <Box h={height} borderRadius="lg" overflow="hidden">
        <MapComponent
          location={target ? { lat: target.lat, lng: target.lng } : null}
          pins={dropoff ? [{ id: 'dropoff', lat: dropoff.lat, lng: dropoff.lng, title: 'Drop-off', subtitle: dropoff.address }] : []}
          live={live ? { ...live, label: `${name}: live position` } : null}
          zoom={14}
          label={`Live map: ${data.message || name}`}
          unavailableText="The map isn't available right now. The distance above still updates."
          style={{ height: '100%' }}
          h="100%"
        />
      </Box>
      <HStack spacing={4} mt={2} fontSize="xs" color="gray.600" flexWrap="wrap">
        {target && <HStack spacing={1.5}><LegendDot color="#0460CC" /><Text>{here}{target.address ? `: ${target.address}` : ''}</Text></HStack>}
        {dropoff && <HStack spacing={1.5}><LegendDot color="#E5484D" /><Text>Drop-off</Text></HStack>}
        <HStack spacing={1.5}><LegendDot color="#0460CC" ring="#0460CC" /><Text>{name}{live ? '' : ' (not sharing yet)'}</Text></HStack>
      </HStack>
    </Box>
  );
}

/** "Track on map" → a full-screen live map (customer's paid towing / hauling job). */
export function TrackOnMapButton({ kind = 'transport', uuid, title = 'Track on map', ...props }) {
  const modal = useDisclosure();
  return (
    <>
      <Button size="sm" variant="outline" borderColor="primary" color="primary" leftIcon={<MapIcon size={14} />} onClick={modal.onOpen} {...props}>
        Track on map
      </Button>
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pr={12}>{title}</ModalHeader>
          <ModalCloseButton aria-label="Close the map" />
          <ModalBody pb={6}>
            {modal.isOpen && <LiveTrackingPanel kind={kind} uuid={uuid} height="calc(100vh - 190px)" />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

// ---- sharing (the mechanic / towing business) ----------------------------------------------------------
// One share at a time for the whole page, so it keeps going when a drawer or chat card closes; it ends with
// "Stop sharing", when the server says the job can't be tracked, or when the page is closed.

const share = {
  key: '', kind: '', uuid: '', status: 'idle', message: '', messageKey: '', label: '',
  watchId: null, last: null, sentAt: 0, inFlight: false, wake: null,
};
const listeners = new Set();
const snapshot = () => ({
  key: share.key, status: share.status, message: share.message, messageKey: share.messageKey, sentAt: share.sentAt, label: share.label,
});
const emit = () => { const snap = snapshot(); listeners.forEach((fn) => fn(snap)); };

async function keepAwake() {
  try {
    if (share.status !== 'idle' && navigator.wakeLock && !share.wake) {
      share.wake = await navigator.wakeLock.request('screen');
      share.wake.addEventListener?.('release', () => { share.wake = null; });
    }
  } catch { /* not allowed (e.g. battery saver): sharing still works while the screen is on */ }
}
function onVisible() { if (document.visibilityState === 'visible') keepAwake(); }
function onPageHide() {
  // best effort: tell the server we stopped (the request survives the page closing)
  if (share.key) trackingRequest('DELETE', share.kind, share.uuid, null, { keepalive: true }).catch(() => {});
}

async function sendPosition(position) {
  const next = positionPayload(position);
  const now = Date.now();
  if (share.inFlight || !shouldSendPosition(share.last, next, now)) return;
  share.inFlight = true;
  const key = share.key;
  try {
    await trackingRequest('POST', share.kind, share.uuid, next);
    if (share.key !== key) return;
    share.last = { ...next, at: now };
    share.sentAt = now;
    share.status = 'sharing';
    share.message = '';
  } catch (error) {
    if (share.key !== key) return;
    if (stopsSharing(error)) { stopSharing({ message: sharingErrorMessage(error), tellServer: error.status !== 403 }); return; }
    share.message = sharingErrorMessage(error);
    share.messageKey = key;
    if (error.status === 429) share.last = { ...next, at: now + 10000 }; // slow down
  } finally {
    share.inFlight = false;
    emit();
  }
}

function onPositionError(error) {
  if (stopsSharing(error)) { stopSharing({ message: sharingErrorMessage(error), tellServer: false }); return; }
  share.message = sharingErrorMessage(error);
  share.messageKey = share.key;
  emit();
}

export function startSharing(kind, uuid, label = '') {
  const key = `${kind}:${uuid}`;
  if (share.key === key) return;
  if (share.key) stopSharing();
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    Object.assign(share, { message: "This browser can't share its location. Try Chrome or Safari on your phone.", messageKey: key });
    emit();
    return;
  }
  Object.assign(share, { key, kind, uuid, label, status: 'starting', message: '', messageKey: '', last: null, sentAt: 0 });
  share.watchId = navigator.geolocation.watchPosition(sendPosition, onPositionError, WATCH_OPTIONS);
  keepAwake();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('pagehide', onPageHide);
  emit();
}

export function stopSharing({ message = '', tellServer = true } = {}) {
  if (!share.key) return;
  const { kind, uuid, key } = share;
  if (share.watchId !== null) navigator.geolocation?.clearWatch(share.watchId);
  share.wake?.release?.().catch?.(() => {});
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('pagehide', onPageHide);
  Object.assign(share, { key: '', kind: '', uuid: '', label: '', status: 'idle', watchId: null, last: null, sentAt: 0, wake: null, message, messageKey: message ? key : '' });
  if (tellServer) trackingRequest('DELETE', kind, uuid).catch(() => {});
  emit();
}

/** The current share, kept up to date. */
export function useSharing() {
  const [snap, setSnap] = useState(snapshot);
  useEffect(() => {
    listeners.add(setSnap);
    setSnap(snapshot());
    return () => { listeners.delete(setSnap); };
  }, []);
  return snap;
}

/**
 * "Share live location" / "Stop sharing" for one job. `active`: the job's `live_tracking` flag; when it turns
 * false while sharing (job done or cancelled), sharing stops by itself.
 */
export function ShareLiveLocation({ kind, uuid, active, label = '', ...props }) {
  const snap = useSharing();
  const key = `${kind}:${uuid}`;
  const mine = snap.key === key;
  const sharing = mine && snap.status !== 'idle';
  const now = useNow(1000, sharing);

  useEffect(() => {
    if (!active && share.key === key) stopSharing({ message: 'The job has moved on, so sharing has stopped.' });
  }, [active, key]);

  const message = snap.messageKey === key ? snap.message : '';
  if (!active && !message) return null;

  return (
    <Box borderWidth="1px" borderColor={sharing ? 'green.300' : 'gray.200'} bg={sharing ? 'green.50' : 'white'} borderRadius="md" p={3} {...props}>
      {sharing ? (
        <>
          <HStack spacing={2} align="start">
            <Box as="span" mt={1.5} w="10px" h="10px" borderRadius="full" bg="green.500" flexShrink={0}
              sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: 'motaaShare 1.6s ease-in-out infinite' } }} aria-hidden="true" />
            <Box>
              <Text fontSize="sm" fontWeight="600" color="green.800">Sharing your live location with the customer · keep this page open</Text>
              <Text fontSize="xs" color="green.700">
                {snap.status === 'starting' ? 'Finding your location…' : `Last sent ${updatedAgoText((now - snap.sentAt) / 1000).replace('Updated ', '')}`}
              </Text>
            </Box>
          </HStack>
          <style>{'@keyframes motaaShare { 0%,100% { box-shadow: 0 0 0 0 rgba(56,161,105,.5) } 50% { box-shadow: 0 0 0 6px rgba(56,161,105,0) } }'}</style>
          <Button mt={2} size="sm" variant="outline" colorScheme="red" leftIcon={<Square size={12} />} onClick={() => stopSharing()}>
            Stop sharing
          </Button>
        </>
      ) : active ? (
        <>
          <Button size="sm" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<Navigation size={14} />}
            onClick={() => startSharing(kind, uuid, label)}>
            Share live location
          </Button>
          <Text fontSize="xs" color="gray.600" mt={1.5}>The customer sees you move on a map while you're on your way.</Text>
        </>
      ) : null}
      {message && <Text fontSize="sm" color={sharing ? 'orange.700' : 'red.600'} mt={2} role="alert">{message}</Text>}
    </Box>
  );
}

/** A thin bar while sharing, for pages where the job's own control may be out of view (e.g. the bookings page). */
export function SharingStatusBar(props) {
  const snap = useSharing();
  if (snap.status === 'idle') return null;
  return (
    <Flex align="center" justify="space-between" gap={3} flexWrap="wrap" bg="green.50" borderWidth="1px" borderColor="green.300" borderRadius="md" px={3} py={2} role="status" {...props}>
      <Text fontSize="sm" color="green.800" fontWeight="600">
        Sharing your live location{snap.label ? ` with ${snap.label}` : ''} · keep this page open
      </Text>
      <Button size="xs" variant="outline" colorScheme="red" onClick={() => stopSharing()}>Stop sharing</Button>
    </Flex>
  );
}
