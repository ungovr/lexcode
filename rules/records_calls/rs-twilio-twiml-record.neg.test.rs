// lexcode-expect: 0
use actix_web::{post, HttpResponse};

// A call the app only connects, with recording off or unset, and a conference without recording.
#[post("/voice/forward")]
pub async fn forward() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/xml")
        .body(r#"<Response><Dial record="do-not-record" timeout="20"><Number>+15550100</Number></Dial></Response>"#)
}

#[post("/voice/room")]
pub async fn room() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/xml")
        .body("<Response><Dial><Conference startConferenceOnEnter=\"true\">team</Conference></Dial></Response>")
}

// The app's own dialer settings, which say nothing about Twilio.
pub struct Dial {
    pub record: bool,
}

pub fn settings() -> Dial {
    Dial { record: true }
}
