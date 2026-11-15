// lexcode-expect: 5
use chrono::{DateTime, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
pub struct LeaseAgreement {
    pub id: Uuid,
    pub tenant_signature: String,
    pub signed_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SignWaiverBody {
    pub participant_name: String,
    pub signature_base64: String,
}

#[derive(diesel::Queryable)]
pub struct ParentalConsentForm {
    pub id: i64,
    pub signature: Vec<u8>,
    pub(crate) guardian_signature: Option<String>,
}

pub struct NewWaiverRow {
    signature_data: String,
}
