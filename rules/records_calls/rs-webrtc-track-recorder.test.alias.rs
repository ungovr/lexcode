// lexcode-expect: 2
use std::fs::File;
use webrtc as rtc;
use webrtc::media::io::{h264_writer, ogg_writer};

pub fn by_alias(call_id: &str) -> anyhow::Result<()> {
    let _audio = rtc::media::io::ogg_writer::OggWriter::new(File::create(format!("{call_id}.ogg"))?, 48000, 2)?;
    let _video = h264_writer::H264Writer::new(File::create(format!("{call_id}.h264"))?);
    Ok(())
}
