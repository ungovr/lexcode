// lexcode-expect: 3
// Placing and recording phone calls with the Twilio REST client.
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function callAndRecord(to, from, twimlUrl) {
  return client.calls.create({
    to,
    from,
    url: twimlUrl,
    record: true,
    recordingChannels: 'dual',
    recordingStatusCallback: 'https://example.org/recording-done',
  });
}

export async function startRecordingMidCall(callSid) {
  return client.calls(callSid).recordings.create({ recordingChannels: 'dual' });
}

export async function recordOutbound(to, from) {
  const call = await client.calls.create({
    to,
    from,
    twiml: '<Response><Say>This call may be recorded.</Say></Response>',
    record: 'true',
  });
  return call.sid;
}
