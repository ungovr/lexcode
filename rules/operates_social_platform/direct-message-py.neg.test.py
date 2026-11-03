# lexcode-expect: 0
from django.db import models


class EmailLog(models.Model):
    """A copy of a transactional email the site sent, kept for support."""

    sender = models.EmailField()
    recipient = models.EmailField()
    subject = models.CharField(max_length=200)
    sent_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    sender = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="+")
    recipient = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="notifications")
    verb = models.CharField(max_length=80)


@sio.on("message")
async def on_room_message(sid, data):
    await sio.emit("message", data, room="lobby")
