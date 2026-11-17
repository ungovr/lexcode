// lexcode-expect: 1
// A speech endpoint held in a `const` declared in the function.
use axum::extract::State;
use axum::response::IntoResponse;

pub async fn speak(State(http): State<reqwest::Client>, body: serde_json::Value) -> impl IntoResponse {
    const SPEECH_URL: &str = "https://api.openai.com/v1/audio/speech";
    let audio = http.post(SPEECH_URL).json(&body).send().await.unwrap().bytes().await.unwrap();
    audio.into_response()
}
