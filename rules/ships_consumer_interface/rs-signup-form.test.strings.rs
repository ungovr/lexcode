// lexcode-expect: 1
use actix_web::{web, HttpResponse};

#[derive(serde::Deserialize)]
pub struct FormData {
    email: String,
}

pub mod site {
    use actix_web::{web, HttpResponse};

    // A staff module whose string holds an opening brace: the module still ends at its own
    // closing brace, so the public sign-up after it is read.
    pub mod admin {
        pub const OPEN: &str = "{";
    }

    pub async fn register(form: web::Form<super::FormData>) -> HttpResponse {
        let _ = &form.email;
        HttpResponse::Ok().finish()
    }
}
