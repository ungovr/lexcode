// lexcode-expect: 0
// A `const` holding an address that makes no audio (ElevenLabs' voice list), and a speech address
// held in a `const` that a settings page only shows.
use axum::extract::State;
use axum::Json;

const VOICES: &str = "https://api.elevenlabs.io/v1/voices";
const SPEECH_URL: &str = "https://api.openai.com/v1/audio/speech";

pub async fn voices(State(http): State<reqwest::Client>) -> Json<serde_json::Value> {
    let list = http.get(VOICES).send().await.unwrap().json().await.unwrap();
    Json(list)
}

pub async fn settings() -> Json<String> {
    Json(SPEECH_URL.to_string())
}
