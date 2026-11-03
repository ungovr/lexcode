# lexcode-expect: 0
from django.core.mail import send_mail


def send_digest(subscriber):
    send_mail(
        subject="Freedom of Information Act: what changed this year",
        message="A summary of this year's changes to records law, for our readers.",
        from_email="news@example.org",
        recipient_list=[subscriber.email],
    )


def send_receipt(order):
    send_mail(
        subject=f"Receipt for order {order.id}",
        message="Thank you for your purchase.",
        from_email="orders@example.org",
        recipient_list=[order.email],
    )


FAQ = """
Under the Public Records Act, agencies have ten days to respond. Our guide explains
what that means for you and how to read the reply you get back.
"""
