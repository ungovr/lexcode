// lexcode-expect: 6
use actix_web::{post, web, HttpResponse};
use async_openai::{
    config::OpenAIConfig,
    types::{ChatCompletionRequestMessage, CreateChatCompletionRequestArgs},
    Client,
};
use axum::{extract::State, response::sse::Sse, Json};
use ollama_rs::generation::chat::request::ChatMessageRequest;
use rig::completion::Chat;

pub struct AppState {
    pub client: Client<OpenAIConfig>,
    pub ollama: ollama_rs::Ollama,
    pub agent: rig::agent::Agent<rig::providers::openai::CompletionModel>,
    pub genai: genai::Client,
}

pub async fn chat(State(st): State<AppState>, Json(req): Json<ChatRequest>) -> String {
    let messages: Vec<ChatCompletionRequestMessage> = req.messages.into_iter().map(to_message).collect();
    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-4o-mini")
        .messages(messages)
        .build()
        .unwrap();
    let response = st.client.chat().create(request).await.unwrap();
    response.choices[0].message.content.clone().unwrap_or_default()
}

pub async fn chat_stream(State(st): State<AppState>, Json(body): Json<ChatRequest>) -> Sse<ReplyStream> {
    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-4o-mini")
        .messages(body.history.iter().map(to_message).collect::<Vec<_>>())
        .build()
        .unwrap();
    let stream = st.client.chat().create_stream(request).await.unwrap();
    Sse::new(ReplyStream::new(stream))
}

#[post("/chat")]
pub async fn chat_actix(st: web::Data<AppState>, req: web::Json<ChatRequest>) -> HttpResponse {
    let request = ChatMessageRequest::new("llama3.2".to_string(), req.into_inner().messages);
    let reply = st.ollama.send_chat_messages(request).await.unwrap();
    HttpResponse::Ok().body(reply.message.content)
}

pub async fn chat_rig(State(st): State<AppState>, Json(payload): Json<ChatRequest>) -> String {
    st.agent
        .chat(payload.prompt.as_str(), payload.history.clone())
        .await
        .unwrap()
}

pub async fn chat_genai(State(st): State<AppState>, Json(input): Json<ChatRequest>) -> String {
    let chat_req = genai::chat::ChatRequest::new(input.messages);
    let res = st.genai.exec_chat("gpt-4o-mini", chat_req, None).await.unwrap();
    res.first_text().unwrap_or_default().to_string()
}

pub async fn chat_rig_prompt(State(st): State<AppState>, Json(data): Json<ChatRequest>) -> String {
    let mut history = data.conversation;
    st.agent.prompt(data.prompt.as_str()).with_history(&mut history).await.unwrap()
}
