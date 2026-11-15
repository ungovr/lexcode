// lexcode-expect: 3
use std::fs::File;
use std::sync::Arc;
use tokio::sync::Mutex;
use webrtc::media::io::h264_writer::H264Writer;
use webrtc::media::io::ogg_writer::OggWriter;
use webrtc::media::io::Writer;
use webrtc::peer_connection::RTCPeerConnection;
use webrtc::track::track_remote::TrackRemote;

pub fn writers(call_id: &str) -> anyhow::Result<(Arc<Mutex<dyn Writer + Send + Sync>>, Arc<Mutex<dyn Writer + Send + Sync>>)> {
    let audio = OggWriter::new(File::create(format!("{call_id}.ogg"))?, 48000, 2)?;
    let video = H264Writer::new(File::create(format!("{call_id}.h264"))?);
    Ok((Arc::new(Mutex::new(audio)), Arc::new(Mutex::new(video))))
}

pub async fn save(pc: Arc<RTCPeerConnection>, writer: Arc<Mutex<dyn Writer + Send + Sync>>) {
    pc.on_track(Box::new(move |track: Arc<TrackRemote>, _, _| {
        let writer = Arc::clone(&writer);
        Box::pin(async move {
            while let Ok((packet, _)) = track.read_rtp().await {
                writer.lock().await.write_rtp(&packet).ok();
            }
        })
    }));
}

pub fn nested() -> anyhow::Result<()> {
    use webrtc::media::io::{ivf_writer::IVFWriter, ivf_reader::IVFFileHeader};
    let _ivf = IVFWriter::new(File::create("call.ivf")?, &IVFFileHeader::default())?;
    Ok(())
}
