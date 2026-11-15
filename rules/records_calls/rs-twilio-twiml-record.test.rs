// lexcode-expect: 3
use actix_web::{post, HttpResponse};

fn xml(body: String) -> HttpResponse {
    HttpResponse::Ok().content_type("text/xml").body(body)
}

#[post("/voice/bridge")]
pub async fn bridge() -> HttpResponse {
    xml(r#"<Response><Dial record="record-from-answer-dual" recordingStatusCallback="/voice/recorded"><Number>+15550100</Number></Dial></Response>"#.to_string())
}

#[post("/voice/support")]
pub async fn support() -> HttpResponse {
    xml("<Response><Dial callerId=\"+15550199\" record=\"record-from-ringing\">+15550101</Dial></Response>".to_string())
}

#[post("/voice/standup")]
pub async fn standup(room: String) -> HttpResponse {
    xml(format!(
        r#"<Response><Dial><Conference record="record-from-start" startConferenceOnEnter="true">{room}</Conference></Dial></Response>"#
    ))
}
