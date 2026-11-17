// lexcode-expect: 0
// A `const` holding a Gemini address that generates nothing (countTokens), and a generateContent
// address held in a `const` that a settings page only shows.
use axum::extract::State;
use axum::Json;

const COUNT: &str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:countTokens";
const GENERATE: &str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

pub async fn count(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let tokens = http.post(COUNT).json(&body).send().await.unwrap().json().await.unwrap();
    Json(tokens)
}

pub async fn settings() -> Json<String> {
    Json(GENERATE.to_string())
}
