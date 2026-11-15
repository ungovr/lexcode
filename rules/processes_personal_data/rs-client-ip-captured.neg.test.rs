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
