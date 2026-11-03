// lexcode-expect: 0
// A call placed with no recording, and a status lookup. The call is carried and
// not kept; nothing here records it.
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function placeCall(to, from, twimlUrl) {
  return client.calls.create({ to, from, url: twimlUrl, statusCallback: 'https://example.org/call-status' });
}

export async function placeCallExplicitlyUnrecorded(to, from) {
  return client.calls.create({ to, from, twiml: '<Response><Say>Hello</Say></Response>', record: false });
}

export async function hangUp(callSid) {
  return client.calls(callSid).update({ status: 'completed' });
}

export async function callStatus(callSid) {
  const call = await client.calls(callSid).fetch();
  return call.status;
}

export async function sendReminderText(to, from, body) {
  return client.messages.create({ to, from, body });
}
