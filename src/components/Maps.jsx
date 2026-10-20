import { useEffect, useRef, useState } from 'react';
import { KITCHEN } from '../utils.js';
import { MAP_ID, loadMaps, mapsEnabled } from '../lib/maps.js';

const lat = (p) => (typeof p.lat === 'function' ? p.lat() : p.lat);
const lng = (p) => (typeof p.lng === 'function' ? p.lng() : p.lng);

function pinEl(emoji, className = '') {
  const el = document.createElement('div');
  el.className = `pin ${className}`;
  el.textContent = emoji;
  return el;
}

function MapFallback({ error }) {
  return (
    <div className="map map-fallback" role="status">
      <strong>{mapsEnabled ? 'Map unavailable' : 'Map is not set up yet'}</strong>
      <p className="muted small">
        {error || 'Add VITE_GOOGLE_MAPS_KEY to your .env file and restart the dev server.'}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------
 * LocationPicker: tap the map or drag the pin to choose where to deliver.
 * value: {lat,lng} | null     onChange: ({lat,lng}) => void
 *
 * The map is built only once the <div> really exists. `node` is set by a callback ref,
 * so the effect below can never run with a missing element.
 * ------------------------------------------------------------- */
export function LocationPicker({ value, onChange, center }) {
  const [node, setNode] = useState(null);
  const [error, setError] = useState('');
  const map = useRef(null);
  const marker = useRef(null);
  const cb = useRef(onChange);
  const first = useRef({ value, center });
  cb.current = onChange;

  useEffect(() => {
    if (!node) return undefined;
    let dead = false;

    loadMaps()
      .then(async (maps) => {
        const { Map } = await maps.importLibrary('maps');
        const { AdvancedMarkerElement } = await maps.importLibrary('marker');
        if (dead) return;

        const { value: v, center: c } = first.current;
        const start = v || c || KITCHEN;
        map.current = new Map(node, {
          center: start,
          zoom: v ? 17 : 13,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        marker.current = new AdvancedMarkerElement({
          map: v ? map.current : null,
          position: start,
          gmpDraggable: true,
          content: pinEl('📍', 'pin-home'),
          title: 'Delivery location',
        });

        marker.current.addListener('dragend', () => {
          const p = marker.current.position;
          cb.current({ lat: lat(p), lng: lng(p) });
        });
        map.current.addListener('click', (e) => {
          cb.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
      })
      .catch((e) => !dead && setError(e.message));

    return () => {
      dead = true;
      if (marker.current) marker.current.map = null;
      marker.current = null;
      map.current = null;
    };
  }, [node]);

  // keep the pin in sync when the value changes (use-my-location, click, drag)
  useEffect(() => {
    if (!map.current || !marker.current || !value) return;
    marker.current.position = value;
    marker.current.map = map.current;
    map.current.panTo(value);
    if (map.current.getZoom() < 16) map.current.setZoom(17);
  }, [value]);

  if (error || !mapsEnabled) return <MapFallback error={error} />;
  return <div ref={setNode} className="map" aria-label="Pick your delivery location on the map" />;
}

/* ---------------------------------------------------------------
 * TrackMap: restaurant, customer's address and the live rider position.
 * ------------------------------------------------------------- */
export function TrackMap({ home, rider, kitchen: kitchenPos }) {
  const kitchen = kitchenPos || KITCHEN;
  const [node, setNode] = useState(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const state = useRef({});
  const startKitchen = useRef(kitchen);

  useEffect(() => {
    if (!node) return undefined;
    let dead = false;

    loadMaps()
      .then(async (maps) => {
        const { Map, Polyline } = await maps.importLibrary('maps');
        const { AdvancedMarkerElement } = await maps.importLibrary('marker');
        const { LatLngBounds } = await maps.importLibrary('core');
        if (dead) return;

        const k = startKitchen.current;
        const map = new Map(node, {
          center: k,
          zoom: 14,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        });
        const mk = (emoji, cls, title, pos) =>
          new AdvancedMarkerElement({ map: pos ? map : null, position: pos || k, content: pinEl(emoji, cls), title });

        state.current = {
          map,
          maps,
          LatLngBounds,
          kitchen: mk('🍽️', 'pin-kitchen', 'Restaurant', k),
          home: mk('🏠', 'pin-home', 'Your address', null),
          rider: mk('🛵', 'pin-rider', 'Delivery partner', null),
          line: new Polyline({
            map: null,
            strokeOpacity: 0,
            icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: '#d81b60', scale: 3 }, offset: '0', repeat: '14px' }],
          }),
          fitted: '',
        };
        setReady(true);
      })
      .catch((e) => !dead && setError(e.message));

    return () => {
      dead = true;
      const s = state.current;
      ['kitchen', 'home', 'rider'].forEach((key) => {
        if (s[key]) s[key].map = null;
      });
      s.line?.setMap(null);
      state.current = {};
      setReady(false);
    };
  }, [node]);

  useEffect(() => {
    const s = state.current;
    if (!ready || !s.map) return;

    s.kitchen.position = kitchen;
    if (home) {
      s.home.position = home;
      s.home.map = s.map;
    }
    if (rider) {
      s.rider.position = rider;
      s.rider.map = s.map;
    } else {
      s.rider.map = null;
    }

    if (home) {
      s.line.setPath([rider || kitchen, home]);
      s.line.setMap(s.map);
    } else {
      s.line.setMap(null);
    }

    // fit the view when the set of visible points changes, not on every rider move
    const key = `${Boolean(home)}-${Boolean(rider)}`;
    if (s.fitted !== key) {
      s.fitted = key;
      const b = new s.LatLngBounds();
      b.extend(kitchen);
      if (home) b.extend(home);
      if (rider) b.extend(rider);
      s.map.fitBounds(b, 70);
      s.maps.event.addListenerOnce(s.map, 'idle', () => {
        if (s.map.getZoom() > 16) s.map.setZoom(16);
      });
    }
  }, [ready, kitchen.lat, kitchen.lng, home?.lat, home?.lng, rider?.lat, rider?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error || !mapsEnabled) return <MapFallback error={error} />;
  return <div ref={setNode} className="map" aria-label="Live delivery map" />;
}
