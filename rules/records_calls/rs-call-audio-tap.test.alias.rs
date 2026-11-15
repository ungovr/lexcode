// lexcode-expect: 1
use livekit as lk;

pub fn by_alias(track: &lk::track::RemoteAudioTrack) {
    let _frames = lk::webrtc::audio_stream::native::NativeAudioStream::new(track.rtc_track(), 48000, 1);
}
