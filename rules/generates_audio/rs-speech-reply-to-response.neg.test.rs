// lexcode-expect: 0
// Speech only the team hears, a person's own recording played back or transcribed, and speech
// calls that make no sound.
use async_openai::types::{CreateSpeechRequest, CreateTranscriptionRequest};
use async_openai::{config::OpenAIConfig, Client};
use axum::body::Body;
use axum::extract::State;
use axum::response::IntoResponse;
use axum::{Json, Router};

pub struct AppState {
    pub openai: Client<OpenAIConfig>,
    pub polly: aws_sdk_polly::Client,
    pub recordings: RecordingStore,
}

// A build step: the release-notes narration lands in a folder the team checks before launch.
pub async fn narrate_release_notes(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> anyhow::Result<()> {
    let speech = client.audio().speech().create(request).await?;
    speech.save("build/review/release-notes.mp3").await?;
    std::fs::write("build/review/release-notes.len", speech.bytes.len().to_string())?;
    Ok(())
}

// The person's own recording, transcribed: their words, read (processes_voice).
pub async fn transcribe(State(state): State<AppState>, request: CreateTranscriptionRequest) -> Json<String> {
    let transcript = state.openai.audio().transcription().create(request).await.unwrap();
    Json(transcript.text)
}

// The person's own voice memo, played back as recorded.
pub async fn play_memo(State(state): State<AppState>, id: String) -> impl IntoResponse {
    let memo = state.recordings.load(&id).await.unwrap();
    Body::from(memo).into_response()
}

// The voices a person can choose from.
pub async fn voices(State(state): State<AppState>) -> Json<Vec<String>> {
    let list = state.polly.describe_voices().send().await.unwrap();
    Json(voice_names(list))
}

// The text-to-speech address on a settings page.
pub async fn settings() -> Json<String> {
    Json("https://api.elevenlabs.io/v1/text-to-speech".to_string())
}
