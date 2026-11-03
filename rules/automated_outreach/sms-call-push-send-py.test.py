# lexcode-expect: 4
from firebase_admin import messaging
from pywebpush import webpush
from twilio.rest import Client

client = Client("sid", "token")


def text_status(phone, status):
    # Tells the person their request moved; they did not just ask for this message.
    client.messages.create(to=phone, from_="+15550100", body=f"Your request is now {status}.")


def call_back(phone):
    client.calls.create(to=phone, from_="+15550100", url="https://example.org/voice/outbound.xml")


def push(sub, payload):
    webpush(subscription_info=sub, data=payload, vapid_private_key="key-from-env")


def fcm(token):
    messaging.send(messaging.Message(token=token, notification=messaging.Notification(title="Your report is ready")))
