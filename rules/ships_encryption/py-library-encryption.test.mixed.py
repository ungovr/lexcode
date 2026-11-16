# lexcode-expect: 16
# The libraries that mix hashing, MACs or signing with their ciphers have no component-map entry;
# these are their cipher and key-agreement calls, which this rule reads instead (#13336).
import libnacl
import libnacl.secret
import rsa
import tink
from tink import aead, hybrid
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, padding, x25519
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms
from cryptography.hazmat.primitives.ciphers.aead import AESGCMSIV
from Crypto.Cipher import ChaCha20_Poly1305, PKCS1_v1_5
from Crypto.Protocol import DH


def rsa_oaep(public_key, data: bytes) -> bytes:
    return public_key.encrypt(
        data,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None),
    )


def ecdh(private_key, peer_public):
    return private_key.exchange(ec.ECDH(), peer_public)


def x25519_agree(peer_public):
    mine = x25519.X25519PrivateKey.generate()
    return mine.exchange(peer_public)


def stream(key: bytes, nonce: bytes):
    return Cipher(algorithms.ChaCha20(key, nonce), mode=None).encryptor()


def siv(key: bytes, nonce: bytes, data: bytes) -> bytes:
    return AESGCMSIV(key).encrypt(nonce, data, None)


def pycryptodome_aead(key: bytes):
    return ChaCha20_Poly1305.new(key=key)


def pycryptodome_rsa(key, data: bytes) -> bytes:
    return PKCS1_v1_5.new(key).encrypt(data)


def pycryptodome_dh(static_priv, eph_pub, kdf):
    return DH.key_agreement(static_priv=static_priv, eph_pub=eph_pub, kdf=kdf)


def libnacl_secret(key: bytes, data: bytes) -> bytes:
    return libnacl.secret.SecretBox(key).encrypt(data)


def libnacl_raw(msg: bytes, nonce: bytes, pk: bytes, sk: bytes) -> bytes:
    return libnacl.crypto_box(msg, nonce, pk, sk)


def tink_aead(handle):
    aead.register()
    return handle.primitive(aead.Aead)


def tink_hybrid(handle):
    hybrid.register()
    return handle.primitive(hybrid.HybridEncrypt)


def python_rsa(message: bytes, public_key) -> bytes:
    return rsa.encrypt(message, public_key)


def module_qualified(handle):
    return handle.primitive(tink.aead.Aead)
