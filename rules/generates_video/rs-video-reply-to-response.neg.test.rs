// lexcode-expect: 0
// Clips only the team watches, footage a person shot that the app only trims, and a video
// host's upload client.
use async_openai::{config::OpenAIConfig, Client};
use axum::body::Body;
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::{Json, Router};

pub struct AppState {
    pub openai: Client<OpenAIConfig>,
    pub host: VideoHostClient,
    pub storage: ClipStore,
}

// A batch job: drafts of an advertisement land in a folder the marketing team reviews.
pub async fn ad_drafts(client: &Client<OpenAIConfig>, ids: Vec<String>) -> anyhow::Result<()> {
    for id in ids {
        let clip = client.videos().download_content(&id).await?;
        std::fs::write(format!("marketing/review/{id}.mp4"), &clip)?;
    }
    Ok(())
}

// Footage the person uploaded, only trimmed.
pub async fn trim(State(state): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    let footage = state.storage.load(&id).await.unwrap();
    let trimmed = cut(&footage, 0.0, 30.0);
    Body::from(trimmed).into_response()
}

// A video host's own client: `videos().create(...)` uploads the person's file.
pub async fn upload(State(state): State<AppState>, file: Vec<u8>) -> Json<String> {
    let uploaded = state.host.videos().create(NewUpload::from_bytes(file)).await.unwrap();
    Json(uploaded.id)
}

// The list of the account's clips and their status.
pub async fn list(State(state): State<AppState>) -> Json<Vec<String>> {
    let videos = state.openai.videos().list().await.unwrap();
    Json(videos.data.into_iter().map(|v| v.id).collect())
}

// Addresses under the video vendors' prefixes that make no clip: Luma's image generation, and a
// Sora job's status.
pub async fn luma_image(State(state): State<AppState>, http: reqwest::Client, body: serde_json::Value) -> Json<serde_json::Value> {
    let generation = http
        .post("https://api.lumalabs.ai/dream-machine/v1/generations/image")
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(generation)
}

pub async fn clip_status(http: reqwest::Client, Path(id): Path<String>) -> Json<serde_json::Value> {
    let status = http
        .get(format!("https://api.openai.com/v1/videos/{}", id))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(status)
}

// The video endpoint's address on a settings page.
pub async fn settings() -> Json<String> {
    Json("https://api.openai.com/v1/videos".to_string())
}
