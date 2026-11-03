// lexcode-expect: 2
// Reading a user's Zoom cloud recordings so the app can transcribe or review meetings.
export async function listRecordings(token, userId) {
  const response = await fetch(`https://api.zoom.us/v2/users/${userId}/recordings?from=2026-01-01`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function getMeetingRecordings(token, meetingId) {
  const url = `https://api.zoom.us/v2/meetings/${meetingId}/recordings`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return response.json();
}
