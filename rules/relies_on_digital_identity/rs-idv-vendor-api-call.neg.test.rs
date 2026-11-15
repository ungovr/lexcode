// lexcode-expect: 0
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, CsrfToken, RedirectUrl, Scope, TokenUrl};
use openidconnect::{core::CoreProviderMetadata, IssuerUrl};
use reqwest::Client;
use samael::service_provider::ServiceProviderBuilder;
use webauthn_rs::prelude::*;

// Sign-in with a password, a social or workforce sign-in that only links an account (OAuth, OpenID
// Connect, SAML), passkeys, a payment with a vendor that also verifies identity, and a vendor's address
// that is only a link in a page or a const are not relying on a digital identity.
const PERSONA_DOCS: &str = "https://withpersona.com/api/v1/inquiries";

pub async fn sign_in(http: &Client, webauthn: &Webauthn, user_id: Uuid) -> anyhow::Result<String> {
    let oauth = BasicClient::new(ClientId::new("app".into()))
        .set_client_secret(ClientSecret::new("secret".into()))
        .set_auth_uri(AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".into())?)
        .set_token_uri(TokenUrl::new("https://oauth2.googleapis.com/token".into())?)
        .set_redirect_uri(RedirectUrl::new("https://app.example.org/callback".into())?);
    let (_url, _csrf) = oauth.authorize_url(CsrfToken::new_random).add_scope(Scope::new("email".into())).url();
    let _meta = CoreProviderMetadata::discover_async(IssuerUrl::new("https://login.microsoftonline.com/common/v2.0".into())?, http).await?;
    let _sp = ServiceProviderBuilder::default().entity_id("https://app.example.org/saml".into()).build()?;
    let (_challenge, _state) = webauthn.start_passkey_registration(user_id, "ada", "Ada", None)?;
    let _charge = http
        .post("https://api.stripe.com/v1/payment_intents")
        .form(&[("amount", "1000"), ("currency", "usd")])
        .send()
        .await?;
    let _profile = http.get("https://api.github.com/user").send().await?;
    let help = format!("Verify at <a href=\"https://withpersona.com/verify\">Persona</a>, see {PERSONA_DOCS}");
    Ok(help)
}
