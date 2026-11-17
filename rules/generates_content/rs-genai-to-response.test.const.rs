// lexcode-expect: 1
// Gemini's generateContent address held in a `const` declared before the call.
use axum::extract::State;
use axum::Json;

const GENERATE: &str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

pub async fn generate(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let reply = http.post(GENERATE).json(&body).send().await.unwrap().json().await.unwrap();
    Json(reply)
}
