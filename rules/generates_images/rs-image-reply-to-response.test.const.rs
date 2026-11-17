// lexcode-expect: 2
// An image endpoint and a Nova Canvas model id held in a `const` declared before the call.
use aws_sdk_bedrockruntime::{primitives::Blob, Client as BedrockClient};
use axum::extract::State;
use axum::Json;

const CANVAS: &str = "amazon.nova-canvas-v1:0";

pub async fn canvas(State(client): State<BedrockClient>, body: Vec<u8>) -> Json<Vec<u8>> {
    let output = client
        .invoke_model()
        .model_id(CANVAS)
        .body(Blob::new(body))
        .send()
        .await
        .unwrap();
    Json(output.body.into_inner())
}

pub struct Stability {
    http: reqwest::Client,
}

impl Stability {
    const CORE: &'static str = "https://api.stability.ai/v2beta/stable-image/generate/core";

    pub async fn generate(&self, form: reqwest::multipart::Form) -> Json<serde_json::Value> {
        let image = self.http.post(Self::CORE).multipart(form).send().await.unwrap().json().await.unwrap();
        Json(image)
    }
}
