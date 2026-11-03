// lexcode-expect: 2
// Creating Daily rooms through the REST API with recording switched on.
const DAILY_API = 'https://api.daily.co/v1';

export async function createRecordedRoom(name) {
  const response = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      privacy: 'private',
      properties: { enable_recording: 'cloud', max_participants: 8 },
    }),
  });
  return response.json();
}

export async function createRawTracksToken(room) {
  const properties = { room_name: room, enable_recording: "raw-tracks", is_owner: false };
  const response = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties }),
  });
  return response.json();
}
