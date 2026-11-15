// lexcode-expect: 0
// The app's own Json and Html, in a file without axum's use lines. Gemini output put in them goes
// to the team's audit log.
use gemini_rust::Gemini;

pub struct Json<T>(pub T);
pub struct Html<T>(pub T);

pub struct AuditLog;

impl AuditLog {
    pub fn record<T>(&self, _entry: T) {}
}

pub async fn audit_answer(gemini: &Gemini, prompt: String, log: &AuditLog) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    log.record(Json(response.text()));
    log.record(Html(response.text()));
}
