// lexcode-expect: 0
// Zoom calls that schedule and list meetings or read a profile. No recording is read.
export async function listMeetings(token) {
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings?type=upcoming', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function profile(token) {
  const response = await fetch('https://api.zoom.us/v2/users/me', { headers: { Authorization: `Bearer ${token}` } });
  return response.json();
}

export async function registrants(token, meetingId) {
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/registrants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export const docs = 'https://developers.zoom.us/docs/api/meetings/#tag/cloud-recording';
