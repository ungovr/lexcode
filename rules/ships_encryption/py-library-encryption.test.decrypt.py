# lexcode-expect: 7
# An app that only decrypts or agrees keys with a mixed cryptography library still ships encryption
# (#13336).
import libnacl
import rsa
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import dh, padding


def rsa_open(private_key, ciphertext: bytes) -> bytes:
    return private_key.decrypt(
        ciphertext,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None),
    )


def rsa_open_legacy(private_key, ciphertext: bytes) -> bytes:
    return private_key.decrypt(ciphertext, padding.PKCS1v15())


def finite_field(parameters, peer_public):
    mine = parameters.generate_private_key()
    return mine.exchange(peer_public)


def python_rsa_open(ciphertext: bytes, private_key) -> bytes:
    return rsa.decrypt(ciphertext, private_key)


def libnacl_open(box: bytes, nonce: bytes, pk: bytes, sk: bytes, key: bytes):
    return (
        libnacl.crypto_box_open(box, nonce, pk, sk),
        libnacl.crypto_secretbox_open(box, nonce, key),
        libnacl.crypto_box_seal_open(box, pk, sk),
    )
