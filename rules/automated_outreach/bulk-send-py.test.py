# lexcode-expect: 4
import resend
from django.core.mail import send_mass_mail
from exponent_server_sdk import PushClient
from firebase_admin import messaging


def announce(subscribers):
    # One call, many recipients.
    datatuple = [("Service change", "Buses on route 12 now stop at the library.", "news@example.org", [s.email]) for s in subscribers]
    send_mass_mail(datatuple)


def batch(rows):
    resend.Batch.send([{"from": "hi@example.org", "to": r.email, "subject": r.subject} for r in rows])


def push_all(messages):
    PushClient().publish_multiple(messages)


def multicast(tokens):
    message = messaging.MulticastMessage(tokens=tokens, notification=messaging.Notification(title="Pickup moved"))
    messaging.send_each_for_multicast(message)
