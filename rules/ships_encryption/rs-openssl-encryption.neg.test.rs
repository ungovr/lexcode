// lexcode-expect: 0
use native_tls::TlsConnector;
use openssl::hash::{hash, MessageDigest};
use openssl::sign::Signer;
use openssl::ssl::{SslAcceptor, SslConnector, SslFiletype, SslMethod};

// The crate's TLS and native-tls hand the connection to the system's stack, and a hash or a signature
// encrypts nothing. An app's own encrypt is not openssl::symm's.
mod vault {
    pub fn encrypt(label: &str) -> String {
        format!("label:{label}")
    }
}

pub fn serve(pkey: &openssl::pkey::PKey<openssl::pkey::Private>) -> anyhow::Result<()> {
    let mut acceptor = SslAcceptor::mozilla_intermediate(SslMethod::tls())?;
    acceptor.set_private_key_file("key.pem", SslFiletype::PEM)?;
    let _connector = SslConnector::builder(SslMethod::tls())?.build();
    let _native = TlsConnector::new()?;
    let _digest = hash(MessageDigest::sha256(), b"body")?;
    let mut signer = Signer::new(MessageDigest::sha256(), pkey)?;
    signer.update(b"body")?;
    let _sig = signer.sign_to_vec()?;
    let _ = vault::encrypt("note");
    Ok(())
}
