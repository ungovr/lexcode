# lexcode-expect: 0
import pyotp
import stripe
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, HTTPException
from passlib.context import CryptContext
from webauthn import verify_authentication_response

app = FastAPI()
oauth = OAuth()
oauth.register(name="google", server_metadata_url="https://accounts.google.com/.well-known/openid-configuration")
pwd = CryptContext(schemes=["bcrypt"])


@app.get("/login/google")
async def login_google(request):
    # Social sign-in is not an identity credential.
    return await oauth.google.authorize_redirect(request, "https://app.example.org/auth/google")


@app.post("/login")
def login(email: str, password: str, db):
    user = db.get_user(email)
    if not user or not pwd.verify(password, user.hash):
        raise HTTPException(status_code=401)
    return {"ok": True}


def check_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code)


def check_passkey(credential, challenge, public_key):
    # A passkey proves possession of a key, not an attribute of the person.
    return verify_authentication_response(
        credential=credential,
        expected_challenge=challenge,
        expected_rp_id="app.example.org",
        expected_origin="https://app.example.org",
        credential_public_key=public_key,
        credential_current_sign_count=0,
    )


def charge(amount: int, customer: str):
    return stripe.PaymentIntent.create(amount=amount, currency="usd", customer=customer)


def verify_credential(email: str, password: str) -> bool:
    return email == "demo@example.org" and password == "demo"
