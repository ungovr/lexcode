// lexcode-expect: 6
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { geolocation } from '@vercel/functions';
import Geolocation from '@react-native-community/geolocation';

// Browser: asks for the person's position to show nearby offices.
export function useNearby() {
  const [pos, setPos] = useState<GeolocationPosition | null>(null);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((p) => setPos(p), () => setPos(null), { enableHighAccuracy: true });
    const watch = navigator.geolocation.watchPosition((p) => setPos(p));
    return () => navigator.geolocation.clearWatch(watch);
  }, []);
  return pos;
}

// Expo: one precise fix, kept with the report the person files.
export async function currentFix() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
}

// React Native community module.
export function legacyFix(done: (lat: number, lng: number) => void) {
  Geolocation.getCurrentPosition((info) => done(info.coords.latitude, info.coords.longitude));
}

// Vercel edge function: the visitor's city, region and coordinates from the request.
export function GET(request: Request) {
  const geo = geolocation(request);
  return Response.json({ city: geo.city, latitude: geo.latitude, longitude: geo.longitude });
}

export async function track() {
  return Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced }, () => undefined);
}
