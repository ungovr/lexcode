# lexcode-expect: 2
# Creating Daily rooms and meeting tokens from Python with recording switched on.
import os

import requests

DAILY_API = "https://api.daily.co/v1"
HEADERS = {"Authorization": f"Bearer {os.environ['DAILY_API_KEY']}"}


def create_recorded_room(name):
    payload = {
        "name": name,
        "privacy": "private",
        "properties": {"enable_recording": "cloud", "max_participants": 8},
    }
    return requests.post(f"{DAILY_API}/rooms", json=payload, headers=HEADERS, timeout=10).json()


def create_owner_token(room):
    properties = {"room_name": room, "is_owner": True, "enable_recording": "local"}
    return requests.post(f"{DAILY_API}/meeting-tokens", json={"properties": properties}, headers=HEADERS, timeout=10).json()
