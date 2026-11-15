// lexcode-expect: 0
use sha2::{Digest, Sha256};

// A key derived from a passphrase to encrypt a file is not a password hash, a plain digest is not
// one either, and an app's own hash and verify functions are not bcrypt's, in a file that does not
// use the crate.
mod checks {
    pub fn hash(input: &str, _rounds: u32) -> String {
        format!("{:x}", input.len())
    }
    pub fn verify(input: &str, expected: &str) -> bool {
        hash(input, 0) == expected
    }
}

use checks::{hash, verify};

pub struct Store;

impl Store {
    pub fn hash_password(&self, raw: &[u8]) -> Vec<u8> {
        raw.to_vec()
    }

    pub fn file_key(&self, passphrase: &[u8], salt: &[u8]) -> [u8; 32] {
        let mut key = [0u8; 32];
        argon2::Argon2::default().hash_password_into(passphrase, salt, &mut key).unwrap();
        key
    }

    pub fn etag(&self, body: &str) -> String {
        let _ = verify(body, &hash(body, 1));
        let _ = self.hash_password(body.as_bytes());
        format!("{:x}", Sha256::digest(body.as_bytes()))
    }
}
