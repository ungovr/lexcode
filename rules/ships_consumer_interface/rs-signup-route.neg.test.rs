// lexcode-expect: 0
use actix_web::{get, post, web, HttpResponse, Responder};
use axum::{routing::post as apost, Router};
use loco_rs::prelude::*;

async fn handler() -> HttpResponse {
    HttpResponse::Ok().finish()
}

// The definition's exclusion: a tool only the staff use. Staff create accounts in an admin
// scope, an admin router nested under /admin, and an admin prefix.
pub fn admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/admin")
            .wrap(actix_web::middleware::Logger::default())
            .route("/register", web::post().to(handler))
            .service(web::resource("/signup").route(web::post().to(handler))),
    );
}

pub fn admin_router() -> Router {
    Router::new().nest("/admin", Router::new().route("/register", apost(handler)))
}

pub fn admin_routes() -> Routes {
    Routes::new().prefix("admin").add("/register", post(handler))
}

#[post("/admin/register")]
async fn staff_register() -> impl Responder {
    HttpResponse::Ok().finish()
}

// Lookalikes: registering a device, a webhook or a node with a service, the sign-in page, and the
// staff's queue of registration applications.
pub fn api(cfg: &mut web::ServiceConfig) {
    cfg.route("/devices/register", web::post().to(handler));
    cfg.route("/login", web::post().to(handler));
    cfg.service(web::scope("/registration_application").route("", web::get().to(handler)));
}

#[post("/webhooks/register")]
async fn webhook() -> impl Responder {
    HttpResponse::Ok().finish()
}

#[get("/nodes/registration")]
async fn node() -> impl Responder {
    HttpResponse::Ok().finish()
}

// A metrics counter keyed by a path is not a route.
pub fn count(metrics: &mut Metrics) {
    metrics.add("/register", 1);
}

pub struct Metrics;
impl Metrics {
    pub fn add(&mut self, _k: &str, _v: u64) {}
}
