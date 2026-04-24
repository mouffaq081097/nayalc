'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';
import { LocateFixed } from 'lucide-react';
import { toast } from 'react-toastify';

const containerStyle = {
  width: '100%',
  borderRadius: '8px',
};

// Default center for Dubai, UAE
const defaultCenter = {
  lat: 25.276987,
  lng: 55.296249,
};

// Must be a stable reference outside the component to avoid re-loading the API
const libraries = ['places', 'marker'];

function MapPicker({ onPlaceSelect, initialAddress }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
    mapIds: ['DEMO_MAP_ID'], // Required for AdvancedMarkerElement
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(initialAddress?.location || defaultCenter);
  const [searchBox, setSearchBox] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // We need to keep a reference to the advanced marker we create manually
  const [markerInstance, setMarkerInstance] = useState(null);

  const getAddressFromLatLng = useCallback(async ({ lat, lng }) => {
    if (!map) return;
    setLocationError(null);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const place = results[0];
        const components = place.address_components;
        let streetNumber = '', routeName = '', sublocalityLevel1 = '', sublocality = '', city = '', country = '';

        for (const c of components) {
          if (c.types.includes('street_number'))        streetNumber     = c.long_name;
          if (c.types.includes('route'))                routeName        = c.long_name;
          if (c.types.includes('sublocality_level_1')) sublocalityLevel1 = c.long_name;
          if (c.types.includes('sublocality'))          sublocality      = c.long_name;
          if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) city = c.long_name;
          if (c.types.includes('country'))              country          = c.long_name;
        }

        let streetAddress = routeName
          ? `${streetNumber} ${routeName}`.trim()
          : sublocalityLevel1 || sublocality || place.formatted_address.split(', ')[0] || '';

        onPlaceSelect({ lat, lng, formattedAddress: place.formatted_address, streetAddress, city, country });
      } else {
        console.error('Geocoder failed: ' + status);
        onPlaceSelect(null);
      }
    });
  }, [map, onPlaceSelect]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    // Initialize AdvancedMarkerElement when map loads
    if (window.google && window.google.maps && window.google.maps.marker) {
      const { AdvancedMarkerElement } = window.google.maps.marker;
      const newMarker = new AdvancedMarkerElement({
        map: mapInstance,
        position: markerPosition,
        gmpDraggable: true,
      });
      
      // Listen for drag end
      newMarker.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarkerPosition({ lat, lng });
        getAddressFromLatLng({ lat, lng });
      });

      setMarkerInstance(newMarker);
    }
  }, [markerPosition, getAddressFromLatLng]);

  const onUnmount = useCallback(() => {
    if (markerInstance) {
      markerInstance.map = null;
    }
    setMap(null);
    setMarkerInstance(null);
  }, [markerInstance]);

  // Update marker position when state changes
  React.useEffect(() => {
    if (markerInstance && markerPosition) {
      markerInstance.position = markerPosition;
    }
  }, [markerPosition, markerInstance]);

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setLocationError(null);
    setMarkerPosition({ lat, lng });
    getAddressFromLatLng({ lat, lng });
  }, [getAddressFromLatLng]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPosition = { lat, lng };
        
        setMarkerPosition(newPosition);
        if (map) {
          map.panTo(newPosition);
          map.setZoom(16);
        }
        getAddressFromLatLng(newPosition);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Could not fetch your location.';
        if (error.code === 1) errorMsg = 'Location access denied. Please enable it in your browser settings.';
        else if (error.code === 2) errorMsg = 'Location unavailable. Please check your system location settings.';
        else if (error.code === 3) errorMsg = 'Location request timed out.';
        setLocationError(errorMsg);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  const onSearchBoxLoad = useCallback((ref) => setSearchBox(ref), []);

  const onPlacesChanged = useCallback(() => {
    if (!searchBox) return;
    const places = searchBox.getPlaces();
    
    if (places && places.length > 0) {
      setLocationError(null);
      const place = places[0];
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPosition = { lat, lng };
        setMarkerPosition(newPosition);
        if (map) {
          map.panTo(newPosition);
          map.setZoom(15);
        }
        getAddressFromLatLng(newPosition);
      } else if (place.name) {
        // Fallback: user typed and pressed Enter without selecting a suggestion
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: place.name, region: 'ae' }, (results, status) => {
          if (status === 'OK' && results[0]?.geometry?.location) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            const newPosition = { lat, lng };
            setMarkerPosition(newPosition);
            if (map) { map.panTo(newPosition); map.setZoom(15); }
            getAddressFromLatLng(newPosition);
          }
        });
      }
    }
  }, [searchBox, map, getAddressFromLatLng]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Search — StandaloneSearchBox */}
      <div className="mb-4 flex gap-2 w-full" style={{ position: 'relative', zIndex: 9999 }}>
        <div className="flex-1">
          <StandaloneSearchBox
            onLoad={onSearchBoxLoad}
            onPlacesChanged={onPlacesChanged}
            options={{ componentRestrictions: { country: 'ae' } }}
          >
            <input
              type="text"
              placeholder="Search for a location in UAE"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-purple)]"
            />
          </StandaloneSearchBox>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className={`px-3 py-2 rounded-md shadow-sm border border-gray-300 flex items-center justify-center transition-all ${
            isLocating ? 'bg-gray-100' : 'bg-white hover:bg-gray-50 active:scale-95'
          }`}
          title="Use Current Location"
        >
          <LocateFixed size={18} className={`${isLocating ? 'animate-pulse text-blue-500' : 'text-gray-600'}`} />
        </button>
      </div>

      {locationError && (
        <div className="mb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-medium animate-in fade-in slide-in-from-top-1 duration-300">
            {locationError}
          </div>
        </div>
      )}

      <div className="flex-grow h-[55vh] relative">
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height: '100%' }}
          center={markerPosition}
          zoom={12}
          options={{ mapId: 'DEMO_MAP_ID' }}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          {/* We are injecting the AdvancedMarkerElement directly into the map instance via the onLoad hook, so no <Marker> child is needed here. */}
        </GoogleMap>
      </div>
    </div>
  );
}

export default MapPicker;
