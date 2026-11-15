// lexcode-expect: 0
use std::fs::File;
use std::io::BufReader;
use std::sync::Arc;
use webrtc::media::io::ogg_reader::OggReader;
use webrtc::track::track_local::track_local_static_rtp::TrackLocalStaticRTP;
use webrtc::track::track_local::TrackLocalWriter;
use webrtc::track::track_remote::TrackRemote;

// Playing a file into a call reads; it records no one.
pub fn hold_music(path: &str) -> anyhow::Result<()> {
    let (_reader, _header) = OggReader::new(BufReader::new(File::open(path)?), true)?;
    Ok(())
}

// A forwarding unit: packets from one peer's track are written to the other peers' tracks, which
// only carries the call.
pub async fn forward(remote: Arc<TrackRemote>, outbound: Arc<TrackLocalStaticRTP>) {
    while let Ok((packet, _)) = remote.read_rtp().await {
        outbound.write_rtp(&packet).await.ok();
    }
}
