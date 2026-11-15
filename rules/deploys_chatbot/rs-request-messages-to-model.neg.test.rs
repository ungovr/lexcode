// lexcode-expect: 0
use async_openai::{
    config::OpenAIConfig,
    types::{ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs},
    Client,
};
use axum::{extract::State, Json};
use sqlx::PgPool;

pub struct AppState {
    pub client: Client<OpenAIConfig>,
    pub pool: PgPool,
}

// A one-shot tool: one field of the request pasted into a fixed prompt.
pub async fn summarize(State(st): State<AppState>, Json(req): Json<SummaryRequest>) -> String {
    let prompt = ChatCompletionRequestUserMessageArgs::default()
        .content(req.text.clone())
        .build()
        .unwrap();
    let request = CreateChatCompletionRequestArgs::default()
        .model("gpt-4o-mini")
        .messages(vec![prompt.into()])
        .build()
        .unwrap();
    let response = st.client.chat().create(request).await.unwrap();
    response.choices[0].message.content.clone().unwrap_or_default()
}

// The request's messages saved or counted, never sent to a model.
pub async fn archive(State(st): State<AppState>, Json(body): Json<ChatRequest>) -> usize {
    for m in &body.messages {
        st.pool.execute_message(m).await;
    }
    body.history.len()
}

// An app's own `chat` method that takes two arguments.
pub async fn room(State(st): State<AppState>, Json(payload): Json<RoomRequest>) {
    st.rooms.chat(payload.room_id, payload.messages).await;
}
