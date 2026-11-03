# lexcode-expect: 0
from django.db import models


class Subscription(models.Model):
    """A reader's subscription to one newsletter."""

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    newsletter = models.ForeignKey("publishing.Newsletter", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class FriendlyError(Exception):
    """An error with wording meant for the person at the keyboard."""


class GitHubProfile:
    def __init__(self, payload):
        self.login = payload["login"]
        self.followers_count = payload["followers"]
        self.following_count = payload["following"]


def summarize(profile):
    return f"{profile.login}: {profile.followers_count} followers"
