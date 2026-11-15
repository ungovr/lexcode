// lexcode-expect: 0
use sd_jwt_rs::{SDJWTHolder, SDJWTIssuer, SDJWTSerializationFormat};
use webauthn_rs::prelude::*;

// Issuing a credential and building a holder's presentation are not relying on one, a passkey sign-in
// is not a credential from a wallet, and an app's own SessionManager and verifier are not isomdl's or
// sd-jwt-rs's, in a file whose `use` lines do not name them.
mod sessions {
    pub struct SessionManager;
    impl SessionManager {
        pub fn establish_session(user: &str) -> String {
            format!("session for {user}")
        }
    }
    pub struct SDJWTVerifier;
    impl SDJWTVerifier {
        pub fn new(token: &str) -> bool {
            !token.is_empty()
        }
    }
}

use sessions::{SDJWTVerifier, SessionManager};

pub fn issue(issuer: &mut SDJWTIssuer, claims: serde_json::Value, holder_verifier: Box<dyn sd_jwt_rs::SDJWTSignatureVerifier>) -> anyhow::Result<String> {
    let sd_jwt = issuer.issue_sd_jwt(claims, sd_jwt_rs::ClaimsForSelectiveDisclosureStrategy::AllLevels, None, false, SDJWTSerializationFormat::Compact)?;
    let mut holder = SDJWTHolder::new(holder_verifier, None, sd_jwt.clone(), SDJWTSerializationFormat::Compact)?;
    let _presentation = holder.create_presentation(serde_json::Map::new(), None, None, None, None)?;
    Ok(sd_jwt)
}

pub fn sign_in(webauthn: &Webauthn, creds: &[Passkey], user: &str) -> anyhow::Result<()> {
    let (_challenge, _state) = webauthn.start_passkey_authentication(creds)?;
    let _s = SessionManager::establish_session(user);
    let _ok = SDJWTVerifier::new("token");
    Ok(())
}
