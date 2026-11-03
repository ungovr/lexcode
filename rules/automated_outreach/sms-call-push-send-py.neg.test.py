# lexcode-expect: 0
import anthropic
from twilio.rest import Client

client = Client("sid", "token")
llm = anthropic.Anthropic()


def text_login_code(phone, otp):
    # A one-time code texted to the number the person just entered.
    client.messages.create(to=phone, from_="+15550100", body=f"Your login code is {otp}")


def start_verification(phone, service_sid):
    # Twilio Verify: the person asked to sign in by text.
    return client.verify.v2.services(service_sid).verifications.create(to=phone, channel="sms")


def summarize(text):
    # A model API call. Its messages.create is a chat completion, not a text message.
    return llm.messages.create(model="claude-sonnet-5-5", max_tokens=300, messages=[{"role": "user", "content": text}])


def send_sms_preview(text):
    return text[:160]
