# Project Context: Address Management & Google Maps Fix

## 1. Address Management Fixes
- **Field Mapping Resolution:** Identified a mismatch where the frontend sent `camelCase` fields (e.g., `addressLine1`, `zipCode`) while the API expected `snake_case` (e.g., `address_line1`). Updated `UserContext.js` and `app/checkout/page.js` to correctly map these fields.
- **Mobile Accessibility:** Added "Add Address" and "Edit/Delete" functionality to the mobile addresses page (`app/account/addresses/page.js`), which previously lacked these controls.
- **Real-time Sync:** Switched `useAccountData.js` to source address data from the global `UserContext` to ensure the dashboard and management pages remain in sync after edits.
- **Runtime Error Fix:** Fixed a `TypeError` in `UserContext.js` where `shippingAddresses` was being set to a raw `Response` object instead of the parsed JSON array.

## 2. Google Maps SearchBox Deprecation Fix
- **Issue:** As of March 1st, 2025, `google.maps.places.SearchBox` is deprecated for new API keys, causing `StandaloneSearchBox` to fail in `MapPicker.js`.
- **Solution:** Replaced `StandaloneSearchBox` with the `Autocomplete` component from `@react-google-maps/api`.
- **Technical Changes in `app/components/MapPicker.js`:**
    - Switched from `SearchBox` (legacy) to `Autocomplete` (current).
    - Updated event handling from `onPlacesChanged` (returning an array) to `onPlaceChanged` (returning a single object via `getPlace()`).
    - Added a Geocoder fallback to handle cases where users press Enter on raw text without selecting a dropdown suggestion.
    - Explicitly requested the `geometry` field to prevent "Place has no geometry" errors.

## 3. UI/UX Redesign
- **Lavender Theme ("Cloud Luxe"):** Completely redesigned `app/account/page.js` to follow a lavender/glassmorphism aesthetic.
- **Components:** Implemented custom glass-effect cards, aura background gradients, and stylized stat badges for Orders, Wishlist, and Addresses.
- **Cleaned Imports:** Removed unused icons and streamlined the layout for a more modern, compact floating feel.

## 4. Pending Warnings
- **Marker Deprecation:** Google has deprecated `google.maps.Marker` in favor of `AdvancedMarkerElement`. This is a non-breaking warning. Moving to Advanced Markers requires a `mapId` configured in the Google Cloud Console.
