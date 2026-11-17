// lexcode-expect: 0
// A `const` holding an address that makes no video (Luma's image endpoint), and a video address
// held in a `const` that a settings page only shows.
use axum::extract::State;
use axum::Json;

const LUMA_IMAGE: &str = "https://api.lumalabs.ai/dream-machine/v1/generations/image";
const RUNWAY_URL: &str = "https://api.dev.runwayml.com/v1/image_to_video";

pub async fn still(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let generation = http.post(LUMA_IMAGE).json(&body).send().await.unwrap().json().await.unwrap();
    Json(generation)
}

pub async fn settings() -> Json<String> {
    Json(RUNWAY_URL.to_string())
}
