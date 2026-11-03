// lexcode-expect: 0
// TwiML that greets, forwards and bridges a call without recording it, and a
// local object that has its own record() method.
import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

export function greet(res) {
  const twiml = new VoiceResponse();
  twiml.say({ voice: 'alice' }, 'Thanks for calling the clerk.');
  twiml.gather({ input: 'dtmf', numDigits: 1, action: '/menu' });
  res.type('text/xml').send(twiml.toString());
}

export function forward(res, number) {
  const response = new VoiceResponse();
  response.dial({ callerId: '+15555550100', timeout: 20 }, number);
  res.type('text/xml').send(response.toString());
}

export function bridgeUnrecorded(res, number) {
  const response = new VoiceResponse();
  response.dial({ record: 'do-not-record' }, number);
  res.type('text/xml').send(response.toString());
}

const audit = {
  entries: [],
  record(entry) {
    this.entries.push(entry);
  },
};

export function noteCall(sid) {
  audit.record({ sid, at: Date.now() });
}
