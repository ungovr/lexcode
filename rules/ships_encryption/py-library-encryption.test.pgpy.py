# lexcode-expect: 2
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
