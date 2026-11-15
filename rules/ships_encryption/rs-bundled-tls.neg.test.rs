// lexcode-expect: 0
use native_tls::TlsConnector;
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};
use sqlx::postgres::PgPoolOptions;

// The platform's TLS (native-tls, the system's OpenSSL) and a plain HTTPS call through a client
// whose TLS backend is a Cargo feature are not a bundled stack. An app's own ServerConfig and
// ClientConfig are not rustls's.
mod settings {
    pub struct ServerConfig {
        pub port: u16,
    }
    impl ServerConfig {
        pub fn builder() -> Self {
            ServerConfig { port: 8080 }
        }
    }
    pub struct ClientConfig;
    impl ClientConfig {
        pub fn new() -> Self {
            ClientConfig
        }
    }
}

use settings::{ClientConfig, ServerConfig};

pub async fn run(db_url: &str) -> anyhow::Result<()> {
    let _server = ServerConfig::builder();
    let _client = ClientConfig::new();
    let _tls = TlsConnector::new()?;
    let mut acceptor = SslAcceptor::mozilla_intermediate(SslMethod::tls())?;
    acceptor.set_private_key_file("key.pem", SslFiletype::PEM)?;
    let _pool = PgPoolOptions::new().max_connections(5).connect(db_url).await?;
    let body = reqwest::Client::new().get("https://example.org/feed").send().await?.text().await?;
    let _ = reqwest::Client::builder().use_native_tls().build()?;
    println!("{body}");
    Ok(())
}
