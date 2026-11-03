// lexcode-expect: 0
// Daily rooms created with no recording, and a settings object that merely
// mentions recording in prose.
const DAILY_API = 'https://api.daily.co/v1';

export async function createPlainRoom(name) {
  const response = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, privacy: 'private', properties: { max_participants: 8, enable_chat: true } }),
  });
  return response.json();
}

export function describeRoom() {
  return { enable_recording: 'off', label: 'Recording is not enabled for this room' };
}

export const copy = {
  notice: 'Ask the host whether they enable_recording before you join.',
};
