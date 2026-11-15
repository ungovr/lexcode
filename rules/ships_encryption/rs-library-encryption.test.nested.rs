// lexcode-expect: 8
use aes_gcm as gcm;
use josekit::{jwe::{JweHeader, Dir}, jwt::{self, JwtPayload}};
use openssl as ossl;
use orion as or;
use ring::{
    aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM},
    rand::SystemRandom,
};
use sodiumoxide::crypto::secretbox as sb;
use x25519_dalek as xd;

pub fn nested_and_aliased(key: &[u8], data: &mut Vec<u8>, payload: &JwtPayload) -> anyhow::Result<String> {
    let k = UnboundKey::new(&AES_256_GCM, key).map_err(|_| anyhow::anyhow!("key"))?;
    let sealing = LessSafeKey::new(k);
    sealing
        .seal_in_place_append_tag(Nonce::assume_unique_for_key([0u8; 12]), Aad::empty(), data)
        .map_err(|_| anyhow::anyhow!("seal"))?;
    let _ = gcm::Aes256Gcm::new_from_slice(key);
    let _ = ossl::symm::encrypt(ossl::symm::Cipher::aes_256_cbc(), key, None, data);
    let _ = or::aead::seal(&or::aead::SecretKey::default(), data);
    let _ = sb::seal(data, &sb::gen_nonce(), &sb::gen_key());
    let _ = xd::EphemeralSecret::random();
    let _ = SystemRandom::new();
    let encrypter = Dir.encrypter_from_bytes(key)?;
    let token = jwt::encode_with_encrypter(payload, &JweHeader::new(), &encrypter)?;
    Ok(token)
}
