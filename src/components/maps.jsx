import { Box, Button, ButtonGroup, Flex, Input, List, ListItem, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { MAPBOX_TOKEN } from "../config";
import {
  SEARCH_DEBOUNCE_MS, newPlacesSession, placeDetails, placesErrorMessage, searchPlaces, shouldSearch,
} from "../api/geocode";

// Abuja city centre: used when we don't know where the user is yet.
export const DEFAULT_MAP_CENTER = { lat: 9.0765, lng: 7.3986 };
const MAP_STYLES = {
  map: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12", // photos with road and place names on top
};
const MAP_VIEW_KEY = 'motaa:map-view';

// the last view the user chose (map or satellite), remembered in this browser
function savedMapView() {
  try { return localStorage.getItem(MAP_VIEW_KEY) === 'satellite' ? 'satellite' : 'map'; } catch { return 'map'; }
}
function saveMapView(view) {
  try { localStorage.setItem(MAP_VIEW_KEY, view); } catch { /* private window: just don't remember */ }
}

function validPoint(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// Mapbox GL is large, so it is only downloaded on pages that show a map.
let mapboxPromise;
function loadMapbox() {
  if (!mapboxPromise) {
    mapboxPromise = Promise.all([import("mapbox-gl"), import("mapbox-gl/dist/mapbox-gl.css")])
      .then(([module]) => {
        const mapboxgl = module.default || module;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        return mapboxgl;
      })
      .catch((error) => { mapboxPromise = undefined; throw error; });
  }
  return mapboxPromise;
}

/** The live vehicle marker: a blue dot with a white ring, a soft halo and (when moving) a heading arrow. */
function liveMarkerElement() {
  const box = document.createElement('div');
  box.setAttribute('role', 'img');
  box.style.cssText = 'width:34px;height:34px;position:relative;transition:opacity .3s';
  const halo = document.createElement('div');
  halo.style.cssText = 'position:absolute;inset:0;border-radius:50%;background:rgba(4,96,204,.22)';
  const dot = document.createElement('div');
  dot.style.cssText = 'position:absolute;left:8px;top:8px;width:18px;height:18px;border-radius:50%;background:#0460CC;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)';
  const arrow = document.createElement('div');
  arrow.setAttribute('data-arrow', '');
  // a small triangle above the dot, turned by the heading (0° = north)
  arrow.style.cssText = 'position:absolute;inset:0;display:none;transform-origin:50% 50%';
  const tip = document.createElement('div');
  tip.style.cssText = 'position:absolute;left:11px;top:-3px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid #0460CC';
  arrow.appendChild(tip);
  box.append(halo, arrow, dot);
  return box;
}

/** What a pin's popup shows: built from DOM nodes so names are never treated as HTML. */
function pinPopup(pin) {
  const box = document.createElement('div');
  box.style.cssText = 'font-family:inherit;min-width:160px;max-width:220px';
  const title = document.createElement('div');
  title.textContent = pin.title || 'Mechanic';
  title.style.cssText = 'font-weight:700;font-size:14px;color:#101828';
  box.appendChild(title);
  if (pin.subtitle) {
    const subtitle = document.createElement('div');
    subtitle.textContent = pin.subtitle;
    subtitle.style.cssText = 'font-size:12px;color:#475467;margin-top:2px';
    box.appendChild(subtitle);
  }
  if (pin.href) {
    const link = document.createElement('a');
    link.href = pin.href;
    link.textContent = pin.linkLabel || 'View';
    link.style.cssText = 'display:inline-block;margin-top:8px;font-size:13px;font-weight:700;color:#0460CC;text-decoration:underline';
    link.addEventListener('click', (event) => {
      if (!pin.onOpen || event.metaKey || event.ctrlKey || event.shiftKey) return; // new tab: let the browser do it
      event.preventDefault();
      pin.onOpen();
    });
    box.appendChild(link);
  }
  return box;
}

/**
 * Mapbox map centred on `location` ({lat, lng}) with a marker.
 * The centre only moves when `location` changes, so the user can pan freely.
 * If the map can't load (offline, blocked, bad token) a plain notice is shown instead.
 *
 * pins:       more places to mark, e.g. mechanics: [{ id, lat, lng, title, subtitle, href, linkLabel, onOpen }].
 *             Clicking one shows its name and link.
 * fitPins:    zoom so `location` and every pin are in view (used by the large map).
 * onMapClick: called when the map itself is clicked, not dragged (used to open the large map).
 * pageScroll: true (default) keeps the page scrolling when the pointer is over the map;
 *             false lets the wheel and one finger move the map (for a full-screen map).
 * onPinMove:  makes the `location` marker movable: drag it, or click the map to put it there.
 *             Called with { lat, lng } (e.g. to fine-tune a business's pin).
 * live:       a moving vehicle { lat, lng, heading?, label?, stale? } (live tracking). It glides to each new
 *             position, and the first time it appears the map zooms so it, `location` and `pins` are all in
 *             view; after that the view is left to the user.
 * unavailableText: what to say when the map can't load.
 */
export const MapComponent = ({
  location, style, zoom = 12, label = 'Map', pins, fitPins = false, onMapClick, onPinMove, live, pageScroll = true,
  unavailableText = "The map isn't available right now. You can still type your address.", ...props
}) => {
  const point = validPoint(location);
  const lat = point?.lat;
  const lng = point?.lng;
  const container = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const pinMarkers = useRef([]);
  const clickHandler = useRef(onMapClick);
  clickHandler.current = onMapClick;
  const moveHandler = useRef(onPinMove);
  moveHandler.current = onPinMove;
  const movable = Boolean(onPinMove);
  const [status, setStatus] = useState(MAPBOX_TOKEN ? 'loading' : 'error');
  const [view, setView] = useState(savedMapView);
  const shownView = useRef(view);
  const validPins = (Array.isArray(pins) ? pins : []).map((pin) => ({ ...pin, ...(validPoint(pin) || {}), ok: Boolean(validPoint(pin)) })).filter((pin) => pin.ok);
  // re-draw pins only when the places themselves change, not on every render
  const pinsKey = validPins.map((pin) => `${pin.id ?? ''}:${pin.lat.toFixed(5)},${pin.lng.toFixed(5)}:${pin.title ?? ''}:${pin.subtitle ?? ''}`).join('|');
  const pinsRef = useRef(validPins);
  pinsRef.current = validPins;
  const livePoint = validPoint(live);
  const liveMarker = useRef(null);
  const liveFrame = useRef(0);
  const liveFitted = useRef(false);

  // create the map once
  useEffect(() => {
    if (!MAPBOX_TOKEN) return undefined;
    let cancelled = false;
    loadMapbox().then((mapboxgl) => {
      if (cancelled || !container.current) return;
      if (mapboxgl.supported && !mapboxgl.supported()) return setStatus('error');
      const instance = new mapboxgl.Map({
        container: container.current,
        style: MAP_STYLES[shownView.current],
        center: lat !== undefined ? [lng, lat] : [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
        zoom,
        attributionControl: true,
        cooperativeGestures: pageScroll, // page scroll isn't hijacked by the map
      });
      instance.on('click', (event) => {
        // a click on a pin opens that pin, not the large map
        if (event.originalEvent?.target?.closest?.('.mapboxgl-marker, .mapboxgl-popup')) return;
        if (moveHandler.current && event.lngLat) {
          moveHandler.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
          return;
        }
        clickHandler.current?.();
      });
      instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      instance.on('load', () => { if (!cancelled) setStatus('ready'); });
      // a rejected token or unreachable style: fall back to the notice
      instance.on('error', (event) => {
        const code = event?.error?.status;
        if (!cancelled && (code === 401 || code === 403 || !instance.isStyleLoaded())) setStatus((s) => (s === 'ready' ? s : 'error'));
      });
      map.current = instance;
      map.current.mapboxgl = mapboxgl;
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => {
      cancelled = true;
      cancelAnimationFrame(liveFrame.current);
      liveMarker.current = null;
      marker.current = null;
      pinMarkers.current = [];
      map.current?.remove();
      map.current = null;
    };
    // the map is created once; later changes are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // switch between the street map and satellite photos (markers stay where they are)
  useEffect(() => {
    const instance = map.current;
    if (!instance || status !== 'ready' || shownView.current === view) return;
    shownView.current = view;
    instance.setStyle(MAP_STYLES[view]);
  }, [view, status]);

  const chooseView = (next) => (event) => {
    event.stopPropagation();
    setView(next);
    saveMapView(next);
  };

  // follow `location`
  useEffect(() => {
    const instance = map.current;
    if (!instance || status !== 'ready') return;
    if (lat === undefined) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = new instance.mapboxgl.Marker({ color: '#0460CC' });
      marker.current.on('dragend', () => {
        const at = marker.current?.getLngLat();
        if (at) moveHandler.current?.({ lat: at.lat, lng: at.lng });
      });
    }
    marker.current.setDraggable(movable);
    marker.current.setLngLat([lng, lat]).addTo(instance);
    // a fine-tuned pin stays in view: only pan when it has left the visible area
    if (!movable || !instance.getBounds().contains([lng, lat])) {
      instance.easeTo({ center: [lng, lat], zoom: Math.max(instance.getZoom(), zoom), duration: 600 });
    }
  }, [lat, lng, zoom, status, movable]);

  // the other places (mechanics)
  useEffect(() => {
    const instance = map.current;
    if (!instance || status !== 'ready') return;
    pinMarkers.current.forEach((item) => item.remove());
    const mapboxgl = instance.mapboxgl;
    pinMarkers.current = pinsRef.current.map((pin) => {
      const item = new mapboxgl.Marker({ color: '#E5484D', scale: 0.85 })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(new mapboxgl.Popup({ offset: 26, closeButton: true, maxWidth: '240px' }).setDOMContent(pinPopup(pin)))
        .addTo(instance);
      const element = item.getElement();
      element.style.cursor = 'pointer';
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-label', pin.title || 'Mechanic');
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.togglePopup(); }
      });
      return item;
    });
    if (fitPins && pinsRef.current.length) {
      const bounds = new mapboxgl.LngLatBounds();
      pinsRef.current.forEach((pin) => bounds.extend([pin.lng, pin.lat]));
      if (lat !== undefined) bounds.extend([lng, lat]);
      instance.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinsKey, fitPins, status, lat, lng]);

  // the live vehicle: a distinct marker that glides to each new position
  const liveLat = livePoint?.lat;
  const liveLng = livePoint?.lng;
  const liveHeading = Number.isFinite(Number(live?.heading)) && live?.heading !== null && live?.heading !== '' ? Number(live.heading) : null;
  const liveStale = Boolean(live?.stale);
  const liveLabel = live?.label || 'Live position';
  useEffect(() => {
    const instance = map.current;
    if (!instance || status !== 'ready') return;
    if (liveLat === undefined) {
      cancelAnimationFrame(liveFrame.current);
      liveMarker.current?.remove();
      liveMarker.current = null;
      return;
    }
    const mapboxgl = instance.mapboxgl;
    if (!liveMarker.current) {
      liveMarker.current = new mapboxgl.Marker({ element: liveMarkerElement(), rotationAlignment: 'map' })
        .setLngLat([liveLng, liveLat])
        .addTo(instance);
    } else {
      // glide from where it is to the new position (~1 s), unless the user prefers less motion
      cancelAnimationFrame(liveFrame.current);
      const from = liveMarker.current.getLngLat();
      const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        liveMarker.current.setLngLat([liveLng, liveLat]);
      } else {
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / 1000);
          const ease = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
          liveMarker.current?.setLngLat([from.lng + (liveLng - from.lng) * ease, from.lat + (liveLat - from.lat) * ease]);
          if (t < 1) liveFrame.current = requestAnimationFrame(step);
        };
        liveFrame.current = requestAnimationFrame(step);
      }
    }
    const element = liveMarker.current.getElement();
    element.setAttribute('aria-label', liveLabel);
    element.title = liveLabel;
    element.style.opacity = liveStale ? '0.55' : '1';
    const arrow = element.querySelector('[data-arrow]');
    if (arrow) {
      arrow.style.display = liveHeading === null ? 'none' : 'block';
      arrow.style.transform = `rotate(${liveHeading ?? 0}deg)`;
    }
    // the first time: show the vehicle, `location` and the pins together; then leave the view alone
    if (!liveFitted.current) {
      liveFitted.current = true;
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([liveLng, liveLat]);
      if (lat !== undefined) bounds.extend([lng, lat]);
      pinsRef.current.forEach((pin) => bounds.extend([pin.lng, pin.lat]));
      instance.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLat, liveLng, liveHeading, liveStale, liveLabel, status]);

  return (
    <Box position="relative" role="region" aria-label={label} borderRadius="lg" overflow="hidden" minH="200px" bg="gray.100" style={style} {...props}>
      {/* Mapbox makes its container position:relative, so it gets its size from this wrapper */}
      <Box position="absolute" inset={0} visibility={status === 'error' ? 'hidden' : 'visible'}>
        <div ref={container} style={{ width: '100%', height: '100%' }} />
      </Box>
      {status === 'ready' && (
        <ButtonGroup size="xs" isAttached position="absolute" top={2} left={2} zIndex={1} boxShadow="md" borderRadius="md"
          role="group" aria-label="Map view">
          {[['map', 'Map'], ['satellite', 'Satellite']].map(([value, text]) => (
            <Button key={value} onClick={chooseView(value)} aria-pressed={view === value}
              bg={view === value ? 'primary' : 'white'} color={view === value ? 'white' : 'gray.700'}
              _hover={{ bg: view === value ? 'primary' : 'gray.100' }} fontWeight="600">
              {text}
            </Button>
          ))}
        </ButtonGroup>
      )}
      {status !== 'ready' && (
        <Flex position="absolute" inset={0} align="center" justify="center" direction="column" gap={2} color="gray.600" textAlign="center" px={4} pointerEvents="none">
          {status === 'error' ? (
            <>
              <MapPin aria-hidden="true" />
              <Text fontSize="sm">{unavailableText}</Text>
            </>
          ) : (
            <Spinner color="primary" aria-label="Loading map" />
          )}
        </Flex>
      )}
    </Box>
  );
};

/**
 * Address search through the Motaa backend (Google Places, OpenStreetMap as a fallback).
 * onPlaceChange({ place_id, country, state, city, formatted_address, zip_code, lat, lng, name })
 * fires when a suggestion is chosen.
 *
 * Google bills per session, so this box keeps one session id while the user types (searches only from
 * 3 characters, ~400 ms after they stop, never the same text twice in a row), fetches details only for
 * the suggestion picked, with that session, and then starts a new session.
 */
export const CustomPlacesAutocomplete = ({
  value,
  onPlaceChange,
  inputProps,
  placeholder = "Search a place",
  country = 'ng', // eslint-disable-line no-unused-vars -- kept for callers; the server searches Nigeria
  id,
  'aria-label': ariaLabel = 'Search for an address',
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(null); // place_id whose details are loading
  const [message, setMessage] = useState('');
  const debounce = useRef(null);
  const request = useRef(null);
  const detailsRequest = useRef(null);
  const session = useRef(null);
  const last = useRef({ text: '', results: [] }); // the last search sent, and what it found
  const listId = useId();

  const currentSession = () => {
    if (!session.current) session.current = newPlacesSession();
    return session.current;
  };
  const endSession = () => { session.current = null; };

  // keep the text in sync when the parent sets a new value (e.g. reverse-geocoded location)
  useEffect(() => {
    if (value !== undefined) setInputValue(value || '');
  }, [value]);

  useEffect(() => () => {
    clearTimeout(debounce.current);
    request.current?.abort();
    detailsRequest.current?.abort();
  }, []);

  const fetchPredictions = (input) => {
    clearTimeout(debounce.current);
    setMessage('');
    const text = input.trim();
    if (!text) endSession(); // cleared: the next search is a new session
    if (!shouldSearch(text, '')) {
      request.current?.abort();
      setPredictions([]);
      setLoading(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      if (!shouldSearch(text, last.current.text)) {
        // same text as the last search (e.g. typed a letter and deleted it): show what it found again
        setPredictions(last.current.results);
        setActive(-1);
        return;
      }
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      last.current = { text, results: [] };
      setLoading(true);
      try {
        const results = await searchPlaces(text, { session: currentSession(), signal: controller.signal });
        last.current = { text, results };
        setPredictions(results);
        setActive(-1);
        if (!results.length) setMessage('No suggestions found. You can type the full address instead.');
      } catch (error) {
        if (error?.name === 'AbortError') return; // a newer search replaced this one
        if (!error?.status) last.current = { text: '', results: [] }; // offline: the same text can be tried again
        setPredictions([]);
        setMessage(placesErrorMessage(error));
      } finally {
        if (request.current === controller) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const finish = (place) => {
    setInputValue(place.formatted_address);
    setPredictions([]);
    setActive(-1);
    setPicking(null);
    setMessage('');
    last.current = { text: String(place.formatted_address || '').trim(), results: [] };
    endSession(); // a pick ends the session
    onPlaceChange?.(place);
  };

  const handleSelect = async (suggestion) => {
    if (!suggestion || picking) return;
    clearTimeout(debounce.current);
    request.current?.abort();
    setLoading(false);
    if (suggestion.place) {
      finish(suggestion.place);
      return;
    }
    detailsRequest.current?.abort();
    const controller = new AbortController();
    detailsRequest.current = controller;
    setPicking(suggestion.place_id);
    try {
      const place = await placeDetails(suggestion.place_id, { session: currentSession(), name: suggestion.main, signal: controller.signal });
      if (detailsRequest.current === controller) finish(place);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setPicking(null);
      setPredictions([]);
      setMessage(placesErrorMessage(error));
    }
  };

  function onKeyDown(e) {
    if (!predictions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % predictions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? predictions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      handleSelect(predictions[active]);
    } else if (e.key === 'Escape') {
      setPredictions([]);
    }
  }

  const open = predictions.length > 0;

  return (
    <Box position="relative" w="100%" {...props}>
      <Input
        id={id}
        placeholder={placeholder}
        value={inputValue}
        borderWidth={0}
        autoComplete="off"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-busy={Boolean(picking) || loading}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onKeyDown={onKeyDown}
        onBlur={() => { if (!picking) setPredictions([]); }}
        onChange={(e) => {
          setInputValue(e.target.value);
          fetchPredictions(e.target.value);
        }}
        {...inputProps}
      />

      {(loading || picking) && <Spinner size="sm" position="absolute" right={2} top="50%" mt="-8px" aria-label={picking ? 'Loading the address' : 'Searching'} />}
      {message && !open && <Text fontSize="xs" color="gray.600" mt={1} role="status">{message}</Text>}

      {open && (
        <List
          id={listId}
          role="listbox"
          position="absolute"
          width="100%"
          bg="white"
          border="1px solid #ccc"
          zIndex={999}
          mt={1}
          borderRadius="md"
          boxShadow="md"
          maxH="260px"
          overflowY="auto"
        >
          {predictions.map((suggestion, idx) => {
            const loadingRow = picking === suggestion.place_id;
            return (
              <ListItem
                key={suggestion.place_id}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={idx === active}
                aria-busy={loadingRow || undefined}
                px={4}
                py={2}
                display="flex"
                alignItems="center"
                gap={3}
                bg={idx === active || loadingRow ? 'gray.100' : undefined}
                opacity={picking && !loadingRow ? 0.6 : 1}
                _hover={{ bg: "gray.100", cursor: picking ? 'progress' : "pointer" }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                <Box as="span" color="gray.400" flexShrink={0} lineHeight={0} aria-hidden="true">
                  {loadingRow ? <Spinner size="xs" /> : <MapPin size={16} />}
                </Box>
                <Box as="span" display="block" minW={0}>
                  <Text as="span" display="block" fontWeight="600" fontSize="sm" noOfLines={1}>{suggestion.main}</Text>
                  {suggestion.secondary && <Text as="span" display="block" fontSize="xs" color="gray.600" noOfLines={1}>{suggestion.secondary}</Text>}
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};
