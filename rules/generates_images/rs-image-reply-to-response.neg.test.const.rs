// lexcode-expect: 0
// A `const` holding an address that makes no image (the account balance), and an image model id
// held in a `const` that a settings page only shows.
use axum::extract::State;
use axum::Json;

const BALANCE: &str = "https://api.stability.ai/v1/user/balance";
const CANVAS: &str = "amazon.nova-canvas-v1:0";

pub async fn balance(State(http): State<reqwest::Client>) -> Json<serde_json::Value> {
    let credits = http.get(BALANCE).send().await.unwrap().json().await.unwrap();
    Json(credits)
}

pub async fn settings() -> Json<String> {
    Json(CANVAS.to_string())
}
