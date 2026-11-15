// lexcode-expect: 8
use actix_web::{HttpRequest, HttpResponse};
use axum::extract::{ConnectInfo, State};
use axum::http::HeaderMap;
use axum_client_ip as aci;
use diesel::prelude::*;
use rocket::Request;
use sea_orm::ActiveValue::Set;
use sqlx::PgPool;
use std::net::SocketAddr;
use tracing::info;

// actix-web: the real address behind the proxy, written to the log.
pub async fn login(req: HttpRequest) -> HttpResponse {
    let ip = req
        .connection_info()
        .realip_remote_addr()
        .map(ToString::to_string);
    tracing::info!("login from {:?}", ip);
    HttpResponse::Ok().finish()
}

// actix-web: the request's peer address, through the imported short macro name.
pub async fn hello(req: HttpRequest) -> HttpResponse {
    let addr = req.peer_addr();
    info!("hello from {:?}", addr);
    HttpResponse::Ok().finish()
}

// A write whose result is tested: the is_ok() is on the write, not a check on the address.
pub async fn remember(req: HttpRequest, pool: PgPool) -> bool {
    let ip = req.connection_info().realip_remote_addr().map(str::to_owned);
    sqlx::query("INSERT INTO sightings (ip) VALUES ($1)").bind(ip).execute(&pool).await.is_ok()
}

// axum: a destructured ConnectInfo stored with each visit.
pub async fn visit(ConnectInfo(addr): ConnectInfo<SocketAddr>, State(pool): State<PgPool>) {
    let ip_text = addr.ip().to_string();
    let _ = sqlx::query!("INSERT INTO visits (ip) VALUES ($1)", ip_text)
        .execute(&pool)
        .await;
}

// axum: the extractor kept whole.
pub async fn ping(connect: ConnectInfo<SocketAddr>) -> &'static str {
    let peer = connect.0;
    log::warn!("ping from {:?}", peer);
    "pong"
}

// A forwarded-address header kept in an audit table.
pub async fn audit(headers: HeaderMap, pool: PgPool, action: String) {
    let forwarded = headers
        .get("X-Forwarded-For")
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);
    let _ = sqlx::query("INSERT INTO audit_log (action, source) VALUES ($1, $2)")
        .bind(action)
        .bind(forwarded)
        .execute(&pool)
        .await;
}

// Rocket: the client address inserted through Diesel.
pub fn record(req: &Request<'_>, conn: &mut PgConnection) {
    let ip = req.client_ip().map(|a| a.to_string());
    let _ = diesel::insert_into(visits::table)
        .values(visits::address.eq(ip))
        .execute(conn);
}

// axum-client-ip through an aliased crate, kept on a SeaORM active model.
pub async fn sign_up(aci::InsecureClientIp(addr): aci::InsecureClientIp) -> signup::ActiveModel {
    let text = addr.to_string();
    signup::ActiveModel {
        signup_ip: Set(text),
        ..Default::default()
    }
}
