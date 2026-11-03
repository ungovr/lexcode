# lexcode-expect: 0
# TwiML that greets, forwards and bridges a call without recording it, and a local
# class with its own record() method.
from twilio.twiml.voice_response import VoiceResponse


def greet():
    response = VoiceResponse()
    response.say("Thanks for calling the clerk.")
    response.gather(num_digits=1, action="/menu")
    return str(response)


def forward(number):
    response = VoiceResponse()
    response.dial(number, caller_id="+15555550100", timeout=20)
    return str(response)


def bridge_unrecorded(number):
    response = VoiceResponse()
    response.dial(number, record="do-not-record")
    return str(response)


class AuditLog:
    def __init__(self):
        self.entries = []

    def record(self, entry):
        self.entries.append(entry)


def note_call(log, sid):
    log.record({"sid": sid})
