// lexcode-expect: 8
// Speech and sound a model made, sent back to the person who asked, one source per handler:
// async-openai (both API generations), rig, mistral.rs, Amazon Polly, and OpenAI's and
// ElevenLabs' HTTP endpoints, reached through grouped use lines one level deep.
use async_openai::types::{CreateSpeechRequest, SpeechModel, Voice};
use async_openai::{config::OpenAIConfig, Client};
use aws_sdk_polly::types::{OutputFormat, VoiceId};
use axum::body::Body;
use axum::extract::State;
use axum::extract::ws::{Message, WebSocket};
use axum::response::{IntoResponse, Response};
use futures::StreamExt;
use mistralrs::{SpeechLoaderType, SpeechModelBuilder};
use rig::providers::openai::AudioGenerationModel;

pub async fn narrate(State(client): State<Client<OpenAIConfig>>, request: CreateSpeechRequest) -> impl IntoResponse {
    let speech = client.audio().speech().create(request).await.unwrap();
    speech.bytes.into_response()
}

// async-openai before 0.29: `audio().speech(request)`.
pub async fn narrate_legacy(State(client): State<Client<OpenAIConfig>>, request: CreateSpeechRequest) -> Response {
    let speech = client.audio().speech(request).await.unwrap();
    Response::builder()
        .header("content-type", "audio/mpeg")
        .body(Body::from(speech.bytes))
        .unwrap()
}

// Speech streamed over a socket as it is made.
pub async fn narrate_live(client: Client<OpenAIConfig>, request: CreateSpeechRequest, mut socket: WebSocket) {
    let mut stream = client.audio().speech().create_stream(request).await.unwrap();
    while let Some(Ok(chunk)) = stream.next().await {
        socket.send(Message::Binary(audio_delta(chunk))).await.unwrap();
    }
}

pub async fn rig_voice(model: AudioGenerationModel, text: String) -> impl IntoResponse {
    let response = model
        .audio_generation_request()
        .text(&text)
        .voice("alloy")
        .send()
        .await
        .unwrap();
    response.audio.into_response()
}

pub async fn local_voice(text: String) -> impl IntoResponse {
    let model = SpeechModelBuilder::new("nari-labs/Dia-1.6B", SpeechLoaderType::Dia).build().await.unwrap();
    let (pcm, rate, channels) = model.generate_speech(text).await.unwrap();
    wav_bytes(pcm, rate, channels).into_response()
}

pub async fn polly(State(client): State<aws_sdk_polly::Client>, text: String) -> impl IntoResponse {
    let output = client
        .synthesize_speech()
        .text(text)
        .voice_id(VoiceId::Joanna)
        .output_format(OutputFormat::Mp3)
        .send()
        .await
        .unwrap();
    let audio = output.audio_stream.collect().await.unwrap().into_bytes();
    Body::from(audio)
}

pub async fn elevenlabs(State(http): State<reqwest::Client>, voice: String, body: serde_json::Value) -> impl IntoResponse {
    let audio = http
        .post(&format!("https://api.elevenlabs.io/v1/text-to-speech/{}", voice))
        .json(&body)
        .send()
        .await
        .unwrap()
        .bytes()
        .await
        .unwrap();
    audio.into_response()
}

pub async fn openai_http(State(http): State<reqwest::Client>, body: serde_json::Value) -> impl IntoResponse {
    let audio = http
        .post("https://api.openai.com/v1/audio/speech")
        .json(&body)
        .send()
        .await
        .unwrap()
        .bytes()
        .await
        .unwrap();
    Body::from(audio)
}
