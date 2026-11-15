// lexcode-expect: 6
use std::sync::Arc;

use poem::{
    listener::{Listener, RustlsCertificate, RustlsConfig, TcpListener},
    Route, Server,
};
use tokio_rustls::{
    rustls::{ClientConfig, RootCertStore, ServerConfig},
    TlsConnector,
};

pub async fn nested(roots: RootCertStore) -> anyhow::Result<()> {
    rustls::crypto::CryptoProvider::install_default(rustls::crypto::ring::default_provider()).ok();
    let client = ClientConfig::builder().with_root_certificates(roots).with_no_client_auth();
    let _connector = TlsConnector::from(Arc::new(client));
    let _server = ServerConfig::builder_with_protocol_versions(&[&rustls::version::TLS13]);
    let listener = TcpListener::bind("0.0.0.0:443").rustls(
        RustlsConfig::new().fallback(RustlsCertificate::new().key(vec![]).cert(vec![])),
    );
    Server::new(listener).run(Route::new()).await?;
    let _other = poem::listener::RustlsConfig::new();
    Ok(())
}
