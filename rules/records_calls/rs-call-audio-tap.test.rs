// lexcode-expect: 2
use futures::StreamExt;
use livekit::prelude::*;
use livekit::webrtc::{audio_stream::native::NativeAudioStream, prelude::*};

pub async fn listen(mut events: tokio::sync::mpsc::UnboundedReceiver<RoomEvent>) {
    while let Some(event) = events.recv().await {
        if let RoomEvent::TrackSubscribed { track: RemoteTrack::Audio(audio), participant, .. } = event {
            let mut frames = NativeAudioStream::new(audio.rtc_track(), 48000, 1);
            tokio::spawn(async move {
                while let Some(frame) = frames.next().await {
                    let _who = participant.identity();
                    let _samples = frame.data.len();
                }
            });
        }
    }
}

pub fn by_path(track: &RemoteAudioTrack) {
    let _frames = livekit::webrtc::audio_stream::native::NativeAudioStream::new(track.rtc_track(), 16000, 1);
}
