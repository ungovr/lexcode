// lexcode-expect: 4
// TwiML a webhook returns to Twilio: record the caller, or record a bridged call.
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

export function voicemail(res) {
  const twiml = new VoiceResponse();
  twiml.say('Leave a message after the tone.');
  twiml.record({ maxLength: 120, transcribe: true, action: '/voicemail-done' });
  res.type('text/xml').send(twiml.toString());
}

export function bridgeAndRecord(res, agentNumber) {
  const response = new twilio.twiml.VoiceResponse();
  response.say('This call is being recorded.');
  response.dial({ record: 'record-from-answer-dual', recordingStatusCallback: '/recording' }, agentNumber);
  res.type('text/xml').send(response.toString());
}

export function recordedConference(res, room) {
  const response = new VoiceResponse();
  const dial = response.dial();
  dial.conference({ record: 'record-from-start' }, room);
  response.record({ playBeep: false });
  res.type('text/xml').send(response.toString());
}
