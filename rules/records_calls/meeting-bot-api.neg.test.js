// lexcode-expect: 0
// Scheduling a meeting and reading the user's calendar. No bot joins and nothing is recorded.
// A comment that names the vendor without a URL: Recall and MeetingBaaS are products.
export async function scheduleMeeting(token, topic) {
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, type: 2, duration: 30 }),
  });
  return response.json();
}

export async function upcoming(token) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export const links = {
  help: 'https://example.org/help/recall-password',
  note: 'Recall your password by email.',
};
