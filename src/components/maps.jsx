import { Box, Flex, Input, List, ListItem, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { MAPBOX_TOKEN } from "../config";
import { searchPlaces } from "../api/geocode";

// Abuja city centre: used when we don't know where the user is yet.
export const DEFAULT_MAP_CENTER = { lat: 9.0765, lng: 7.3986 };
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

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

/**
 * Mapbox map centred on `location` ({lat, lng}) with a marker.
 * The centre only moves when `location` changes, so the user can pan freely.
 * If the map can't load (offline, blocked, bad token) a plain notice is shown instead.
 */
export const MapComponent = ({ location, style, zoom = 12, label = 'Map', ...props }) => {
  const point = validPoint(location);
  const lat = point?.lat;
  const lng = point?.lng;
  const container = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [status, setStatus] = useState(MAPBOX_TOKEN ? 'loading' : 'error');

  // create the map once
  useEffect(() => {
    if (!MAPBOX_TOKEN) return undefined;
    let cancelled = false;
    loadMapbox().then((mapboxgl) => {
      if (cancelled || !container.current) return;
      if (mapboxgl.supported && !mapboxgl.supported()) return setStatus('error');
      const instance = new mapboxgl.Map({
        container: container.current,
        style: MAP_STYLE,
        center: lat !== undefined ? [lng, lat] : [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
        zoom,
        attributionControl: true,
        cooperativeGestures: true, // page scroll isn't hijacked by the map
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
      marker.current = null;
      map.current?.remove();
      map.current = null;
    };
    // the map is created once; later changes are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow `location`
  useEffect(() => {
    const instance = map.current;
    if (!instance || status !== 'ready') return;
    if (lat === undefined) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) marker.current = new instance.mapboxgl.Marker({ color: '#0460CC' });
    marker.current.setLngLat([lng, lat]).addTo(instance);
    instance.easeTo({ center: [lng, lat], zoom: Math.max(instance.getZoom(), zoom), duration: 600 });
  }, [lat, lng, zoom, status]);

  return (
    <Box position="relative" role="region" aria-label={label} borderRadius="lg" overflow="hidden" minH="200px" bg="gray.100" style={style} {...props}>
      {/* Mapbox makes its container position:relative, so it gets its size from this wrapper */}
      <Box position="absolute" inset={0} visibility={status === 'error' ? 'hidden' : 'visible'}>
        <div ref={container} style={{ width: '100%', height: '100%' }} />
      </Box>
      {status !== 'ready' && (
        <Flex position="absolute" inset={0} align="center" justify="center" direction="column" gap={2} color="gray.600" textAlign="center" px={4} pointerEvents="none">
          {status === 'error' ? (
            <>
              <MapPin aria-hidden="true" />
              <Text fontSize="sm">The map isn't available right now. You can still type your address.</Text>
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
 * Address search backed by Photon (OpenStreetMap).
 * onPlaceChange({ place_id, country, state, city, formatted_address, zip_code, lat, lng, name })
 * fires when a suggestion is chosen.
 */
export const CustomPlacesAutocomplete = ({
  value,
  onPlaceChange,
  inputProps,
  placeholder = "Search a place",
  country = 'ng',
  id,
  'aria-label': ariaLabel = 'Search for an address',
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const debounce = useRef(null);
  const request = useRef(null);
  const listId = useId();

  // keep the text in sync when the parent sets a new value (e.g. reverse-geocoded location)
  useEffect(() => {
    if (value !== undefined) setInputValue(value || '');
  }, [value]);

  useEffect(() => () => {
    clearTimeout(debounce.current);
    request.current?.abort();
  }, []);

  const fetchPredictions = (input) => {
    clearTimeout(debounce.current);
    request.current?.abort();
    setMessage('');
    if (input.trim().length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      try {
        const results = await searchPlaces(input, { country, signal: controller.signal });
        setPredictions(results);
        setActive(-1);
        if (!results.length) setMessage('No suggestions found. You can type the full address instead.');
      } catch (error) {
        if (error?.name === 'AbortError') return; // a newer search replaced this one
        setPredictions([]);
        setMessage('Address search is unavailable right now. You can type the full address instead.');
      } finally {
        if (request.current === controller) setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (place) => {
    if (!place) return;
    setInputValue(place.formatted_address);
    setPredictions([]);
    setActive(-1);
    onPlaceChange?.(place);
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
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onKeyDown={onKeyDown}
        onBlur={() => setPredictions([])}
        onChange={(e) => {
          setInputValue(e.target.value);
          fetchPredictions(e.target.value);
        }}
        {...inputProps}
      />

      {loading && <Spinner size="sm" position="absolute" right={2} top="50%" mt="-8px" aria-label="Searching" />}
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
          {predictions.map((place, idx) => (
            <ListItem
              key={place.place_id}
              id={`${listId}-${idx}`}
              role="option"
              aria-selected={idx === active}
              px={4}
              py={2}
              bg={idx === active ? 'gray.100' : undefined}
              _hover={{ bg: "gray.100", cursor: "pointer" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(place)}
            >
              {place.formatted_address}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
