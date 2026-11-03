// lexcode-expect: 0
import axios from 'axios';

// The app's own API, and ordinary third-party APIs that check nobody's identity.
export async function loadProfile() {
  return fetch('https://api.example.org/v1/profile');
}

export async function charge(body) {
  return axios.post('https://api.stripe.com/v1/payment_intents', body);
}

export async function weather(city) {
  return axios.get(`https://api.weather.example.net/v2/forecast?city=${city}`);
}

// A link to a vendor's marketing page, not an API call.
export function openPricing() {
  return window.open('https://www.onfido.com/pricing');
}

export async function readDocs() {
  return fetch('https://yoti.com/blog/age-estimation-explained');
}

// A support address in a message, not a request.
export const note = 'Questions about verification? See https://api.example.org/v1/help or ask Veriff.';
