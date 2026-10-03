import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { Box, Flex, Input, List, ListItem, Spinner, Text } from "@chakra-ui/react";
import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { GlobalStore } from "../App";

// Abuja city centre: used when we don't know where the user is yet.
export const DEFAULT_MAP_CENTER = { lat: 9.0765, lng: 7.3986 };

function validPoint(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * Google map centred on `location` ({lat, lng}) with a marker.
 * Uses the Maps script App already loads (useJsApiLoader), so no second loader.
 * The centre only moves when `location` changes, so the user can pan freely.
 */
export const MapComponent = ({ location, style, zoom = 12, label = 'Map', ...props }) => {
  const { mapsLoaded, mapsError } = useContext(GlobalStore);
  const point = validPoint(location);
  const lat = point?.lat;
  const lng = point?.lng;
  const center = useMemo(
    () => (lat !== undefined ? { lat, lng } : DEFAULT_MAP_CENTER),
    [lat, lng]
  );

  // Google draws its own "This page can't load Google Maps correctly" box inside the
  // map when it rejects the key (billing, restrictions). Watch for it and show our fallback.
  const wrapper = useRef(null);
  const [rejected, setRejected] = useState(false);
  useEffect(() => {
    const node = wrapper.current;
    if (!mapsLoaded || !node) return undefined;
    const check = () => { if (node.querySelector('.gm-err-container, .dismissButton')) setRejected(true); };
    const observer = new MutationObserver(check);
    observer.observe(node, { childList: true, subtree: true });
    check();
    return () => observer.disconnect();
  }, [mapsLoaded]);

  if (!mapsLoaded || rejected) {
    return (
      <Flex
        align="center"
        justify="center"
        direction="column"
        gap={2}
        bg="gray.100"
        color="gray.600"
        borderRadius="lg"
        minH="200px"
        textAlign="center"
        px={4}
        style={style}
        {...props}
      >
        {mapsError || rejected ? (
          <>
            <MapPin aria-hidden="true" />
            <Text fontSize="sm">The map isn't available right now. You can still type your address.</Text>
          </>
        ) : (
          <Spinner color="primary" aria-label="Loading map" />
        )}
      </Flex>
    );
  }

  return (
    <Box ref={wrapper} role="region" aria-label={label} borderRadius="lg" overflow="hidden" style={style} {...props}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", minHeight: "200px" }}
        center={center}
        zoom={zoom}
        options={{ streetViewControl: false, mapTypeControl: false, clickableIcons: false }}
      >
        {point && <MarkerF position={point} />}
      </GoogleMap>
    </Box>
  );
};


function component(result, type, key = 'long_name') {
  return result?.address_components?.find((comp) => comp?.types?.includes(type))?.[key];
}

/**
 * Address search backed by Google Places.
 * onPlaceChange({ place_id, country, state, city, formatted_address, zip_code, lat, lng, name })
 * fires once the chosen place's coordinates are known.
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
  const { mapsLoaded } = useContext(GlobalStore);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounce = useRef(null);
  const listId = useId();

  // keep the text in sync when the parent sets a new value (e.g. reverse-geocoded location)
  useEffect(() => {
    if (value !== undefined) setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    if (!mapsLoaded || !window.google?.maps?.places) return;
    if (!autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
    if (!placesService.current) {
      placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
    }
  }, [mapsLoaded]);

  useEffect(() => () => clearTimeout(debounce.current), []);

  const fetchPredictions = (input) => {
    clearTimeout(debounce.current);
    setMessage('');
    if (!autocompleteService.current || input.trim().length < 2) {
      setPredictions([]);
      if (!mapsLoaded && input.trim().length >= 2) setMessage("Address search is unavailable right now.");
      return;
    }
    debounce.current = setTimeout(() => {
      setLoading(true);
      const request = { input };
      if (country) request.componentRestrictions = { country };
      autocompleteService.current.getPlacePredictions(request, (results, status) => {
        setLoading(false);
        setPredictions(results || []);
        setActive(-1);
        if (!results?.length && status !== 'OK') setMessage('No suggestions found. You can type the full address instead.');
      });
    }, 250);
  };

  const handleSelect = (place) => {
    if (!place) return;
    setInputValue(place.description);
    setPredictions([]);
    setActive(-1);
    if (!placesService.current) {
      setMessage("Couldn't look up that address. Please try again.");
      return;
    }

    setLoading(true);
    placesService.current.getDetails(
      { placeId: place.place_id, fields: ['geometry', 'formatted_address', 'address_components', 'name', 'place_id'] },
      (details, status) => {
        setLoading(false);
        const location = details?.geometry?.location;
        if (status !== 'OK' || !location) {
          setMessage('No suggestions found. You can type the full address instead.');
          return;
        }
        onPlaceChange?.({
          place_id: place.place_id,
          name: details.name || place.description,
          country: component(details, 'country', 'short_name'),
          state: component(details, 'administrative_area_level_1', 'short_name'),
          city: component(details, 'administrative_area_level_2') || component(details, 'locality'),
          formatted_address: details.formatted_address || place.description,
          zip_code: component(details, 'postal_code'),
          lat: location.lat(),
          lng: location.lng(),
        });
      }
    );
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
              {place.description}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
