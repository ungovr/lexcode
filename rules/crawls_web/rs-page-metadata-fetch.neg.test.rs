// lexcode-expect: 0
use crate::meta::Webpage;
use webpage::HTML;

// Parsing HTML the app already holds reads no page from anywhere (the parse itself is the
// aggregation rules' concern, not a fetch).
pub fn title_of(html: String) -> Option<String> {
    HTML::from_string(html, None).ok().and_then(|h| h.title)
}

// The app's own `Webpage` type, and the crate's fetch pointed at the app's own dev server.
pub fn own(url: &str) {
    let w = Webpage::from_url(url, 3);
    let local = webpage::Webpage::from_url("http://localhost:8080/", webpage::WebpageOptions::default());
}

pub mod meta {
    pub struct Webpage;
    impl Webpage {
        pub fn from_url(_url: &str, _depth: u8) -> Self {
            Webpage
        }
    }
}
