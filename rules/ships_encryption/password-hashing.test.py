# lexcode-expect: 3
import bcrypt
from argon2 import PasswordHasher
from passlib.context import CryptContext

ph = PasswordHasher()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_with_bcrypt(password: str) -> bytes:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


def hash_with_argon2(password: str) -> str:
    return ph.hash(password)


def hash_with_passlib(password: str) -> str:
    return pwd_context.hash(password)
