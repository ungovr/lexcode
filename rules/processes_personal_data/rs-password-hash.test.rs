// lexcode-expect: 10
use anyhow::Context;
use argon2::password_hash::SaltString;
use argon2::{Algorithm, Argon2, Params, PasswordHash, PasswordHasher, PasswordVerifier, Version};
use bcrypt as bc;
use bcrypt::{hash, verify, DEFAULT_COST};
use password_auth as pwa;
use scrypt::Scrypt;

pub fn generate(password: String) -> anyhow::Result<String> {
    let salt = SaltString::generate(rand::thread_rng());
    Ok(PasswordHash::generate(Argon2::default(), password, salt.as_str())
        .map_err(|e| anyhow::anyhow!("failed to generate password hash: {}", e))?
        .to_string())
}

pub fn check(password: String, stored: String) -> anyhow::Result<()> {
    let hash = PasswordHash::new(&stored).map_err(|e| anyhow::anyhow!("invalid hash: {}", e))?;
    hash.verify_password(&[&Argon2::default()], password)
        .map_err(|e| anyhow::anyhow!("wrong password: {}", e))
}

pub fn compute(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut rand::thread_rng());
    let hashed = Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        Params::new(15000, 2, 1, None).unwrap(),
    )
    .hash_password(password.as_bytes(), &salt)?
    .to_string();
    Ok(hashed)
}

pub fn verify_candidate(candidate: &str, expected: &PasswordHash) -> anyhow::Result<()> {
    Argon2::default()
        .verify_password(candidate.as_bytes(), expected)
        .context("Invalid password.")
}

pub fn with_local(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut rand::thread_rng());
    let argon2 = Argon2::default();
    Ok(argon2.hash_password(password.as_bytes(), &salt)?.to_string())
}

pub fn lemmy_style(new_password: &str, stored: &str) -> anyhow::Result<bool> {
    let password_hash = hash(new_password, DEFAULT_COST)?;
    let ok = verify(new_password, stored)?;
    let parts = bc::hash_with_result(new_password, 12)?;
    Ok(ok && !password_hash.is_empty() && !parts.to_string().is_empty())
}

pub fn other_hashers(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut rand::thread_rng());
    let s = Scrypt.hash_password(password.as_bytes(), &salt)?.to_string();
    let p = pwa::generate_hash(password);
    Ok(format!("{s}{p}"))
}
