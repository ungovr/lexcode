// lexcode-expect: 9
use std::sync::Arc;

use axum::{routing::get, Router};
use axum_server::tls_rustls::RustlsConfig;
use rustls::{pki_types::{CertificateDer, PrivateKeyDer}, ClientConfig, RootCertStore, ServerConfig};
use tokio_rustls::rustls as tr;

pub async fn serve(certs: Vec<CertificateDer<'static>>, key: PrivateKeyDer<'static>) -> anyhow::Result<()> {
    let _ = rustls::crypto::ring::default_provider().install_default();
    let server = ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(certs.clone(), key.clone_key())?;
    let _acceptor = tokio_rustls::TlsAcceptor::from(Arc::new(server));

    let roots = RootCertStore::from_iter(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());
    let client = ClientConfig::builder().with_root_certificates(roots).with_no_client_auth();
    let _connector = tokio_postgres_rustls::MakeRustlsConnect::new(client);

    let _other = tr::ServerConfig::builder_with_provider(Arc::new(rustls::crypto::aws_lc_rs::default_provider()))
        .with_safe_default_protocol_versions()?;

    let config = RustlsConfig::from_pem_file("cert.pem", "key.pem").await?;
    let app = Router::new().route("/", get(|| async { "ok" }));
    axum_server::bind_rustls("0.0.0.0:443".parse()?, config)
        .serve(app.into_make_service())
        .await?;
    Ok(())
}

pub fn https_client() -> reqwest::Result<reqwest::Client> {
    let _ = hyper_rustls::HttpsConnectorBuilder::new().with_webpki_roots().https_only().enable_http1().build();
    reqwest::Client::builder()
        .use_rustls_tls()
        .build()
}

pub async fn serve_warp() {
    let routes = warp::any().map(|| "ok");
    warp::serve(routes)
        .tls()
        .cert_path("cert.pem")
        .key_path("key.pem")
        .run(([0, 0, 0, 0], 443))
        .await;
}
