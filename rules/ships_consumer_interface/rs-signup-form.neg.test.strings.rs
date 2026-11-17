// lexcode-expect: 0
use actix_web::{web, HttpResponse};

#[derive(serde::Deserialize)]
pub struct Credentials {
    email: String,
}

// The staff's own sign-up form, in an inline staff module whose strings, characters and comments
// hold closing braces: none of them ends the module.
pub mod staff {
    use actix_web::{web, HttpResponse};

    pub const CLOSE: &str = "}";
    pub const ESCAPED: &str = "\"}";
    pub const RAW: &str = r#"a "} quote"#;
    pub const RAW_PLAIN: &str = r"C:\}";
    pub const BYTES: &[u8] = br"}";
    pub const BRACE: char = '}';
    pub const UNICODE: char = '\u{7d}';
    // a closing brace in a comment: }
    /* and in a block comment: } */

    fn first<'a>(items: &'a [&'a str]) -> &'a str {
        items[0]
    }

    pub async fn register(form: web::Form<super::Credentials>) -> HttpResponse {
        let _ = (&form.email, first(&["}"]));
        HttpResponse::Ok().finish()
    }
}
