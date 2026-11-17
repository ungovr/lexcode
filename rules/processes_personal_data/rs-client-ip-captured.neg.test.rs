// lexcode-expect: 0
use std::collections::HashMap;
use std::io::Write;
use std::net::TcpStream;
use std::sync::Mutex;

use actix_web::{HttpRequest, HttpResponse};
use tracing::info;

// An in-memory rate-limit key that is never written anywhere.
pub fn limit(req: &HttpRequest, hits: &Mutex<HashMap<String, u32>>) -> bool {
    let info = req.connection_info();
    let key = info.realip_remote_addr().unwrap_or("unknown").to_string();
    let mut map = hits.lock().unwrap();
    let n = map.entry(key).or_insert(0);
    *n += 1;
    *n > 100
}

// A ban-list lookup and a count of recent attempts: the address is matched, not kept.
pub async fn banned(req: HttpRequest, pool: sqlx::PgPool) -> bool {
    let ip = req.connection_info().realip_remote_addr().unwrap_or("").to_owned();
    let hit = sqlx::query("SELECT 1 FROM banned_ips WHERE ip = $1")
        .bind(ip.clone())
        .fetch_optional(&pool)
        .await
        .ok()
        .flatten()
        .is_some();
    let recent = sqlx::query!("SELECT count(*) AS n FROM login_attempts WHERE ip = $1", ip)
        .fetch_one(&pool)
        .await;
    hit || recent.is_err()
}

// Checks on the address whose boolean answer is logged: a loopback test, an allow list, a prefix.
pub async fn classify(req: HttpRequest, allowed: Vec<std::net::IpAddr>) {
    let addr = req.peer_addr().unwrap();
    let is_local = addr.ip().is_loopback();
    info!("local request {}", is_local);
    let ok = allowed.contains(&addr.ip());
    tracing::debug!("allow-listed {}", ok);
    let real = req.connection_info().realip_remote_addr().unwrap_or("").to_owned();
    let internal = real.starts_with("10.");
    info!("internal {}", internal);
}

// A log line without the address.
pub async fn health(req: HttpRequest) -> HttpResponse {
    info!("health check on {}", req.path());
    HttpResponse::NoContent().finish()
}

// The forwarded protocol is not the person's address.
pub fn scheme(headers: &actix_web::http::header::HeaderMap) -> String {
    let proto = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("http")
        .to_string();
    info!("scheme {}", proto);
    proto
}

// A client's own connection: its peer is the server it called.
pub fn send(stream: &mut TcpStream) -> std::io::Result<()> {
    let server = stream.peer_addr()?;
    info!("connected to {}", server);
    stream.write_all(b"ping")
}

// The app's own ConnectInfo, in a file without axum's.
pub struct ConnectInfo<T>(pub T);

pub struct Settings {
    pub host: String,
}

pub async fn connect(settings: ConnectInfo<Settings>) {
    let host = settings.0.host;
    info!("connecting to {}", host);
}

// The app's own ClientIp, the name of axum-client-ip's extractor, holding a configured address.
pub struct ClientIp(pub String);

pub async fn upstream(target: ClientIp) {
    let addr = target.0;
    info!("forwarding to {}", addr);
}

// A client_ip() that is not Rocket's: the address this service presents to its upstream.
pub struct Egress {
    pub address: String,
}

impl Egress {
    pub fn client_ip(&self) -> &str {
        &self.address
    }
}

pub fn announce(egress: &Egress) {
    let ip = egress.client_ip();
    info!("egress address {}", ip);
}

// A lookup statement held in a const or built with format!, and an emptiness test on the address
// whose answer is logged: the address is matched or tested, not kept.
const LOOKUP_BAN: &str = "SELECT 1 FROM banned_ips WHERE ip = $1";

pub async fn lookups(req: HttpRequest, pool: sqlx::PgPool, table: &str) -> bool {
    let ip = req.connection_info().realip_remote_addr().unwrap_or("").to_owned();
    let missing = ip.is_empty();
    info!("no address {}", missing);
    let banned = sqlx::query(LOOKUP_BAN).bind(ip.clone()).fetch_optional(&pool).await.is_ok();
    let seen = sqlx::query(&format!("SELECT 1 FROM {table} WHERE ip = $1"))
        .bind(ip)
        .fetch_optional(&pool)
        .await
        .is_ok();
    banned || seen
}

// Ban-list and rate-limit checks whose answer is logged: a receiver that calls a method named
// query, update or set, or that runs a SELECT (as text or through a const), is still a check.
const LOOKUP_FLAG: &str = "SELECT is_banned FROM bans WHERE ip = $1";

pub async fn checks(req: HttpRequest, pool: sqlx::PgPool, bans: &Bans, limiter: &Limiter) {
    let ip = req.connection_info().realip_remote_addr().unwrap_or("").to_owned();
    let ok = bans.query(&ip).is_allowed();
    info!("allowed: {}", ok);
    let ok = limiter.update(&ip).is_allowed();
    info!("allowed: {}", ok);
    let ok = limiter.check(&ip).is_allowed();
    info!("allowed: {}", ok);
    let ok = limiter.update(&ip).set(1).is_allowed();
    info!("allowed: {}", ok);
    let flag = sqlx::query_scalar("SELECT is_banned FROM bans WHERE ip = $1")
        .bind(&ip)
        .fetch_one(&pool)
        .await
        .is_ok_and(|b| b);
    info!("banned: {}", flag);
    let flag = sqlx::query_scalar(LOOKUP_FLAG).bind(&ip).fetch_one(&pool).await.is_ok_and(|b| b);
    info!("banned: {}", flag);
}
