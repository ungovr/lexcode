// lexcode-expect: 26
use async_openai::{config::OpenAIConfig, Client};
use aws_sdk_transcribe::types::{LanguageCode, Media};
use aws_sdk_transcribestreaming::types::{AudioStream, LanguageCode as StreamLanguage};
use deepgram::common::options::{Language, Options};
use deepgram::Deepgram;
use openai_api_rs::v1::api::OpenAIClient;

pub struct Transcriber {
    transcribe: aws_sdk_transcribe::Client,
    streaming: aws_sdk_transcribestreaming::Client,
    openai: Client<OpenAIConfig>,
    dg: Deepgram,
}

impl Transcriber {
    pub async fn batch(&self, key: &str) -> anyhow::Result<()> {
        self.transcribe
            .start_transcription_job()
            .transcription_job_name(key)
            .media(Media::builder().media_file_uri(format!("s3://calls/{key}")).build())
            .language_code(LanguageCode::EnUs)
            .send()
            .await?;
        self.transcribe.start_medical_transcription_job().send().await?;
        self.transcribe.start_call_analytics_job().send().await?;
        self.transcribe.start_medical_scribe_job().send().await?;
        Ok(())
    }

    pub async fn live(&self, input: AudioStream) -> anyhow::Result<()> {
        let _out = self
            .streaming
            .start_stream_transcription()
            .language_code(StreamLanguage::EnUs)
            .media_sample_rate_hertz(16000)
            .send()
            .await?;
        self.streaming.start_medical_stream_transcription().send().await?;
        self.streaming.start_call_analytics_stream_transcription().send().await?;
        Ok(())
    }

    pub async fn whisper(&self, req: async_openai::types::CreateTranscriptionRequest) -> anyhow::Result<String> {
        let res = self.openai.audio().transcribe(req.clone()).await?;
        let _raw = self.openai.audio().transcribe_raw(req.clone()).await?;
        let _en = self.openai.audio().translate(req.into()).await?;
        let _new = self
            .openai
            .audio()
            .transcription()
            .create(Default::default())
            .await?;
        Ok(res.text)
    }

    pub async fn deepgram(&self, path: &str) -> anyhow::Result<()> {
        let options = Options::builder().language(Language::en).build();
        let _r = self.dg.transcription().prerecorded(path.into(), &options).await?;
        let _live = self.dg.transcription().stream_request().keep_alive();
        Ok(())
    }
}

pub async fn other_clients(oai: &mut OpenAIClient, req: openai_api_rs::v1::audio::AudioTranscriptionRequest) -> anyhow::Result<()> {
    let _r = oai.audio_transcription(req).await?;
    let _en = oai.audio_translation(Default::default()).await?;
    Ok(())
}

pub async fn by_address(http: &reqwest::Client, audio: Vec<u8>, id: &str) -> anyhow::Result<()> {
    http.post("https://api.assemblyai.com/v2/upload").body(audio.clone()).send().await?;
    let _poll = format!("https://api.assemblyai.com/v2/transcript/{id}");
    http.post("https://api.deepgram.com/v1/listen?model=nova-2").body(audio).send().await?;
    http.post("https://api.rev.ai/speechtotext/v1/jobs").send().await?;
    http.post("https://asr.api.speechmatics.com/v2/jobs/").send().await?;
    http.post("https://api.gladia.io/v2/pre-recorded").send().await?;
    http.post("https://api.elevenlabs.io/v1/speech-to-text").send().await?;
    http.post("https://speech.googleapis.com/v1/speech:recognize").send().await?;
    http.post("https://westus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1").send().await?;
    http.post("https://westus.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions").send().await?;
    http.post("http://localhost:8000/v1/audio/translations").send().await?;
    Ok(())
}
