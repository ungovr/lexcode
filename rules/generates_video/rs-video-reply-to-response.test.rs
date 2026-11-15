// lexcode-expect: 8
// Clips a video model made, sent back to the person who asked, one source per handler:
// async-openai's Videos API, AWS Bedrock (Nova Reel), and OpenAI's, Google's Veo, Runway's and
// Luma's HTTP endpoints, reached through grouped use lines one level deep.
use async_openai::types::videos::{CreateVideoRequestArgs, VideoSize};
use async_openai::{config::OpenAIConfig, Client};
use aws_sdk_bedrockruntime::types::AsyncInvokeOutputDataConfig;
use aws_sdk_bedrockruntime::Client as BedrockClient;
use axum::body::Body;
use axum::extract::{Path, State};
use axum::response::{IntoResponse, Response};
use axum::{Json, Router};

pub async fn start_clip(State(client): State<Client<OpenAIConfig>>, prompt: String) -> Json<String> {
    let request = CreateVideoRequestArgs::default()
        .model("sora-2")
        .prompt(prompt)
        .size(VideoSize::S1280x720)
        .build()
        .unwrap();
    let video = client.videos().create(request).await.unwrap();
    Json(video.id)
}

pub async fn clip_bytes(State(client): State<Client<OpenAIConfig>>, Path(id): Path<String>) -> Response {
    let clip = client.videos().download_content(&id).await.unwrap();
    Response::builder()
        .header("content-type", "video/mp4")
        .body(Body::from(clip))
        .unwrap()
}

pub async fn remix(State(client): State<Client<OpenAIConfig>>, Path(id): Path<String>, request: RemixVideoRequest) -> Json<String> {
    let video = client.videos().remix(&id, request).await.unwrap();
    Json(video.id)
}

pub async fn nova_reel(State(client): State<BedrockClient>, input: aws_smithy_types::Document, output: AsyncInvokeOutputDataConfig) -> Json<String> {
    let started = client
        .start_async_invoke()
        .model_id("amazon.nova-reel-v1:1")
        .model_input(input)
        .output_data_config(output)
        .send()
        .await
        .unwrap();
    Json(started.invocation_arn)
}

pub async fn sora_http(State(http): State<reqwest::Client>, Path(id): Path<String>) -> impl IntoResponse {
    let clip = http
        .get(format!("https://api.openai.com/v1/videos/{}/content", id))
        .send()
        .await
        .unwrap()
        .bytes()
        .await
        .unwrap();
    clip.into_response()
}

pub async fn veo(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let operation = http
        .post("https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning")
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(operation)
}

pub async fn runway(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let task = http
        .post("https://api.dev.runwayml.com/v1/image_to_video")
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(task)
}

pub async fn luma(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let generation = http
        .post("https://api.lumalabs.ai/dream-machine/v1/generations")
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(generation)
}
