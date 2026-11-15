// lexcode-expect: 4
use actix_web::{web, HttpResponse};
use axum::{extract::{Form, State}, response::Redirect};
use axum as ax;
use sqlx::PgPool;

#[derive(serde::Deserialize)]
pub struct FormData {
    email: String,
    name: String,
}

// actix-web: the newsletter's public sign-up, posted from a browser form (as the newsletter
// service in Zero To Production does).
pub async fn subscribe(form: web::Form<FormData>, pool: web::Data<PgPool>) -> HttpResponse {
    let _ = (&form.email, &form.name, pool);
    HttpResponse::Ok().finish()
}

// axum: the account sign-up form, its extractor brought by a nested use group.
pub async fn register(State(pool): State<PgPool>, Form(input): Form<FormData>) -> Redirect {
    let _ = (pool, input.email);
    Redirect::to("/welcome")
}

// axum under an alias of the crate.
pub async fn sign_up(ax::Form(input): ax::Form<FormData>) -> Redirect {
    let _ = input.name;
    Redirect::to("/welcome")
}

// A handler method with the form as its body.
pub struct Accounts;

impl Accounts {
    pub async fn handle_create_account(&self, form: web::Form<FormData>) -> HttpResponse {
        let _ = &form.email;
        HttpResponse::SeeOther().finish()
    }
}
