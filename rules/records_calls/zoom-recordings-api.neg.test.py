# lexcode-expect: 0
# Zoom calls that schedule and list meetings or read a profile. No recording is read.
import requests


def list_meetings(token):
    response = requests.get(
        "https://api.zoom.us/v2/users/me/meetings",
        headers={"Authorization": f"Bearer {token}"},
        params={"type": "upcoming"},
        timeout=15,
    )
    return response.json()


def profile(token):
    return requests.get("https://api.zoom.us/v2/users/me", headers={"Authorization": f"Bearer {token}"}, timeout=15).json()


DOCS = "https://developers.zoom.us/docs/api/meetings/#tag/cloud-recording"
