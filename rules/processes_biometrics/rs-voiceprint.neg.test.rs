// lexcode-expect: 0
use crate::tts::{SpeakerModel, Synthesizer};

// Speech synthesis with a chosen synthetic voice, and the app's own session check: no voiceprint.
pub fn read_aloud(text: &str) -> Vec<u8> {
    let voice = SpeakerModel::new("en-female-2");
    let mut synth = Synthesizer::default();
    synth.set_speaker_model(&voice);
    synth.speak(text)
}

// The app's own keyword extractor, named like sherpa-rs's, in a file with no `use sherpa_rs`.
pub struct EmbeddingExtractor;
impl EmbeddingExtractor {
    pub fn new(_dims: usize) -> Self {
        EmbeddingExtractor
    }
}

pub fn keywords() -> EmbeddingExtractor {
    EmbeddingExtractor::new(384)
}

pub struct Risk;
impl Risk {
    pub fn evaluate_session(&self) -> u8 {
        0
    }
}

pub fn login_risk(r: &Risk) -> u8 {
    r.evaluate_session()
}

// Speech recognition and speaker diarization in a file that names other vendors: what was said, and
// which turns belong together, without naming anyone.
pub async fn diarized_minutes(http: &reqwest::Client) -> anyhow::Result<()> {
    http.post("https://api.assemblyai.com/v2/transcript").body(r#"{"speaker_labels": true}"#).send().await?;
    Ok(())
}
