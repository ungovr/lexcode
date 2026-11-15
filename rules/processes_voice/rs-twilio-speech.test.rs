// lexcode-expect: 6
use axum::{http::header, response::IntoResponse, Form};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Inbound {
    #[serde(rename = "CallSid")]
    pub call_sid: String,
}

fn twiml(body: String) -> impl IntoResponse {
    ([(header::CONTENT_TYPE, "text/xml")], body)
}

pub async fn menu(Form(_call): Form<Inbound>) -> impl IntoResponse {
    twiml("<Response><Gather input=\"speech dtmf\" action=\"/voice/choice\"><Say>How can we help?</Say></Gather></Response>".to_string())
}

pub async fn voicemail(Form(call): Form<Inbound>) -> impl IntoResponse {
    twiml(format!(
        r#"<Response><Say>Leave a message after the tone.</Say><Record maxLength="120" action="/voice/saved/{}"/></Response>"#,
        call.call_sid
    ))
}

pub async fn short_message() -> impl IntoResponse {
    twiml("<Response><Record/></Response>".to_string())
}

pub async fn note() -> impl IntoResponse {
    twiml(r#"<Response><Gather input="speech" speechTimeout="auto"/></Response>"#.to_string())
}

pub async fn live_captions() -> impl IntoResponse {
    twiml(r#"<Response><Start><Transcription statusCallbackUrl="/voice/captions"/></Start><Dial>+15550100</Dial></Response>"#.to_string())
}

pub async fn agent() -> impl IntoResponse {
    twiml(r#"<Response><Connect><ConversationRelay url="wss://example.org/relay"/></Connect></Response>"#.to_string())
}
