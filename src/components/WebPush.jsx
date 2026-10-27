// "Notifications on this device": turn web push on/off (src/utils/webPush.js), with help for iPhones that haven't
// added Motaa to the home screen and for browsers where notifications are blocked. Plus a one-time prompt for people
// using the installed app.
import { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Button, CloseButton, Flex, FormControl, FormLabel, HStack, Icon, Spinner, Switch, Text } from '@chakra-ui/react';
import { BellRing } from 'lucide-react';
import { GlobalStore } from '../App';
import * as webPush from '../utils/webPush';

const PROMPT_DISMISSED_KEY = 'motaa-push-prompt-dismissed';

function deniedHelp() {
  if (webPush.isIos()) return 'Notifications are blocked for Motaa. Open Settings → Notifications → Motaa and allow them, then come back here.';
  if (/Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
    return 'Notifications are blocked for Motaa. Long-press the Motaa icon → App info → Notifications and allow them (or allow them in the browser\'s site settings), then come back here.';
  }
  return 'Notifications are blocked for this site. Click the lock icon next to the address, allow notifications, then reload the page.';
}

const HELP = {
  'needs-install': 'To get notifications on iPhone, tap Share → Add to Home Screen, then open Motaa from your home screen and turn this on.',
  unsupported: "This browser can't show notifications from Motaa. Try Chrome, Edge or Safari, or install the Motaa app.",
  'disabled-by-server': "Notifications on the website aren't available yet.",
  on: "You'll get notified about bookings, orders and messages on this device, even when Motaa is closed.",
  off: 'Get notified about bookings, orders and messages on this device, even when Motaa is closed.',
};

/** The current status, refreshed when the page becomes visible again (e.g. after changing phone settings). */
export function usePushStatus() {
  const { api } = useContext(GlobalStore);
  const [state, setState] = useState('loading');
  const refresh = useCallback(() => webPush.status(api).then(setState).catch(() => setState('unsupported')), [api]);
  useEffect(() => {
    refresh();
    const onShow = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [refresh]);
  return [state, setState, refresh];
}

/** The settings switch. Hidden entirely when the server hasn't turned web push on. */
export function PushSettings(props) {
  const { api, notifyError } = useContext(GlobalStore);
  const [state, setState] = usePushStatus();
  const [busy, setBusy] = useState(false);

  if (state === 'disabled-by-server') return null;

  // must run straight from the tap: the permission prompt only appears for a user action
  async function toggle(event) {
    const turnOn = event.target.checked;
    setBusy(true);
    try {
      setState(turnOn ? await webPush.enable(api) : await webPush.disable(api));
    } catch (error) {
      notifyError(error, "Couldn't change notifications");
      webPush.status(api).then(setState).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  const canToggle = ['on', 'off'].includes(state);
  const help = state === 'denied' ? deniedHelp() : HELP[state];

  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" p={4} {...props}>
      <FormControl display="flex" alignItems="center" justifyContent="space-between" gap={4} isDisabled={!canToggle || busy}>
        <HStack spacing={3} align="start">
          <Icon as={BellRing} boxSize={5} color="primary" mt={0.5} aria-hidden="true" />
          <Box>
            <FormLabel htmlFor="push-switch" mb={0} fontWeight="600">Notifications on this device</FormLabel>
            {state !== 'loading' && <Text fontSize="sm" color={state === 'denied' ? 'orange.700' : 'gray.600'} id="push-help">{help}</Text>}
          </Box>
        </HStack>
        {state === 'loading' || busy ? <Spinner size="sm" color="primary" aria-label="Checking notifications" />
          : <Switch id="push-switch" size="lg" isChecked={state === 'on'} onChange={toggle} aria-describedby="push-help" />}
      </FormControl>
    </Box>
  );
}

function promptDismissed() {
  try { return Boolean(localStorage.getItem(PROMPT_DISMISSED_KEY)); } catch { return false; }
}

/** A small one-time prompt for signed-in people using the installed app with notifications off. */
export function InstalledPushPrompt() {
  const { api, authUser, notifyError } = useContext(GlobalStore);
  const [state, setState] = useState(null);
  const [hidden, setHidden] = useState(promptDismissed);
  const [busy, setBusy] = useState(false);
  const show = Boolean(authUser) && !hidden && webPush.isInstalled();

  useEffect(() => {
    if (!show) return;
    webPush.status(api).then(setState).catch(() => {});
  }, [api, show]);

  function dismiss() {
    try { localStorage.setItem(PROMPT_DISMISSED_KEY, '1'); } catch { /* private mode: it just shows again later */ }
    setHidden(true);
  }

  async function turnOn() {
    setBusy(true);
    try {
      const next = await webPush.enable(api);
      setState(next);
      if (next !== 'off') dismiss();
    } catch (error) {
      notifyError(error, "Couldn't turn on notifications");
    } finally {
      setBusy(false);
    }
  }

  if (!show || state !== 'off') return null;
  return (
    <Flex position="fixed" left={{ base: 3, md: 'auto' }} right={3} bottom={{ base: 'calc(12px + env(safe-area-inset-bottom))', md: 4 }} zIndex={1400}
      maxW={{ md: '380px' }} bg="white" borderWidth="1px" borderColor="gray.200" boxShadow="lg" borderRadius="xl" p={3} gap={3} align="center"
      role="dialog" aria-label="Turn on notifications">
      <Icon as={BellRing} boxSize={6} color="primary" flexShrink={0} aria-hidden="true" />
      <Text flex={1} fontSize="sm" fontWeight="600">Get notified about bookings, orders and messages</Text>
      <Button size="sm" bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={turnOn} isLoading={busy}>Turn on</Button>
      <CloseButton size="sm" onClick={dismiss} aria-label="Not now" />
    </Flex>
  );
}
