# lexcode-expect: 11
import smtplib
from email.message import EmailMessage

import boto3
import resend
from django.core.mail import send_mail
from sendgrid import SendGridAPIClient
from twilio.rest import Client

sg = SendGridAPIClient("key-from-env")
sms = Client("sid", "token")
ses = boto3.client("ses", region_name="us-west-2")


def weekly_summary(subscribers):
    # One message per subscriber, sent by the program on a schedule it owns.
    with smtplib.SMTP("localhost") as server:
        for sub in subscribers:
            msg = EmailMessage()
            msg["To"] = sub.email
            msg["From"] = "weekly@example.org"
            msg["Subject"] = "Your week"
            msg.set_content("Here is what changed.")
            server.send_message(msg)


def django_loop(users):
    for user in users:
        send_mail("Update", "Something changed.", "hi@example.org", [user.email])


def sendgrid_loop(users):
    for u in users:
        sg.send({"to": u.email, "from": "hi@example.org", "subject": "Hi"})


def text_everyone(phones):
    for phone in phones:
        sms.messages.create(to=phone, from_="+15550100", body="Your trash pickup moves to Tuesday.")


def ses_loop(addresses):
    for address in addresses:
        ses.send_email(
            Source="hi@example.org",
            Destination={"ToAddresses": [address]},
            Message={"Subject": {"Data": "Hi"}, "Body": {"Text": {"Data": "Hi"}}},
        )


def resend_loop(users):
    return [resend.Emails.send({"from": "hi@example.org", "to": u.email, "subject": "Hi"}) for u in users]


def helper_loop(users, send_email):
    for user in users:
        send_email(user.email, "Reminder")


# ---- scheduled jobs and management commands ----
import schedule
from apscheduler.schedulers.blocking import BlockingScheduler
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from twilio.rest import Client

sms = Client("sid", "token")
sched = BlockingScheduler()


@sched.scheduled_job("cron", day_of_week="mon", hour=9)
def weekly_summary():
    send_mail("Your week", "Here is what changed.", "weekly@example.org", ["list@example.org"])


@sched.scheduled_job("cron", hour=18)
def appointment_reminders():
    sms.messages.create(to="+15550101", from_="+15550100", body="Reminder: your appointment is tomorrow.")


schedule.every().day.at("08:00").do(lambda: send_mail("Daily digest", "Numbers", "digest@example.org", ["list@example.org"]))


class Command(BaseCommand):
    help = "Mails the nightly status to the team (run from cron)."

    def handle(self, *args, **options):
        send_mail("Nightly status", "All quiet.", "ops@example.org", ["team@example.org"])
