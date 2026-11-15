// lexcode-expect: 9
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use bcrypt as bc;
use pbkdf2::Pbkdf2;
use scrypt::Scrypt;

pub struct Accounts;

impl Accounts {
    pub fn create(&self, password: &str) -> anyhow::Result<String> {
        Ok(hash(password, DEFAULT_COST)?)
    }

    pub fn check(&self, password: &str, stored: &str) -> bool {
        verify(password, stored).unwrap_or(false)
    }

    pub fn create_aliased(&self, password: &str) -> anyhow::Result<String> {
        Ok(bc::hash(password, 12)?)
    }

    pub fn create_argon2(&self, password: &str) -> anyhow::Result<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        Ok(argon2.hash_password(password.as_bytes(), &salt).map_err(anyhow::Error::msg)?.to_string())
    }

    pub fn check_argon2(&self, password: &str, stored: &str) -> bool {
        let parsed = PasswordHash::new(stored).unwrap();
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok()
    }

    pub fn create_scrypt(&self, password: &str, salt: &SaltString) -> String {
        Scrypt.hash_password(password.as_bytes(), salt).unwrap().to_string()
    }

    pub fn create_pbkdf2(&self, password: &str, salt: &SaltString) -> String {
        Pbkdf2.hash_password(password.as_bytes(), salt).unwrap().to_string()
    }

    pub fn create_password_auth(&self, password: &str) -> String {
        password_auth::generate_hash(password)
    }

    pub fn create_rust_argon2(&self, password: &[u8], salt: &[u8]) -> String {
        argon2::hash_encoded(password, salt, &argon2::Config::default()).unwrap()
    }
}
