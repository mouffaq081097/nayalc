'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocateFixed, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

// Dubai, UAE default center
const DEFAULT_CENTER = [25.276987, 55.296249];

// Custom SVG pin marker — avoids the default Leaflet icon file-path issues in Next.js
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 28 14 28S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#7e69d4"/>
  <circle cx="14" cy="14" r="6" fill="white"/>
</svg>`;

function parseNominatimAddress(addr = {}) {
  const streetAddress = [addr.house_number, addr.road || addr.pedestrian]
    .filter(Boolean).join(' ')
    || addr.suburb || addr.neighbourhood || addr.quarter || '';
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
  return {
    streetAddress,
    city,
    country: addr.country || 'United Arab Emirates',
    zipCode: addr.postcode || '0000',
    state: addr.state || '',
  };
}

function MapPicker({ onPlaceSelect, initialAddress }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);
  const [ready, setReady] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const initialPos = initialAddress?.location
    ? [initialAddress.location.lat, initialAddress.location.lng]
    : null;

  // ── Reverse geocode a lat/lng → call onPlaceSelect ──────────────────────
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'NayaLumiereCosmetics/1.0' } }
      );
      const data = await res.json();
      const parsed = parseNominatimAddress(data.address || {});
      onPlaceSelect({ lat, lng, formattedAddress: data.display_name || '', ...parsed });
    } catch {
      // silent — user can still type manually
    }
  }, [onPlaceSelect]);

  // ── Place / move the draggable marker ───────────────────────────────────
  const placeMarker = useCallback((lat, lng) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        html: PIN_SVG,
        className: '',
        iconSize: [28, 42],
        iconAnchor: [14, 42],
      });
      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }
  }, [reverseGeocode]);

  // ── Load Leaflet + CSS dynamically (client-only) ────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    // Inject Leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let cancelled = false;

    import('leaflet').then((mod) => {
      if (cancelled || !containerRef.current) return;
      const L = mod.default;
      leafletRef.current = L;

      const center = initialPos || DEFAULT_CENTER;
      const map = L.map(containerRef.current, {
        center,
        zoom: initialPos ? 15 : 12,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      if (initialPos) {
        placeMarker(initialPos[0], initialPos[1]);
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
      });

      mapRef.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        leafletRef.current = null;
        setReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search Nominatim ─────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ae&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'NayaLumiereCosmetics/1.0' } }
      );
      const data = await res.json();
      setResults(data);
      if (data.length === 0) toast.info('No results found — try a different search.');
    } catch {
      toast.error('Search failed. Check your connection.');
    }
    setSearching(false);
  }, [query]);

  const handleSelectResult = useCallback((result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const map = mapRef.current;
    if (map) {
      map.setView([lat, lng], 16);
      placeMarker(lat, lng);
    }
    const parsed = parseNominatimAddress(result.address || {});
    onPlaceSelect({ lat, lng, formattedAddress: result.display_name || '', ...parsed });
    setResults([]);
    setQuery(result.display_name?.split(',').slice(0, 2).join(',').trim() || '');
  }, [onPlaceSelect, placeMarker]);

  // ── Use current GPS location ─────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported by your browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        const map = mapRef.current;
        if (map) { map.setView([lat, lng], 16); }
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) toast.error('Location access denied. Please allow it in your browser.');
        else toast.error('Could not get your location.');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, [placeMarker, reverseGeocode]);

  const inputStyle = {
    padding: '10px 36px 10px 36px',
    borderRadius: '12px',
    border: '1px solid rgba(216,180,254,0.45)',
    background: 'rgba(255,255,255,0.6)',
    color: '#3b0764',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="flex flex-col gap-2 h-full">

      {/* ── Search bar ── */}
      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgb(196,167,254)' }}
          />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value) setResults([]); }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search address in UAE…"
            style={inputStyle}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={13} style={{ color: 'rgb(196,167,254)' }} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-4 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95"
          style={{
            border: '1px solid rgba(216,180,254,0.45)',
            background: 'var(--brand-gradient)',
            color: 'white',
            opacity: searching ? 0.7 : 1,
          }}
        >
          {searching ? '…' : 'Go'}
        </button>

        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Use my current location"
          className="px-3 rounded-xl border transition-all flex items-center justify-center active:scale-95"
          style={{ border: '1px solid rgba(216,180,254,0.45)', background: 'rgba(255,255,255,0.6)', color: 'rgb(126,105,230)' }}
        >
          <LocateFixed size={16} className={locating ? 'animate-pulse' : ''} />
        </button>
      </div>

      {/* ── Search results dropdown ── */}
      {results.length > 0 && (
        <div
          className="rounded-xl overflow-hidden relative z-50"
          style={{ border: '1px solid rgba(216,180,254,0.4)', background: 'white', boxShadow: '0 8px 24px rgba(147,51,234,0.12)' }}
        >
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectResult(r)}
              className="w-full text-left px-4 py-3 transition-all hover:bg-purple-50 border-b last:border-b-0"
              style={{ color: '#3b0764', borderColor: 'rgba(216,180,254,0.2)' }}
            >
              <p className="text-[12px] font-semibold truncate">
                {r.display_name?.split(',').slice(0, 2).join(', ')}
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(59,7,100,0.4)' }}>
                {r.display_name?.split(',').slice(2, 4).join(', ')}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── Map container ── */}
      {!ready && (
        <div
          className="flex-1 rounded-xl flex items-center justify-center"
          style={{ minHeight: '200px', border: '1px solid rgba(216,180,254,0.35)', background: 'rgba(255,255,255,0.4)' }}
        >
          <div className="flex flex-col items-center gap-2" style={{ color: 'rgba(147,51,234,0.5)' }}>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-medium">Loading map…</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 rounded-xl overflow-hidden"
        style={{
          minHeight: '200px',
          border: '1px solid rgba(216,180,254,0.35)',
          display: ready ? 'block' : 'none',
        }}
      />

      <p className="text-[10px]" style={{ color: 'rgba(59,7,100,0.3)' }}>
        Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors
      </p>
    </div>
  );
}

export default MapPicker;
