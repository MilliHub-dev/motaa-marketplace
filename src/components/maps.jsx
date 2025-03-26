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
