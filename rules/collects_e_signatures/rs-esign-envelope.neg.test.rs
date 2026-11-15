// lexcode-expect: 0
use reqwest::{Client, Method};

// Reading an envelope's or a signature request's status sends nothing; accepting the terms of
// service with a button is contract formation, not an electronic signature; an app's own
// "envelopes" route is not DocuSign's.
pub struct Status {
    http: Client,
    base: String,
    account: String,
}

impl Status {
    pub async fn envelope(&self, id: &str) -> reqwest::Result<reqwest::Response> {
        self.http
            .get(format!("{}/restapi/v2.1/accounts/{}/envelopes/{id}", self.base, self.account))
            .send()
            .await
    }

    pub async fn list(&self) -> reqwest::Result<reqwest::Response> {
        self.http
            .request(Method::GET, format!("{}/v2.1/accounts/{}/envelopes", self.base, self.account))
            .send()
            .await
    }

    pub async fn request_status(&self, id: &str) -> reqwest::Result<reqwest::Response> {
        self.http.get(format!("https://api.hellosign.com/v3/signature_request/{id}")).send().await
    }

    pub async fn accept_terms(&self, user: i64) -> reqwest::Result<reqwest::Response> {
        self.http
            .post(format!("{}/api/users/{user}/terms_accepted", self.base))
            .send()
            .await
    }

    pub async fn mail_envelope(&self) -> reqwest::Result<reqwest::Response> {
        self.http.post(format!("{}/api/mailroom/envelopes", self.base)).send().await
    }
}
