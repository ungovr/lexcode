# lexcode-expect: 2
import socketio
from django.db import models

sio = socketio.AsyncServer(async_mode="asgi")


class DirectMessage(models.Model):
    sender = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="received_messages")
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)


@sio.on("direct_message")
async def on_direct_message(sid, data):
    recipient_room = f"user:{data['to']}"
    await sio.emit("direct_message", {"from": data["from"], "body": data["body"]}, room=recipient_room)
