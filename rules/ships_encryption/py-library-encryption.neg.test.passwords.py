# lexcode-expect: 0
# Password hashing, key derivation and signing are not shipping encryption, from a bundled library or
# from the standard library: bcrypt, argon2-cffi, passlib, pwdlib, hashlib's scrypt and PBKDF2, a
# JWT signed with PyJWT, and a digest and an HMAC.
import hashlib
import hmac

import bcrypt
import jwt
from argon2 import PasswordHasher
from passlib.context import CryptContext
from pwdlib import PasswordHash

ph = PasswordHasher()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_hash = PasswordHash.recommended()


def hash_with_bcrypt(password: str) -> bytes:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


def hash_with_argon2(password: str) -> str:
    return ph.hash(password)


def hash_with_passlib(password: str) -> str:
    return pwd_context.hash(password)


def hash_with_pwdlib(password: str) -> str:
    return password_hash.hash(password)


def derive(password: bytes, salt: bytes) -> tuple[bytes, bytes]:
    return (
        hashlib.scrypt(password, salt=salt, n=2**14, r=8, p=1),
        hashlib.pbkdf2_hmac("sha256", password, salt, 600_000),
    )


def issue(user_id: str, secret: str) -> str:
    return jwt.encode({"sub": user_id}, secret, algorithm="HS256")


def sign(body: bytes, secret: bytes) -> str:
    return hmac.new(secret, body, hashlib.sha256).hexdigest()


def etag(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()
