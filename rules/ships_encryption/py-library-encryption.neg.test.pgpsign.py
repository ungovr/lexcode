# lexcode-expect: 0
# PGPy used only to sign, verify and protect a key: no encryption of data.
import pgpy


def sign(armored: str, passphrase: str, text: str):
    key, _ = pgpy.PGPKey.from_blob(armored)
    with key.unlock(passphrase):
        return key.sign(pgpy.PGPMessage.new(text))


def verify(public_armored: str, message):
    key, _ = pgpy.PGPKey.from_blob(public_armored)
    return key.verify(message)
