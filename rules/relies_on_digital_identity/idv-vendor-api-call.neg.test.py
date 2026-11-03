# lexcode-expect: 0
import logging

import requests

log = logging.getLogger(__name__)


def own_api(user_id: str) -> dict:
    return requests.get(f"https://api.example.org/v1/users/{user_id}", timeout=10).json()


def charge(payload: dict) -> dict:
    return requests.post("https://api.stripe.com/v1/payment_intents", data=payload, timeout=10).json()


def mention_vendor() -> None:
    # A log line and a docs link name a vendor but call nothing.
    log.info("we do not use https://api.onfido.com/v3.6/checks any more")
    print("docs: https://documentation.onfido.com/")


def docs_page() -> str:
    return requests.get("https://www.yoti.com/blog/", timeout=10).text
