// lexcode-expect: 6
use isomdl::{
    definitions::x509::trust_anchor::TrustAnchorRegistry,
    presentation::{reader::SessionManager, Stringify},
};
use sd_jwt_rs::{SDJWTSerializationFormat, SDJWTVerifier};
use ssi::claims::vc::v1::data_integrity::any_credential_from_json_str;
use ssi::prelude::*;
use ssi as spruce;

pub struct Verifier {
    anchors: TrustAnchorRegistry,
}

impl Verifier {
    pub fn read_mdl(&self, qr: String, requested: isomdl::definitions::helpers::NonEmptyMap<String, isomdl::definitions::helpers::NonEmptyMap<String, bool>>) -> anyhow::Result<Vec<u8>> {
        let (_session, request, _ble) = SessionManager::establish_session(qr, requested, self.anchors.clone())?;
        Ok(request)
    }

    pub fn check_sd_jwt(&self, presentation: String, checker: Box<dyn sd_jwt_rs::SDJWTSignatureVerifier>) -> anyhow::Result<serde_json::Value> {
        let verified = SDJWTVerifier::new(checker, presentation, Some("https://rp.example.org".into()), Some("n-0S6".into()), SDJWTSerializationFormat::Compact)?
            .verified_claims;
        Ok(verified)
    }

    pub async fn check_vc<R: VerificationMethodResolver>(&self, json: &str, resolver: R) -> anyhow::Result<bool> {
        let vc = any_credential_from_json_str(json)?;
        let params = spruce::claims::VerificationParameters::from_resolver(resolver);
        Ok(vc.verify(&params).await?.is_ok())
    }

    pub async fn check_vc_v2(&self, json: &str) -> anyhow::Result<()> {
        let _vc = ssi::claims::vc::v2::data_integrity::any_credential_from_json_str(json)?;
        Ok(())
    }

    pub fn check_legacy(&self, json: &str) -> anyhow::Result<()> {
        let _p = ssi::vc::Presentation::from_json(json)?;
        Ok(())
    }
}
