# lexcode-expect: 0
import hashlib
import hmac
import jwt


def issue(user_id: str, secret: str) -> str:
    return jwt.encode({"sub": user_id}, secret, algorithm="HS256")


def digest(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def sign(body: bytes, secret: bytes) -> str:
    return hmac.new(secret, body, hashlib.sha256).hexdigest()


def etag(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


class Cache:
    def hash(self, key):
        return hash(key) % 8
