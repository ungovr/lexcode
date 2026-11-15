// lexcode-expect: 0
use ed25519_dalek::{Signer, SigningKey, Verifier};
use hmac::{Hmac, Mac};
use jsonwebtoken::{encode, EncodingKey, Header};
use ring::{digest, signature};
use rsa::{pkcs1v15::SigningKey as RsaSigningKey, signature::RandomizedSigner};
use sha2::{Digest, Sha256};

// Signatures, MACs, hashes and a signed JWT encrypt nothing. An app's own types and functions named
// like a crate's (UnboundKey, Aes256Gcm, encrypt, seal) are not the crate's, in a file without its `use`.
mod keys {
    pub struct UnboundKey(pub Vec<u8>);
    impl UnboundKey {
        pub fn new(bytes: &[u8]) -> Self {
            UnboundKey(bytes.to_vec())
        }
    }
    pub struct Aes256Gcm;
    impl Aes256Gcm {
        pub fn new_from_slice(_k: &[u8]) -> Self {
            Aes256Gcm
        }
    }
    pub fn encrypt(label: &str) -> String {
        format!("label:{label}")
    }
    pub mod secretbox {
        pub fn seal(s: &str) -> String {
            s.to_uppercase()
        }
    }
}

use keys::{secretbox, Aes256Gcm, UnboundKey};

pub struct Tokens {
    secret: Vec<u8>,
}

impl Tokens {
    pub fn sign(&self, claims: &serde_json::Value, rsa_key: RsaSigningKey<Sha256>) -> String {
        let signing = SigningKey::from_bytes(&[7u8; 32]);
        let sig = signing.sign(b"message");
        let _ = signing.verifying_key().verify(b"message", &sig);
        let mut mac = Hmac::<Sha256>::new_from_slice(&self.secret).unwrap();
        mac.update(b"payload");
        let _ = mac.finalize();
        let _ = digest::digest(&digest::SHA256, b"x");
        let pair = signature::Ed25519KeyPair::from_pkcs8(&self.secret).unwrap();
        let _ = pair.sign(b"x");
        let _ = Sha256::digest(b"x");
        let _ = rsa_key.sign_with_rng(&mut rand_core::OsRng, b"x");
        encode(&Header::default(), claims, &EncodingKey::from_secret(&self.secret)).unwrap()
    }

    pub fn own(&self) -> String {
        let _ = UnboundKey::new(&self.secret);
        let _ = Aes256Gcm::new_from_slice(&self.secret);
        let _ = secretbox::seal("x");
        keys::encrypt("note")
    }

    pub fn own_rsa(&self, key: &Store) -> Vec<u8> {
        key.public_encrypt(b"x")
    }
}

pub struct Store;
impl Store {
    pub fn public_encrypt(&self, x: &[u8]) -> Vec<u8> {
        x.to_vec()
    }
}
