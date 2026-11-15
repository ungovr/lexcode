// lexcode-expect: 0
use actix_web::{cookie::Cookie, HttpResponse};
use uuid::Uuid;

// A session cookie that keeps one visit signed in.
pub fn sign_in(session: Uuid) -> HttpResponse {
    let c = Cookie::build("session", session.to_string())
        .http_only(true)
        .secure(true)
        .finish();
    HttpResponse::Ok().cookie(c).finish()
}

// A tracking cookie withdrawn on a consent change: written empty to remove it.
pub fn withdraw() -> HttpResponse {
    let mut c = Cookie::new("_ga", "");
    c.make_removal();
    HttpResponse::Ok().cookie(c).finish()
}

// Preferences and CSRF: no identifier of the device.
pub fn prefs(theme: &str, csrf: &str) -> HttpResponse {
    HttpResponse::Ok()
        .cookie(Cookie::new("theme", theme.to_owned()))
        .cookie(Cookie::new("csrf_token", csrf.to_owned()))
        .finish()
}
