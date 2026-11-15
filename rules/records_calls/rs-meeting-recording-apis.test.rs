// lexcode-expect: 15
use livekit_api::services::egress::{EgressClient, EgressOutput, RoomCompositeOptions};
use livekit_protos::EncodedFileOutput;
use serde_json::json;

pub async fn record_room(egress: &EgressClient, room: &str) -> anyhow::Result<()> {
    let out = EgressOutput::File(EncodedFileOutput { filepath: format!("{room}.mp4"), ..Default::default() });
    egress
        .start_room_composite_egress(room, vec![out.clone()], RoomCompositeOptions::default())
        .await?;
    egress.start_participant_egress(room, "alice", vec![out], Default::default()).await?;
    egress.start_track_egress(room, "TR_abc", Default::default()).await?;
    egress.start_track_composite_egress(room, Default::default(), Default::default()).await?;
    Ok(())
}

pub async fn aws(
    chime: &aws_sdk_chimesdkmediapipelines::Client,
    meetings: &aws_sdk_chimesdkmeetings::Client,
    connect: &aws_sdk_connect::Client,
    meeting_arn: &str,
) -> anyhow::Result<()> {
    chime
        .create_media_capture_pipeline()
        .source_arn(meeting_arn)
        .send()
        .await?;
    meetings.start_meeting_transcription().meeting_id("m-1").send().await?;
    connect.start_contact_recording().instance_id("i-1").contact_id("c-1").send().await?;
    chime.create_media_insights_pipeline().media_insights_pipeline_configuration_arn("arn:cfg").send().await?;
    Ok(())
}

pub async fn zoom_and_bots(http: &reqwest::Client, meeting_id: u64, url: &str) -> anyhow::Result<()> {
    let recordings = format!("https://api.zoom.us/v2/meetings/{meeting_id}/recordings");
    http.get(recordings).send().await?;
    http.post("https://us-west-2.recall.ai/api/v1/bot/")
        .json(&json!({ "meeting_url": url, "bot_name": "Notetaker" }))
        .send()
        .await?;
    http.post("https://api.daily.co/v1/rooms")
        .json(&json!({ "properties": { "enable_recording": "cloud" } }))
        .send()
        .await?;
    http.post("https://video.twilio.com/v1/Compositions").send().await?;
    http.post("https://api.meetingbaas.com/bots").send().await?;
    http.post("https://app.attendee.dev/api/v1/bots").send().await?;
    let start = format!("https://api.agora.io/v1/apps/{}/cloud_recording/resourceid/{}/mode/mix/start", "app", "rid");
    http.post(start).send().await?;
    Ok(())
}
