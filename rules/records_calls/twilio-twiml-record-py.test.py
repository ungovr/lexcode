# lexcode-expect: 4
# TwiML a webhook returns to Twilio: record the caller, or record a bridged call.
from twilio.twiml.voice_response import Dial, VoiceResponse


def voicemail():
    response = VoiceResponse()
    response.say("Leave a message after the tone.")
    response.record(max_length=120, transcribe=True, action="/voicemail-done")
    return str(response)


def bridge_and_record(agent_number):
    response = VoiceResponse()
    response.dial(agent_number, record="record-from-answer-dual")
    return str(response)


def recorded_conference(room):
    response = VoiceResponse()
    dial = Dial()
    dial.conference(room, record="record-from-start")
    response.append(dial)
    response.record(play_beep=False)
    return str(response)
