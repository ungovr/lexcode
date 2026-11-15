// lexcode-expect: 2
use argon2::{self, Config};

// rust-argon2's encoded form, the one stored against an account.
pub fn store(password: &[u8], salt: &[u8]) -> Result<String, argon2::Error> {
    let config = Config::default();
    argon2::hash_encoded(password, salt, &config)
}

pub fn check(encoded: &str, password: &[u8]) -> Result<bool, argon2::Error> {
    argon2::verify_encoded(encoded, password)
}
