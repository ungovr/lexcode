# lexcode-expect: 2
# Placing a call with recording on, and starting a recording on a live call, with the
# Twilio Python helper library.
import os

from twilio.rest import Client

client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])


def call_and_record(to, from_, url):
    return client.calls.create(to=to, from_=from_, url=url, record=True, recording_channels="dual")


def record_mid_call(call_sid):
    return client.calls(call_sid).recordings.create(recording_channels="dual")
