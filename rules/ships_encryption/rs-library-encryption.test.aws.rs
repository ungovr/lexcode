// lexcode-expect: 10
use aws_lc_rs::{
    aead::{Aad, BoundKey, NonceSequence, OpeningKey, SealingKey, UnboundKey, AES_256_GCM},
    agreement::{agree_ephemeral, EphemeralPrivateKey, UnparsedPublicKey, X25519},
    rand::SystemRandom,
};
use josekit::{jwe::{self, JweHeader}, jwt::{self, JwtPayload}};
use ring as rg;

pub fn aws<N: NonceSequence>(key: &[u8], seal_nonces: N, open_nonces: N, peer: &[u8]) -> anyhow::Result<()> {
    let sealing = SealingKey::new(UnboundKey::new(&AES_256_GCM, key).map_err(|_| anyhow::anyhow!("k"))?, seal_nonces);
    let _opening = OpeningKey::new(UnboundKey::new(&AES_256_GCM, key).map_err(|_| anyhow::anyhow!("k"))?, open_nonces);
    let rng = SystemRandom::new();
    let mine = EphemeralPrivateKey::generate(&X25519, &rng).map_err(|_| anyhow::anyhow!("g"))?;
    let _shared = agree_ephemeral(mine, &UnparsedPublicKey::new(&X25519, peer), |km| km.to_vec());
    let _ = (sealing, Aad::empty());
    let _ = rg::aead::LessSafeKey::new(rg::aead::UnboundKey::new(&rg::aead::CHACHA20_POLY1305, key).map_err(|_| anyhow::anyhow!("k"))?);
    Ok(())
}

pub fn jose(token: &str, decrypter: &dyn jwe::JweDecrypter, payload: &JwtPayload, encrypter: &dyn jwe::JweEncrypter) -> anyhow::Result<()> {
    let (_payload, _header) = jwt::decode_with_decrypter(token, decrypter)?;
    let _compact = jwe::serialize_compact(b"x", &JweHeader::new(), encrypter)?;
    let _ = payload;
    Ok(())
}
