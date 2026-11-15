// lexcode-expect: 0
use std::path::PathBuf;

// The app's own writers named like webrtc-rs's, in a file that does not import webrtc: a log
// rotator and a video export of a slideshow the user built.
pub struct OggWriter {
    path: PathBuf,
}

impl OggWriter {
    pub fn new(path: &str) -> Self {
        Self { path: PathBuf::from(path) }
    }
}

pub struct H264Writer;

impl H264Writer {
    pub fn new(_slides: usize) -> Self {
        H264Writer
    }
}

pub fn export() -> (OggWriter, H264Writer) {
    (OggWriter::new("app.log"), H264Writer::new(12))
}
