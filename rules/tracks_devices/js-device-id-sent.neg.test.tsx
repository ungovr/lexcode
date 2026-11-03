// lexcode-expect: 0
import axios from 'axios';
import * as Application from 'expo-application';
import DeviceInfo from 'react-native-device-info';

// The device id goes to the app's own backend through a relative URL.
export async function registerDevice(userId: string) {
  const deviceId = await DeviceInfo.getUniqueId();
  await fetch('/api/devices', {
    method: 'POST',
    body: JSON.stringify({ deviceId, userId }),
  });
}

// Kept on the device for display.
export function describeDevice() {
  const id = Application.getAndroidId();
  return `Device ${id.slice(0, 4)}`;
}

// Third-party calls that carry no device identifier.
export async function loadWeather(city: string) {
  return axios.get('https://api.weather.example.net/v2/forecast', { params: { city } });
}

export async function sendFeedback(text: string) {
  return fetch('https://feedback.example.org/v1/messages', { method: 'POST', body: JSON.stringify({ text }) });
}
