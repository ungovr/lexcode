# lexcode-expect: 0
# An app that links a mixed cryptography library only to hash, MAC, sign or make a key pair ships
# no encryption (#13336): none of these is read.
import libnacl
import nacl.hash
import nacl.signing
import rsa
import tink
from tink import mac, signature
from cryptography.hazmat.primitives import hashes, hmac, serialization
from cryptography.hazmat.primitives.asymmetric import ed25519, padding
from cryptography.hazmat.primitives.asymmetric import rsa as rsa_keys
from Crypto.Hash import HMAC, SHA256
from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5, pkcs1_15


def cryptography_signing(data: bytes, secret: bytes):
    key = rsa_keys.generate_private_key(public_exponent=65537, key_size=2048)
    signed = key.sign(data, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=32), hashes.SHA256())
    ed = ed25519.Ed25519PrivateKey.generate().sign(data)
    tag = hmac.HMAC(secret, hashes.SHA256())
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.BestAvailableEncryption(secret),
    )
    return signed, ed, tag, pem


def pycryptodome_signing(data: bytes, secret: bytes):
    key = RSA.generate(2048)
    digest = SHA256.new(data)
    legacy = PKCS1_v1_5.new(key).sign(digest)
    modern = pkcs1_15.new(key).sign(digest)
    return legacy, modern, HMAC.new(secret, data, SHA256).hexdigest()


def nacl_signing(data: bytes, seed: bytes):
    return nacl.signing.SigningKey(seed).sign(data), nacl.hash.sha256(data)


def libnacl_signing(data: bytes, sk: bytes):
    return libnacl.crypto_sign(data, sk), libnacl.crypto_generichash(data)


def tink_signing(handle):
    mac.register()
    signature.register()
    return handle.primitive(mac.Mac), handle.primitive(signature.PublicKeySign), tink.mac.register()


def python_rsa_signing(message: bytes):
    public_key, private_key = rsa.newkeys(2048)
    return rsa.sign(message, private_key, "SHA-256"), public_key


class Vault:
    # The app's own exchange is not a key agreement.
    def exchange(self, a, b):
        return b, a


print(Vault().exchange(1, 2))
