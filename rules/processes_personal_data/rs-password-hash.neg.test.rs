// lexcode-expect: 0
use argon2::Argon2;

// A key derived from a passphrase to encrypt a local file: no account, nothing stored.
pub fn derive_key(passphrase: &str, salt: &[u8; 16]) -> [u8; 32] {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .expect("key derivation");
    key
}

// The same, through a local binding.
pub fn derive_key_local(passphrase: &str, salt: &[u8; 16]) -> [u8; 32] {
    let mut key = [0u8; 32];
    let kdf = Argon2::default();
    kdf.hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .expect("key derivation");
    key
}
