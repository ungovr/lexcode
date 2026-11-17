// lexcode-expect: 2
// A video endpoint and a Nova Reel model id held in a `const` declared before the call.
use aws_sdk_bedrockruntime::types::AsyncInvokeOutputDataConfig;
use aws_sdk_bedrockruntime::Client as BedrockClient;
use axum::extract::State;
use axum::Json;

const REEL: &str = "amazon.nova-reel-v1:1";
const RUNWAY_URL: &str = "https://api.dev.runwayml.com/v1/image_to_video";

pub async fn nova_reel(State(client): State<BedrockClient>, input: aws_smithy_types::Document, output: AsyncInvokeOutputDataConfig) -> Json<String> {
    let started = client
        .start_async_invoke()
        .model_id(REEL)
        .model_input(input)
        .output_data_config(output)
        .send()
        .await
        .unwrap();
    Json(started.invocation_arn)
}

pub async fn runway(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let task = http.post(RUNWAY_URL).json(&body).send().await.unwrap().json().await.unwrap();
    Json(task)
}
