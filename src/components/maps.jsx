import {Map, Marker, APIProvider,  } from "@vis.gl/react-google-maps";
import {
    Box, Heading,
    Button,
    Container,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Stack,
    Text,
    Avatar,
    Badge,
    Card,
    CardBody,
    Icon,
    VStack,
    HStack,
    Image,
    Tag,
    ButtonGroup,
    Divider,
    Checkbox,
    List,
    ListItem,
    Spinner,
    useColorModeValue,
 } from "@chakra-ui/react";
import { useContext, useEffect, useState, Fragment, useRef } from "react";
import { GlobalStore } from "../App";
import { jsonifyObject, objectifyJSON } from "../utils";
import { useSearchParams, Link } from "react-router-dom";



export const MapComponent = ({ location, style, ref, ...props }) => {
  return (
    <APIProvider
     apiKey={'AIzaSyBcwRVb-mzVQuHVJyaOkgbGXtmFT-c_II0'}
    >
      <Map
        mapId="fe2d2f3f932f354f"
        style={{ width: "100%", height: "100%", color: 'green', ...style }}
        center={location}
        class="rounded"
        zoom={11}
      >
        <Marker position={location} />
      </Map>
    </APIProvider>
  );
};



export const CustomPlacesAutocomplete = ({ value, onPlaceChange, inputProps, ...props }) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedLatLng, setSelectedLatLng] = useState(null);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (window.google && !autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }

    if (window.google && mapRef.current && !placesService.current) {
      const dummyMap = new window.google.maps.Map(mapRef.current);
      placesService.current = new window.google.maps.places.PlacesService(dummyMap);
    }
  }, []);

  const fetchPredictions = (input) => {
    if (!autocompleteService.current || input.length < 2) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    autocompleteService.current.getPlacePredictions({ input }, (results) => {
      setPredictions(results || []);
      setLoading(false);
    });
  };

  const handleSelect = (place) => {
    setInputValue(place.description);
    setPredictions([]);
    setSelectedPlace(place)

    if (!placesService.current) return;

    placesService.current.getDetails({ placeId: place.place_id }, (details, status) => {
      if (status === "OK" && details.geometry) {
        const lat = details.geometry.location.lat();
        const lng = details.geometry.location.lng();
        setSelectedLatLng({ lat, lng });

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            const location = results[0]
            setSelectedAddress(location.formatted_address);

            const postal_code = location.address_components.find(comp => comp.types.includes('postal_code'))
            const country = location.address_components.find(comp => comp.types.includes('country'))
            const city = location.address_components.find(comp => comp.types.includes('administrative_area_level_2'))
            const state = location.address_components.find(comp => comp.types.includes('administrative_area_level_1'))
            const coords = {
              place_id: place.place_id,
              country: country.short_name,
              state: state.short_name,
              city: city.long_name,
              formatted_address: location.formatted_address,
              zip_code: postal_code?.long_name,
              lat,
              lng,
            }
            console.log("Coords:", coords)
            console.log("Postal code:", postal_code)
            onPlaceChange(coords)
          } else {
            setSelectedAddress("Address not found");
          }
        });
      }
    });
  };

  return (
    <Box position="relative" w="100%" {...props}>
      <Box ref={mapRef} style={{ display: "none" }} />

      <Input
        placeholder={props?.placeholder || "Search a place"}
        value={inputValue}
        borderWidth={0}
        outline="none"
        onChange={(e) => {
          setInputValue(e.target.value);
          fetchPredictions(e.target.value);
        }}
        {...inputProps}
      />

      {loading && <Spinner size="sm" mt={2} />}

      {predictions.length > 0 && (
        <List
          position="absolute"
          width="100%"
          bg="white"
          border="1px solid #ccc"
          zIndex={999}
          mt={1}
          borderRadius="md"
          boxShadow="md"
        >
          {predictions.map((place) => (
            <ListItem
              key={place.place_id}
              px={4}
              py={2}
              _hover={{ bg: "gray.100", cursor: "pointer" }}
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





