# lexcode-expect: 2
# Sending a notetaker bot into a video meeting through a meeting-bot API.
import os

import requests

RECALL_BASE = "https://us-east-1.recall.ai/api/v1"


def send_notetaker(meeting_url):
    response = requests.post(
        f"{RECALL_BASE}/bot/",
        headers={"Authorization": f"Token {os.environ['RECALL_API_KEY']}"},
        json={"meeting_url": meeting_url, "bot_name": "Notes"},
        timeout=15,
    )
    return response.json()


def send_attendee_bot(meeting_url):
    response = requests.post(
        "https://app.attendee.dev/api/v1/bots",
        headers={"Authorization": f"Token {os.environ['ATTENDEE_API_KEY']}"},
        json={"meeting_url": meeting_url, "bot_name": "Notes"},
        timeout=15,
    )
    return response.json()
