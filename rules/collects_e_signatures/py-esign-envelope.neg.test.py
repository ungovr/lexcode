# lexcode-expect: 0
import hashlib
import hmac
import subprocess

import jwt
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class SignupForm(BaseModel):
    email: str
    accepted_terms: bool


@app.post("/signup")
def signup(form: SignupForm):
    # A checkbox accepting terms is not a signature.
    if not form.accepted_terms:
        return {"error": "Please accept the terms"}
    return {"ok": True}


def issue_token(user_id: str, secret: str) -> str:
    return jwt.encode({"sub": user_id}, secret, algorithm="HS256")


def verify_webhook(body: bytes, signature: str, secret: bytes) -> bool:
    expected = hmac.new(secret, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def sign_release(path: str, key_id: str) -> None:
    # Code signing a build artifact.
    subprocess.run(["gpg", "--detach-sign", "--local-user", key_id, path], check=True)


class Outbox:
    def create_envelope(self, to: str, body: str) -> dict:
        return {"to": to, "body": body}


reply = Outbox().create_envelope("a@example.org", "hello")
