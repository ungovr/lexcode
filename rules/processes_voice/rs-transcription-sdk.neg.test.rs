// lexcode-expect: 0
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequestArgs, Client};
use aws_sdk_polly::types::{OutputFormat, VoiceId};

// Text a person typed, read aloud: text to speech processes no one's voice.
pub async fn read_note_aloud(openai: &Client<OpenAIConfig>, polly: &aws_sdk_polly::Client, note: &str) -> anyhow::Result<()> {
    let req = CreateSpeechRequestArgs::default().input(note).build()?;
    let _mp3 = openai.audio().speech(req).await?;
    let _ogg = polly
        .synthesize_speech()
        .text(note)
        .voice_id(VoiceId::Joanna)
        .output_format(OutputFormat::OggVorbis)
        .send()
        .await?;
    Ok(())
}

pub async fn tts_by_address(http: &reqwest::Client, note: String) -> anyhow::Result<()> {
    http.post("https://api.openai.com/v1/audio/speech").body(note.clone()).send().await?;
    http.post("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM").body(note).send().await?;
    Ok(())
}

// The app's own media library: an audio track's player and a stored transcript a person typed.
pub struct Episode {
    pub title: String,
}

impl Episode {
    pub fn audio(&self) -> Player {
        Player
    }
    pub fn transcription(&self) -> Notes {
        Notes
    }
}

pub struct Player;
impl Player {
    pub fn play(&self, _volume: f32) {}
}

pub struct Notes;
impl Notes {
    pub fn save(&self, _text: &str) {}
}

pub struct Jobs;
impl Jobs {
    pub fn start_transcription_job(&self, _id: u64) {}
}

pub fn play_episode(ep: &Episode, jobs: &Jobs, typed: &str) {
    ep.audio().play(0.8);
    ep.transcription().save(typed);
    jobs.start_transcription_job(7);
}
