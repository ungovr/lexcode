# lexcode-expect: 4
from celery import shared_task
from django.core.mail import send_mail


# A queue task: the code does not show who enqueued it or why.
@shared_task
def mail_task(to, subject, body):
    send_mail(subject, body, "hi@example.org", [to])


# A function whose name says it notifies people about a change.
def notify_watchers(db, request_id):
    watchers = db.watchers_for(request_id)
    send_mail("A request you follow changed", "See the page.", "hi@example.org", [w.email for w in watchers])


async def send_daily_digest(db, user_id):
    user = await db.get_user(user_id)
    send_mail("Your daily digest", "Numbers", "digest@example.org", [user.email])


def reminder_email(to):
    send_mail("Reminder", "Do the thing.", "hi@example.org", [to])
