// lexcode-expect: 0
use crate::nlp::{Recognizer, Whisper, WhisperContext};
use sherpa_rs::tts::{KokoroTts, KokoroTtsConfig};

// Speech synthesis reads typed text aloud; it processes no one's voice.
pub fn speak(note: &str) -> anyhow::Result<()> {
    let mut tts = KokoroTts::new(KokoroTtsConfig::default());
    let _audio = tts.create(note, 0, 1.0)?;
    Ok(())
}

// The app's own types that share the libraries' short names, in a file that imports neither
// whisper-rs nor Vosk: a text-intent recognizer over typed commands and a gossip "whisper" channel.
pub fn typed_command(text: &str) -> Option<String> {
    let ctx = WhisperContext::new_with_params("room-7", 3);
    let rec = Recognizer::new(&ctx, 0.5);
    let mut channel = Whisper::new(ctx);
    let _builder = Whisper::builder();
    channel.post(text);
    rec.intent(text)
}
