// lexcode-expect: 7
use reqwest::{multipart, Client, Method};
use serde_json::json;
use ureq as u;

pub struct Signing {
    http: Client,
    base: String,
    account: String,
    token: String,
}

impl Signing {
    pub async fn send_lease(&self, pdf_b64: &str, email: &str) -> reqwest::Result<serde_json::Value> {
        self.http
            .post(format!("{}/restapi/v2.1/accounts/{}/envelopes", self.base, self.account))
            .bearer_auth(&self.token)
            .json(&json!({
                "emailSubject": "Please sign your lease",
                "documents": [{ "documentBase64": pdf_b64, "name": "Lease", "documentId": "1" }],
                "recipients": { "signers": [{ "email": email, "recipientId": "1" }] },
                "status": "sent"
            }))
            .send()
            .await?
            .json()
            .await
    }

    pub async fn signing_view(&self, envelope: &str) -> reqwest::Result<reqwest::Response> {
        self.http
            .post(format!("https://demo.docusign.net/restapi/v2.1/accounts/{}/envelopes/{envelope}/views/recipient", self.account))
            .send()
            .await
    }

    pub async fn dropbox_sign(&self, form: multipart::Form) -> reqwest::Result<reqwest::Response> {
        self.http
            .post("https://api.hellosign.com/v3/signature_request/send")
            .basic_auth(&self.token, Some(""))
            .multipart(form)
            .send()
            .await
    }

    pub async fn embedded(&self) -> reqwest::Result<reqwest::Response> {
        self.http.request(Method::POST, r#"https://api.hellosign.com/v3/signature_request/create_embedded"#).send().await
    }

    pub fn boldsign(&self, body: serde_json::Value) -> Result<u::Response, u::Error> {
        u::post("https://api.boldsign.com/v1/document/send").send_json(body)
    }

    pub fn adobe(&self) -> http::Request<String> {
        http::Request::builder()
            .method("POST")
            .uri("https://api.na1.adobesign.com/api/rest/v6/agreements")
            .body(String::new())
            .unwrap()
    }

    pub async fn template(&self) -> reqwest::Result<reqwest::Response> {
        self.http.post("https://api.boldsign.com/v1/template/send?templateId=t1").send().await
    }
}
