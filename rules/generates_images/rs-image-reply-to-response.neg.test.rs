// lexcode-expect: 0
// Pictures only the team sees, pictures a person made that the app only resizes, and image
// calls that draw nothing.
use async_openai::types::{CreateChatCompletionRequest, CreateImageRequest};
use async_openai::{config::OpenAIConfig, Client};
use axum::body::Body;
use axum::extract::State;
use axum::response::IntoResponse;
use axum::{Json, Router};

pub struct AppState {
    pub openai: Client<OpenAIConfig>,
    pub cms: CmsClient,
    pub http: reqwest::Client,
}

// A batch job a designer runs: drafts land in a folder the design team reviews.
pub async fn draft_banners(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> anyhow::Result<()> {
    let response = client.images().generate(request).await?;
    response.save("design/review/banners").await?;
    tracing::info!(count = response.data.len(), "banner drafts saved for review");
    Ok(())
}

// A photograph the person uploaded, only resized.
pub async fn thumbnail(bytes: axum::body::Bytes) -> impl IntoResponse {
    let photo = image::load_from_memory(&bytes).unwrap();
    let small = photo.thumbnail(256, 256);
    let mut out = Vec::new();
    small.write_to(&mut std::io::Cursor::new(&mut out), image::ImageFormat::Png).unwrap();
    Body::from(out).into_response()
}

// A vision model describing a picture writes text, not a picture.
pub async fn describe(State(state): State<AppState>, request: CreateChatCompletionRequest) -> Json<String> {
    let response = state.openai.chat().create(request).await.unwrap();
    Json(response.choices[0].message.content.clone().unwrap_or_default())
}

// A CMS client's own `images().create(...)` uploads the person's file.
pub async fn upload(State(state): State<AppState>, file: Vec<u8>) -> Json<String> {
    let stored = state.cms.images().create(NewImage::from_bytes(file)).await.unwrap();
    Json(stored.url)
}

// The account's remaining credit on the image service, and its address on a settings page.
pub async fn balance(State(state): State<AppState>) -> Json<serde_json::Value> {
    let credit = state
        .http
        .get("https://api.stability.ai/v1/user/balance")
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(credit)
}

pub async fn settings() -> Json<String> {
    Json("https://api.stability.ai/v2beta/stable-image/generate/core".to_string())
}
