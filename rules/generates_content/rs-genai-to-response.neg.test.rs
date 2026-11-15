// lexcode-expect: 0
// Gemini output only the team reads, Gemini calls that generate nothing, and a person's own text.
use axum::extract::State;
use axum::{Json, Router};
use gemini_rust::Gemini;

pub struct AppState {
    pub gemini: Gemini,
    pub http: reqwest::Client,
}

// A nightly job: the model's triage notes go to the team's log and a local file.
pub async fn triage_notes(gemini: &Gemini, issues: String) -> anyhow::Result<()> {
    let response = gemini.generate_content().with_user_message(issues).execute().await?;
    let notes = response.text();
    tracing::info!(len = notes.len(), "triage notes written");
    std::fs::write("ops/triage/notes.md", notes)?;
    Ok(())
}

// Token counting and embeddings answer about the text; they write nothing a person reads.
pub async fn count(State(state): State<AppState>, body: serde_json::Value) -> Json<serde_json::Value> {
    let counted = state
        .http
        .post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:countTokens")
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(counted)
}

pub async fn embed(State(state): State<AppState>, body: serde_json::Value) -> Json<serde_json::Value> {
    let vectors = state
        .http
        .post("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent")
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(vectors)
}

// Text the person wrote, only trimmed.
pub async fn echo(Json(text): Json<String>) -> Json<String> {
    Json(text.trim().to_string())
}

// The endpoint's address on a settings page.
pub async fn settings() -> Json<String> {
    Json("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent".to_string())
}
