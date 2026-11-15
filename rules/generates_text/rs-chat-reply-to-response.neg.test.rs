// lexcode-expect: 0
// Model output that only the team reads, and responses no model wrote.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateChatCompletionRequest, CreateEmbeddingRequest, CreateTranscriptionRequest},
    Client,
};
use axum::{extract::State, Json};
use ollama_rs::generation::completion::request::GenerationRequest;
use std::fs;

pub struct AppState {
    pub openai: Client<OpenAIConfig>,
    pub passwords: PasswordGenerator,
}

// A command a maintainer runs: the model's digest goes to a local file and the log.
pub async fn weekly_digest(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> anyhow::Result<()> {
    let response = client.chat().create(request).await?;
    let digest = response.choices[0].message.content.clone().unwrap_or_default();
    fs::write("scripts/out/weekly-digest.md", &digest)?;
    tracing::info!(len = digest.len(), "digest written");
    Ok(())
}

// The same digest posted to the team's own chat channel through a webhook: reqwest's `.json(...)`
// and `.body(...)` build an outgoing request, not a response.
pub async fn post_digest(http: &reqwest::Client, client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> anyhow::Result<()> {
    let response = client.chat().create(request).await?;
    let digest = response.choices[0].message.content.clone().unwrap_or_default();
    http.post(std::env::var("TEAM_WEBHOOK_URL")?).json(&digest).send().await?;
    http.post(std::env::var("TEAM_LOG_URL")?).body(digest).send().await?;
    Ok(())
}

// Embeddings are vectors for search, not text a person reads.
pub async fn embed(State(state): State<AppState>, request: CreateEmbeddingRequest) -> Json<Vec<f32>> {
    let response = state.openai.embeddings().create(request).await.unwrap();
    Json(response.data[0].embedding.clone())
}

// A transcript is the person's own words, read from their recording (processes_voice).
pub async fn transcribe(State(state): State<AppState>, request: CreateTranscriptionRequest) -> Json<String> {
    let transcript = state.openai.audio().transcription().create(request).await.unwrap();
    Json(transcript.text)
}

// The list of models the account can use.
pub async fn models(State(state): State<AppState>) -> Json<Vec<String>> {
    let list = state.openai.models().list().await.unwrap();
    Json(list.data.into_iter().map(|m| m.id).collect())
}

// The request a model would be sent is not its output.
pub async fn preview_request(prompt: String) -> Json<String> {
    let request = GenerationRequest::new("llama3".to_string(), prompt);
    Json(request.prompt)
}

// `generate` and `prompt` on the app's own types call no model.
pub async fn new_password(State(state): State<AppState>) -> Json<String> {
    let password = state.passwords.generate(PasswordOptions::default());
    Json(password)
}

pub async fn ask_name(term: Terminal) -> Json<String> {
    let name = term.prompt("Your name?");
    Json(name)
}

// Text a person wrote, only trimmed.
pub async fn save_note(Json(note): Json<String>) -> Json<String> {
    Json(note.trim().to_string())
}
