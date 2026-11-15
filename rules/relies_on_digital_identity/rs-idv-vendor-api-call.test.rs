// lexcode-expect: 8
use reqwest::{header::AUTHORIZATION, Client, Method};
use serde_json::json;
use url::Url;
use ureq as u;

pub struct Kyc {
    http: Client,
    key: String,
}

impl Kyc {
    pub async fn start_inquiry(&self, template: &str) -> reqwest::Result<serde_json::Value> {
        self.http
            .post("https://withpersona.com/api/v1/inquiries")
            .header(AUTHORIZATION, format!("Bearer {}", self.key))
            .json(&json!({ "data": { "attributes": { "inquiry-template-id": template } } }))
            .send()
            .await?
            .json()
            .await
    }

    pub async fn applicant(&self, id: &str) -> reqwest::Result<String> {
        self.http.get(format!("https://api.onfido.com/v3.6/applicants/{id}")).send().await?.text().await
    }

    pub async fn veriff_session(&self) -> reqwest::Result<reqwest::Response> {
        self.http.request(Method::POST, r#"https://stationapi.veriff.com/v1/sessions"#).send().await
    }

    pub async fn stripe_identity(&self) -> reqwest::Result<reqwest::Response> {
        self.http
            .post("https://api.stripe.com/v1/identity/verification_sessions")
            .basic_auth(&self.key, None::<&str>)
            .form(&[("type", "document")])
            .send()
            .await
    }

    pub fn sumsub_base(&self) -> Url {
        Url::parse("https://api.sumsub.com/resources/applicants").unwrap()
    }

    pub fn yoti(&self) -> Result<u::Response, u::Error> {
        u::post("https://api.yoti.com/idverify/v1/sessions").call()
    }

    pub async fn hyper_request(&self) -> http::Request<String> {
        http::Request::builder()
            .method("POST")
            .uri("https://api.idenfy.com/api/v2/token")
            .body(String::new())
            .unwrap()
    }

    pub async fn blocking(&self) -> reqwest::Result<reqwest::blocking::Response> {
        reqwest::blocking::get("https://netverify.com/api/v4/scans")
    }
}
