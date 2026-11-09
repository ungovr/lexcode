# lexcode-expect: 0
# A profile photo, a gallery that links photos by id, a password sign-in, a
# social sign-in that only links an account, and an ID scan with no face beside
# it: nothing here holds a face image next to a photo-ID image.
from django import forms
from django.db import models


class Profile(models.Model):
    face_image = models.ImageField(upload_to="avatars/")
    display_name = models.CharField(max_length=80)


class Gallery(models.Model):
    selfie_url = models.URLField()
    photo_id = models.IntegerField()


class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)
    avatar_image = forms.ImageField(required=False)


class TravelDocument(models.Model):
    passport_image = models.ImageField(upload_to="docs/")
    nationality = models.CharField(max_length=2)


def link_social(user, provider_uid, picture_url):
    return {"provider_uid": provider_uid, "profile_picture": picture_url}


def upload_selfie(session, selfie_png):
    return session.post("https://example.org/me/photo", files={"selfie": selfie_png})


class VerifyFlow:
    # Step names of a verification flow, not images.
    FACE_PHOTO_STEP = "face-photo-step"
    ID_PHOTO_STEP = "id-photo-step"
    STEP_TITLES = {FACE_PHOTO_STEP: "Take a photo", ID_PHOTO_STEP: "Show your ID"}
