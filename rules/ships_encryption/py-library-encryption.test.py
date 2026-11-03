# lexcode-expect: 7
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from Crypto.Cipher import AES
from nacl.secret import SecretBox
from nacl.public import Box, PrivateKey


def encrypt_field(value: bytes, key: bytes) -> bytes:
    # Fernet from the cryptography package seals a database field.
    return Fernet(key).encrypt(value)


def encrypt_blob(data: bytes, key: bytes, nonce: bytes) -> bytes:
    aead = AESGCM(key)
    return aead.encrypt(nonce, data, None)


def encrypt_stream(data: bytes, key: bytes, nonce: bytes) -> bytes:
    return ChaCha20Poly1305(key).encrypt(nonce, data, b"hdr")


def encrypt_cbc(data: bytes, key: bytes, iv: bytes) -> bytes:
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    enc = cipher.encryptor()
    return enc.update(data) + enc.finalize()


def pycryptodome(data: bytes, key: bytes):
    cipher = AES.new(key, AES.MODE_GCM)
    return cipher.encrypt_and_digest(data)


def pynacl_secret(data: bytes, key: bytes) -> bytes:
    return SecretBox(key).encrypt(data)


def pynacl_public(data: bytes, secret: PrivateKey, peer) -> bytes:
    return Box(secret, peer).encrypt(data)
