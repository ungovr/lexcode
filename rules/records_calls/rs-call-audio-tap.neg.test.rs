// lexcode-expect: 0
use crate::audio::NativeAudioStream;

// Publishing the app's own audio into a call carries it; reading nothing from the others.
pub async fn publish(room: &livekit::Room) -> anyhow::Result<()> {
    let source = livekit::webrtc::audio_source::native::NativeAudioSource::new(Default::default(), 48000, 1, 100);
    let track = livekit::track::LocalAudioTrack::create_audio_track("mic", livekit::webrtc::audio_source::RtcAudioSource::Native(source));
    room.local_participant().publish_track(livekit::track::LocalTrack::Audio(track), Default::default()).await?;
    Ok(())
}

// The app's own audio stream type of the same name, in a file with no `use` of livekit.
pub fn local_player() {
    let _s = NativeAudioStream::new("hold-music.wav");
}
