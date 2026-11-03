# lexcode-expect: 3
from django.db import models


class ExtensionSubmission(models.Model):
    developer = models.ForeignKey("accounts.Developer", on_delete=models.CASCADE)
    package_url = models.URLField()
    status = models.CharField(max_length=20, default="pending_review")
    reviewer_note = models.TextField(blank=True)


def approve_plugin(submission, reviewer):
    submission.status = "approved"
    submission.reviewed_by = reviewer
    submission.save(update_fields=["status", "reviewed_by"])
    publish_to_catalog(submission)


async def reject_listing(submission, reviewer, reason):
    submission.status = "rejected"
    submission.reviewer_note = reason
    await submission.asave()
