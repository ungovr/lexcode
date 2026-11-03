// lexcode-expect: 2
// Sending a notetaker bot into a video meeting through a meeting-bot API.
const RECALL = 'https://us-west-2.recall.ai/api/v1';

export async function sendNotetaker(meetingUrl) {
  const response = await fetch(`${RECALL}/bot/`, {
    method: 'POST',
    headers: { Authorization: `Token ${process.env.RECALL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ meeting_url: meetingUrl, bot_name: 'Notes' }),
  });
  return response.json();
}

export async function sendBaasBot(meetingUrl) {
  const response = await fetch('https://api.meetingbaas.com/bots', {
    method: 'POST',
    headers: { 'x-meeting-baas-api-key': process.env.MEETING_BAAS_KEY },
    body: JSON.stringify({ meeting_url: meetingUrl, bot_name: 'Notes' }),
  });
  return response.json();
}
