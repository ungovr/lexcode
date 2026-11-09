# lexcode-expect: 4
# Document-and-selfie identity verification: a face image is kept or sent
# beside an image of the person's photo ID, so a verifier can match the two.
from dataclasses import dataclass

from django.db import models


class IdentityCheck(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    face_image_url = models.URLField(blank=True)
    photo_id_image_url = models.URLField(blank=True)
    status = models.CharField(max_length=32)


@dataclass
class KycSubmission:
    id_document_front: bytes
    selfie: bytes


class Upload:
    liveness_video = None
    drivers_license_front = None


def submit(session, selfie_png, passport_png):
    return session.post(
        "https://verify.example.org/v1/checks",
        files={"selfie": selfie_png, "passport_image": passport_png},
    )
