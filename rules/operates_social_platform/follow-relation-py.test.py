# lexcode-expect: 3
from django.db import models
from sqlmodel import Field, SQLModel


class Follow(models.Model):
    follower = models.ForeignKey("accounts.User", related_name="following_set", on_delete=models.CASCADE)
    following = models.ForeignKey("accounts.User", related_name="follower_set", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")


class UserEdge(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    followed_id: int = Field(foreign_key="user.id", index=True)
    follower_id: int = Field(foreign_key="user.id", index=True)


class Friendship(models.Model):
    requester = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="+")
    addressee = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="+")
    accepted = models.BooleanField(default=False)
