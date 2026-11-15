// lexcode-expect: 16
// Text a model wrote, sent back to the person who asked, one source per handler: async-openai,
// rig, ollama-rs, genai, mistral.rs, llama.cpp and AWS Bedrock, reached through grouped use lines.
// The engine resolves a group one level deep (`use a::b::{C, D}`); an item written with a path
// inside a group (`use a::{b::C}`) is not resolved (rules/README.md), so the crate items the rule
// names are imported at their own level here.
use async_openai::types::{CreateChatCompletionRequest, CreateCompletionRequest, CreateResponse};
use async_openai::{config::OpenAIConfig, Client};
use aws_sdk_bedrockruntime::{primitives::Blob, Client as BedrockClient};
use axum::extract::State;
use axum::response::sse::{Event, KeepAlive};
use axum::response::IntoResponse;
use axum::{Json, Router};
use futures::StreamExt;
use genai::{chat::ChatRequest, Client as GenaiClient};
use llama_cpp_2::model::Special;
use llama_cpp_2::sampling::{params::LlamaSamplerChainParams, LlamaSampler};
use mistralrs::{TextMessages, TextModelBuilder};
use ollama_rs::generation::chat::request::ChatMessageRequest;
use ollama_rs::generation::completion::request::{GenerationRequest, GenerationResponse};
use ollama_rs::Ollama;
use rig::{completion::Prompt, providers::openai};

pub async fn summarize(State(client): State<Client<OpenAIConfig>>, Json(request): Json<CreateChatCompletionRequest>) -> Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let summary = response.choices[0].message.content.clone().unwrap_or_default();
    Json(summary)
}

pub async fn complete(State(client): State<Client<OpenAIConfig>>, Json(request): Json<CreateCompletionRequest>) -> Json<String> {
    let response = client.completions().create(request).await.unwrap();
    Json(response.choices[0].text.clone())
}

pub async fn respond(State(client): State<Client<OpenAIConfig>>, Json(request): Json<CreateResponse>) -> impl IntoResponse {
    let response = client
        .responses()
        .create(request)
        .await
        .unwrap();
    response.output_text().into_response()
}

// A streamed answer, read with while let and sent token by token.
pub async fn stream_tokens(client: Client<OpenAIConfig>, request: CreateChatCompletionRequest, tx: tokio::sync::mpsc::Sender<Event>) {
    let mut stream = client.chat().create_stream(request).await.unwrap();
    while let Some(Ok(chunk)) = stream.next().await {
        let token = chunk.choices[0].delta.content.clone().unwrap_or_default();
        tx.send(Event::default().data(token)).await.unwrap();
    }
}

// The same, gathered into one string.
pub async fn stream_gathered(client: Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Json<String> {
    let mut stream = client.chat().create_stream(request).await.unwrap();
    let mut answer = String::new();
    while let Some(result) = stream.next().await {
        answer.push_str(&result.unwrap().choices[0].delta.content.clone().unwrap_or_default());
    }
    Json(answer)
}

pub async fn headline(topic: String) -> Json<String> {
    let client = openai::Client::from_env();
    let agent = client
        .agent("gpt-4o")
        .preamble("You write newspaper headlines.")
        .build();
    let headline = agent.prompt(topic.as_str()).await.unwrap();
    Json(headline)
}

pub async fn draft(model: openai::CompletionModel, brief: String) -> Json<String> {
    let response = model.completion_request(brief.as_str()).send().await.unwrap();
    Json(format_choice(response.choice))
}

pub async fn ollama_chat(State(ollama): State<Ollama>, Json(request): Json<ChatMessageRequest>) -> Json<String> {
    let response = ollama.send_chat_messages(request).await.unwrap();
    Json(response.message.content)
}

pub async fn ollama_generate(State(ollama): State<Ollama>, prompt: String) -> Json<String> {
    let response = ollama
        .generate(GenerationRequest::new("llama3.2".to_string(), prompt))
        .await
        .unwrap();
    Json(response.response)
}

pub async fn genai_chat(State(client): State<GenaiClient>, Json(request): Json<ChatRequest>) -> Json<String> {
    let response = client.exec_chat("gpt-4o-mini", request, None).await.unwrap();
    Json(response.first_text().unwrap_or_default().to_string())
}

pub async fn local_chat(question: String) -> Json<String> {
    let model = TextModelBuilder::new("microsoft/Phi-3.5-mini-instruct").build().await.unwrap();
    let messages = TextMessages::new().add_message(mistralrs::TextMessageRole::User, question);
    let response = model.send_chat_request(messages).await.unwrap();
    Json(response.choices[0].message.content.clone().unwrap_or_default())
}

pub async fn llama_local(model: &llama_cpp_2::model::LlamaModel, ctx: &mut llama_cpp_2::context::LlamaContext<'_>, n: i32) -> Json<String> {
    let mut sampler = LlamaSampler::chain_simple([LlamaSampler::dist(1234), LlamaSampler::greedy()]);
    let mut output = String::new();
    loop {
        let token = sampler.sample(ctx, n - 1);
        if model.is_eog_token(token) {
            break;
        }
        output.push_str(&model.token_to_str(token, Special::Tokenize).unwrap());
    }
    Json(output)
}

pub async fn llama_session(model: llama_cpp::LlamaModel, prompt: String) -> Json<Vec<String>> {
    let mut session = model.create_session(llama_cpp::SessionParams::default()).unwrap();
    session.advance_context(prompt).unwrap();
    let completions = session
        .start_completing_with(llama_cpp::standard_sampler::StandardSampler::default(), 512)
        .unwrap()
        .into_strings();
    Json(completions.collect())
}

pub async fn bedrock_converse(State(client): State<BedrockClient>, message: aws_sdk_bedrockruntime::types::Message) -> Json<String> {
    let output = client
        .converse()
        .model_id("anthropic.claude-3-haiku-20240307-v1:0")
        .messages(message)
        .send()
        .await
        .unwrap();
    Json(read_text(output))
}

pub async fn bedrock_invoke(State(client): State<BedrockClient>, body: Vec<u8>) -> Json<Vec<u8>> {
    let output = client
        .invoke_model()
        .model_id("meta.llama3-8b-instruct-v1:0")
        .body(Blob::new(body))
        .send()
        .await
        .unwrap();
    Json(output.body.into_inner())
}

pub async fn bedrock_stream(client: BedrockClient, message: aws_sdk_bedrockruntime::types::Message, tx: tokio::sync::mpsc::Sender<Event>) {
    let mut stream = client
        .converse_stream()
        .model_id("amazon.nova-lite-v1:0")
        .messages(message)
        .send()
        .await
        .unwrap()
        .stream;
    while let Ok(Some(event)) = stream.recv().await {
        tx.send(Event::default().data(read_delta(event))).await.unwrap();
    }
}
