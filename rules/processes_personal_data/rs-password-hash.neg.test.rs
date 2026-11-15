// lexcode-expect: 0
use argon2::Argon2;
use sha2::{Digest, Sha256};

// A key derived from a passphrase to encrypt a local file: no account, nothing stored.
pub fn derive_key(passphrase: &str, salt: &[u8; 16]) -> [u8; 32] {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .expect("key derivation");
    key
}

// The app's own content hash and comparison, named like bcrypt's functions.
fn hash(data: &[u8], rounds: u32) -> Vec<u8> {
    let mut out = data.to_vec();
    for _ in 0..rounds {
        out = Sha256::digest(&out).to_vec();
    }
    out
}

fn verify(expected: &[u8], actual: &[u8]) -> bool {
    expected == actual
}

// The app's own type of the same short name as scrypt's hasher.
struct Scrypt;

impl Scrypt {
    fn hash_password(&self, data: &[u8], label: &str) -> String {
        format!("{label}:{}", hex::encode(Sha256::digest(data)))
    }
}

pub fn fingerprint(file: &[u8]) -> bool {
    let digest = hash(file, 2);
    let label = Scrypt.hash_password(file, "upload");
    verify(&digest, &digest) && !label.is_empty()
}
