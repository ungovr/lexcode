# lexcode-expect: 0
from celery import shared_task
from django.core.mail import send_mail
from PIL import Image


# A queue task that resizes images and sends nothing.
@shared_task
def make_thumbnail(path, out):
    Image.open(path).resize((200, 200)).save(out)


# Functions named for the reply they send to one person who just asked.
def send_password_reset(to, token):
    send_mail("Reset your password", f"https://example.org/reset/{token}", "login@example.org", [to])


def send_verification_email(to, token):
    send_mail("Confirm your email address", f"https://example.org/verify/{token}", "hi@example.org", [to])


def send_magic_link(to, link):
    send_mail("Your sign-in link", link, "login@example.org", [to])


# A notifier-named function that only writes an in-app notification row.
def notify_in_app(db, user_id, text):
    db.notifications.insert({"user_id": user_id, "text": text})


def daily_totals(db):
    return db.orders.sum_for_today()
