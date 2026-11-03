// lexcode-expect: 3
import axios from 'axios';
import * as Application from 'expo-application';
import DeviceInfo from 'react-native-device-info';

// Sends the hardware-bound device id to an outside analytics endpoint.
export async function registerDevice(userId: string) {
  const deviceId = await DeviceInfo.getUniqueId();
  await fetch('https://collect.adtech-partner.example/v1/device', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceId, userId }),
  });
}

export async function registerAndroid(endpoint: string) {
  const androidId = Application.getAndroidId();
  await axios.post(endpoint, { androidId });
}

export async function registerVendorId() {
  const vendorId = await Application.getIosIdForVendorAsync();
  return axios.post('https://events.example-metrics.net/identify', { vendorId });
}
