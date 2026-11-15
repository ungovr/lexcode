// lexcode-expect: 0
// The app's own types named like sherpa-rs's, in a file with no `use sherpa_rs`: a zip archive
// writer and a feature-flag rollout ("diarize" meaning split into cohorts).
pub struct ZipFormer {
    level: u8,
}

impl ZipFormer {
    pub fn new(level: u8) -> Self {
        Self { level }
    }
}

pub struct Diarize;

impl Diarize {
    pub fn new(_cohorts: usize) -> Self {
        Diarize
    }
}

pub fn pack() -> (ZipFormer, Diarize) {
    (ZipFormer::new(9), Diarize::new(4))
}
