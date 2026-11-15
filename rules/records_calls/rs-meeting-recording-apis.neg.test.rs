// lexcode-expect: 0
use livekit_api::access_token::{AccessToken, VideoGrants};
use livekit_api::services::egress::{EgressClient, WebOptions};
use serde_json::json;

// Carrying a call without keeping it, and Transcribe call analytics, which the controller placed
// under processes_voice only: a LiveKit join token, a Daily room with recording off, a
// Chime meeting created, a Zoom meeting scheduled. A web egress records a web page, not the room.
pub async fn join(egress: &EgressClient, room: &str, user: &str) -> anyhow::Result<String> {
    let token = AccessToken::with_api_key("key", "secret")
        .with_identity(user)
        .with_grants(VideoGrants { room_join: true, room: room.to_string(), ..Default::default() })
        .to_jwt()?;
    egress.start_web_egress("https://example.org/scoreboard", vec![], WebOptions::default()).await?;
    Ok(token)
}

pub async fn rooms(
    http: &reqwest::Client,
    meetings: &aws_sdk_chimesdkmeetings::Client,
    transcribe: &aws_sdk_transcribe::Client,
) -> anyhow::Result<()> {
    http.post("https://api.daily.co/v1/rooms")
        .json(&json!({ "properties": { "enable_recording": false, "enable_chat": true } }))
        .send()
        .await?;
    meetings.create_meeting().client_request_token("t-1").send().await?;
    http.post("https://api.zoom.us/v2/users/me/meetings").send().await?;
    transcribe.start_call_analytics_job().call_analytics_job_name("call-1").send().await?;
    Ok(())
}

// The app's own job queue, whose method takes the job's name. The AWS patterns are zero-argument
// builder starts, so a same-named app method with an argument does not match (the negative leans on
// arity, not on a guard).
pub struct Jobs;
impl Jobs {
    pub fn start_contact_recording(&self, _name: &str) {}
}

pub fn queue(jobs: &Jobs) {
    jobs.start_contact_recording("weekly");
}
