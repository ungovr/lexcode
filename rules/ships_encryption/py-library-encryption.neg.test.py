# lexcode-expect: 0
import hashlib
import hmac
import secrets
import ssl
import urllib.request


def digest(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def sign(body: bytes, secret: bytes) -> str:
    return hmac.new(secret, body, hashlib.sha256).hexdigest()


def token() -> str:
    return secrets.token_urlsafe(32)


def fetch(url: str) -> bytes:
    # Stock HTTPS through the standard library.
    context = ssl.create_default_context()
    with urllib.request.urlopen(url, context=context) as reply:
        return reply.read()


class Vault:
    # The app's own class happens to use the same method names.
    def encrypt(self, value):
        return "enc:" + value

    def new(self, key):
        return key


store = Vault()
cipher = store.new("k")
print(Vault().encrypt("x"), digest("a"), cipher)
