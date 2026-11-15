// lexcode-expect: 0
// The app's own Json, Body and CreateImageRequestArgs, in a file without axum's or the request
// type's use lines. A generated picture put in the app's own Json goes to the team's audit log.
use async_openai::{config::OpenAIConfig, Client};

pub struct Json<T>(pub T);
pub struct Body(pub Vec<u8>);

#[derive(Default)]
pub struct CreateImageRequestArgs {
    pub caption: String,
}

pub struct AuditLog;

impl AuditLog {
    pub fn record<T>(&self, _entry: T) {}
}

pub async fn audit_preview(client: &Client<OpenAIConfig>, request: async_openai::types::CreateImageRequest, log: &AuditLog) {
    let response = client.images().generate(request).await.unwrap();
    log.record(Json(response.created));
    log.record(Body(response.data.len().to_be_bytes().to_vec()));
}

// The app's own gallery: `images().create(...)` with a request type of the same short name.
// Its reply is a real axum response, written with the full path.
pub async fn add_to_gallery(gallery: &Gallery) -> axum::Json<String> {
    let entry = CreateImageRequestArgs::default();
    let stored = gallery.images().create(entry).await;
    axum::Json(stored.id)
}
