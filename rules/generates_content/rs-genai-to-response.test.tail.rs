// lexcode-expect: 1
// A Gemini answer returned from a handler with no response wrapper (`-> String`).
use axum::extract::State;
use gemini_rust::Gemini;

pub async fn answer(State(gemini): State<Gemini>, prompt: String) -> String {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    response.text()
}
