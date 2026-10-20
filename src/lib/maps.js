// Loads the Google Maps JavaScript API once and exposes small helpers.
// Needs VITE_GOOGLE_MAPS_KEY. Enable "Maps JavaScript API" and "Geocoding API" in Google Cloud.
const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export const mapsEnabled = Boolean(KEY);
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

// Google's official "dynamic library import" loader. It defines google.maps.importLibrary()
// right away and downloads the Maps script the first time a library is requested.
function installLoader(params) {
  const g = window.google || (window.google = {});
  const maps = g.maps || (g.maps = {});
  if (maps.importLibrary) return; // already installed, or the real API is loaded

  const libs = new Set();
  let promise;
  const load = () =>
    promise ||
    (promise = new Promise((resolve, reject) => {
      const q = new URLSearchParams();
      q.set('libraries', [...libs].join(','));
      for (const k in params) q.set(k.replace(/[A-Z]/g, (t) => `_${t.toLowerCase()}`), params[k]);
      q.set('callback', 'google.maps.__ib__');
      maps.__ib__ = resolve;
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?${q}`;
      s.onerror = () => {
        promise = undefined; // allow a retry
        reject(new Error('Google Maps could not load. Check your API key, billing and internet connection.'));
      };
      document.head.append(s);
    }));

  // After the real API loads it replaces this function, so the call below uses the real one.
  maps.importLibrary = (name, ...rest) => {
    libs.add(name);
    return load().then(() => maps.importLibrary(name, ...rest));
  };
}

export function loadMaps() {
  if (!KEY) return Promise.reject(new Error('Add VITE_GOOGLE_MAPS_KEY to your .env file to show maps.'));
  installLoader({ key: KEY, v: 'weekly' });
  return Promise.resolve(window.google.maps);
}

export async function reverseGeocode(lat, lng) {
  const maps = await loadMaps();
  const { Geocoder } = await maps.importLibrary('geocoding');
  const res = await new Geocoder().geocode({ location: { lat, lng } });
  return res.results?.[0]?.formatted_address || '';
}

export const directionsUrl = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

// Distance in km between two points (haversine)
export function km(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}