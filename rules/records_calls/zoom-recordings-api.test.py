# lexcode-expect: 2
# Reading a user's Zoom cloud recordings so the app can transcribe or review meetings.
import requests


def list_recordings(token, user_id):
    response = requests.get(
        f"https://api.zoom.us/v2/users/{user_id}/recordings",
        headers={"Authorization": f"Bearer {token}"},
        params={"from": "2026-01-01"},
        timeout=15,
    )
    return response.json()


def meeting_recordings(token, meeting_id):
    url = f"https://api.zoom.us/v2/meetings/{meeting_id}/recordings"
    return requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=15).json()
