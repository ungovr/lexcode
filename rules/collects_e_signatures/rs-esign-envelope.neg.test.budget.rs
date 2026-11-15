// lexcode-expect: 0
use reqwest::Client;

// A budgeting service's own API has the same path shape as an e-signature vendor's envelopes, in a
// file that never names the vendor.
pub struct Budget {
    http: Client,
    base: String,
}

impl Budget {
    pub async fn new_envelope(&self, account: &str, name: &str) -> reqwest::Result<reqwest::Response> {
        self.http
            .post(format!("{}/v2/accounts/{account}/envelopes", self.base))
            .json(&serde_json::json!({ "name": name, "limit": 400 }))
            .send()
            .await
    }
}
