// lexcode-expect: 3
import { useEffect, useState } from 'react';
import { getAdvertisingId, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import AdSupport from '@react-native-community/ad-support';

// Reads the device's advertising identifier once the person allows tracking.
export function useAdvertisingId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { status } = await requestTrackingPermissionsAsync();
      if (status === 'granted') setId(getAdvertisingId());
    })();
  }, []);
  return id;
}

export async function legacyAdId() {
  const info = await AdSupport.getAdvertisingId();
  return info.advertisingId;
}
