# lexcode-expect: 0
# Calls placed with no recording, a status lookup, and a text message.
import os

from twilio.rest import Client

client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])


def place_call(to, from_, url):
    return client.calls.create(to=to, from_=from_, url=url, status_callback="https://example.org/status")


def place_unrecorded_call(to, from_):
    return client.calls.create(to=to, from_=from_, twiml="<Response><Say>Hello</Say></Response>", record=False)


def hang_up(call_sid):
    return client.calls(call_sid).update(status="completed")


def call_status(call_sid):
    return client.calls(call_sid).fetch().status


def remind(to, from_, body):
    return client.messages.create(to=to, from_=from_, body=body)
