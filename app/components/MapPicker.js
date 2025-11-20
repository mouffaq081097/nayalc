'use client';

import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  borderRadius: '8px',
};

// Default center for Dubai, UAE
const defaultCenter = {
  lat: 25.276987, // Latitude of Dubai
  lng: 55.296249, // Longitude of Dubai
};

const libraries = ['places']; // Define libraries array as a constant outside the component

function MapPicker({ onPlaceSelect, initialAddress }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries, // Use the constant libraries array
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(initialAddress?.location || defaultCenter);
  const [searchResult, setSearchResult] = useState(null); // For Autocomplete component

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const getAddressFromLatLng = useCallback(async ({ lat, lng }) => {
    if (!map) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const place = results[0];
        const addressComponents = place.address_components;
        let streetNumber = '';
        let routeName = '';
        let sublocalityLevel1 = '';
        let sublocality = '';
        let city = '';
        let country = '';

        for (const component of addressComponents) {
          if (component.types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (component.types.includes('route')) {
            routeName = component.long_name;
          }
          if (component.types.includes('sublocality_level_1')) {
            sublocalityLevel1 = component.long_name;
          }
          if (component.types.includes('sublocality')) {
            sublocality = component.long_name;
          }
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        }

        let streetAddress = '';
        if (routeName) {
          streetAddress = `${streetNumber} ${routeName}`.trim();
        } else if (sublocalityLevel1) {
          streetAddress = sublocalityLevel1;
        } else if (sublocality) {
          streetAddress = sublocality;
        } else {
          // Fallback to a part of formatted_address if nothing specific is found
          // This might need more refined logic for specific locales
          const parts = place.formatted_address.split(', ');
          streetAddress = parts[0] || '';
        }
        
        console.log("MapPicker - Raw address_components:", addressComponents);
        console.log("MapPicker - Extracted streetAddress:", streetAddress);
        console.log("MapPicker - Extracted city:", city);
        console.log("MapPicker - Extracted country:", country);
        console.log("MapPicker - Formatted address:", place.formatted_address);

        onPlaceSelect({
          lat,
          lng,
          formattedAddress: place.formatted_address,
          streetAddress,
          city,
          country,
        });
      } else {
        console.error('Geocoder failed due to: ' + status);
        onPlaceSelect(null);
      }
    });
  }, [map, onPlaceSelect]);

  const handleMapClick = useCallback(async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPosition({ lat, lng });
    await getAddressFromLatLng({ lat, lng });
  }, [map, getAddressFromLatLng]);

  const handleMarkerDragEnd = useCallback(async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPosition({ lat, lng });
    await getAddressFromLatLng({ lat, lng });
  }, [map, getAddressFromLatLng]);

  const onAutocompleteLoad = useCallback((autocomplete) => {
    setSearchResult(autocomplete);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (searchResult) {
      const place = searchResult.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPosition = { lat, lng };
        setMarkerPosition(newPosition);
        if (map) {
          map.panTo(newPosition);
          map.setZoom(15);
        }
        getAddressFromLatLng(newPosition);
      } else {
        console.error('Place has no geometry');
      }
    }
  }, [searchResult, map, getAddressFromLatLng]);


  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 w-full"> {/* Search bar in normal flow, added w-full for full width */}
        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Search for a location"
            className="w-full p-2 border border-gray-300 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-brand-pink"
          />
        </Autocomplete>
      </div>

      <div className="flex-grow h-[55vh] relative"> {/* Map container */}
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height: '100%' }}
          center={markerPosition}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          />
        </GoogleMap>
      </div>
    </div>
  );
}

export default MapPicker;