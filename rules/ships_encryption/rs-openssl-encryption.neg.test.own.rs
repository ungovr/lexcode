// lexcode-expect: 0
use serde::Serialize;

// An app's own public_encrypt, private_decrypt and encrypt are not openssl's, in a file with no
// `use openssl` line.
#[derive(Serialize)]
pub struct Envelope {
    body: Vec<u8>,
}

pub struct Keys;

impl Keys {
    pub fn public_encrypt(&self, x: &[u8]) -> Envelope {
        Envelope { body: x.iter().rev().copied().collect() }
    }

    pub fn private_decrypt(&self, e: &Envelope) -> Vec<u8> {
        e.body.iter().rev().copied().collect()
    }
}

pub fn round_trip(keys: &Keys, data: &[u8]) -> Vec<u8> {
    let sealed = keys.public_encrypt(data);
    keys.private_decrypt(&sealed)
}
