# lexcode-expect: 0
# Daily rooms created with no recording, and a dict that only describes recording.
import os

import requests

DAILY_API = "https://api.daily.co/v1"
HEADERS = {"Authorization": f"Bearer {os.environ['DAILY_API_KEY']}"}


def create_plain_room(name):
    payload = {"name": name, "privacy": "private", "properties": {"max_participants": 8, "enable_chat": True}}
    return requests.post(f"{DAILY_API}/rooms", json=payload, headers=HEADERS, timeout=10).json()


def describe_room():
    return {"enable_recording": "off", "label": "Recording is not enabled for this room"}


NOTICE = {"enable_recording": False}
