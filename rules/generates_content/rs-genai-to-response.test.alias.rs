// lexcode-expect: 2
// The crate items the rule names, reached through `use <crate> as <alias>`.
use actix_web as aw;
use gemini_rust::Gemini;
use rocket as rk;

pub async fn answer(gemini: aw::web::Data<Gemini>, prompt: String) -> aw::HttpResponse {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    aw::HttpResponse::Ok().json(response.text())
}

pub async fn answer_rocket(gemini: &rk::State<Gemini>, prompt: String) -> rk::serde::json::Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    rk::serde::json::Json(response.text())
}
