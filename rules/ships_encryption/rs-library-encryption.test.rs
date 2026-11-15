// lexcode-expect: 28
use aes::Aes256;
use aes_gcm::{aead::{Aead, KeyInit, OsRng}, Aes256Gcm, Nonce};
use age::secrecy::SecretString;
use cbc::cipher::{block_padding::Pkcs7, BlockEncryptMut, KeyIvInit};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use crypto_box::{ChaChaBox, PublicKey, SecretKey};
use openssl::rsa::{Padding, Rsa};
use openssl::symm::{encrypt, Cipher, Crypter, Mode};
use ring::{aead, agreement, rand};
use rsa::{Oaep, Pkcs1v15Encrypt, RsaPrivateKey, RsaPublicKey};
use sha2::Sha256;
use sodiumoxide::crypto::{box_, sealedbox, secretbox};
use x25519_dalek::{EphemeralSecret, PublicKey as XPublicKey, StaticSecret};

type Aes256CbcEnc = cbc::Encryptor<Aes256>;

pub struct Vault {
    key: [u8; 32],
}

impl Vault {
    pub fn seal_ring(&self, data: &mut Vec<u8>) -> Result<(), ring::error::Unspecified> {
        let unbound = aead::UnboundKey::new(&aead::AES_256_GCM, &self.key)?;
        let key = aead::LessSafeKey::new(
            unbound,
        );
        key.seal_in_place_append_tag(aead::Nonce::assume_unique_for_key([0u8; 12]), aead::Aad::empty(), data)
    }

    pub fn agree_ring(&self, peer: &[u8]) -> Result<Vec<u8>, ring::error::Unspecified> {
        let rng = rand::SystemRandom::new();
        let mine = agreement::EphemeralPrivateKey::generate(&agreement::X25519, &rng)?;
        let peer = agreement::UnparsedPublicKey::new(&agreement::X25519, peer);
        agreement::agree_ephemeral(mine, &peer, |km| km.to_vec())
    }

    pub async fn seal_rustcrypto(&self, data: &[u8]) -> Vec<u8> {
        let gcm = Aes256Gcm::new_from_slice(&self.key).unwrap();
        let x = XChaCha20Poly1305::new(&self.key.into());
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let _ = x.encrypt(&XNonce::default(), data);
        gcm.encrypt(&nonce, data).unwrap()
    }

    pub fn seal_box(&self, theirs: &PublicKey, mine: &SecretKey) -> ChaChaBox {
        ChaChaBox::new(theirs, mine)
    }

    pub fn seal_cbc(&self, iv: &[u8; 16], data: &[u8]) -> Vec<u8> {
        let a = cbc::Encryptor::<Aes256>::new(&self.key.into(), iv.into());
        let _ = a.encrypt_padded_vec_mut::<Pkcs7>(data);
        Aes256CbcEnc::new(&self.key.into(), iv.into())
            .encrypt_padded_vec_mut::<Pkcs7>(data)
    }

    pub fn seal_rsa(&self, public: &RsaPublicKey, private: &RsaPrivateKey, data: &[u8]) {
        let mut rng = rand_core::OsRng;
        let a = public.encrypt(&mut rng, Pkcs1v15Encrypt, data).unwrap();
        let _ = private.decrypt(Pkcs1v15Encrypt, &a).unwrap();
        let _ = public.encrypt(&mut rng, Oaep::new::<Sha256>(), data);
        let _ = private.decrypt(rsa::Oaep::new::<Sha256>(), &a);
        let _ = public.oaep_encrypt::<Sha256>(data);
    }

    pub fn seal_openssl(&self, iv: &[u8], data: &[u8], pem: &[u8]) {
        let _ = encrypt(Cipher::aes_256_cbc(), &self.key, Some(iv), data);
        let _ = Crypter::new(Cipher::aes_256_gcm(), Mode::Encrypt, &self.key, Some(iv));
        let rsa = Rsa::public_key_from_pem(pem).unwrap();
        let mut out = vec![0; rsa.size() as usize];
        let _ = rsa.public_encrypt(data, &mut out, Padding::PKCS1_OAEP);
    }

    pub fn seal_sodium(&self, data: &[u8], pk: &box_::PublicKey, sk: &box_::SecretKey) {
        let key = secretbox::gen_key();
        let n = secretbox::gen_nonce();
        let _ = secretbox::seal(data, &n, &key);
        let _ = box_::seal(data, &box_::gen_nonce(), pk, sk);
        let _ = sealedbox::seal(data, pk);
    }

    pub fn seal_age(&self, data: &[u8], pass: SecretString) {
        let _ = age::Encryptor::with_user_passphrase(pass);
        let r: age::x25519::Recipient = "age1...".parse().unwrap();
        let _ = age::encrypt(&r, data);
    }

    pub fn seal_orion(&self, data: &[u8]) {
        let key = orion::aead::SecretKey::default();
        let _ = orion::aead::seal(&key, data);
        let _ = orion::kex::EphemeralClientSession::new();
    }

    pub fn agree_x25519(&self, theirs: &XPublicKey) {
        let mine = EphemeralSecret::random_from_rng(rand_core::OsRng);
        let _ = mine.diffie_hellman(theirs);
        let fixed = StaticSecret::from(self.key);
        let _ = fixed.diffie_hellman(theirs);
    }

    pub fn seal_vodozemac(&self) {
        let _ = vodozemac::olm::Account::new();
    }
}
