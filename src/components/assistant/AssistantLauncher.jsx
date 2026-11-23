// The floating Motaa AI button (bottom right, every page except chat). The chat panel itself is loaded only when
// someone opens it, so it adds nothing to page load.
import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Flex, Spinner, Tooltip } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Sparkles, X } from 'lucide-react';

const AssistantPanel = lazy(() => import('./AssistantPanel'));
const SEEN_KEY = 'motaa-ai-seen';
const pulse = keyframes`0% { transform: scale(1); opacity: .55 } 100% { transform: scale(1.7); opacity: 0 }`;

function readSeen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}

export default function AssistantLauncher() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [seen, setSeen] = useState(readSeen);
  const hidden = /^\/chat(\/|$)/.test(pathname);

  useEffect(() => {
    // other parts of the site can open the assistant: window.dispatchEvent(new CustomEvent('motaa-ai:open'))
    const onOpen = () => { setLoaded(true); setOpen(true); };
    window.addEventListener('motaa-ai:open', onOpen);
    return () => window.removeEventListener('motaa-ai:open', onOpen);
  }, []);

  function toggle() {
    setLoaded(true);
    setOpen((value) => !value);
    if (!seen) {
      setSeen(true);
      try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
    }
  }

  if (hidden) return null;
  return (
    <>
      {loaded && (
        <Suspense fallback={open ? <Flex position="fixed" bottom="96px" right="24px" zIndex={1450} w="56px" h="56px" align="center" justify="center"><Spinner color="primary" /></Flex> : null}>
          <AssistantPanel isOpen={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
      <Tooltip label="Ask Motaa AI" placement="left" hasArrow isDisabled={open} openDelay={300}>
        <Box as="button" type="button" onClick={toggle} aria-label={open ? 'Close Motaa AI' : 'Open Motaa AI assistant'} aria-expanded={open}
          position="fixed" right={{ base: 4, md: 6 }} bottom={{ base: 'calc(16px + env(safe-area-inset-bottom))', md: 6 }} zIndex={1460}
          w={{ base: '56px', md: '60px' }} h={{ base: '56px', md: '60px' }} borderRadius="full" color="white"
          bg="linear-gradient(135deg, #0B1220 0%, #0065B5 70%, #4C9BE0 100%)" boxShadow="0 12px 30px rgba(0,101,181,0.45)"
          display={{ base: open ? 'none' : 'flex', md: 'flex' }} alignItems="center" justifyContent="center"
          transition="transform .2s, box-shadow .2s" _hover={{ transform: 'translateY(-2px) scale(1.04)', boxShadow: '0 16px 36px rgba(0,101,181,0.55)' }}
          _focusVisible={{ outline: '3px solid #FDD153', outlineOffset: '3px' }}
          // a form's sticky Save bar is at the bottom: sit above it so it's never covered
          sx={{
            'body:has([data-motaa-sticky-actions]) &': { bottom: { base: '150px', md: '104px' } },
            // never float over an open menu or dialog (e.g. the phone navigation menu)
            'body:has(.chakra-modal__content-container) &': { display: 'none' },
          }}>
          {!seen && !open && (
            <Box position="absolute" inset={0} borderRadius="full" bg="#4C9BE0" aria-hidden="true"
              sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: `${pulse} 1.8s ease-out infinite` } }} />
          )}
          <Box position="relative" transition="transform .25s" transform={open ? 'rotate(90deg)' : undefined}>
            {open ? <X size={24} /> : <Sparkles size={26} />}
          </Box>
          {!seen && !open && <Box position="absolute" top="2px" right="2px" w="14px" h="14px" borderRadius="full" bg="tertiary" border="2px solid white" aria-hidden="true" />}
        </Box>
      </Tooltip>
    </>
  );
}
