// lexcode-expect: 0
// A helper returning Gemini's answer to its caller, with no extractor or route attribute.
use axum::extract::State;
use gemini_rust::Gemini;

pub async fn draft(gemini: &Gemini, prompt: String) -> String {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    response.text()
}
