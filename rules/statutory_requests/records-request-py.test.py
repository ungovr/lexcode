# lexcode-expect: 3
from email.message import EmailMessage

from django.core.mail import send_mail

LETTER = """
To the Records Custodian:

Pursuant to the California Public Records Act, I am requesting copies of the
contracts the department signed with outside vendors during the last fiscal year.
"""


def file_request(agency_email, topic):
    send_mail(
        subject=f"Public Records Request: {topic}",
        message=LETTER,
        from_email="requests@example.org",
        recipient_list=[agency_email],
    )


def build_message(agency_email, topic):
    msg = EmailMessage()
    msg["To"] = agency_email
    msg["Subject"] = "FOIA request for vendor contracts"
    msg.set_content("Please see the attached request.")
    return msg
