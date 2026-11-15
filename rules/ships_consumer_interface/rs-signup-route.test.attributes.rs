// lexcode-expect: 5
use actix_web::{get, post, HttpResponse, Responder};
use poem_openapi::{payload::Json, OpenApi};
use rocket::form::Form;
use yew_router::prelude::*;

// actix-web's route macros: the sign-up page and its form post.
#[get("/signup")]
async fn signup_page() -> impl Responder {
    HttpResponse::Ok().body("sign up")
}

#[actix_web::post("/auth/register")]
async fn register() -> impl Responder {
    HttpResponse::Ok().finish()
}

// Rocket: the registration form's handler.
#[rocket::post("/register", data = "<form>")]
fn create(form: Form<String>) -> &'static str {
    "ok"
}

// poem-openapi: an operation on the sign-up path.
pub struct Api;

#[OpenApi]
impl Api {
    #[oai(path = "/users/register", method = "post")]
    async fn register(&self) -> Json<bool> {
        Json(true)
    }
}

// Yew's router: the sign-up screen's route.
#[derive(Clone, Routable, PartialEq)]
enum AppRoute {
    #[at("/")]
    Home,
    #[at("/register")]
    Register,
    #[not_found]
    #[at("/404")]
    NotFound,
}
