// lexcode-expect: 0
use argon2::{self, Config};

// rust-argon2's raw hash: key material for encryption, not an encoded password kept for sign-in.
pub fn wrapping_key(passphrase: &[u8], salt: &[u8]) -> Result<Vec<u8>, argon2::Error> {
    let config = Config::default();
    argon2::hash_raw(passphrase, salt, &config)
}
