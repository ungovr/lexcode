// lexcode-expect: 0
use actix_web::{web, HttpResponse};
use axum::{Form, Json};

#[derive(serde::Deserialize)]
pub struct Credentials {
    email: String,
    password: String,
}

// The definition's exclusion: an API with no screen of its own. A sign-up that takes a JSON body
// is called by a program, not posted from a page this app serves.
pub async fn register(Json(body): Json<Credentials>) -> Json<bool> {
    let _ = body.email;
    Json(true)
}

// A form post that is not a sign-up: the sign-in form, and the staff's form for adding an
// account and publishing an issue.
pub async fn login(form: web::Form<Credentials>) -> HttpResponse {
    let _ = &form.password;
    HttpResponse::SeeOther().finish()
}

pub async fn admin_create_user(Form(input): Form<Credentials>) -> HttpResponse {
    let _ = input.email;
    HttpResponse::Ok().finish()
}

pub async fn publish_newsletter(form: web::Form<Credentials>) -> HttpResponse {
    let _ = &form.email;
    HttpResponse::Ok().finish()
}

// A sign-up handler with no form at all (a link that confirms a subscription).
pub async fn subscribe_confirm(token: web::Query<String>) -> HttpResponse {
    let _ = token;
    HttpResponse::Ok().finish()
}
