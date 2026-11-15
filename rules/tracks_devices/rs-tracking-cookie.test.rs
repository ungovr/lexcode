// lexcode-expect: 6
use actix_web::{cookie::Cookie, HttpResponse};
use axum_extra::extract::cookie::{Cookie as JarCookie, CookieJar};
use cookie as ck;
use tower_cookies::{Cookie as TowerCookie, Cookies};
use uuid::Uuid;

// actix-web through a nested use group: a returning-visitor id, the old and new builder forms.
pub fn remember_visitor(id: Uuid) -> HttpResponse {
    let visitor = Cookie::build("visitor_id", id.to_string())
        .path("/")
        .max_age(actix_web::cookie::time::Duration::days(365))
        .finish();
    let ga = Cookie::new("_ga", format!("GA1.1.{}", id.as_u128()));
    HttpResponse::Ok().cookie(visitor).cookie(ga).finish()
}

// axum-extra through a grouped use with an alias.
pub fn tag_device(jar: CookieJar, id: String) -> CookieJar {
    jar.add(JarCookie::build(("device_id", id)).path("/").permanent())
}

// The cookie crate through an aliased crate.
pub fn segment_anonymous(id: &str) -> ck::Cookie<'static> {
    ck::Cookie::new("ajs_anonymous_id", id.to_owned())
}

// tower-cookies through a grouped use with an alias, and by its full path.
pub fn track(cookies: Cookies, id: String) {
    cookies.add(TowerCookie::new("tracking_id", id.clone()));
    cookies.add(tower_cookies::Cookie::new("_fbp", format!("fb.1.{}", id)));
}
