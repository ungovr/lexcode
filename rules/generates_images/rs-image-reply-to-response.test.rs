// lexcode-expect: 10
// Pictures an image model made, sent back to the person who asked, one source per handler:
// async-openai, rig, mistral.rs, AWS Bedrock, and OpenAI's and Stability AI's HTTP endpoints,
// reached through grouped use lines one level deep.
use async_openai::types::{CreateImageEditRequest, CreateImageRequest, CreateImageRequestArgs, ImageSize};
use async_openai::{config::OpenAIConfig, Client};
use aws_sdk_bedrockruntime::{primitives::Blob, Client as BedrockClient};
use axum::extract::State;
use axum::response::sse::{Event, KeepAlive};
use axum::response::{Html, IntoResponse};
use axum::{Json, Router};
use futures::StreamExt;
use mistralrs::{DiffusionGenerationParams, DiffusionModelBuilder, ImageGenerationResponseFormat};
use rig::providers::openai::ImageGenerationModel;

pub async fn draw(State(client): State<Client<OpenAIConfig>>, Json(request): Json<CreateImageRequest>) -> Json<Vec<String>> {
    let response = client.images().generate(request).await.unwrap();
    Json(response.data.iter().map(|image| image_url(image)).collect())
}

pub async fn retouch(State(client): State<Client<OpenAIConfig>>, request: CreateImageEditRequest) -> impl IntoResponse {
    let response = client
        .images()
        .edit_stream(request)
        .await
        .unwrap();
    response.into_response()
}

// async-openai before 0.29: `create` with a request from its Args builder.
pub async fn draw_legacy(State(client): State<Client<OpenAIConfig>>, prompt: String) -> Json<String> {
    let request = CreateImageRequestArgs::default()
        .prompt(prompt)
        .size(ImageSize::S1024x1024)
        .build()
        .unwrap();
    let response = client.images().create(request).await.unwrap();
    Json(first_url(response))
}

// Partial images, streamed as they are drawn.
pub async fn draw_streamed(client: Client<OpenAIConfig>, request: CreateImageRequest, tx: tokio::sync::mpsc::Sender<Event>) {
    let mut stream = client.images().generate_stream(request).await.unwrap();
    while let Some(Ok(partial)) = stream.next().await {
        tx.send(Event::default().data(partial_b64(partial))).await.unwrap();
    }
}

pub async fn avatar(model: ImageGenerationModel, prompt: String) -> impl IntoResponse {
    let response = model
        .image_generation_request()
        .prompt(&prompt)
        .width(1024)
        .height(1024)
        .send()
        .await
        .unwrap();
    axum::body::Body::from(response.image)
}

pub async fn local_diffusion(prompt: String) -> Json<String> {
    let model = DiffusionModelBuilder::new("black-forest-labs/FLUX.1-schnell", mistralrs::DiffusionLoaderType::FluxOffloaded)
        .build()
        .await
        .unwrap();
    let response = model
        .generate_image(prompt, ImageGenerationResponseFormat::Url, DiffusionGenerationParams::default())
        .await
        .unwrap();
    Json(response.data[0].url.clone().unwrap_or_default())
}

pub async fn bedrock_canvas(State(client): State<BedrockClient>, body: Vec<u8>) -> Json<Vec<u8>> {
    let output = client
        .invoke_model()
        .model_id("amazon.nova-canvas-v1:0")
        .body(Blob::new(body))
        .send()
        .await
        .unwrap();
    Json(output.body.into_inner())
}

pub async fn stability(State(http): State<reqwest::Client>, form: reqwest::multipart::Form) -> impl IntoResponse {
    let bytes = http
        .post("https://api.stability.ai/v2beta/stable-image/generate/core")
        .multipart(form)
        .send()
        .await
        .unwrap()
        .bytes()
        .await
        .unwrap();
    bytes.into_response()
}

pub async fn openai_http(State(http): State<reqwest::Client>, base: String, body: serde_json::Value) -> Html<String> {
    let reply: serde_json::Value = http
        .post(format!("https://api.openai.com/v1/images/generations?user={}", base))
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Html(img_tag(reply))
}

pub async fn edit_page(State(client): State<Client<OpenAIConfig>>, request: CreateImageEditRequest) -> Json<String> {
    let response = client.images().create_edit(request).await.unwrap();
    Json(first_url(response))
}
