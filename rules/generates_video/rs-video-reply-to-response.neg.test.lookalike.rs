// lexcode-expect: 0
// The app's own Json and CreateVideoRequestArgs, in a file without axum's or the request type's
// use lines.
// async-openai is named by its full path, with no use line.

pub struct Json<T>(pub T);

#[derive(Default)]
pub struct CreateVideoRequestArgs {
    pub title: String,
}

pub struct AuditLog;

impl AuditLog {
    pub fn record<T>(&self, _entry: T) {}
}

// A generated clip's bytes, counted in the team's audit log through the app's own Json.
pub async fn audit_clip(client: &async_openai::Client<async_openai::config::OpenAIConfig>, id: String, log: &AuditLog) {
    let clip = client.videos().download_content(&id).await.unwrap();
    log.record(Json(clip.len()));
}

// The app's own library: `videos().create(...)` with a request type of the same short name, and
// a real axum response written with the full path.
pub async fn add_to_library(library: &Library) -> axum::Json<String> {
    let entry = CreateVideoRequestArgs::default();
    let stored = library.videos().create(entry).await;
    axum::Json(stored.id)
}
