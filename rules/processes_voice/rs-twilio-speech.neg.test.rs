// lexcode-expect: 0
use axum::{http::header, response::IntoResponse};

pub struct Record {
    pub id: i64,
}

pub struct Transcription {
    pub text: String,
}

// Typed text read to the caller, a keypad menu, and the app's own record types as type arguments.
pub async fn greeting() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "text/xml")],
        r#"<Response><Say voice="alice">Thanks for calling.</Say><Gather input="dtmf" numDigits="1"/><Play>https://example.org/hold.mp3</Play></Response>"#,
    )
}

pub fn records(rows: Vec<Record>) -> Option<Vec<Transcription>> {
    let kept: Vec<Record> = rows.into_iter().filter(|r| r.id > 0).collect();
    let _first: Option<Record> = kept.into_iter().next();
    None::<Vec<Transcription>>
}
