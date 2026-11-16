# lexcode-expect: 3
# PGPy's encryption, to a recipient's key and with a passphrase.
import pgpy
from pgpy.constants import SymmetricKeyAlgorithm


def to_recipient(recipient_armored: str, text: str):
    key, _ = pgpy.PGPKey.from_blob(recipient_armored)
    message = pgpy.PGPMessage.new(text)
    return key.pubkey.encrypt(message)


def with_passphrase(text: str, passphrase: str):
    message = pgpy.PGPMessage.new(text)
    return message.encrypt(passphrase, cipher=SymmetricKeyAlgorithm.AES256)


def read(own_armored: str, passphrase: str, armored_message: str):
    key, _ = pgpy.PGPKey.from_blob(own_armored)
    with key.unlock(passphrase):
        return key.decrypt(pgpy.PGPMessage.from_blob(armored_message))
