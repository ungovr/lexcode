# lexcode-expect: 0
# Scheduling a meeting and reading a calendar. No bot joins and nothing is recorded.
import requests


def schedule_meeting(token, topic):
    response = requests.post(
        "https://api.zoom.us/v2/users/me/meetings",
        headers={"Authorization": f"Bearer {token}"},
        json={"topic": topic, "type": 2, "duration": 30},
        timeout=15,
    )
    return response.json()


def upcoming(token):
    response = requests.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    return response.json()


HELP = {
    "reset": "https://example.org/help/recall-password",
    "note": "Recall your password by email.",
}
