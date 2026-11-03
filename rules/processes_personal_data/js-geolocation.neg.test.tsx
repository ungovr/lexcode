// lexcode-expect: 0
import { useState } from 'react';

// A map centered on a fixed place; no position of the visitor is read.
export function OfficeMap() {
  const [center] = useState({ lat: 34.2746, lng: -119.2290 });
  return <iframe title="Office" src={`https://maps.example.org/embed?ll=${center.lat},${center.lng}`} />;
}

// Coordinates that belong to a public building in the app's own data.
export const buildings = [
  { name: 'City Hall', latitude: 34.2805, longitude: -119.2945 },
  { name: 'Library', latitude: 34.2751, longitude: -119.2288 },
];

export function nearest(lat: number, lng: number) {
  return buildings.slice().sort((a, b) => Math.hypot(a.latitude - lat, a.longitude - lng) - Math.hypot(b.latitude - lat, b.longitude - lng))[0];
}

// A geolocation helper of the app's own with no import from a platform package.
function geolocation(request: Request) {
  return { city: new URL(request.url).searchParams.get('city') };
}
export const city = geolocation(new Request('https://example.org/?city=Ventura')).city;

// The Permissions API is queried for the state of the permission, not for a position.
export async function canLocate() {
  const status = await navigator.permissions.query({ name: 'geolocation' });
  return status.state;
}

// A text field named location on a form: no sensor.
export function Form() {
  const [location, setLocation] = useState('');
  return <input value={location} onChange={(e) => setLocation(e.target.value)} />;
}
