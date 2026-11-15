// lexcode-expect: 0
use serde::{Deserialize, Serialize};

// Accepting the terms of service is contract formation; a key's signature on an activity, a webhook,
// a token or a contract call is not a person signing; a signature on a struct that is not an agreement
// is not a signed record.
#[derive(Debug, Deserialize)]
pub struct TermsAgreement {
    pub accepted: bool,
    pub accepted_version: String,
}

#[derive(Debug, Serialize)]
pub struct ActivityEnvelope {
    pub signature: String,
}

#[derive(Debug, Deserialize)]
pub struct ConsentWebhookPayload {
    pub signature: String,
}

pub struct ContractCallRequest {
    pub signature: Vec<u8>,
}

pub struct ContractorProfile {
    pub tenant_signature: String,
}

pub struct DeviceEnrollmentRequest {
    pub signature: String,
}

pub struct EmailSettings {
    pub signature: String,
}
