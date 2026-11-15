// lexcode-expect: 0
use livekit_api::access_token::{AccessToken, VideoGrants};
use livekit_api::services::egress::{EgressClient, WebOptions};
use serde_json::json;

// Carrying a call without keeping it: a LiveKit join token, a Daily room with recording off, a
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
) -> anyhow::Result<()> {
    http.post("https://api.daily.co/v1/rooms")
        .json(&json!({ "properties": { "enable_recording": false, "enable_chat": true } }))
        .send()
        .await?;
    meetings.create_meeting().client_request_token("t-1").send().await?;
    http.post("https://api.zoom.us/v2/users/me/meetings").send().await?;
    Ok(())
}

// The app's own job queue, whose method takes the job's name.
pub struct Jobs;
impl Jobs {
    pub fn start_track_egress(&self) {}
    pub fn start_contact_recording(&self, _name: &str) {}
}

pub fn queue(jobs: &Jobs) {
    jobs.start_contact_recording("weekly");
}
