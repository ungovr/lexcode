// lexcode-expect: 4
use isomdl::presentation::{reader, Stringify};
use sd_jwt_rs::{verifier::SDJWTVerifier, SDJWTSerializationFormat};
use ssi::{claims::vc::v1::data_integrity::any_credential_from_json_str, prelude::*};

pub async fn verify_all<R: VerificationMethodResolver>(
    qr: String,
    requested: isomdl::definitions::helpers::NonEmptyMap<String, isomdl::definitions::helpers::NonEmptyMap<String, bool>>,
    anchors: isomdl::definitions::x509::trust_anchor::TrustAnchorRegistry,
    presentation: String,
    checker: Box<dyn sd_jwt_rs::SDJWTSignatureVerifier>,
    json: &str,
    resolver: R,
) -> anyhow::Result<bool> {
    let (_session, _request, _ble) = reader::SessionManager::establish_session(qr, requested, anchors)?;
    let _claims = SDJWTVerifier::new(checker, presentation, None, None, SDJWTSerializationFormat::Compact)?;
    let vc = any_credential_from_json_str(json)?;
    let params = VerificationParameters::from_resolver(resolver);
    Ok(vc.verify(&params).await?.is_ok())
}
