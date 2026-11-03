# lexcode-expect: 0
import secrets
import smtplib
import time
from email.message import EmailMessage

import boto3
from django.core.mail import send_mail
from twilio.rest import Client

sms = Client("sid", "token")
sqs = boto3.client("sqs")


def request_password_reset(db, email):
    # A reply to the person's own immediate request: a password reset they asked for.
    user = db.find_user(email)
    if user is None:
        return
    token = secrets.token_urlsafe(32)
    db.save_reset_token(user.id, token)
    send_mail("Reset your password", f"https://example.org/reset?token={token}", "login@example.org", [user.email])


def send_magic_link(email, link):
    # A magic sign-in link the person asked for.
    msg = EmailMessage()
    msg["To"] = email
    msg["From"] = "login@example.org"
    msg["Subject"] = "Your sign-in link"
    msg.set_content(link)
    with smtplib.SMTP("localhost") as server:
        server.send_message(msg)


def verify_address(email, token):
    send_mail("Confirm your email address", f"https://example.org/verify?token={token}", "hi@example.org", [email])


def form_receipt(form):
    # A receipt for the form they just submitted.
    send_mail(f"We received request {form.reference}", "Thanks. We will be in touch.", "hi@example.org", [form.email])


def text_login_code(phone, code):
    sms.messages.create(to=phone, from_="+15550100", body=f"Your login code is {code}")


def send_with_retry(msg):
    # A retry loop around ONE message to ONE person is not a loop over recipients.
    attempts = 0
    while attempts < 3:
        try:
            with smtplib.SMTP("localhost") as server:
                server.send_message(msg)
            return
        except OSError:
            attempts += 1
            time.sleep(2**attempts)


RELAYS = [("smtp-a.example.org", 587), ("smtp-b.example.org", 587)]


def deliver_via_first_relay(msg, recipient):
    # A fallback loop over mail relays: ONE message goes to ONE person, whichever relay accepts it.
    for relay_host, relay_port in RELAYS:
        try:
            with smtplib.SMTP(relay_host, relay_port, timeout=10) as server:
                server.sendmail("login@example.org", [recipient], msg.as_string())
            return relay_host
        except OSError:
            continue
    return None


def deliver_with_attempts(msg, recipient):
    for attempt in range(3):
        try:
            with smtplib.SMTP("localhost") as server:
                server.sendmail("login@example.org", [recipient], msg.as_string())
            return
        except OSError:
            time.sleep(attempt + 1)


def enqueue(bodies):
    # SQS has a send_message too; it puts work on a queue and contacts nobody.
    for body in bodies:
        sqs.send_message(QueueUrl="https://sqs.us-west-2.amazonaws.com/1/jobs", MessageBody=body)


def build_messages(users):
    out = []
    for user in users:
        out.append({"to": user.email, "subject": "Hello"})
    return out


# ---- scheduled jobs and request handlers ----
from apscheduler.schedulers.blocking import BlockingScheduler
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from flask import Flask, request

app = Flask(__name__)
sched = BlockingScheduler()


@sched.scheduled_job("cron", hour=3)
def purge_sessions(db):
    # A scheduled job that sends nothing to anyone.
    db.delete_expired_sessions()


@app.post("/contact")
def contact():
    # Mail sent from a request handler, in reply to what the person just did.
    data = request.get_json()
    send_mail("We got your message", "Thanks for writing.", "hi@example.org", [data["email"]])
    return "", 204


class Command(BaseCommand):
    help = "Rebuilds the search index."

    def handle(self, *args, **options):
        print("reindexing")
