// lexcode-expect: 0
import { useEffect, useState } from 'react';
import * as Application from 'expo-application';
import DeviceInfo from 'react-native-device-info';
import * as Notifications from 'expo-notifications';

// Showing the app's own version and the device model on the About screen keeps data on the device.
export function useAboutInfo() {
  const [info, setInfo] = useState({ version: '', model: '' });
  useEffect(() => {
    setInfo({
      version: Application.nativeApplicationVersion ?? '',
      model: DeviceInfo.getModel(),
    });
  }, []);
  return info;
}

// A push token request is a service the person asked for, not an advertising identifier.
export async function registerForPush() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  return Notifications.getExpoPushTokenAsync();
}

// A first-party session id kept in memory.
let sessionId: string | null = null;
export function getSessionId() {
  sessionId = sessionId ?? Math.random().toString(36).slice(2);
  return sessionId;
}
