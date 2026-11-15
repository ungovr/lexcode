// lexcode-expect: 10
use openssl::derive::Deriver;
use openssl::encrypt::{Decrypter, Encrypter};
use openssl::envelope::{Open, Seal};
use openssl::pkey::{PKey, Private, Public};
use openssl::rsa::{Padding, Rsa};
use openssl::symm::{decrypt, encrypt, Cipher, Crypter, Mode};
use openssl as ossl;

pub struct Sealer {
    key: [u8; 32],
}

impl Sealer {
    pub fn symmetric(&self, iv: &[u8], data: &[u8]) -> Result<Vec<u8>, openssl::error::ErrorStack> {
        let ct = encrypt(Cipher::aes_256_cbc(), &self.key, Some(iv), data)?;
        let _ = decrypt(Cipher::aes_256_cbc(), &self.key, Some(iv), &ct)?;
        let _ = Crypter::new(Cipher::aes_256_gcm(), Mode::Encrypt, &self.key, Some(iv))?;
        let _ = ossl::symm::encrypt_aead(Cipher::aes_256_gcm(), &self.key, Some(iv), b"", data, &mut [0u8; 16])?;
        Ok(ct)
    }

    pub fn public_key(&self, public: &PKey<Public>, private: &PKey<Private>, pem: &[u8], data: &[u8]) -> Result<(), openssl::error::ErrorStack> {
        let _ = Encrypter::new(public)?;
        let _ = Decrypter::new(private)?;
        let _ = Seal::new(Cipher::aes_256_cbc(), &[public.clone()])?;
        let _ = Deriver::new(private)?;
        let rsa = Rsa::public_key_from_pem(pem)?;
        let mut out = vec![0; rsa.size() as usize];
        let _ = rsa.public_encrypt(data, &mut out, Padding::PKCS1_OAEP)?;
        let _ = Open::new(Cipher::aes_256_cbc(), private, None, &out);
        Ok(())
    }
}
