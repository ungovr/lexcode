// lexcode-expect: 9
use actix_web::{web, App, HttpResponse};
use actix_web::{web::{resource, scope}, HttpServer};
use actix_web as aw;
use axum::{routing::post, Router};
use loco_rs::prelude::*;
use poem::{post as ppost, Route};

async fn register() -> HttpResponse {
    HttpResponse::Ok().finish()
}

// axum: a sign-up path, and one under the API prefix written over several lines.
pub fn router() -> Router {
    Router::new()
        .route("/register", post(register))
        .route(
            "/api/users/signup",
            post(register),
        )
}

// actix-web, as Lemmy writes it: the register route in the account scope.
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        scope("/account/auth")
            .wrap(actix_web::middleware::Logger::default())
            .route("/register", web::post().to(register)),
    );
    // A resource by the module path, under an alias of the crate, and by a name a nested use
    // group brings.
    cfg.service(web::resource("/sign-up").route(web::post().to(register)));
    cfg.service(aw::web::resource("/signup").route(web::post().to(register)));
    cfg.service(resource("/create-account").route(web::post().to(register)));
}

// axum: a public router that ends in an admin nest. The public sign-up route is chained before
// the nest, in its receiver, and is read; only the nested admin router is a staff screen.
pub fn app() -> Router {
    Router::new()
        .route("/sign-up", post(register))
        .route("/login", post(register))
        .nest("/admin", Router::new().route("/register", post(register)))
}

// Poem: a route tree.
pub fn poem_routes() -> Route {
    Route::new().at("/registration", ppost(register))
}

// Loco: the auth controller's routes.
pub fn routes() -> Routes {
    Routes::new()
        .prefix("auth")
        .add("/register", post(register))
}
