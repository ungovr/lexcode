// lexcode-expect: 3
// The crate items the rule names, reached through `use <crate> as <alias>`.
use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequest, Client};
use axum as ax;
use llama_cpp_2 as llama;
use ollama_rs as ol;

pub async fn summarize(client: Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> ax::Json<String> {
    let response = client.chat().create(request).await.unwrap();
    ax::Json(response.choices[0].message.content.clone().unwrap_or_default())
}

pub async fn ollama_generate(ollama: ol::Ollama, prompt: String) -> ax::Json<String> {
    let request = ol::generation::completion::request::GenerationRequest::new("llama3.2".to_string(), prompt);
    let response = ollama.generate(request).await.unwrap();
    ax::Json(response.response)
}

pub async fn llama_local(model: &llama::model::LlamaModel, ctx: &mut llama::context::LlamaContext<'_>, n: i32) -> ax::Json<String> {
    let mut sampler = llama::sampling::LlamaSampler::greedy();
    let token = sampler.sample(ctx, n - 1);
    let piece = model.token_to_str(token, llama::model::Special::Tokenize).unwrap();
    ax::Json(piece)
}
